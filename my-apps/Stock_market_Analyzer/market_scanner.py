"""
Agent Market Scanner - Real-time Data Ingestion & Technical Pivot Engine
========================================================================
Per specification in agent_market_scanner.yaml and spec.md:
- Fetches OHLCV data via yfinance (with synthetic generator fallback).
- Screens for Market Movers (Price > $15, Volume > 1M, Volume > Avg Volume).
- Calculates Relative Volume explicitly as: RelVol = Volume / AvgVolume.
- Monitors 11 Sector ETFs & Top 3 holdings per sector.
- Tracks Magnificent Seven stocks.
- Calculates Pivot (P), Resistance (R1, R2, R3), and Support (S1, S2, S3) levels.
- Exports results to market_analysis_results.json.
"""

import json
import datetime
import math
import sys
import http.server
import socketserver

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False

SECTOR_UNIVERSE = {
    "XLK": {"name": "Technology", "top_stocks": ["AAPL", "MSFT", "NVDA"]},
    "XLE": {"name": "Energy", "top_stocks": ["XOM", "CVX", "COP"]},
    "XLF": {"name": "Financials", "top_stocks": ["JPM", "BAC", "WFC"]},
    "XLV": {"name": "Healthcare", "top_stocks": ["LLY", "JNJ", "UNH"]},
    "XLI": {"name": "Industrials", "top_stocks": ["GE", "CAT", "HON"]},
    "XLC": {"name": "Communication Services", "top_stocks": ["GOOGL", "META", "NFLX"]},
    "XLY": {"name": "Consumer Discretionary", "top_stocks": ["AMZN", "TSLA", "HD"]},
    "XLP": {"name": "Consumer Staples", "top_stocks": ["PG", "KO", "PEP"]},
    "XLU": {"name": "Utilities", "top_stocks": ["NEE", "SO", "DUK"]},
    "XLB": {"name": "Materials", "top_stocks": ["LIN", "APD", "ECL"]},
    "XLRE": {"name": "Real Estate", "top_stocks": ["PLD", "AMT", "EQIX"]}
}

MAGNIFICENT_SEVEN = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "OSIS"]

def calculate_pivots(high, low, close):
    """Calculates Standard Floor Pivot Points (P, R1-R3, S1-S3)."""
    p = (high + low + close) / 3.0
    r1 = (2.0 * p) - low
    r2 = p + (high - low)
    r3 = high + 2.0 * (p - low)
    
    s1 = (2.0 * p) - high
    s2 = p - (high - low)
    s3 = low - 2.0 * (high - p)
    
    return {
        "pivot": round(p, 2),
        "r1": round(r1, 2),
        "r2": round(r2, 2),
        "r3": round(r3, 2),
        "s1": round(s1, 2),
        "s2": round(s2, 2),
        "s3": round(s3, 2)
    }

def fetch_stock_data(symbol):
    """Fetches real market data via yfinance or generates fallback OHLCV."""
    if YFINANCE_AVAILABLE:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="10d")
            if not hist.empty and len(hist) >= 2:
                latest = hist.iloc[-1]
                prev = hist.iloc[-2]
                high = float(latest["High"])
                low = float(latest["Low"])
                close = float(latest["Close"])
                open_px = float(latest["Open"])
                vol = int(latest["Volume"])
                
                # Avg Volume (10-day average)
                avg_vol = int(hist["Volume"].mean())
                # Relative Volume = Volume / AvgVolume
                rel_vol = round(vol / max(1, avg_vol), 2)
                
                chg_pct = float(((close - prev["Close"]) / prev["Close"]) * 100.0)
                
                return {
                    "symbol": symbol,
                    "open": round(open_px, 2),
                    "high": round(high, 2),
                    "low": round(low, 2),
                    "close": round(close, 2),
                    "volume": vol,
                    "avgVolume": avg_vol,
                    "relVolume": rel_vol,
                    "changePercent": round(chg_pct, 2),
                    "pivots": calculate_pivots(high, low, close)
                }
        except Exception as e:
            print(f"yfinance fetch error for {symbol}: {e}")

    # Fallback synthetic calculation
    base_price = 150.0
    if symbol in ["AAPL", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "MSFT"]:
        base_price = 220.0
    high = base_price * 1.025
    low = base_price * 0.978
    close = base_price * 1.012
    open_px = base_price * 0.995
    vol = 45000000
    avg_vol = 32000000
    rel_vol = round(vol / avg_vol, 2)
    
    return {
        "symbol": symbol,
        "open": round(open_px, 2),
        "high": round(high, 2),
        "low": round(low, 2),
        "close": round(close, 2),
        "volume": vol,
        "avgVolume": avg_vol,
        "relVolume": rel_vol,
        "changePercent": 1.71,
        "pivots": calculate_pivots(high, low, close)
    }

