# 📈 PulseMarket Stock Market Analyzer & Terminal

A modern, high-density financial terminal and automated market close scanner built with **Vanilla HTML5/CSS3/JS**, **HTML5 Canvas**, **Python**, and **YFinance API**.

---

## 🌟 Key Features

- **High-Performance Canvas Chart Engine**: Dual chart modes supporting OHLC **Candlesticks** and **Area Line Charts** with responsive crosshair tooltips and High DPI screen scaling.
- **Floor Pivot Points Engine**: Calculates Floor Pivot ($P$), Resistance levels ($R_1, R_2, R_3$), and Support levels ($S_1, S_2, S_3$) with canvas line overlays on price charts.
- **Relative Volume Screening**: Computes Relative Volume explicitly as:
  $$\text{Relative Volume (RelVol)} = \frac{\text{Volume}}{\text{Avg Volume}}$$
- **Dedicated Market Movers Page (`movers.html`)**: Interactive screener view sorting top gainers (winners) and decliners (losers) filtered by Sector and Relative Volume.
- **Dedicated Magnificent Seven & OSIS Page (`mag7.html`)**: Real-time comparative matrix, spot prices, market caps, Relative Volume, and Floor Pivots for `AAPL`, `MSFT`, `NVDA`, `AMZN`, `GOOGL`, `META`, `TSLA`, and `OSIS` (OSI Systems, Inc.).
- **11 Sector SPDR ETFs & Top Holdings Grid**: Real-time tracking of `XLK` (Tech), `XLE` (Energy), `XLF` (Financials), `XLV` (Healthcare), `XLI` (Industrials), `XLC` (Comm), `XLY` (Cons Disc), `XLP` (Staples), `XLU` (Utilities), `XLB` (Materials), `XLRE` (Real Estate), plus top 3 stock holdings per sector.
- **Dedicated Market News Highlights Page (`news.html`)**: Real-time financial headline aggregator parsing live RSS feeds from **Google News** (`news.google.com`) across Market Overview, Mag 7 & OSIS, Sector News, Macro & Fed, and Market Movers with sentiment tagging and keyword search.
- **Automated Market Close Scanner & Web Server (`market_scanner.py`, `news_fetcher.py`)**: Cron-executable scanner that ingests YFinance market data, screens movers (`Price > $15`, `Volume > 1M`, `RelVol >= 1.0`), calculates daily pivot levels, scrapes live Google News RSS highlights, and automatically launches the local HTTP web server on port **8080**.

---

## 📁 Project File Structure

```
Stock_market_Analyzer/
├── index.html                  # Main Terminal Dashboard View
├── trades.html                 # Dedicated Asymmetric Low-Risk Trades View (Critic Agent Evaluated)
├── movers.html                 # Dedicated Market Movers & Pivots Screener View
├── mag7.html                   # Dedicated Magnificent Seven + OSIS Terminal View
├── news.html                   # Dedicated Market News Highlights View (Google News RSS)
├── index.css                   # Premium Dark Glassmorphic Design System
├── app.js                      # Main Dashboard Controller & Canvas Chart Engine
├── trades.js                   # Asymmetric Low-Risk Trades Controller & Ranking Engine
├── movers.js                   # Market Movers Screener & Table Controller
├── mag7.js                     # Magnificent Seven Controller & Comparative Matrix
├── news.js                     # Market News Highlights Controller & Search/Filter
├── market_scanner.py           # YFinance Market Scanner, Pivots Engine & HTTP Server (Port 8080)
├── critic_agent.py             # Critic Agent Validation Engine (Price, Vol & Pivot Audit)
├── news_fetcher.py             # Google News RSS Scraper & Sentiment Analyzer
├── news_highlights.json        # Curated Google News RSS Highlights Cache
├── validated_yahoo_data.json   # Critic Agent Validated Stock Data & Pivots Output
├── market_scanner_agent.yaml   # Specification for Market Scanner Agent (Cron, Filters, Critic Checklist)
├── spec.md                     # Comprehensive System Specification Document
└── venv/                       # Python Virtual Environment
```

---

## 🚀 Quick Start Guide: How to Run the Web App

### 1. Prerequisites & Virtual Environment Setup
Ensure Python 3.10+ is installed on your system.

```powershell
# Navigate to the project directory
cd "c:\Users\nkonr\Documents\AI Agents\Agentic_Engineering\agent_engineering\my-apps\Stock_market_Analyzer"

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install required dependencies
pip install yfinance requests beautifulsoup4 pandas lxml
```

### 2. Run Scanner & Launch Web Application Server
Run the market scanner to ingest live YFinance market data, calculate floor pivot points, screen movers, aggregate Google News highlights, and automatically start the HTTP web server on port **8080**:

```powershell
python market_scanner.py
```
*Output results are saved to `market_analysis_results.json` and `news_highlights.json`, and the web application is served immediately on `http://localhost:8080`.*

#### Additional Server & Scanner Options:
- **Run scanner without starting the HTTP server**:
  ```powershell
  python market_scanner.py --no-serve
  ```
- **Launch standalone HTTP server on port 8080 manually**:
  ```powershell
  python -m http.server 8080
  ```

### 3. Critic Agent Stock Price Validation
Execute the automated Critic Agent verification audit module to validate price data, volume ratios, and Floor Pivot math for all 45 symbols against live YFinance API feeds:

```powershell
python critic_agent.py
```
*Validated records are saved to [`validated_yahoo_data.json`](file:///c:/Users/nkonr/Documents/AI%20Agents/Agentic_Engineering/agent_engineering/my-apps/Stock_market_Analyzer/validated_yahoo_data.json).*

### 4. Access the Web App Views
Open your web browser and navigate to any of the live dashboard endpoints:
- 📈 **Terminal Dashboard**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
- 🛡️ **Low-Risk Trades**: [http://localhost:8080/trades.html](http://localhost:8080/trades.html)
- 🚀 **Market Movers Screener**: [http://localhost:8080/movers.html](http://localhost:8080/movers.html)
- 👑 **Magnificent Seven Matrix**: [http://localhost:8080/mag7.html](http://localhost:8080/mag7.html)
- 📰 **Market News Highlights**: [http://localhost:8080/news.html](http://localhost:8080/news.html)

---

## 🧮 Technical Analysis Formulas

### Floor Pivot Points
$$\text{Pivot (P)} = \frac{\text{High} + \text{Low} + \text{Close}}{3}$$

- **Resistance Levels**:
  - $R_1 = (2 \times P) - \text{Low}$
  - $R_2 = P + (\text{High} - \text{Low})$
  - $R_3 = \text{High} + 2 \times (P - \text{Low})$

- **Support Levels**:
  - $S_1 = (2 \times P) - \text{High}$
  - $S_2 = P - (\text{High} - \text{Low})$
  - $S_3 = \text{Low} - 2 \times (\text{High} - P)$

### Relative Volume
$$\text{RelVol} = \frac{\text{Volume}}{\text{Avg Volume}}$$

---

## 🎨 UI/UX Design Palette

- **Background Canvas**: `#0b0f19` (Deep Obsidian Dark)
- **Glassmorphic Cards**: `#141c2e` (`backdrop-filter: blur(16px)`)
- **Bullish / Gain Accent**: `#10b981` (Emerald Green)
- **Bearish / Loss Accent**: `#f43f5e` (Crimson Red)
- **Primary Brand / Active State**: `#3b82f6` (Electric Blue)
- **Floor Pivots Accent**: `#8b5cf6` (Neon Purple)

---

## 📄 License
This project is open-source and licensed under the MIT License.
