# daybot — a long-only day trading bot for Robinhood

Automates the strategies from Sarwa's
[Top 9 Successful Day Trading Strategies](https://www.sarwa.co/blog/successful-day-trading-strategies)
on 5-minute bars, with the risk management the article insists on: every trade
has a pre-defined entry, stop-loss and take-profit.

> **Read this first.** No bot can promise profits. Most retail day traders lose
> money, and on a 60-day backtest of large-cap stocks none of these strategies
> showed a reliable edge after slippage (results below). Use the backtester and
> paper mode for weeks before risking real money, and only trade money you can
> afford to lose. This is not financial advice.

## What it does

| Strategy (article #) | Entry | Stop | Exit |
|---|---|---|---|
| `trend` (1) | EMA9 crosses above EMA21, price above SMA50, ADX > 25, MACD above signal | recent swing low | EMA9 crosses back below EMA21, bearish reversal candle, or target |
| `range` (2) | No trend (ADX < 20), bounce near support, RSI turning up from oversold | just below support | RSI > 70 or near resistance |
| `momentum` (3) | Momentum crosses 100 and RSI crosses 50, ADX rising | swing low | momentum/RSI fade or target |
| `breakout` (4) | Close above 20-bar resistance with a strong bullish candle on 1.5× volume | below the broken level | bearish reversal candle or target |
| `pullback` (5) | Uptrend, dip to EMA21, bullish candle on volume | below swing low | close below SMA50 or target |
| `gap` (6) | 1–8% gap up above yesterday's high that isn't filling, opening-range breakout | day's low | gap fills or target |
| `price_action` (7) | Reversal candle (hammer, engulfing, morning star) on a second test of support | below the candle | bearish reversal or resistance |
| `scalping` (8) | 5/8/13 EMA ribbon rising, dip to EMA8 bought | below EMA13 | close below EMA13 or 1R target |

**Not automated:** news trading (9) needs a real-time news feed and human judgement.
**Long-only:** Robinhood doesn't let regular accounts short stocks, so only the buy side of each strategy is used.

Risk controls (all set in `config.toml`):

- **Position sizing:** each trade risks at most `risk_per_trade_pct` of equity (default 0.5%) if the stop is hit, and no single position can exceed `max_position_pct` of the account.
- **Protective stops:** live trades get a real stop-loss order at Robinhood right after the buy fills, so the stop still works if the bot crashes. If the stop order can't be placed, the bot sells immediately.
- **Daily loss limit:** trading stops for the day after a `max_daily_loss_pct` loss. There are also caps on trades per day and on open positions.
- **Pattern day trader rule:** accounts under $25k are limited to 3 day trades per 5 business days.
- **No overnight holds:** no entries in the first 5 minutes or after 15:30, and everything is sold at 15:55 ET.

## Setup

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp config.example.toml config.toml   # then edit
```

## 1. Backtest

```bash
python -m daybot backtest                      # strategies from config.toml
python -m daybot backtest --each               # compare every strategy separately
python -m daybot backtest --symbols AMD TSLA --strategies breakout gap --out trades_bt.csv
```

The backtest uses Yahoo Finance 5-minute data, which only goes back 60 days. Signals fill at the next bar's open, and when a bar touches both the stop and the target it counts as a stop.

Results for 60 days ending 2026-10-01, on the 8 default symbols with $30k (so the pattern day trader rule doesn't apply):

| strategy | trades | win % | profit factor | return |
|---|---|---|---|---|
| momentum | 50 | 36.0 | 1.15 | +0.31% |
| range | 74 | 31.1 | 1.03 | +0.09% |
| gap | 19 | 42.1 | 0.91 | −0.19% |
| trend | 45 | 35.6 | 0.76 | −0.30% |
| breakout | 240 | 35.0 | 0.88 | −0.91% |
| pullback | 108 | 25.0 | 0.63 | −1.69% |
| scalping | 382 | 41.6 | 0.88 | −1.73% |
| price_action | 321 | 27.1 | 0.62 | −3.23% |

Sixty days is too short a sample to tell skill from luck. The default strategies (`breakout`, `momentum` and `range`) were picked because they did best in this one window, which is itself a form of curve-fitting. Re-run the backtest yourself and change the parameters only for reasons you can explain.

## 2. Paper trade (no money at risk)

```bash
python -m daybot paper
```

Paper mode runs the real loop during market hours. It uses live Yahoo data and a simulated $10k account, and writes to `paper_trades.csv` and `paper_state.json`.

## 3. Live trading on Robinhood

The bot connects through [`robin_stocks`](https://github.com/jmfernandes/robin_stocks). That library is **unofficial**: Robinhood doesn't offer a public stock-trading API, so automated trading may go against its terms of service, and the library can break without warning.

```bash
export RH_USERNAME="you@example.com"
export RH_PASSWORD="..."
export RH_MFA_SECRET="..."   # base32 secret from enabling an authenticator app in Robinhood security settings
# in config.toml: live = true
python -m daybot live --live
```

Both the config flag and `--live` are required, so you can't send real orders by accident. Open positions and stop order IDs are saved in `state.json`, so you can restart the bot mid-day. Every closed trade is added to `trades.csv`.

Don't place manual trades in the same symbols while the bot is running. In a cash account, the money from a sale takes a day to settle, so it can't be reused the same day.

## Tests

```bash
python -m pytest -q
```
