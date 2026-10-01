"""Portfolio backtest over intraday bars.

Signals are computed on a bar's close and filled at the next bar's open, so
there is no look-ahead. When a bar touches both the stop and the target the
stop is assumed to fill first (the pessimistic choice).
"""

from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from . import indicators
from .config import Config
from .risk import RiskManager, position_size
from .strategies import STRATEGIES, Signal, first_signal


@dataclass
class Trade:
    symbol: str
    strategy: str
    entry_time: pd.Timestamp
    entry: float
    qty: int
    stop: float
    target: float | None
    exit_time: pd.Timestamp | None = None
    exit: float | None = None
    exit_reason: str = ""

    @property
    def pnl(self) -> float:
        return 0.0 if self.exit is None else (self.exit - self.entry) * self.qty

    @property
    def r_multiple(self) -> float:
        risk = (self.entry - self.stop) * self.qty
        return self.pnl / risk if risk > 0 else 0.0


@dataclass
class Result:
    trades: list[Trade]
    equity_curve: pd.Series
    starting_cash: float
    stats: dict = field(default_factory=dict)


def _slip(price: float, cfg: Config, side: str) -> float:
    s = cfg.slippage_pct / 100
    return price * (1 + s) if side == "buy" else price * (1 - s)


def run(cfg: Config, bars: dict[str, pd.DataFrame], starting_cash: float | None = None) -> Result:
    cash = starting_cash if starting_cash is not None else cfg.paper_starting_cash
    start = cash
    frames = {s: indicators.add_all(df) for s, df in bars.items() if len(df) > 60}
    risk = RiskManager(cfg)
    open_pos: dict[str, Trade] = {}
    pending_entry: dict[str, Signal] = {}
    pending_exit: dict[str, str] = {}
    trades: list[Trade] = []
    curve: dict[pd.Timestamp, float] = {}
    last_close: dict[str, float] = {}

    timeline = sorted(set().union(*(f.index for f in frames.values()))) if frames else []
    pos_index = {s: {t: k for k, t in enumerate(f.index)} for s, f in frames.items()}

    def equity() -> float:
        return cash + sum(t.qty * last_close.get(s, t.entry) for s, t in open_pos.items())

    def close(sym: str, price: float, when, reason: str):
        nonlocal cash
        t = open_pos.pop(sym)
        t.exit, t.exit_time, t.exit_reason = price, when, reason
        cash += price * t.qty
        risk.record_close(t.pnl, when.date())
        trades.append(t)

    for ts in timeline:
        risk.new_day(ts.date(), equity())
        for sym, df in frames.items():
            i = pos_index[sym].get(ts)
            if i is None:
                continue
            bar = df.iloc[i]

            if sym in pending_exit and sym in open_pos:
                close(sym, _slip(bar["open"], cfg, "sell"), ts, pending_exit.pop(sym))
            pending_exit.pop(sym, None)

            if sym in pending_entry:
                sig = pending_entry.pop(sym)
                fill = _slip(bar["open"], cfg, "buy")
                if fill > sig.stop and (sig.target is None or fill < sig.target):
                    qty = position_size(cfg, equity(), cash, fill, sig.stop)
                    if qty > 0:
                        cash -= fill * qty
                        open_pos[sym] = Trade(sym, sig.strategy, ts, fill, qty, sig.stop, sig.target)
                        risk.record_entry()

            if sym in open_pos:
                t = open_pos[sym]
                if bar["low"] <= t.stop:
                    close(sym, _slip(min(t.stop, bar["open"]), cfg, "sell"), ts, "stop")
                elif t.target is not None and bar["high"] >= t.target:
                    close(sym, _slip(max(t.target, bar["open"]), cfg, "sell"), ts, "target")
                elif ts.time() >= cfg.flatten_time:
                    close(sym, _slip(bar["close"], cfg, "sell"), ts, "end of day")
                elif STRATEGIES[t.strategy].exit(df, i):
                    pending_exit[sym] = "strategy exit"

            last_close[sym] = bar["close"]
            is_last_bar_of_day = i + 1 >= len(df) or df.index[i + 1].date() != ts.date()
            if sym in open_pos and is_last_bar_of_day:
                close(sym, _slip(bar["close"], cfg, "sell"), ts, "end of day")
                pending_exit.pop(sym, None)

            if sym not in open_pos and not is_last_bar_of_day:
                ok, _ = risk.can_enter(ts, equity(), len(open_pos) + len(pending_entry))
                if ok:
                    sig = first_signal(df, i, cfg.strategies, cfg.reward_risk)
                    if sig is not None:
                        pending_entry[sym] = sig
        curve[ts] = equity()

    for sym in list(open_pos):
        close(sym, last_close[sym], timeline[-1], "end of data")

    res = Result(trades, pd.Series(curve, dtype=float), start)
    res.stats = summarize(res)
    return res


def summarize(res: Result) -> dict:
    tr = res.trades
    end = res.equity_curve.iloc[-1] if len(res.equity_curve) else res.starting_cash
    wins = [t.pnl for t in tr if t.pnl > 0]
    losses = [t.pnl for t in tr if t.pnl <= 0]
    curve = res.equity_curve if len(res.equity_curve) else pd.Series([res.starting_cash])
    dd = (curve / curve.cummax() - 1).min() * 100
    daily = curve.groupby(curve.index.date).last() if isinstance(curve.index, pd.DatetimeIndex) else curve
    daily_ret = daily.pct_change().dropna()
    sharpe = (daily_ret.mean() / daily_ret.std() * 252**0.5) if len(daily_ret) > 1 and daily_ret.std() > 0 else 0.0
    by_strat = {}
    for t in tr:
        s = by_strat.setdefault(t.strategy, {"trades": 0, "pnl": 0.0, "wins": 0})
        s["trades"] += 1
        s["pnl"] += t.pnl
        s["wins"] += t.pnl > 0
    return {
        "trades": len(tr),
        "win_rate_pct": 100 * len(wins) / len(tr) if tr else 0.0,
        "avg_win": sum(wins) / len(wins) if wins else 0.0,
        "avg_loss": sum(losses) / len(losses) if losses else 0.0,
        "profit_factor": sum(wins) / -sum(losses) if losses and sum(losses) < 0 else float("inf") if wins else 0.0,
        "avg_r": sum(t.r_multiple for t in tr) / len(tr) if tr else 0.0,
        "total_return_pct": 100 * (end / res.starting_cash - 1),
        "max_drawdown_pct": float(dd),
        "sharpe": float(sharpe),
        "by_strategy": by_strat,
    }


def trades_frame(res: Result) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "symbol": t.symbol, "strategy": t.strategy, "entry_time": t.entry_time, "entry": round(t.entry, 4),
                "qty": t.qty, "stop": round(t.stop, 4), "target": None if t.target is None else round(t.target, 4),
                "exit_time": t.exit_time, "exit": None if t.exit is None else round(t.exit, 4),
                "exit_reason": t.exit_reason, "pnl": round(t.pnl, 2), "r": round(t.r_multiple, 2),
            }
            for t in res.trades
        ]
    )
