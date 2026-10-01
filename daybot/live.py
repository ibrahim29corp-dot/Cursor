"""The trading loop: runs once per closed 5-minute bar during market hours."""

from __future__ import annotations

import csv
import json
import logging
import time as _time
from dataclasses import asdict, dataclass
from datetime import date, datetime, time
from pathlib import Path

import pandas as pd

from . import indicators
from .broker import Broker, next_bar_time
from .config import Config
from .data import ET, MARKET_CLOSE, MARKET_OPEN
from .risk import DayState, RiskManager, position_size
from .strategies import STRATEGIES, first_signal

log = logging.getLogger(__name__)
STALE_AFTER = pd.Timedelta(minutes=12)


@dataclass
class Position:
    symbol: str
    strategy: str
    qty: int
    entry: float
    stop: float
    target: float | None
    stop_order_id: str | None
    opened: str


class Engine:
    def __init__(self, cfg: Config, broker: Broker):
        self.cfg = cfg
        self.broker = broker
        self.risk = RiskManager(cfg)
        self.positions: dict[str, Position] = {}
        self._load_state()

    # -- persistence -------------------------------------------------------
    def _load_state(self):
        p = Path(self.cfg.state_path)
        if not p.exists():
            return
        raw = json.loads(p.read_text())
        self.positions = {s: Position(**v) for s, v in raw.get("positions", {}).items()}
        self.risk.day_trade_dates = [date.fromisoformat(d) for d in raw.get("day_trade_dates", [])]
        if d := raw.get("day"):
            self.risk.state = DayState(
                day=date.fromisoformat(d["day"]), start_equity=d["start_equity"],
                realized_pnl=d["realized_pnl"], trades=d["trades"], halted=d["halted"],
            )

    def _save_state(self):
        st = self.risk.state
        Path(self.cfg.state_path).write_text(json.dumps({
            "positions": {s: asdict(p) for s, p in self.positions.items()},
            "day_trade_dates": [d.isoformat() for d in self.risk.day_trade_dates[-20:]],
            "day": None if st.day is None else {
                "day": st.day.isoformat(), "start_equity": st.start_equity,
                "realized_pnl": st.realized_pnl, "trades": st.trades, "halted": st.halted,
            },
        }, indent=2))

    def _journal(self, pos: Position, exit_price: float, reason: str, now: datetime):
        path = Path(self.cfg.journal_path)
        new = not path.exists()
        with path.open("a", newline="") as f:
            w = csv.writer(f)
            if new:
                w.writerow(["opened", "closed", "symbol", "strategy", "qty", "entry", "stop", "target", "exit", "reason", "pnl"])
            pnl = (exit_price - pos.entry) * pos.qty
            w.writerow([pos.opened, now.isoformat(), pos.symbol, pos.strategy, pos.qty, round(pos.entry, 4),
                        round(pos.stop, 4), pos.target and round(pos.target, 4), round(exit_price, 4), reason, round(pnl, 2)])

    # -- trading -----------------------------------------------------------
    def _close(self, pos: Position, reason: str, now: datetime, fill: float | None = None):
        if fill is None:
            if pos.stop_order_id:
                self.broker.cancel(pos.stop_order_id)
            fill = self.broker.sell_market(pos.symbol, pos.qty)
            if fill is None:
                log.error("Could not sell %s; will retry next bar", pos.symbol)
                return
        pnl = (fill - pos.entry) * pos.qty
        log.info("EXIT %s %s x%d @ %.2f (%s) pnl=%.2f", pos.strategy, pos.symbol, pos.qty, fill, reason, pnl)
        self.risk.record_close(pnl, now.date(), same_day=pos.opened[:10] == now.date().isoformat())
        self._journal(pos, fill, reason, now)
        self.positions.pop(pos.symbol, None)

    def _manage(self, pos: Position, df: pd.DataFrame, now: datetime):
        if pos.stop_order_id and (fill := self.broker.stop_fill(pos.stop_order_id)) is not None:
            self._close(pos, "stop", now, fill)
            return
        if pos.symbol not in self.broker.positions():
            log.warning("%s no longer held at broker; dropping from state", pos.symbol)
            self.positions.pop(pos.symbol, None)
            return
        bar = df.iloc[-1]
        if now.time() >= self.cfg.flatten_time:
            self._close(pos, "end of day", now)
        elif pos.target is not None and bar["high"] >= pos.target:
            self._close(pos, "target", now)
        elif bar["close"] <= pos.stop:
            self._close(pos, "stop (bot)", now)
        elif STRATEGIES[pos.strategy].exit(df, len(df) - 1):
            self._close(pos, "strategy exit", now)

    def _maybe_enter(self, symbol: str, df: pd.DataFrame, now: datetime):
        equity, bp = self.broker.account()
        ok, why = self.risk.can_enter(now, equity, len(self.positions))
        if not ok:
            log.debug("%s: no entry (%s)", symbol, why)
            return
        sig = first_signal(df, len(df) - 1, self.cfg.strategies, self.cfg.reward_risk)
        if sig is None:
            return
        price = float(df["close"].iloc[-1])
        qty = position_size(self.cfg, equity, bp, price, sig.stop)
        if qty < 1:
            log.info("%s %s signal skipped: position size 0", sig.strategy, symbol)
            return
        fill = self.broker.buy_market(symbol, qty)
        if fill is None:
            return
        if fill <= sig.stop:
            log.warning("%s filled at/below stop; exiting immediately", symbol)
            self.broker.sell_market(symbol, qty)
            return
        stop_id = self.broker.place_stop(symbol, qty, sig.stop)
        if stop_id is None:
            log.error("No protective stop for %s; exiting to stay safe", symbol)
            self.broker.sell_market(symbol, qty)
            return
        self.risk.record_entry()
        self.positions[symbol] = Position(symbol, sig.strategy, qty, fill, sig.stop, sig.target, stop_id, now.isoformat())
        log.info("ENTER %s %s x%d @ %.2f stop=%.2f target=%s | %s", sig.strategy, symbol, qty, fill, sig.stop,
                 f"{sig.target:.2f}" if sig.target else "-", sig.reason)

    def step(self, now: datetime | None = None):
        now = now or pd.Timestamp.now(ET).to_pydatetime()
        equity, _ = self.broker.account()
        self.risk.new_day(now.date(), equity)
        for symbol in self.cfg.symbols:
            try:
                raw = self.broker.bars(symbol, now)
                if raw.empty or pd.Timestamp(now) - raw.index[-1] > STALE_AFTER:
                    continue  # holiday, halt, or data outage
                df = indicators.add_all(raw)
                if symbol in self.positions:
                    self._manage(self.positions[symbol], df, now)
                elif now.time() < self.cfg.flatten_time:
                    self._maybe_enter(symbol, df, now)
            except Exception:
                log.exception("Error handling %s", symbol)
        self._save_state()

    def run_forever(self):
        log.info("Bot started: %s | strategies=%s | symbols=%s", "LIVE" if self.cfg.live else "PAPER",
                 self.cfg.strategies, self.cfg.symbols)
        while True:
            now = pd.Timestamp.now(ET).to_pydatetime()
            if now.weekday() < 5 and MARKET_OPEN <= now.time() < time(MARKET_CLOSE.hour, MARKET_CLOSE.minute):
                self.step(now)
                equity, _ = self.broker.account()
                st = self.risk.state
                log.info("equity=%.2f day_pnl=%.2f trades=%d open=%s%s", equity, st.realized_pnl, st.trades,
                         list(self.positions), " HALTED" if st.halted else "")
            wake = next_bar_time(now)
            _time.sleep(max(1.0, (wake - pd.Timestamp.now(ET).to_pydatetime()).total_seconds()))