def run_agent_market_scanner():
    print("Running Agent Market Scanner (Calculating Volume / AvgVolume)...")

    sector_results = []
    all_symbols = set(MAGNIFICENT_SEVEN)
    
    for etf_symbol, meta in SECTOR_UNIVERSE.items():
        all_symbols.add(etf_symbol)
        etf_data = fetch_stock_data(etf_symbol)
        top_stocks_data = []
        for stock_sym in meta["top_stocks"]:
            all_symbols.add(stock_sym)
            top_stocks_data.append(fetch_stock_data(stock_sym))
            
        sector_results.append({
            "sector": meta["name"],
            "etf": etf_data,
            "topStocks": top_stocks_data
        })

    mag_7_results = [fetch_stock_data(sym) for sym in MAGNIFICENT_SEVEN]

    movers_results = []
    for sym in all_symbols:
        data = fetch_stock_data(sym)
        # Rule: Price > $15, Volume > 1M, Volume > AvgVolume (RelVol > 1.0)
        if data["close"] > 15.0 and data["volume"] > 1000000 and data["relVolume"] >= 1.0:
            movers_results.append(data)

    movers_results.sort(key=lambda x: abs(x["changePercent"]), reverse=True)

    output_payload = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "marketMovers": movers_results,
        "sectors": sector_results,
        "magnificentSeven": mag_7_results
    }

    with open("market_analysis_results.json", "w") as f:
        json.dump(output_payload, f, indent=2)

    print(f"Scanner finished! Output written to market_analysis_results.json.")
    
    # Run news fetcher pipeline
    try:
        from news_fetcher import run_news_fetcher
        run_news_fetcher()
    except Exception as e:
        print(f"Error running news fetcher: {e}")

    # Run Critic Agent verification & accuracy audit pipeline
    try:
        from critic_agent import run_critic_agent_audit
        run_critic_agent_audit()
    except Exception as e:
        print(f"Error running Critic Agent audit: {e}")

    return output_payload

def start_http_server(port=8080):
    """Starts local HTTP server on specified port (equivalent to python -m http.server 8080)."""
    class ReuseTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    handler = http.server.SimpleHTTPRequestHandler
    print(f"\n[HTTP Server] Starting web server on http://localhost:{port} ...")
    try:
        with ReuseTCPServer(("", port), handler) as httpd:
            print(f"[HTTP Server] Dashboard active at http://localhost:{port}/index.html")
            print("[HTTP Server] Press Ctrl+C to stop.")
            httpd.serve_forever()
    except OSError as e:
        print(f"[HTTP Server] Port {port} is already in use (or HTTP server is already running): {e}")
        print(f"[HTTP Server] Access dashboard at http://localhost:{port}/index.html")
    except KeyboardInterrupt:
        print("\n[HTTP Server] Server stopped.")

if __name__ == "__main__":
    run_agent_market_scanner()
    if "--no-serve" not in sys.argv:
        start_http_server(8080)

