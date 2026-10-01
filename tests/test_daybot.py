from datetime import date, datetime

import numpy as np
import pandas as pd
import pytest

from daybot import backtest, indicators
from daybot.config import Config
from daybot.live import Engine
from daybot.risk import RiskManager, position_size
from daybot.strategies import STRATEGIES, breakout_entry

ET = "America/New_York"


def session(day: str, closes, volume=1_000_000, spread=0.1):
    idx = pd.date_range(f"{day} 09:30", periods=len(closes), freq="5min", tz=ET)
    c = np.asarray(closes, dtype=float)
    o = np.r_[c[0], c[:-1]]
    return pd.DataFrame(
        {"open": o, "high": np.maximum(o, c) + spread, "low": np.minimum(o, c) - spread, "close": c,
         "volume": np.full(len(c), float(volume))},
        index=idx,
    )


def test_indicators_are_causal():
    rng = np.random.default_rng(0)
    df = session("2026-09-01", 100 + rng.normal(0, 0.3, 78).cumsum())
    full = indicators.add_all(df)
    part = indicators.add_all(df.iloc[:50])
    cols = ["ema9", "rsi", "macd", "adx", "atr", "resistance", "support"]
    pd.testing.assert_frame_equal(full[cols].iloc[:50], part[cols])


def test_rsi_bounds():
    rng = np.random.default_rng(1)
    r = indicators.rsi(pd.Series(100 + rng.normal(0, 1, 300).cumsum())).dropna()
    assert r.between(0, 100).all()


def test_position_size_respects_risk_size_and_cash():
    cfg = Config(risk_per_trade_pct=1.0, max_position_pct=20.0)
    assert position_size(cfg, 10_000, 10_000, 50, 49) == 40  # capped by 20% size (2000/50)
    assert position_size(cfg, 10_000, 10_000, 50, 45) == 20  # $100 risk / $5
    assert position_size(cfg, 10_000, 500, 50, 49) == 10  # buying power
    assert position_size(cfg, 10_000, 10_000, 50, 51) == 0


def test_daily_loss_limit_halts():
    rm = RiskManager(Config(max_daily_loss_pct=2.0, pdt_protect=False))
    rm.new_day(date(2026, 9, 1), 10_000)
    rm.record_close(-150, date(2026, 9, 1))
    assert rm.can_enter(datetime(2026, 9, 1, 10, 0), 10_000, 0)[0]
    rm.record_close(-60, date(2026, 9, 1))
    assert rm.can_enter(datetime(2026, 9, 1, 10, 0), 10_000, 0) == (False, "daily loss limit hit")


def test_pdt_rule_under_25k():
    rm = RiskManager(Config(pdt_protect=True))
    rm.new_day(date(2026, 9, 3), 10_000)
    rm.day_trade_dates = [date(2026, 9, 1), date(2026, 9, 2)]
    assert rm.can_enter(datetime(2026, 9, 3, 10), 10_000, 0)[0]
    assert not rm.can_enter(datetime(2026, 9, 3, 10), 10_000, 1)[0]
    assert rm.can_enter(datetime(2026, 9, 3, 10), 30_000, 1)[0]
    rm.day_trade_dates.append(date(2026, 9, 3))
    assert rm.can_enter(datetime(2026, 9, 9, 10), 10_000, 0)[0]  # older trades rolled off


def test_entry_window():
    rm = RiskManager(Config(pdt_protect=False))
    assert not rm.can_enter(datetime(2026, 9, 1, 9, 30), 10_000, 0)[0]
    assert not rm.can_enter(datetime(2026, 9, 1, 15, 45), 10_000, 0)[0]


def _breakout_day():
    flat = [100 + 0.2 * np.sin(k) for k in range(40)]
    df = session("2026-09-02", flat + [101.5, 102.5, 103.5, 104.5] + [104.5] * 34)
    df.iloc[40, df.columns.get_loc("volume")] = 3_000_000
    df.iloc[40, df.columns.get_loc("open")] = 100.2
    df.iloc[40, df.columns.get_loc("high")] = 101.55
    df.iloc[40, df.columns.get_loc("low")] = 100.15
    return df


