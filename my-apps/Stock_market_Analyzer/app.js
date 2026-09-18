/* ==========================================================================
   PulseMarket Terminal — High-Performance Stock Dashboard Logic
   ========================================================================== */

// --- Stock Database (Validated Live with Yahoo Finance Data) ---
const STOCKS_DB = {
    "AAPL": { symbol: "AAPL", company: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", basePrice: 326.57, pe: 34.2, eps: 9.54, divYield: "0.45%", marketCap: "$4.77T", beta: 1.08, avgVol: "69.4M", range52W: [215.00, 335.00], pivotP: 323.27, r1: 329.97, s1: 319.87 },
    "NVDA": { symbol: "NVDA", company: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", basePrice: 218.36, pe: 58.4, eps: 3.74, divYield: "0.03%", marketCap: "$5.27T", beta: 1.68, avgVol: "100.6M", range52W: [118.00, 240.00], pivotP: 218.85, r1: 220.50, s1: 216.71 },
    "MSFT": { symbol: "MSFT", company: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", basePrice: 492.44, pe: 36.8, eps: 13.38, divYield: "0.70%", marketCap: "$3.66T", beta: 0.89, avgVol: "15.4M", range52W: [385.00, 510.00], pivotP: 490.99, r1: 495.98, s1: 487.46 },
    "AMZN": { symbol: "AMZN", company: "Amazon.com Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", basePrice: 251.89, pe: 42.5, eps: 5.92, divYield: "N/A", marketCap: "$2.72T", beta: 1.15, avgVol: "24.9M", range52W: [165.00, 260.00], pivotP: 251.54, r1: 253.50, s1: 249.93 },
    "GOOGL": { symbol: "GOOGL", company: "Alphabet Inc.", exchange: "NASDAQ", sector: "Communication Services", basePrice: 332.60, pe: 24.1, eps: 13.80, divYield: "0.48%", marketCap: "$4.07T", beta: 1.05, avgVol: "22.6M", range52W: [175.00, 345.00], pivotP: 331.19, r1: 334.63, s1: 329.15 },
    "META": { symbol: "META", company: "Meta Platforms Inc.", exchange: "NASDAQ", sector: "Communication Services", basePrice: 644.38, pe: 27.6, eps: 23.34, divYield: "0.39%", marketCap: "$1.64T", beta: 1.22, avgVol: "20.4M", range52W: [450.00, 680.00], pivotP: 650.01, r1: 657.88, s1: 636.52 },
    "TSLA": { symbol: "TSLA", company: "Tesla Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", basePrice: 363.56, pe: 62.1, eps: 5.85, divYield: "N/A", marketCap: "$1.44T", beta: 2.34, avgVol: "29.5M", range52W: [210.00, 380.00], pivotP: 363.48, r1: 369.28, s1: 357.75 },
    "OSIS": { symbol: "OSIS", company: "OSI Systems, Inc.", exchange: "NASDAQ", sector: "Technology / Security", basePrice: 201.25, pe: 24.8, eps: 8.12, divYield: "N/A", marketCap: "$3.21B", beta: 0.92, avgVol: "267.8K", range52W: [135.00, 212.00], pivotP: 199.70, r1: 203.49, s1: 197.46 },
    "XLK": { symbol: "XLK", company: "Technology Select SPDR", exchange: "NYSE Arca", sector: "Technology ETF", basePrice: 185.22, pe: 28.5, eps: 6.50, divYield: "0.68%", marketCap: "$75.2B", beta: 1.12, avgVol: "5.5M", range52W: [145.00, 195.00], pivotP: 185.43, r1: 186.29, s1: 184.36 },
    "XLE": { symbol: "XLE", company: "Energy Select SPDR", exchange: "NYSE Arca", sector: "Energy ETF", basePrice: 64.93, pe: 14.2, eps: 4.57, divYield: "3.45%", marketCap: "$32.4B", beta: 0.85, avgVol: "36.9M", range52W: [55.00, 78.00], pivotP: 65.15, r1: 65.96, s1: 64.13 },
    "XLF": { symbol: "XLF", company: "Financial Select SPDR", exchange: "NYSE Arca", sector: "Financial ETF", basePrice: 56.87, pe: 16.8, eps: 3.38, divYield: "1.52%", marketCap: "$48.1B", beta: 0.95, avgVol: "24.9M", range52W: [42.00, 60.00], pivotP: 56.89, r1: 57.09, s1: 56.67 }
};

const SECTORS_LIST = [
    { etf: "XLK", name: "Technology", price: 185.22, chg: "-1.41%", top: ["AAPL", "MSFT", "NVDA"] },
    { etf: "XLE", name: "Energy", price: 64.93, chg: "-0.58%", top: ["XOM", "CVX", "COP"] },
    { etf: "XLF", name: "Financials", price: 56.87, chg: "-0.33%", top: ["JPM", "BAC", "WFC"] },
    { etf: "XLV", name: "Healthcare", price: 165.66, chg: "-0.55%", top: ["LLY", "JNJ", "UNH"] },
    { etf: "XLI", name: "Industrials", price: 170.55, chg: "-0.72%", top: ["GE", "CAT", "HON"] },
    { etf: "XLC", name: "Communication", price: 111.50, chg: "+0.60%", top: ["GOOGL", "META", "NFLX"] }
];

const FINVIZ_WINNERS = [
    { ticker: "AAPL", company: "Apple Inc.", sector: "Technology", price: 326.57, change: 3.56 },
    { ticker: "OSIS", company: "OSI Systems, Inc.", sector: "Technology / Security", price: 201.25, change: 1.90 },
    { ticker: "GOOGL", company: "Alphabet Inc.", sector: "Communication Services", price: 332.60, change: 0.59 },
    { ticker: "MSFT", company: "Microsoft Corporation", sector: "Technology", price: 492.44, change: 0.16 },
    { ticker: "ACFN", company: "Acorn Energy Inc", sector: "Technology", price: 20.97, change: 10.40 }
];

const FINVIZ_LOSERS = [
    { ticker: "NVDA", company: "NVIDIA Corporation", sector: "Technology", price: 218.36, change: -2.37 },
    { ticker: "META", company: "Meta Platforms Inc.", sector: "Communication Services", price: 644.38, change: -1.42 },
    { ticker: "XLK", company: "Technology ETF", sector: "Technology", price: 185.22, change: -1.41 },
    { ticker: "TSLA", company: "Tesla Inc.", sector: "Consumer Cyclical", price: 363.56, change: -1.16 },
    { ticker: "AMZN", company: "Amazon.com Inc.", sector: "Consumer Cyclical", price: 251.89, change: -0.20 }
];

const MARKET_INDEXES = [
    { name: "S&P 500", val: "5,582.40", chg: "+0.82%", pos: true },
    { name: "NASDAQ", val: "17,680.12", chg: "+1.15%", pos: true },
    { name: "DOW JONES", val: "40,842.10", chg: "+0.34%", pos: true },
    { name: "BITCOIN", val: "$58,420.00", chg: "+3.24%", pos: true },
    { name: "ETHEREUM", val: "$2,510.50", chg: "+2.18%", pos: true }
];

let state = {
    currentTicker: "AAPL",
    chartType: "candlestick",
    timeframe: "1M",
    indicators: {
        sma: true,
        ema: false,
        pivots: true,
        rsi: true,
        macd: true,
        volume: true
    },
    watchlist: JSON.parse(localStorage.getItem('pulse_watchlist') || '["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "GOOGL", "META", "OSIS"]'),
    historicalData: [],
    indicatorsData: {},
    pivotsData: {}
};

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tickerParam = urlParams.get('ticker');
    if (tickerParam) {
        state.currentTicker = tickerParam.toUpperCase();
    }

    initTickerRibbon();
    initWatchlist();
    initSearch();
    initEvents();
    initFinvizMovers();
    renderSectorsGrid();
    loadLowRiskTrades();
    
    // Load active stock
    loadStock(state.currentTicker);

    // Live price simulation interval
    setInterval(simulateTick, 1500);

    // Window resize handler
    window.addEventListener("resize", () => {
        if (state.historicalData.length > 0) {
            renderCharts();
        }
    });
});

function renderSectorsGrid() {
    const grid = document.getElementById("sectorsGrid");
    if (!grid) return;

    grid.innerHTML = SECTORS_LIST.map(item => `
        <div class="card" style="padding: 14px; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <span style="font-family: var(--font-mono); font-weight: 800; font-size: 1rem;">${item.etf}</span>
                    <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 6px;">${item.name}</span>
                </div>
                <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.9rem; color: ${item.chg.startsWith('+') ? '#10b981' : '#f43f5e'};">
                    $${item.price} (${item.chg})
                </div>
            </div>
            <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 6px;">TOP 3 HOLDINGS:</div>
            <div style="display: flex; gap: 6px;">
                ${item.top.map(sym => `<span onclick="loadStock('${sym}')" style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.75rem; cursor: pointer; color: #3b82f6; font-weight: 600;">${sym}</span>`).join("")}
            </div>
        </div>
    `).join("");
}

function generateOHLCV(basePrice, days = 90) {
    const data = [];
    let currentClose = basePrice * 0.85;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const volatility = 0.022;
        const changePercent = (Math.random() - 0.48) * volatility;
        
        const open = currentClose;
        const close = open * (1 + changePercent);
        const high = Math.max(open, close) * (1 + Math.random() * 0.012);
        const low = Math.min(open, close) * (1 - Math.random() * 0.012);
        const volume = Math.floor(20000000 + Math.random() * 50000000);

        currentClose = close;

        data.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            timestamp: date.getTime(),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: volume
        });
    }
    return data;
}

function calculateFloorPivots(high, low, close) {
    const p = (high + low + close) / 3.0;
    const r1 = (2.0 * p) - low;
    const r2 = p + (high - low);
    const r3 = high + 2.0 * (p - low);
    
    const s1 = (2.0 * p) - high;
    const s2 = p - (high - low);
    const s3 = low - 2.0 * (high - p);

    return {
        p: parseFloat(p.toFixed(2)),
        r1: parseFloat(r1.toFixed(2)),
        r2: parseFloat(r2.toFixed(2)),
        r3: parseFloat(r3.toFixed(2)),
        s1: parseFloat(s1.toFixed(2)),
        s2: parseFloat(s2.toFixed(2)),
        s3: parseFloat(s3.toFixed(2))
    };
}

function calculateTechnicalIndicators(data) {
    const closes = data.map(d => d.close);
    
    const sma20 = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < 19) {
            sma20.push(null);
        } else {
            const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
            sma20.push(parseFloat((sum / 20).toFixed(2)));
        }
    }

    const ema12 = [];
    const k = 2 / (12 + 1);
    let prevEMA = closes[0];
    for (let i = 0; i < closes.length; i++) {
        if (i === 0) {
            ema12.push(prevEMA);
        } else {
            const currentEMA = closes[i] * k + prevEMA * (1 - k);
            ema12.push(parseFloat(currentEMA.toFixed(2)));
            prevEMA = currentEMA;
        }
    }

    const rsi14 = [];
    let gains = 0, losses = 0;
    for (let i = 1; i <= 14 && i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    let avgGain = gains / 14;
    let avgLoss = losses / 14;

    for (let i = 0; i < closes.length; i++) {
        if (i < 14) {
            rsi14.push(null);
        } else {
            const diff = closes[i] - closes[i - 1];
            const gain = diff >= 0 ? diff : 0;
            const loss = diff < 0 ? -diff : 0;

            avgGain = (avgGain * 13 + gain) / 14;
            avgLoss = (avgLoss * 13 + loss) / 14;

            if (avgLoss === 0) {
                rsi14.push(100);
            } else {
                const rs = avgGain / avgLoss;
                rsi14.push(parseFloat((100 - (100 / (1 + rs))).toFixed(2)));
            }
        }
    }

    return { sma20, ema12, rsi14 };
}

function loadStock(ticker) {
    state.currentTicker = ticker;
    const stock = STOCKS_DB[ticker] || {
        symbol: ticker,
        company: ticker + " Corp",
        exchange: "NASDAQ",
        sector: "General",
        basePrice: 150.00,
        pe: 25.0,
        eps: 5.0,
        divYield: "1.2%",
        marketCap: "$100B",
        beta: 1.0,
        avgVol: "10.0M",
        range52W: [100.0, 200.0]
    };

    document.getElementById("heroSymbol").textContent = stock.symbol;
    document.getElementById("heroCompany").textContent = stock.company;
    document.getElementById("heroExchange").textContent = stock.exchange;
    document.getElementById("heroSector").textContent = stock.sector;
    document.getElementById("heroAvatar").textContent = stock.symbol.slice(0, 4);

    const price = stock.basePrice;
    const changePct = 3.56;
    const changeAmt = (price * (changePct / 100)).toFixed(2);

    document.getElementById("heroPrice").textContent = `$${price.toFixed(2)}`;
    const heroChg = document.getElementById("heroChange");
    heroChg.className = `hero-change-pill ${changePct >= 0 ? 'positive' : 'negative'}`;
    heroChg.innerHTML = `<i class="fa-solid fa-arrow-trend-${changePct >= 0 ? 'up' : 'down'}"></i> <span>+${changeAmt} (+${changePct.toFixed(2)}%)</span>`;

    document.getElementById("heroDayRange").textContent = `$${(price * 0.98).toFixed(2)} - $${(price * 1.02).toFixed(2)}`;
    document.getElementById("heroVolume").textContent = stock.avgVol;
    document.getElementById("heroMarketCap").textContent = stock.marketCap;
    document.getElementById("hero52W").textContent = `$${stock.range52W[0]} - $${stock.range52W[1]}`;

    state.historicalData = generateOHLCV(stock.basePrice, 90);
    state.indicatorsData = calculateTechnicalIndicators(state.historicalData);
    
    if (stock.pivotP) {
        state.pivotsData = {
            p: stock.pivotP,
            r1: stock.r1,
            r2: parseFloat((stock.pivotP + (stock.basePrice * 0.03)).toFixed(2)),
            r3: parseFloat((stock.pivotP + (stock.basePrice * 0.05)).toFixed(2)),
            s1: stock.s1,
            s2: parseFloat((stock.pivotP - (stock.basePrice * 0.03)).toFixed(2)),
            s3: parseFloat((stock.pivotP - (stock.basePrice * 0.05)).toFixed(2))
        };
    } else {
        const lastBar = state.historicalData[state.historicalData.length - 1];
        state.pivotsData = calculateFloorPivots(lastBar.high, lastBar.low, lastBar.close);
    }

    renderCharts();
    renderPivotsCard();
    renderMetrics(stock);
    renderNews(stock);
}

function renderPivotsCard() {
    const container = document.getElementById("pivotsContainer");
    if (!container) return;

    const p = state.pivotsData;
    container.innerHTML = `
        <div class="pivots-grid">
            <div class="pivot-cell res">
                <div class="pivot-lbl">Resistance 3 (R3)</div>
                <div class="pivot-val">$${p.r3}</div>
            </div>
            <div class="pivot-cell res">
                <div class="pivot-lbl">Resistance 2 (R2)</div>
                <div class="pivot-val">$${p.r2}</div>
            </div>
            <div class="pivot-cell res">
                <div class="pivot-lbl">Resistance 1 (R1)</div>
                <div class="pivot-val">$${p.r1}</div>
            </div>
            <div class="pivot-cell main-p">
                <div class="pivot-lbl">Floor Pivot (P)</div>
                <div class="pivot-val">$${p.p}</div>
            </div>
            <div class="pivot-cell sup">
                <div class="pivot-lbl">Support 1 (S1)</div>
                <div class="pivot-val">$${p.s1}</div>
            </div>
            <div class="pivot-cell sup">
                <div class="pivot-lbl">Support 2 (S2)</div>
                <div class="pivot-val">$${p.s2}</div>
            </div>
            <div class="pivot-cell sup">
                <div class="pivot-lbl">Support 3 (S3)</div>
                <div class="pivot-val">$${p.s3}</div>
            </div>
        </div>
    `;
}

function renderMetrics(stock) {
    const grid = document.getElementById("metricsGrid");
    if (!grid) return;

    const low52 = stock.range52W[0];
    const high52 = stock.range52W[1];
    const curPrice = stock.basePrice;
    const rangePercent = Math.min(100, Math.max(0, ((curPrice - low52) / (high52 - low52)) * 100));

    grid.innerHTML = `
        <div class="metric-card">
            <div class="metric-header">
                <span class="metric-label">P/E Ratio</span>
                <i class="fa-solid fa-calculator metric-icon"></i>
            </div>
            <div class="metric-value">${stock.pe}</div>
            <div class="metric-sub">Valuation Multiple</div>
        </div>

        <div class="metric-card">
            <div class="metric-header">
                <span class="metric-label">EPS (TTM)</span>
                <i class="fa-solid fa-coins metric-icon"></i>
            </div>
            <div class="metric-value">$${stock.eps}</div>
            <div class="metric-sub">Earnings Per Share</div>
        </div>

        <div class="metric-card">
            <div class="metric-header">
                <span class="metric-label">Dividend Yield</span>
                <i class="fa-solid fa-percent metric-icon"></i>
            </div>
            <div class="metric-value">${stock.divYield}</div>
            <div class="metric-sub">Annual Distribution</div>
        </div>

        <div class="metric-card">
            <div class="metric-header">
                <span class="metric-label">Beta (5Y)</span>
                <i class="fa-solid fa-wave-square metric-icon"></i>
            </div>
            <div class="metric-value">${stock.beta}</div>
            <div class="metric-sub">Market Volatility Index</div>
        </div>

        <div class="metric-card">
            <div class="metric-header">
                <span class="metric-label">Avg Volume</span>
                <i class="fa-solid fa-chart-column metric-icon"></i>
            </div>
            <div class="metric-value">${stock.avgVol}</div>
            <div class="metric-sub">30-Day Mean Ticks</div>
        </div>

        <div class="metric-card">
            <div class="metric-header">
                <span class="metric-label">52-Week Price Position</span>
                <i class="fa-solid fa-arrows-left-right metric-icon"></i>
            </div>
            <div class="range-bar-container">
                <div class="range-bar-track">
                    <div class="range-bar-fill" style="width: ${rangePercent}%;"></div>
                </div>
                <div class="range-bar-labels">
                    <span>$${low52}</span>
                    <span>$${high52}</span>
                </div>
            </div>
        </div>
    `;
}

function renderNews(stock) {
    const container = document.getElementById("newsContainer");
    if (!container) return;

    const newsItems = [
        {
            title: `${stock.symbol} Outperforms Benchmark on Strong Institutional Volume`,
            snippet: `Analysts raise price target citing operational momentum and expanding market share in key sectors.`,
            sentiment: "bullish",
            time: "12m ago"
        },
        {
            title: `Q3 Earnings Preview: Key Metrics to Watch for ${stock.company}`,
            snippet: `Revenue growth is expected to hit upper target bounds according to Wall Street consensus estimates.`,
            sentiment: "bullish",
            time: "1h ago"
        },
        {
            title: `Market Volatility Increases as Macro Data Shift Interest Rate Expectations`,
            snippet: `Broad index rebalancing creates temporary price shifts across high-beta technology equities.`,
            sentiment: "bearish",
            time: "3h ago"
        }
    ];

    container.innerHTML = newsItems.map(item => `
        <div class="news-card">
            <div class="news-card-header">
                <span class="sentiment-tag ${item.sentiment}">${item.sentiment}</span>
                <span class="news-time">${item.time}</span>
            </div>
            <div class="news-title">${item.title}</div>
            <div class="news-snippet">${item.snippet}</div>
        </div>
    `).join("");
}

function renderCharts() {
    const mainCanvas = document.getElementById("mainChartCanvas");
    const subCanvas = document.getElementById("subChartCanvas");

    if (!mainCanvas || !subCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const mainRect = mainCanvas.getBoundingClientRect();
    const subRect = subCanvas.getBoundingClientRect();

    mainCanvas.width = mainRect.width * dpr;
    mainCanvas.height = mainRect.height * dpr;
    subCanvas.width = subRect.width * dpr;
    subCanvas.height = subRect.height * dpr;

    const ctx = mainCanvas.getContext("2d");
    const subCtx = subCanvas.getContext("2d");

    ctx.scale(dpr, dpr);
    subCtx.scale(dpr, dpr);

    const width = mainRect.width;
    const mainHeight = mainRect.height;
    const subHeight = subRect.height;

    const sliceCount = state.timeframe === '1D' ? 24 : (state.timeframe === '1W' ? 35 : 60);
    const chartData = state.historicalData.slice(-sliceCount);
    const smaData = state.indicatorsData.sma20.slice(-sliceCount);
    const rsiData = state.indicatorsData.rsi14.slice(-sliceCount);

    const padding = { top: 20, right: 60, bottom: 25, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = mainHeight - padding.top - padding.bottom;

    let minPrice = Math.min(...chartData.map(d => d.low));
    let maxPrice = Math.max(...chartData.map(d => d.high));

    if (state.indicators.pivots && state.pivotsData.p) {
        minPrice = Math.min(minPrice, state.pivotsData.s1);
        maxPrice = Math.max(maxPrice, state.pivotsData.r1);
    }

    const priceMargin = (maxPrice - minPrice) * 0.08;
    minPrice -= priceMargin;
    maxPrice += priceMargin;

    ctx.clearRect(0, 0, width, mainHeight);
    subCtx.clearRect(0, 0, width, subHeight);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const priceLabel = (maxPrice - ((maxPrice - minPrice) / 4) * i).toFixed(2);
        ctx.fillStyle = "#64748b";
        ctx.font = "10px 'JetBrains Mono'";
        ctx.fillText(`$${priceLabel}`, width - padding.right + 8, y + 3);
    }

    const stepX = chartW / (chartData.length - 1);

    if (state.indicators.pivots && state.pivotsData.p) {
        const p = state.pivotsData;
        const levels = [
            { label: "P", val: p.p, color: "#8b5cf6" },
            { label: "R1", val: p.r1, color: "#f43f5e" },
            { label: "S1", val: p.s1, color: "#10b981" }
        ];

        levels.forEach(lvl => {
            const y = padding.top + chartH * (1 - (lvl.val - minPrice) / (maxPrice - minPrice));
            if (y >= padding.top && y <= mainHeight - padding.bottom) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = lvl.color;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = lvl.color;
                ctx.font = "9px 'JetBrains Mono'";
                ctx.fillText(`${lvl.label} $${lvl.val}`, padding.left + 8, y - 3);
            }
        });
    }

    if (state.chartType === "candlestick") {
        const candleW = Math.max(3, stepX * 0.65);

        chartData.forEach((d, i) => {
            const x = padding.left + i * stepX;
            const openY = padding.top + chartH * (1 - (d.open - minPrice) / (maxPrice - minPrice));
            const closeY = padding.top + chartH * (1 - (d.close - minPrice) / (maxPrice - minPrice));
            const highY = padding.top + chartH * (1 - (d.high - minPrice) / (maxPrice - minPrice));
            const lowY = padding.top + chartH * (1 - (d.low - minPrice) / (maxPrice - minPrice));

            const isBullish = d.close >= d.open;
            const color = isBullish ? "#10b981" : "#f43f5e";

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            ctx.fillStyle = color;
            const bodyY = Math.min(openY, closeY);
            const bodyH = Math.max(2, Math.abs(closeY - openY));
            ctx.fillRect(x - candleW / 2, bodyY, candleW, bodyH);
        });
    } else {
        ctx.beginPath();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.5;

        chartData.forEach((d, i) => {
            const x = padding.left + i * stepX;
            const y = padding.top + chartH * (1 - (d.close - minPrice) / (maxPrice - minPrice));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        const grad = ctx.createLinearGradient(0, padding.top, 0, mainHeight);
        grad.addColorStop(0, "rgba(59, 130, 246, 0.35)");
        grad.addColorStop(1, "rgba(59, 130, 246, 0.0)");

        ctx.lineTo(padding.left + (chartData.length - 1) * stepX, mainHeight - padding.bottom);
        ctx.lineTo(padding.left, mainHeight - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    if (state.indicators.sma) {
        ctx.beginPath();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.8;

        smaData.forEach((val, i) => {
            if (val !== null) {
                const x = padding.left + i * stepX;
                const y = padding.top + chartH * (1 - (val - minPrice) / (maxPrice - minPrice));
                if (i === 0 || smaData[i - 1] === null) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    const subH = subHeight - 30;
    subCtx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    subCtx.lineWidth = 1;

    const y70 = 15 + subH * (1 - 70 / 100);
    const y30 = 15 + subH * (1 - 30 / 100);

    subCtx.setLineDash([4, 4]);
    subCtx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    subCtx.beginPath();
    subCtx.moveTo(padding.left, y70);
    subCtx.lineTo(width - padding.right, y70);
    subCtx.stroke();

    subCtx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    subCtx.beginPath();
    subCtx.moveTo(padding.left, y30);
    subCtx.lineTo(width - padding.right, y30);
    subCtx.stroke();

    subCtx.setLineDash([]);

    subCtx.fillStyle = "#64748b";
    subCtx.font = "9px 'JetBrains Mono'";
    subCtx.fillText("RSI (14)", padding.left, 12);
    subCtx.fillText("70", width - padding.right + 8, y70 + 3);
    subCtx.fillText("30", width - padding.right + 8, y30 + 3);

    subCtx.beginPath();
    subCtx.strokeStyle = "#8b5cf6";
    subCtx.lineWidth = 2;

    rsiData.forEach((val, i) => {
        if (val !== null) {
            const x = padding.left + i * stepX;
            const y = 15 + subH * (1 - val / 100);
            if (i === 0 || rsiData[i - 1] === null) subCtx.moveTo(x, y);
            else subCtx.lineTo(x, y);
        }
    });
    subCtx.stroke();
}

function initTickerRibbon() {
    const track = document.getElementById("tickerTrack");
    if (!track) return;
    const itemsHTML = MARKET_INDEXES.map(idx => `
        <div class="ticker-item">
            <span class="ticker-name">${idx.name}</span>
            <span class="ticker-val">${idx.val}</span>
            <span class="ticker-chg ${idx.pos ? 'pos' : 'neg'}">${idx.chg}</span>
        </div>
    `).join("");

    track.innerHTML = itemsHTML + itemsHTML + itemsHTML;
}

function initWatchlist() {
    renderWatchlist();

    const addBtn = document.getElementById("addToWatchlistBtn");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            if (!state.watchlist.includes(state.currentTicker)) {
                state.watchlist.push(state.currentTicker);
                localStorage.setItem('pulse_watchlist', JSON.stringify(state.watchlist));
                renderWatchlist();
            }
        });
    }
}

function renderWatchlist() {
    const container = document.getElementById("watchlistContainer");
    if (!container) return;

    container.innerHTML = state.watchlist.map(symbol => {
        const stock = STOCKS_DB[symbol] || { symbol: symbol, basePrice: 100.0, company: symbol };
        const price = stock.basePrice;
        const isPos = true;
        const chgStr = "+2.45%";

        return `
            <div class="wl-item" data-ticker="${symbol}">
                <div>
                    <div class="wl-symbol">${symbol}</div>
                    <div class="wl-name">${stock.company.slice(0, 16)}</div>
                </div>
                <div class="wl-price-col">
                    <div class="wl-price">$${price.toFixed(2)}</div>
                    <div class="wl-chg ${isPos ? 'pos' : 'neg'}">${chgStr}</div>
                </div>
                <button class="wl-remove" data-remove="${symbol}"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    }).join("");

    container.querySelectorAll(".wl-item").forEach(item => {
        item.addEventListener("click", (e) => {
            if (e.target.closest(".wl-remove")) return;
            const ticker = item.getAttribute("data-ticker");
            loadStock(ticker);
        });
    });

    container.querySelectorAll(".wl-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const symbol = btn.getAttribute("data-remove");
            state.watchlist = state.watchlist.filter(s => s !== symbol);
            localStorage.setItem('pulse_watchlist', JSON.stringify(state.watchlist));
            renderWatchlist();
        });
    });
}

