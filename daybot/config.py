from __future__ import annotations

import tomllib
from dataclasses import dataclass, field, fields
from datetime import time
from pathlib import Path

from .strategies import STRATEGIES


@dataclass
class Config:
    symbols: list[str] = field(default_factory=lambda: ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "AMD", "TSLA", "META"])
    strategies: list[str] = field(default_factory=lambda: ["breakout", "momentum", "range"])
    interval: str = "5m"

    # Risk management
    risk_per_trade_pct: float = 0.5  # % of equity lost if the stop is hit
    max_position_pct: float = 20.0  # cap on a single position's size, % of equity
    reward_risk: float = 2.0  # take-profit distance as a multiple of stop distance
    max_daily_loss_pct: float = 2.0  # stop trading for the day past this loss
    max_trades_per_day: int = 6
    max_open_positions: int = 3
    pdt_protect: bool = True  # obey the pattern-day-trader 3-in-5-days rule under $25k
    slippage_pct: float = 0.02  # assumed per-fill slippage, used by backtest & paper

    # Session (US/Eastern)
    no_entries_before: str = "09:35"
    no_entries_after: str = "15:30"
    flatten_at: str = "15:55"

    # Live trading
    live: bool = False  # real orders are only sent when this is true AND --live is passed
    paper_starting_cash: float = 10_000.0
    journal_path: str = "trades.csv"
    state_path: str = "state.json"

    def __post_init__(self):
        unknown = [s for s in self.strategies if s not in STRATEGIES]
        if unknown:
            raise ValueError(f"Unknown strategies {unknown}; choose from {sorted(STRATEGIES)}")
        if not 0 < self.risk_per_trade_pct <= 5:
            raise ValueError("risk_per_trade_pct must be in (0, 5]")
        self.symbols = [s.upper() for s in self.symbols]

    @staticmethod
    def _t(s: str) -> time:
        h, m = s.split(":")
        return time(int(h), int(m))

    @property
    def entry_start(self) -> time:
        return self._t(self.no_entries_before)

    @property
    def entry_end(self) -> time:
        return self._t(self.no_entries_after)

    @property
    def flatten_time(self) -> time:
        return self._t(self.flatten_at)

    @classmethod
    def load(cls, path: str | Path | None) -> "Config":
        if path is None or not Path(path).exists():
            return cls()
        with open(path, "rb") as f:
            raw = tomllib.load(f)
        known = {f.name for f in fields(cls)}
        bad = set(raw) - known
        if bad:
            raise ValueError(f"Unknown config keys: {sorted(bad)}")
        return cls(**raw)