def test_breakout_signal_fires_on_volume_breakout():
    df = indicators.add_all(_breakout_day())
    sig = breakout_entry(df, 40, 2.0)
    assert sig is not None and sig.stop < df["close"].iloc[40] < sig.target
    assert breakout_entry(df, 30, 2.0) is None


def test_backtest_fills_next_open_and_hits_target():
    cfg = Config(symbols=["X"], strategies=["breakout"], pdt_protect=False, slippage_pct=0.0)
    res = backtest.run(cfg, {"X": _breakout_day()}, 10_000)
    assert len(res.trades) == 1
    t = res.trades[0]
    assert t.entry_time == _breakout_day().index[41] and t.exit_reason == "target" and t.pnl > 0


def test_backtest_stop_wins_tie_and_flattens_eod():
    df = _breakout_day()
    # Next bar spans both stop and target: must be booked as a loss.
    df.iloc[41, df.columns.get_loc("high")] = 110
    df.iloc[41, df.columns.get_loc("low")] = 95
    cfg = Config(symbols=["X"], strategies=["breakout"], pdt_protect=False, slippage_pct=0.0)
    res = backtest.run(cfg, {"X": df}, 10_000)
    assert res.trades[0].exit_reason == "stop" and res.trades[0].pnl < 0
    assert all(t.exit_time.date() == t.entry_time.date() for t in res.trades)


class FakeBroker:
    def __init__(self, df):
        self.df, self.cash, self.held, self.stops, self.orders = df, 10_000.0, {}, {}, []

    def bars(self, symbol, now):
        return self.df[self.df.index + pd.Timedelta(minutes=5) <= pd.Timestamp(now)]

    def _px(self):
        return float(self.df["close"].iloc[-1])

    def account(self):
        return self.cash + sum(q * self._px() for q in self.held.values()), self.cash

    def positions(self):
        return dict(self.held)

    def buy_market(self, s, q):
        self.orders.append(("buy", s, q))
        self.cash -= q * self._px()
        self.held[s] = self.held.get(s, 0) + q
        return self._px()

    def sell_market(self, s, q):
        self.orders.append(("sell", s, q))
        self.cash += q * self._px()
        self.held.pop(s, None)
        return self._px()

    def place_stop(self, s, q, p):
        self.stops["1"] = (s, q, p)
        return "1"

    def cancel(self, oid):
        self.stops.pop(oid, None)

    def stop_fill(self, oid):
        return None


def test_engine_enters_with_protective_stop_and_flattens(tmp_path):
    df = _breakout_day()
    cfg = Config(symbols=["X"], strategies=["breakout"], pdt_protect=False, reward_risk=50,
                 state_path=str(tmp_path / "s.json"), journal_path=str(tmp_path / "j.csv"))
    br = FakeBroker(df.iloc[:41])
    eng = Engine(cfg, br)
    eng.step(df.index[41].to_pydatetime())
    assert "X" in eng.positions and br.stops and br.orders[0][0] == "buy"

    br.df = df
    eng2 = Engine(cfg, br)  # state survives a restart
    assert "X" in eng2.positions
    eng2.step(pd.Timestamp("2026-09-02 15:56", tz=ET).to_pydatetime())
    assert "X" not in eng2.positions and br.orders[-1][0] == "sell" and not br.stops
    assert "end of day" in (tmp_path / "j.csv").read_text()


def test_config_rejects_unknown_strategy():
    with pytest.raises(ValueError):
        Config(strategies=["moon"])


def test_all_strategies_run_on_random_data():
    rng = np.random.default_rng(7)
    frames = [session(f"2026-09-0{d}", 100 + rng.normal(0, 0.4, 78).cumsum(), volume=1e6) for d in range(1, 6)]
    df = indicators.add_all(pd.concat(frames))
    for s in STRATEGIES.values():
        for i in range(len(df)):
            sig = s.entry(df, i, 2.0)
            if sig is not None:
                assert sig.stop < df["close"].iloc[i]
            s.exit(df, i)