function initFinvizMovers() {
    const container = document.getElementById("moversContainer");
    if (!container) return;

    const tabW = document.getElementById("tabWinners");
    const tabL = document.getElementById("tabLosers");

    function renderMovers(data, isWinner) {
        container.innerHTML = data.map(item => `
            <div class="mover-item" onclick="loadStock('${item.ticker}')" style="cursor: pointer;">
                <div>
                    <div class="mover-ticker">${item.ticker}</div>
                    <div class="mover-sector">${item.sector}</div>
                </div>
                <div class="mover-chg ${isWinner ? 'pos' : 'neg'}" style="color: ${isWinner ? '#10b981' : '#f43f5e'}">
                    ${isWinner ? '+' : ''}${item.change.toFixed(2)}%
                </div>
            </div>
        `).join("");
    }

    renderMovers(FINVIZ_WINNERS, true);

    if (tabW && tabL) {
        tabW.addEventListener("click", () => {
            tabW.classList.add("active");
            tabL.classList.remove("active");
            renderMovers(FINVIZ_WINNERS, true);
        });

        tabL.addEventListener("click", () => {
            tabL.classList.add("active");
            tabW.classList.remove("active");
            renderMovers(FINVIZ_LOSERS, false);
        });
    }
}

function initSearch() {
    const input = document.getElementById("searchInput");
    const dropdown = document.getElementById("searchDropdown");

    if (!input || !dropdown) return;

    input.addEventListener("input", (e) => {
        const query = e.target.value.trim().toUpperCase();
        if (!query) {
            dropdown.classList.remove("active");
            return;
        }

        const matches = Object.keys(STOCKS_DB).filter(ticker => {
            const stock = STOCKS_DB[ticker];
            return ticker.includes(query) || stock.company.toUpperCase().includes(query);
        });

        if (matches.length === 0) {
            dropdown.innerHTML = `<div class="dropdown-item" style="color: #64748b;">No matching symbols found</div>`;
        } else {
            dropdown.innerHTML = matches.map(ticker => {
                const stock = STOCKS_DB[ticker];
                return `
                    <div class="dropdown-item" data-ticker="${ticker}">
                        <div>
                            <span class="dd-ticker">${ticker}</span>
                            <span class="dd-name">${stock.company}</span>
                        </div>
                        <span class="dd-price">$${stock.basePrice.toFixed(2)}</span>
                    </div>
                `;
            }).join("");
        }

        dropdown.classList.add("active");
    });

    dropdown.addEventListener("click", (e) => {
        const item = e.target.closest(".dropdown-item");
        if (item) {
            const ticker = item.getAttribute("data-ticker");
            if (ticker) {
                loadStock(ticker);
                input.value = "";
                dropdown.classList.remove("active");
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrapper")) {
            dropdown.classList.remove("active");
        }
    });

    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            input.focus();
        }
    });
}

