"""The day trading strategies from Sarwa's "Top 9 Successful Day Trading Strategies".

Each strategy answers the article's three questions for a long trade:
when to enter, where the stop-loss goes, and when to exit / take profit.

Robinhood does not allow short selling for regular accounts, so only the
long side of each strategy is implemented. News trading is not included: it
needs a real-time news feed and judgement about expectations versus results.

Strategies are evaluated on a frame produced by `indicators.add_all`, at
row `i`, using only data up to and including that (completed) bar.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import pandas as pd

from . import candles


@dataclass(frozen=True)
class Signal:
    strategy: str
    stop: float
    target: float | None
    reason: str


EntryFn = Callable[[pd.DataFrame, int, float], "Signal | None"]
ExitFn = Callable[[pd.DataFrame, int], bool]


@dataclass(frozen=True)
class Strategy:
    name: str
    entry: EntryFn
    exit: ExitFn


def _ok(*vals) -> bool:
    return all(pd.notna(v) for v in vals)


def _target(price: float, stop: float, rr: float) -> float:
    return price + rr * (price - stop)


def _crossed_above(df: pd.DataFrame, i: int, a: str, b: str | float) -> bool:
    if i < 1:
        return False
    prev, cur = df.iloc[i - 1], df.iloc[i]
    pb = prev[b] if isinstance(b, str) else b
    cb = cur[b] if isinstance(b, str) else b
    return _ok(prev[a], cur[a], pb, cb) and prev[a] <= pb and cur[a] > cb


def _crossed_below(df: pd.DataFrame, i: int, a: str, b: str | float) -> bool:
    if i < 1:
        return False
    prev, cur = df.iloc[i - 1], df.iloc[i]
    pb = prev[b] if isinstance(b, str) else b
    cb = cur[b] if isinstance(b, str) else b
    return _ok(prev[a], cur[a], pb, cb) and prev[a] >= pb and cur[a] < cb


def _valid(sig: Signal, price: float, atr: float) -> Signal | None:
    """Reject stops that are on the wrong side or absurdly tight/wide."""
    risk = price - sig.stop
    if not _ok(risk, atr) or risk <= 0.2 * atr or risk > 4 * atr:
        return None
    if sig.target is not None and sig.target <= price:
        return None
    return sig


# 1. Trend trading -----------------------------------------------------------
def trend_entry(df, i, rr):
    r = df.iloc[i]
    if not _ok(r["ema9"], r["ema21"], r["sma50"], r["adx"], r["macd"], r["swing_low"]):
        return None
    if not (_crossed_above(df, i, "ema9", "ema21") and r["close"] > r["sma50"]):
        return None
    if r["adx"] < 25 or r["macd"] <= r["macd_signal"]:
        return None
    stop = min(r["swing_low"], r["close"] - 1.0 * r["atr"])
    return _valid(Signal("trend", stop, _target(r["close"], stop, rr), "EMA9/21 cross, ADX>25, MACD up"), r["close"], r["atr"])


def trend_exit(df, i):
    return _crossed_below(df, i, "ema9", "ema21") or candles.bearish_reversal(df, i)


# 2. Range trading -----------------------------------------------------------
def range_entry(df, i, rr):
    r = df.iloc[i]
    if i < 3 or not _ok(r["support"], r["resistance"], r["rsi"], r["adx"], r["atr"]):
        return None
    if r["adx"] >= 20:
        return None
    width = r["resistance"] - r["support"]
    if width < 3 * r["atr"]:
        return None
    near_support = r["support"] < r["close"] <= r["support"] + 0.25 * width
    was_oversold = df["rsi"].iloc[i - 3 : i].min() < 35
    rsi_rising = r["rsi"] > df["rsi"].iloc[i - 1]
    if not (near_support and was_oversold and rsi_rising and candles.is_bullish(r)):
        return None
    stop = r["support"] - 0.5 * r["atr"]
    target = r["resistance"] - 0.1 * width
    return _valid(Signal("range", stop, target, "Bounce off support, RSI turning up from oversold"), r["close"], r["atr"])


def range_exit(df, i):
    return df["rsi"].iloc[i] > 70


# 3. Momentum trading --------------------------------------------------------
def momentum_entry(df, i, rr):
    r = df.iloc[i]
    if i < 2 or not _ok(r["mom"], r["rsi"], r["adx"], r["swing_low"], r["atr"]):
        return None
    mom_cross = _crossed_above(df, i, "mom", 100.0) or _crossed_above(df, i - 1, "mom", 100.0)
    rsi_cross = _crossed_above(df, i, "rsi", 50.0) or _crossed_above(df, i - 1, "rsi", 50.0)
    adx_rising = r["adx"] > df["adx"].iloc[i - 2]
    if not (mom_cross and rsi_cross and r["mom"] > 100 and r["rsi"] > 50 and r["adx"] > 20 and adx_rising):
        return None
    stop = min(r["swing_low"], r["close"] - 1.0 * r["atr"])
    return _valid(Signal("momentum", stop, _target(r["close"], stop, rr), "Momentum>100 & RSI>50 with rising ADX"), r["close"], r["atr"])


def momentum_exit(df, i):
    r = df.iloc[i]
    return r["rsi"] < 45 or r["mom"] < 99.8


# 4. Breakout trading --------------------------------------------------------
def breakout_entry(df, i, rr):
    r = df.iloc[i]
    if not _ok(r["resistance"], r["vol_avg"], r["atr"]):
        return None
    broke = r["close"] > r["resistance"] and df["close"].iloc[i - 1] <= r["resistance"]
    confirmed = candles.is_strong_bullish(r) and r["volume"] >= 1.5 * r["vol_avg"]
    if not (broke and confirmed):
        return None
    stop = r["resistance"] - 0.5 * r["atr"]
    return _valid(Signal("breakout", stop, _target(r["close"], stop, rr), "Close above resistance on volume"), r["close"], r["atr"])


def breakout_exit(df, i):
    return candles.bearish_reversal(df, i)


# 5. Pullback trading --------------------------------------------------------
def pullback_entry(df, i, rr):
    r = df.iloc[i]
    if not _ok(r["ema21"], r["sma50"], r["adx"], r["swing_low"], r["vol_avg"], r["atr"]):
        return None
    uptrend = r["ema21"] > r["sma50"] and r["close"] > r["sma50"] and r["adx"] > 20
    touched = r["low"] <= r["ema21"] + 0.1 * r["atr"] and r["close"] > r["ema21"]
    confirm = (candles.is_strong_bullish(r) or candles.bullish_reversal(df, i)) and r["volume"] >= r["vol_avg"]
    if not (uptrend and touched and confirm):
        return None
    stop = r["swing_low"] - 0.1 * r["atr"]
    return _valid(Signal("pullback", stop, _target(r["close"], stop, rr), "Uptrend pullback to EMA21 with bullish candle"), r["close"], r["atr"])


def pullback_exit(df, i):
    return df["close"].iloc[i] < df["sma50"].iloc[i]


# 6. Gap trading -------------------------------------------------------------
GAP_MIN_PCT = 1.0
GAP_MAX_PCT = 8.0  # bigger gaps are more often exhaustion gaps
OPENING_RANGE_BARS = 3


def gap_entry(df, i, rr):
    r = df.iloc[i]
    if not _ok(r.get("prev_day_close"), r.get("prev_day_high"), r.get("bar_of_day"), r["atr"]):
        return None
    bar = int(r["bar_of_day"])
    if not (OPENING_RANGE_BARS <= bar <= OPENING_RANGE_BARS + 6):
        return None
    day_open = r["day_open"]
    gap_pct = 100 * (day_open / r["prev_day_close"] - 1)
    # Breakaway/runaway gap: opens above the prior day's high and doesn't fill.
    if not (GAP_MIN_PCT <= gap_pct <= GAP_MAX_PCT and day_open > r["prev_day_high"]):
        return None
    start = i - bar
    or_high = df["high"].iloc[start : start + OPENING_RANGE_BARS].max()
    day_low = df["low"].iloc[start : i + 1].min()
    if day_low <= r["prev_day_close"]:
        return None
    broke = r["close"] > or_high and df["close"].iloc[i - 1] <= or_high
    if not (broke and candles.is_bullish(r) and r["volume"] >= r["vol_avg"]):
        return None
    stop = max(day_low, r["close"] - 2 * r["atr"]) - 0.05 * r["atr"]
    return _valid(Signal("gap", stop, _target(r["close"], stop, rr), f"Gap up {gap_pct:.1f}% holding, opening-range breakout"), r["close"], r["atr"])


def gap_exit(df, i):
    r = df.iloc[i]
    return _ok(r.get("prev_day_close")) and r["close"] < r["prev_day_close"]


# 7. Price action trading ----------------------------------------------------
def price_action_entry(df, i, rr):
    r = df.iloc[i]
    if i < 10 or not _ok(r["support"], r["resistance"], r["atr"]):
        return None
    tested_support = r["low"] <= r["support"] + 0.3 * r["atr"] and r["close"] > r["support"]
    # Double-bottom-ish: an earlier low in the window also sat near support.
    window = df["low"].iloc[i - 20 if i >= 20 else 0 : i - 3]
    prior_test = (window <= r["support"] + 0.3 * r["atr"]).any()
    if not (tested_support and prior_test and candles.bullish_reversal(df, i)):
        return None
    stop = min(r["low"], r["support"]) - 0.2 * r["atr"]
    target = max(r["resistance"], _target(r["close"], stop, rr))
    return _valid(Signal("price_action", stop, target, "Reversal candle on a retest of support"), r["close"], r["atr"])


def price_action_exit(df, i):
    return candles.bearish_reversal(df, i)


# 8. Scalping (moving-average ribbon) -----------------------------------------
def scalping_entry(df, i, rr):
    r = df.iloc[i]
    if i < 2 or not _ok(r["ema5"], r["ema8"], r["ema13"], r["atr"]):
        return None
    p = df.iloc[i - 1]
    ribbon_up = r["ema5"] > r["ema8"] > r["ema13"]
    rising = r["ema5"] > p["ema5"] and r["ema8"] > p["ema8"] and r["ema13"] > p["ema13"]
    dipped_to_ema8 = r["low"] <= r["ema8"] and r["close"] > r["ema5"]
    if not (ribbon_up and rising and dipped_to_ema8 and candles.is_bullish(r)):
        return None
    stop = r["ema13"] - 0.5 * r["atr"]
    return _valid(Signal("scalping", stop, _target(r["close"], stop, min(rr, 1.0)), "5/8/13 ribbon up, dip to EMA8 bought"), r["close"], r["atr"])


def scalping_exit(df, i):
    return df["close"].iloc[i] < df["ema13"].iloc[i]


STRATEGIES: dict[str, Strategy] = {
    s.name: s
    for s in [
        Strategy("trend", trend_entry, trend_exit),
        Strategy("range", range_entry, range_exit),
        Strategy("momentum", momentum_entry, momentum_exit),
        Strategy("breakout", breakout_entry, breakout_exit),
        Strategy("pullback", pullback_entry, pullback_exit),
        Strategy("gap", gap_entry, gap_exit),
        Strategy("price_action", price_action_entry, price_action_exit),
        Strategy("scalping", scalping_entry, scalping_exit),
    ]
}


def first_signal(df: pd.DataFrame, i: int, names: list[str], rr: float) -> Signal | None:
    for name in names:
        sig = STRATEGIES[name].entry(df, i, rr)
        if sig is not None:
            return sig
    return None
