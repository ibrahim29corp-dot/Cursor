from __future__ import annotations

import logging
import os
import time as _time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Protocol

import pandas as pd

from .data import ET, normalize, yahoo_bars

log = logging.getLogger(__name__)
BAR_MINUTES = 5


def completed(df: pd.DataFrame, now: datetime, minutes: int = BAR_MINUTES) -> pd.DataFrame:
    """Drop the still-forming bar so decisions only use closed candles."""
    return df[df.index + pd.Timedelta(minutes=minutes) <= now]


class Broker(Protocol):
    def bars(self, symbol: str, now: datetime) -> pd.DataFrame: ...
    def account(self) -> tuple[float, float]: ...  # (equity, buying_power)
    def positions(self) -> dict[str, float]: ...
    def buy_market(self, symbol: str, qty: int) -> float | None: ...
    def sell_market(self, symbol: str, qty: int) -> float | None: ...
    def place_stop(self, symbol: str, qty: int, stop: float) -> str | None: ...
    def cancel(self, order_id: str) -> None: ...
    def stop_fill(self, order_id: str) -> float | None: ...


@dataclass
class _PaperStop:
    symbol: str
    qty: int
    stop: float
    placed: datetime
    filled_at: float | None = None


class PaperBroker:
    """Simulated account fed by real (Yahoo, ~real-time) market data."""

    def __init__(self, cash: float, slippage_pct: float = 0.02):
        self.cash = cash
        self.slip = slippage_pct / 100
        self.holdings: dict[str, tuple[int, float]] = {}
        self.stops: dict[str, _PaperStop] = {}
        self._last: dict[str, pd.DataFrame] = {}

    def bars(self, symbol, now):
        df = completed(yahoo_bars(symbol, "5m", "5d"), now)
        self._last[symbol] = df
        self._check_stops(symbol, df)
        return df

    def _price(self, symbol):
        return float(self._last[symbol]["close"].iloc[-1])

    def _check_stops(self, symbol, df):
        for oid, s in list(self.stops.items()):
            if s.symbol != symbol or s.filled_at is not None:
                continue
            after = df[df.index >= pd.Timestamp(s.placed)]
            hit = after[after["low"] <= s.stop]
            if not hit.empty:
                fill = min(s.stop, float(hit["open"].iloc[0])) * (1 - self.slip)
                s.filled_at = fill
                self._sell(symbol, s.qty, fill)

    def account(self):
        value = sum(q * (self._price(s) if s in self._last else p) for s, (q, p) in self.holdings.items())
        return self.cash + value, self.cash

    def positions(self):
        return {s: q for s, (q, _) in self.holdings.items() if q > 0}

    def buy_market(self, symbol, qty):
        price = self._price(symbol) * (1 + self.slip)
        if price * qty > self.cash:
            return None
        self.cash -= price * qty
        q0, p0 = self.holdings.get(symbol, (0, 0.0))
        self.holdings[symbol] = (q0 + qty, (q0 * p0 + qty * price) / (q0 + qty))
        return price

    def _sell(self, symbol, qty, price):
        q0, p0 = self.holdings.get(symbol, (0, 0.0))
        qty = min(qty, q0)
        self.cash += price * qty
        self.holdings[symbol] = (q0 - qty, p0)
        if q0 - qty <= 0:
            self.holdings.pop(symbol, None)
        return price

    def sell_market(self, symbol, qty):
        return self._sell(symbol, qty, self._price(symbol) * (1 - self.slip))

    def place_stop(self, symbol, qty, stop):
        oid = uuid.uuid4().hex
        placed = self._last[symbol].index[-1] + pd.Timedelta(minutes=BAR_MINUTES)
        self.stops[oid] = _PaperStop(symbol, qty, stop, placed.to_pydatetime())
        return oid

    def cancel(self, order_id):
        self.stops.pop(order_id, None)

    def stop_fill(self, order_id):
        s = self.stops.get(order_id)
        return None if s is None else s.filled_at


class RobinhoodBroker:
    """Real orders through the unofficial `robin_stocks` client.

    Credentials come from RH_USERNAME, RH_PASSWORD and (recommended) RH_MFA_SECRET,
    the base32 secret shown when enabling an authenticator app on Robinhood.
    """

    def __init__(self):
        import robin_stocks.robinhood as rh

        self.rh = rh
        user, pw = os.environ.get("RH_USERNAME"), os.environ.get("RH_PASSWORD")
        if not user or not pw:
            raise RuntimeError("Set RH_USERNAME and RH_PASSWORD (and RH_MFA_SECRET) to trade live")
        mfa = None
        if secret := os.environ.get("RH_MFA_SECRET"):
            import pyotp

            mfa = pyotp.TOTP(secret).now()
        rh.login(user, pw, mfa_code=mfa, store_session=True)

    def bars(self, symbol, now):
        rows = self.rh.get_stock_historicals(symbol, interval="5minute", span="week", bounds="regular") or []
        rows = [r for r in rows if r]
        if not rows:
            return pd.DataFrame(columns=["open", "high", "low", "close", "volume"])
        df = pd.DataFrame(rows)
        df.index = pd.to_datetime(df["begins_at"], utc=True)
        df = df.rename(columns={"open_price": "open", "high_price": "high", "low_price": "low", "close_price": "close"})
        return completed(normalize(df), now)

    def account(self):
        port = self.rh.load_portfolio_profile() or {}
        equity = float(port.get("extended_hours_equity") or port.get("equity") or 0)
        bp = float(self.rh.load_account_profile(info="buying_power") or 0)
        return equity, bp

    def positions(self):
        return {s: float(h["quantity"]) for s, h in (self.rh.build_holdings() or {}).items()}

    def _wait_fill(self, order: dict | None, timeout: float = 30) -> float | None:
        if not order or "id" not in order:
            log.error("Order rejected: %s", order)
            return None
        deadline = _time.time() + timeout
        while _time.time() < deadline:
            info = self.rh.get_stock_order_info(order["id"])
            state = info.get("state")
            if state == "filled":
                return float(info["average_price"])
            if state in ("cancelled", "rejected", "failed"):
                log.error("Order %s %s", order["id"], state)
                return None
            _time.sleep(1)
        log.error("Order %s not filled in %ss; cancelling", order["id"], timeout)
        self.rh.cancel_stock_order(order["id"])
        return None

    def buy_market(self, symbol, qty):
        return self._wait_fill(self.rh.order_buy_market(symbol, qty, timeInForce="gfd"))

    def sell_market(self, symbol, qty):
        return self._wait_fill(self.rh.order_sell_market(symbol, qty, timeInForce="gfd"))

    def place_stop(self, symbol, qty, stop):
        order = self.rh.order_sell_stop_loss(symbol, qty, round(stop, 2), timeInForce="gfd")
        if not order or "id" not in order:
            log.error("Stop order rejected for %s: %s", symbol, order)
            return None
        return order["id"]

    def cancel(self, order_id):
        self.rh.cancel_stock_order(order_id)
        # Shares stay locked by the stop until the cancel settles.
        for _ in range(10):
            if self.rh.get_stock_order_info(order_id).get("state") in ("cancelled", "filled"):
                return
            _time.sleep(0.5)

    def stop_fill(self, order_id):
        info = self.rh.get_stock_order_info(order_id)
        return float(info["average_price"]) if info.get("state") == "filled" else None


def next_bar_time(now: datetime, minutes: int = BAR_MINUTES, delay_s: int = 8) -> datetime:
    base = now.replace(second=0, microsecond=0)
    nxt = base + timedelta(minutes=minutes - base.minute % minutes)
    return nxt + timedelta(seconds=delay_s)