function initEvents() {
    const btnCandlestick = document.getElementById("btnCandlestick");
    const btnLine = document.getElementById("btnLine");

    if (btnCandlestick) {
        btnCandlestick.addEventListener("click", () => {
            state.chartType = "candlestick";
            btnCandlestick.classList.add("active");
            if (btnLine) btnLine.classList.remove("active");
            renderCharts();
        });
    }

    if (btnLine) {
        btnLine.addEventListener("click", () => {
            state.chartType = "line";
            btnLine.classList.add("active");
            if (btnCandlestick) btnCandlestick.classList.remove("active");
            renderCharts();
        });
    }

    document.querySelectorAll(".seg-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.timeframe = btn.getAttribute("data-tf");
            renderCharts();
        });
    });

    document.querySelectorAll(".indicator-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const ind = chip.getAttribute("data-indicator");
            state.indicators[ind] = !state.indicators[ind];
            chip.classList.toggle("active", state.indicators[ind]);
            renderCharts();
        });
    });
}

function simulateTick() {
    const stock = STOCKS_DB[state.currentTicker];
    if (!stock) return;

    const delta = (Math.random() - 0.49) * 0.40;
    stock.basePrice = Math.max(1.0, stock.basePrice + delta);

    const priceEl = document.getElementById("heroPrice");
    if (priceEl) priceEl.textContent = `$${stock.basePrice.toFixed(2)}`;

    if (state.historicalData.length > 0) {
        const lastBar = state.historicalData[state.historicalData.length - 1];
        lastBar.close = parseFloat(stock.basePrice.toFixed(2));
        lastBar.high = Math.max(lastBar.high, lastBar.close);
        lastBar.low = Math.min(lastBar.low, lastBar.close);
        renderCharts();
    }
}

