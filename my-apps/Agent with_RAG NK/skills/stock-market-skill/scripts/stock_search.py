import random
import datetime

STOCKS_DB = [
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "price": 138.25, "change_pct": 5.82},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "price": 448.90, "change_pct": 3.45},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "price": 182.60, "change_pct": 4.12},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "price": 194.50, "change_pct": 2.18},
    {"ticker": "META", "name": "Meta Platforms Inc.", "price": 512.30, "change_pct": 6.15},
    {"ticker": "TSLA", "name": "Tesla Inc.", "price": 245.10, "change_pct": -4.85},
    {"ticker": "AAPL", "name": "Apple Inc.", "price": 224.30, "change_pct": -1.25},
    {"ticker": "INTC", "name": "Intel Corporation", "price": 20.80, "change_pct": -8.40},
    {"ticker": "AMD", "name": "Advanced Micro Devices", "price": 156.40, "change_pct": 3.90},
    {"ticker": "ORCL", "name": "Oracle Corporation", "price": 142.10, "change_pct": -3.10}
]

def get_stock_market_data(category="all", ticker=None):
    """
    Returns top stock market gainers, losers, or ticker lookup.
    category: 'gainers', 'losers', 'all', 'ticker'
    """
    sorted_stocks = sorted(STOCKS_DB, key=lambda x: x['change_pct'], reverse=True)
    
    if ticker:
        matched = [s for s in STOCKS_DB if s['ticker'].upper() == ticker.upper()]
        return {
            "status": "success",
            "query_type": "ticker_lookup",
            "results": matched
        }
    
    cat_lower = str(category).lower()
    if cat_lower == "gainers":
        results = [s for s in sorted_stocks if s['change_pct'] > 0]
    elif cat_lower == "losers":
        results = sorted([s for s in sorted_stocks if s['change_pct'] < 0], key=lambda x: x['change_pct'])
    else:
        results = sorted_stocks

    return {
        "status": "success",
        "category": cat_lower,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "top_gainers": [s for s in sorted_stocks if s['change_pct'] > 0][:3],
        "top_losers": sorted([s for s in sorted_stocks if s['change_pct'] < 0], key=lambda x: x['change_pct'])[:3],
        "all_results": results
    }

if __name__ == "__main__":
    print(get_stock_market_data("gainers"))
