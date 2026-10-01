"""Usage:
    python -m daybot backtest [--config config.toml] [--symbols SPY AAPL] [--strategies breakout gap]
    python -m daybot paper    [--config config.toml]
    python -m daybot live     [--config config.toml] --live
"""

from __future__ import annotations

import argparse
import logging
import sys

import pandas as pd

from .config import Config
from .strategies import STRATEGIES


def _cfg(args) -> Config:
    cfg = Config.load(args.config)
    if args.symbols:
        cfg.symbols = [s.upper() for s in args.symbols]
    if args.strategies:
        cfg.strategies = args.strategies
        cfg.__post_init__()
    return cfg


def cmd_backtest(args):
    from . import backtest
    from .data import yahoo_bars

    cfg = _cfg(args)
    bars = {}
    for s in cfg.symbols:
        try:
            bars[s] = yahoo_bars(s, cfg.interval, args.period)
        except Exception as e:  # noqa: BLE001
            print(f"skip {s}: {e}", file=sys.stderr)
    if not bars:
        sys.exit("No data downloaded.")

    if args.each:
        rows = []
        for name in STRATEGIES:
            cfg.strategies = [name]
            st = backtest.run(cfg, bars, args.cash).stats
            rows.append({"strategy": name, **{k: v for k, v in st.items() if k != "by_strategy"}})
        print(pd.DataFrame(rows).set_index("strategy").round(2).sort_values("total_return_pct", ascending=False).to_string())
        return

    res = backtest.run(cfg, bars, args.cash)
    st = res.stats
    days = len(set(res.equity_curve.index.date)) if len(res.equity_curve) else 0
    print(f"\nBacktest: {', '.join(bars)} | {days} trading days | strategies: {', '.join(cfg.strategies)}")
    print(f"Start ${res.starting_cash:,.0f} -> end ${res.equity_curve.iloc[-1]:,.2f}  ({st['total_return_pct']:+.2f}%)")
    print(f"Trades {st['trades']}  win rate {st['win_rate_pct']:.1f}%  profit factor {st['profit_factor']:.2f}  "
          f"avg R {st['avg_r']:+.2f}  max drawdown {st['max_drawdown_pct']:.2f}%  Sharpe {st['sharpe']:.2f}")
    if st["by_strategy"]:
        print("\nBy strategy:")
        for name, s in sorted(st["by_strategy"].items(), key=lambda kv: -kv[1]["pnl"]):
            print(f"  {name:<13} trades {s['trades']:>4}  win {100 * s['wins'] / s['trades']:5.1f}%  pnl ${s['pnl']:>10,.2f}")
    if args.out:
        backtest.trades_frame(res).to_csv(args.out, index=False)
        print(f"\nTrades written to {args.out}")


def cmd_run(args, live: bool):
    from .broker import PaperBroker, RobinhoodBroker
    from .live import Engine

    cfg = _cfg(args)
    if live:
        if not (cfg.live and args.live):
            sys.exit("Refusing to trade real money: set `live = true` in the config AND pass --live.")
        broker = RobinhoodBroker()
    else:
        cfg.live = False
        cfg.state_path, cfg.journal_path = "paper_state.json", "paper_trades.csv"
        broker = PaperBroker(cfg.paper_starting_cash, cfg.slippage_pct)
    Engine(cfg, broker).run_forever()


def main(argv=None):
    p = argparse.ArgumentParser(prog="daybot", description="Long-only intraday trading bot")
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("backtest", "paper", "live"):
        sp = sub.add_parser(name)
        sp.add_argument("--config", default="config.toml")
        sp.add_argument("--symbols", nargs="+")
        sp.add_argument("--strategies", nargs="+", choices=sorted(STRATEGIES))
        sp.add_argument("-v", "--verbose", action="store_true")
        if name == "backtest":
            sp.add_argument("--period", default="60d", help="Yahoo period; 5m bars max out at 60d")
            sp.add_argument("--cash", type=float, default=None)
            sp.add_argument("--each", action="store_true", help="backtest every strategy separately")
            sp.add_argument("--out", help="write the trade list to this CSV")
        if name == "live":
            sp.add_argument("--live", action="store_true", help="confirm you want to send real orders")
    args = p.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s")
    if args.cmd == "backtest":
        cmd_backtest(args)
    else:
        cmd_run(args, live=args.cmd == "live")


if __name__ == "__main__":
    main()
