"""Bullish candlestick patterns used to confirm entries (the bot is long-only)."""

from __future__ import annotations

import pandas as pd


def _body(row) -> float:
    return abs(row["close"] - row["open"])


def is_bullish(row) -> bool:
    return row["close"] > row["open"]


def is_strong_bullish(row, min_body_frac: float = 0.6) -> bool:
    rng = row["high"] - row["low"]
    return is_bullish(row) and rng > 0 and _body(row) / rng >= min_body_frac


def is_hammer(row) -> bool:
    rng = row["high"] - row["low"]
    if rng <= 0:
        return False
    body = _body(row)
    lower_wick = min(row["open"], row["close"]) - row["low"]
    upper_wick = row["high"] - max(row["open"], row["close"])
    return body <= 0.35 * rng and lower_wick >= 2 * body and upper_wick <= 0.25 * rng


def is_bullish_engulfing(prev, row) -> bool:
    return (
        prev["close"] < prev["open"]
        and is_bullish(row)
        and row["close"] >= prev["open"]
        and row["open"] <= prev["close"]
    )


def is_morning_star(a, b, c) -> bool:
    a_rng = a["high"] - a["low"]
    return (
        a["close"] < a["open"]
        and a_rng > 0
        and _body(b) <= 0.3 * _body(a)
        and is_bullish(c)
        and c["close"] > (a["open"] + a["close"]) / 2
    )


def bullish_reversal(df: pd.DataFrame, i: int) -> bool:
    row = df.iloc[i]
    if is_hammer(row):
        return True
    if i >= 1 and is_bullish_engulfing(df.iloc[i - 1], row):
        return True
    return i >= 2 and is_morning_star(df.iloc[i - 2], df.iloc[i - 1], row)


def bearish_reversal(df: pd.DataFrame, i: int) -> bool:
    """Shooting star or bearish engulfing — used as an exit signal."""
    row = df.iloc[i]
    rng = row["high"] - row["low"]
    if rng > 0:
        body = _body(row)
        upper = row["high"] - max(row["open"], row["close"])
        lower = min(row["open"], row["close"]) - row["low"]
        if body <= 0.35 * rng and upper >= 2 * body and lower <= 0.25 * rng:
            return True
    if i >= 1:
        prev = df.iloc[i - 1]
        if (
            prev["close"] > prev["open"]
            and row["close"] < row["open"]
            and row["open"] >= prev["close"]
            and row["close"] <= prev["open"]
        ):
            return True
    return False