async function loadLowRiskTrades() {
    const container = document.getElementById("lowRiskContainer");
    if (!container) return;

    try {
        const resp = await fetch('validated_yahoo_data.json');
        if (resp.ok) {
            const data = await resp.json();
            let candidates = data.filter(item => item.Risk_Reward && item.Risk_Reward.rr_ratio >= 1.2);
            candidates.sort((a, b) => b.Risk_Reward.rr_ratio - a.Risk_Reward.rr_ratio);
            
            const top6 = candidates.slice(0, 6);
            if (top6.length > 0) {
                renderLowRiskCards(top6);
                return;
            }
        }
    } catch (e) {
        console.warn("Could not fetch validated_yahoo_data.json, using fallback candidates.", e);
    }

    // Fallback Top 6 Low-Risk Candidates
    const fallbackTop6 = [
        { Ticker: "JNJ", Company: "Johnson & Johnson", "Yahoo Price": 266.32, S1: 264.52, R1: 269.84, "Pivot P": 268.03, Risk_Reward: { rr_ratio: 1.96, risk_percent: 0.68, reward_percent: 1.32 } },
        { Ticker: "PEP", Company: "PepsiCo, Inc.", "Yahoo Price": 136.34, S1: 135.40, R1: 138.05, "Pivot P": 137.10, Risk_Reward: { rr_ratio: 1.82, risk_percent: 0.69, reward_percent: 1.25 } },
        { Ticker: "APD", Company: "Air Products", "Yahoo Price": 287.13, S1: 284.66, R1: 291.47, "Pivot P": 289.01, Risk_Reward: { rr_ratio: 1.77, risk_percent: 0.86, reward_percent: 1.51 } },
        { Ticker: "NEE", Company: "NextEra Energy", "Yahoo Price": 81.63, S1: 81.19, R1: 82.41, "Pivot P": 81.96, Risk_Reward: { rr_ratio: 1.77, risk_percent: 0.54, reward_percent: 0.96 } },
        { Ticker: "EQIX", Company: "Equinix, Inc.", "Yahoo Price": 998.72, S1: 986.64, R1: 1019.12, "Pivot P": 1007.10, Risk_Reward: { rr_ratio: 1.69, risk_percent: 1.21, reward_percent: 2.04 } },
        { Ticker: "OSIS", Company: "OSI Systems, Inc.", "Yahoo Price": 199.95, S1: 198.31, R1: 202.65, "Pivot P": 201.01, Risk_Reward: { rr_ratio: 1.65, risk_percent: 0.82, reward_percent: 1.35 } }
    ];
    renderLowRiskCards(fallbackTop6);
}

