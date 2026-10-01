"""Technical indicators. Every function is causal: row i only uses rows <= i."""

from __future__ import annotations

import numpy as np
import pandas as pd


def sma(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).mean()


def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False, min_periods=n).mean()


def rsi(close: pd.Series, n: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    rs = gain / loss.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(100.0).where(loss.notna())


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    line = ema(close, fast) - ema(close, slow)
    sig = line.ewm(span=signal, adjust=False, min_periods=signal).mean()
    return line, sig, line - sig


def true_range(df: pd.DataFrame) -> pd.Series:
    prev_close = df["close"].shift()
    return pd.concat(
        [df["high"] - df["low"], (df["high"] - prev_close).abs(), (df["low"] - prev_close).abs()],
        axis=1,
    ).max(axis=1)


def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    return true_range(df).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()


def adx(df: pd.DataFrame, n: int = 14) -> pd.Series:
    up = df["high"].diff()
    down = -df["low"].diff()
    plus_dm = pd.Series(np.where((up > down) & (up > 0), up, 0.0), index=df.index)
    minus_dm = pd.Series(np.where((down > up) & (down > 0), down, 0.0), index=df.index)
    tr = true_range(df).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    plus_di = 100 * plus_dm.ewm(alpha=1 / n, adjust=False, min_periods=n).mean() / tr
    minus_di = 100 * minus_dm.ewm(alpha=1 / n, adjust=False, min_periods=n).mean() / tr
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    return dx.ewm(alpha=1 / n, adjust=False, min_periods=n).mean()


def momentum(close: pd.Series, n: int = 10) -> pd.Series:
    """Momentum as a ratio centred on 100, matching the article's 'crossing 100'."""
    return 100 * close / close.shift(n)


def stochastic(df: pd.DataFrame, n: int = 14, d: int = 3):
    lo = df["low"].rolling(n, min_periods=n).min()
    hi = df["high"].rolling(n, min_periods=n).max()
    k = 100 * (df["close"] - lo) / (hi - lo).replace(0, np.nan)
    return k, k.rolling(d, min_periods=d).mean()


def add_all(df: pd.DataFrame, lookback: int = 20) -> pd.DataFrame:
    """Return a copy of an OHLCV frame with every indicator the strategies use."""
    out = df.copy()
    c = out["close"]
    out["ema5"], out["ema8"], out["ema13"] = ema(c, 5), ema(c, 8), ema(c, 13)
    out["ema9"], out["ema21"], out["sma50"] = ema(c, 9), ema(c, 21), sma(c, 50)
    out["rsi"] = rsi(c)
    out["macd"], out["macd_signal"], out["macd_hist"] = macd(c)
    out["atr"] = atr(out)
    out["adx"] = adx(out)
    out["mom"] = momentum(c)
    out["stoch_k"], out["stoch_d"] = stochastic(out)
    out["vol_avg"] = sma(out["volume"], lookback)
    # Support/resistance from the prior `lookback` bars, excluding the current one.
    out["resistance"] = out["high"].rolling(lookback, min_periods=lookback).max().shift()
    out["support"] = out["low"].rolling(lookback, min_periods=lookback).min().shift()
    out["swing_low"] = out["low"].rolling(5, min_periods=5).min()
    if isinstance(out.index, pd.DatetimeIndex):
        add_session_columns(out)
    return out


def add_session_columns(out: pd.DataFrame) -> None:
    day = pd.Series(out.index.date, index=out.index)
    grp = out.groupby(day)
    out["bar_of_day"] = grp.cumcount()
    out["day_open"] = grp["open"].transform("first")
    daily = grp.agg(close=("close", "last"), high=("high", "max"))
    prev = daily.shift()
    out["prev_day_close"] = day.map(prev["close"]).astype(float)
    out["prev_day_high"] = day.map(prev["high"]).astype(float)
