---
name: stock-market-skill
description: Retrieve market stock statistics, top gainers (highest percentage increase), top losers (lowest percentage decrease/highest drop), or lookup specific stock tickers.
trigger_queries:
  - "Which stocks have the highest percentage increase today?"
  - "Show me top market gainers and losers"
  - "Check stock performance for NVDA"
---

# Stock Market Skill
This skill provides real-time/simulated financial market stock metrics including percentage changes, volumes, and top gainers/losers.

## Executable Tool Function
- Python Function: `stock_search.get_stock_market_data(category, ticker)`
- Arguments:
  - `category` (string, optional): 'gainers', 'losers', 'all', or 'ticker'. Default is 'all'.
  - `ticker` (string, optional): Stock symbol when category is 'ticker' (e.g. 'NVDA', 'AAPL').