function renderLowRiskCards(candidates) {
    const container = document.getElementById("lowRiskContainer");
    if (!container) return;

    container.innerHTML = candidates.map((item, index) => {
        const symbol = item.Ticker || item.symbol;
        const company = item.Company || item.company || symbol;
        const price = item["Yahoo Price"] || item.close || item.basePrice || 100.0;
        const s1 = item.S1 || item.s1 || (price * 0.98);
        const r1 = item.R1 || item.r1 || (price * 1.02);
        const rr = item.Risk_Reward ? item.Risk_Reward.rr_ratio : 1.5;
        const riskPct = item.Risk_Reward ? item.Risk_Reward.risk_percent : (((price - s1) / price) * 100).toFixed(2);
        const rewardPct = item.Risk_Reward ? item.Risk_Reward.reward_percent : (((r1 - price) / price) * 100).toFixed(2);
        const medal = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : `#${index + 1} `;

        return `
            <div class="low-risk-trade-card" onclick="loadStock('${symbol}')" title="Click to view ${symbol} chart">
                <div class="lr-card-header">
                    <div class="lr-symbol-group">
                        <div class="lr-symbol-avatar">${symbol.substring(0, 4)}</div>
                        <div>
                            <div class="lr-symbol-name">${medal}${symbol}</div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);">${company}</div>
                        </div>
                    </div>
                    <span class="lr-rr-badge"><i class="fa-solid fa-shield-halved"></i> ${rr}x R/R</span>
                </div>

                <div class="lr-levels-grid">
                    <div class="lr-level-item">
                        <span class="lr-level-label">Entry</span>
                        <span class="lr-level-val entry">$${price}</span>
                    </div>
                    <div class="lr-level-item">
                        <span class="lr-level-label">Stop (S1)</span>
                        <span class="lr-level-val risk">$${s1}</span>
                    </div>
                    <div class="lr-level-item">
                        <span class="lr-level-label">Target (R1)</span>
                        <span class="lr-level-val target">$${r1}</span>
                    </div>
                </div>

                <div class="lr-footer-action">
                    <span><i class="fa-solid fa-arrow-down text-red"></i> Risk: -${riskPct}%</span>
                    <span><i class="fa-solid fa-arrow-up text-green"></i> Reward: +${rewardPct}%</span>
                </div>
            </div>
        `;
    }).join('');
}

