/* ==========================================================================
   PulseMarket Terminal — Magnificent Seven & Featured Stocks Page Logic (mag7.js)
   ========================================================================== */

let MAG7_STOCKS = [
    { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 326.57, change: 3.56, mcap: "$4.77T", pe: 34.2, vol: "69.4M", relVol: "1.45x", pivot: 323.27, r1: 329.97, s1: 319.87 },
    { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology", price: 218.36, change: -2.37, mcap: "$5.27T", pe: 58.4, vol: "100.6M", relVol: "1.85x", pivot: 218.85, r1: 220.50, s1: 216.71 },
    { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", price: 492.44, change: 0.16, mcap: "$3.66T", pe: 36.8, vol: "15.4M", relVol: "1.12x", pivot: 490.99, r1: 495.98, s1: 487.46 },
    { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Communication", price: 332.60, change: 0.59, mcap: "$4.07T", pe: 24.1, vol: "22.6M", relVol: "1.20x", pivot: 331.19, r1: 334.63, s1: 329.15 },
    { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", price: 251.89, change: -0.20, mcap: "$2.72T", pe: 42.5, vol: "24.9M", relVol: "1.15x", pivot: 251.54, r1: 253.50, s1: 249.93 },
    { ticker: "META", name: "Meta Platforms Inc.", sector: "Communication", price: 644.38, change: -1.42, mcap: "$1.64T", pe: 27.6, vol: "20.4M", relVol: "1.65x", pivot: 650.01, r1: 657.88, s1: 636.52 },
    { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Cyclical", price: 363.56, change: -1.16, mcap: "$1.44T", pe: 62.1, vol: "29.5M", relVol: "1.30x", pivot: 363.48, r1: 369.28, s1: 357.75 },
    { ticker: "OSIS", name: "OSI Systems, Inc.", sector: "Technology / Security", price: 201.25, change: 1.90, mcap: "$3.21B", pe: 24.8, vol: "267.8K", relVol: "1.45x", pivot: 199.70, r1: 203.49, s1: 197.46 }
];

const MARKET_INDEXES = [
    { name: "S&P 500", val: "5,582.40", chg: "+0.82%", pos: true },
    { name: "NASDAQ", val: "17,680.12", chg: "+1.15%", pos: true },
    { name: "DOW JONES", val: "40,842.10", chg: "+0.34%", pos: true },
    { name: "BITCOIN", val: "$58,420.00", chg: "+3.24%", pos: true },
    { name: "ETHEREUM", val: "$2,510.50", chg: "+2.18%", pos: true }
];

document.addEventListener("DOMContentLoaded", () => {
    initTickerRibbon();
    loadMag7Results();
});

function loadMag7Results() {
    fetch("market_analysis_results.json")
        .then(res => res.json())
        .then(data => {
            if (data.magnificentSeven && data.magnificentSeven.length > 0) {
                const fetched = data.magnificentSeven.map(item => ({
                    ticker: item.symbol,
                    name: getCompanyName(item.symbol),
                    sector: getSectorName(item.symbol),
                    price: item.close,
                    change: item.changePercent,
                    mcap: getMcapString(item.symbol),
                    pe: getPeString(item.symbol),
                    vol: item.volume >= 1000000 ? (item.volume / 1000000).toFixed(1) + "M" : (item.volume / 1000).toFixed(1) + "K",
                    relVol: (item.relVolume || (item.volume / Math.max(1, item.avgVolume))).toFixed(2) + "x",
                    pivot: item.pivots.pivot,
                    r1: item.pivots.r1,
                    s1: item.pivots.s1
                }));

                // Ensure OSIS is included in list
                const hasOSIS = fetched.some(s => s.ticker === "OSIS");
                if (!hasOSIS) {
                    fetched.push(MAG7_STOCKS.find(s => s.ticker === "OSIS"));
                }
                MAG7_STOCKS = fetched;
            }
            renderMag7Cards();
            renderMag7Table();
        })
        .catch(err => {
            console.log("Using default mag7 data:", err);
            renderMag7Cards();
            renderMag7Table();
        });
}

function getCompanyName(sym) {
    const map = {
        "AAPL": "Apple Inc.", "MSFT": "Microsoft Corporation", "NVDA": "NVIDIA Corporation",
        "AMZN": "Amazon.com Inc.", "GOOGL": "Alphabet Inc.", "META": "Meta Platforms Inc.",
        "TSLA": "Tesla Inc.", "OSIS": "OSI Systems, Inc."
    };
    return map[sym] || sym + " Corp";
}

function getSectorName(sym) {
    const map = {
        "AAPL": "Technology", "MSFT": "Technology", "NVDA": "Technology",
        "AMZN": "Consumer Cyclical", "GOOGL": "Communication", "META": "Communication",
        "TSLA": "Consumer Cyclical", "OSIS": "Technology / Security"
    };
    return map[sym] || "Technology";
}

function getMcapString(sym) {
    const map = {
        "AAPL": "$4.77T", "NVDA": "$5.27T", "MSFT": "$3.66T", "GOOGL": "$4.07T",
        "AMZN": "$2.72T", "META": "$1.64T", "TSLA": "$1.44T", "OSIS": "$3.21B"
    };
    return map[sym] || "$1.0T";
}

function getPeString(sym) {
    const map = {
        "AAPL": 34.2, "NVDA": 58.4, "MSFT": 36.8, "GOOGL": 24.1,
        "AMZN": 42.5, "META": 27.6, "TSLA": 62.1, "OSIS": 24.8
    };
    return map[sym] || 25.0;
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

function renderMag7Cards() {
    const grid = document.getElementById("mag7CardsGrid");
    if (!grid) return;

    grid.innerHTML = MAG7_STOCKS.map(stock => {
        const isPos = stock.change >= 0;
        return `
            <div class="card" onclick="window.location.href='index.html?ticker=${stock.ticker}'" style="cursor: pointer; padding: 20px; border-radius: 16px; transition: transform 0.2s, border-color 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-weight: 800; color: #fff;">
                            ${stock.ticker.slice(0, 4)}
                        </div>
                        <div>
                            <div style="font-family: var(--font-mono); font-weight: 800; font-size: 1.15rem;">${stock.ticker}</div>
                            <div style="font-size: 0.78rem; color: #94a3b8;">${stock.name}</div>
                        </div>
                    </div>
                    <span style="font-size: 0.7rem; background: rgba(59,130,246,0.15); color: #3b82f6; padding: 2px 8px; border-radius: 99px; font-weight: 600;">${stock.sector}</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px;">
                    <div style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 800;">$${stock.price.toFixed(2)}</div>
                    <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.88rem; padding: 2px 8px; border-radius: 99px; background: ${isPos ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}; color: ${isPos ? '#10b981' : '#f43f5e'};">
                        ${isPos ? '+' : ''}${stock.change.toFixed(2)}%
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
                    <div>
                        <div style="font-size: 0.65rem; color: #64748b;">VOLUME</div>
                        <div style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700;">${stock.vol}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.65rem; color: #64748b;">REL VOL</div>
                        <div style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: #3b82f6;">${stock.relVol}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.65rem; color: #64748b;">FLOOR PIVOT</div>
                        <div style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: #8b5cf6;">$${stock.pivot}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.65rem; color: #64748b;">MARKET CAP</div>
                        <div style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600;">${stock.mcap}</div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderMag7Table() {
    const tbody = document.getElementById("mag7TableBody");
    if (!tbody) return;

    tbody.innerHTML = MAG7_STOCKS.map(stock => {
        const isPos = stock.change >= 0;
        return `
            <tr onclick="window.location.href='index.html?ticker=${stock.ticker}'">
                <td>
                    <div class="ticker-cell">
                        <span class="symbol-tag">${stock.ticker}</span>
                        <span style="font-size: 0.82rem; color: #94a3b8;">${stock.name}</span>
                    </div>
                </td>
                <td><span class="badge-sector">${stock.sector}</span></td>
                <td class="price-cell">$${stock.price.toFixed(2)}</td>
                <td class="change-cell ${isPos ? 'positive' : 'negative'}">
                    ${isPos ? '+' : ''}${stock.change.toFixed(2)}%
                </td>
                <td class="vol-cell">${stock.vol}</td>
                <td class="vol-cell"><span style="color: #3b82f6; font-weight: 700;">${stock.relVol}</span></td>
                <td class="vol-cell">${stock.mcap}</td>
                <td class="vol-cell">${stock.pe}</td>
                <td class="vol-cell"><span style="color: #8b5cf6; font-weight: 700;">$${stock.pivot}</span></td>
                <td class="vol-cell"><span style="color: #f43f5e; font-weight: 600;">$${stock.r1}</span></td>
                <td class="vol-cell"><span style="color: #10b981; font-weight: 600;">$${stock.s1}</span></td>
                <td>
                    <button class="btn-analyze" onclick="event.stopPropagation(); window.location.href='index.html?ticker=${stock.ticker}'">
                        Analyze <i class="fa-solid fa-arrow-trend-up"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}
