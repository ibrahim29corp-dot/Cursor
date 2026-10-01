from __future__ import annotations

from datetime import time

import pandas as pd

ET = "America/New_York"
MARKET_OPEN, MARKET_CLOSE = time(9, 30), time(16, 0)


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Lower-case OHLCV columns, Eastern-time index, regular session only."""
    if isinstance(df.columns, pd.MultiIndex):
        df = df.droplevel(1, axis=1)
    df = df.rename(columns=str.lower)[["open", "high", "low", "close", "volume"]].astype(float)
    idx = df.index if df.index.tz is not None else df.index.tz_localize("UTC")
    df.index = idx.tz_convert(ET)
    t = df.index.time
    df = df[(t >= MARKET_OPEN) & (t < MARKET_CLOSE)]
    return df.dropna()[~df.index.duplicated()].sort_index()


def yahoo_bars(symbol: str, interval: str = "5m", period: str = "60d") -> pd.DataFrame:
    """Historical intraday bars from Yahoo Finance. 5m data goes back at most 60 days."""
    import yfinance as yf

    raw = yf.download(symbol, period=period, interval=interval, progress=False, auto_adjust=False, threads=False)
    if raw is None or raw.empty:
        raise RuntimeError(f"No data returned for {symbol}")
    return normalize(raw)
