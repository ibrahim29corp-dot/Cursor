"""Position sizing and the guard rails that keep one bad day from wiping out the account."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, datetime, time

import numpy as np

from .config import Config

PDT_EQUITY_THRESHOLD = 25_000.0
PDT_MAX_DAY_TRADES = 3


def position_size(cfg: Config, equity: float, buying_power: float, entry: float, stop: float) -> int:
    """Shares such that hitting the stop loses `risk_per_trade_pct` of equity."""
    per_share_risk = entry - stop
    if per_share_risk <= 0 or entry <= 0:
        return 0
    by_risk = equity * cfg.risk_per_trade_pct / 100 / per_share_risk
    by_size = equity * cfg.max_position_pct / 100 / entry
    by_cash = buying_power / entry
    return max(0, math.floor(min(by_risk, by_size, by_cash)))


@dataclass
class DayState:
    day: date | None = None
    start_equity: float = 0.0
    realized_pnl: float = 0.0
    trades: int = 0
    halted: bool = False


@dataclass
class RiskManager:
    cfg: Config
    state: DayState = field(default_factory=DayState)
    day_trade_dates: list[date] = field(default_factory=list)

    def new_day(self, d: date, equity: float) -> None:
        if self.state.day != d:
            self.state = DayState(day=d, start_equity=equity)

    def record_close(self, pnl: float, d: date, same_day: bool = True) -> None:
        self.state.realized_pnl += pnl
        if same_day:
            self.day_trade_dates.append(d)
        limit = -self.state.start_equity * self.cfg.max_daily_loss_pct / 100
        if self.state.realized_pnl <= limit:
            self.state.halted = True

    def day_trades_last_5(self, today: date) -> int:
        return sum(1 for d in self.day_trade_dates if np.busday_count(d, today) < 5)

    def can_enter(self, now: datetime, equity: float, open_positions: int) -> tuple[bool, str]:
        t: time = now.time()
        if self.state.halted:
            return False, "daily loss limit hit"
        if not (self.cfg.entry_start <= t < self.cfg.entry_end):
            return False, "outside entry window"
        if self.state.trades >= self.cfg.max_trades_per_day:
            return False, "max trades per day"
        if open_positions >= self.cfg.max_open_positions:
            return False, "max open positions"
        if (
            self.cfg.pdt_protect
            and equity < PDT_EQUITY_THRESHOLD
            # Open positions are flattened today, so each one becomes a day trade.
            and self.day_trades_last_5(now.date()) + open_positions >= PDT_MAX_DAY_TRADES
        ):
            return False, "pattern-day-trader limit (under $25k)"
        return True, ""

    def record_entry(self) -> None:
        self.state.trades += 1
