/* ==========================================================================
   PulseMarket Terminal — Market Movers Page Logic (movers.js)
   ========================================================================== */

let MOVERS_DATA = [
    // WINNERS
    { ticker: "ACFN", company: "Acorn Energy Inc", sector: "Technology", price: 20.97, change: 10.40, vol: "85.1K", relVol: "3.40x", type: "winner", pivot: 20.45 },
    { ticker: "SWKS", company: "Skyworks Solutions Inc", sector: "Technology", price: 84.03, change: 9.79, vol: "11.3M", relVol: "2.80x", type: "winner", pivot: 82.50 },
    { ticker: "FFTH", company: "Faeth Therapeutics Inc", sector: "Healthcare", price: 39.00, change: 7.97, vol: "445.4K", relVol: "4.10x", type: "winner", pivot: 38.10 },
    { ticker: "TYRA", company: "Tyra Biosciences Inc", sector: "Healthcare", price: 23.54, change: 6.95, vol: "2.48M", relVol: "2.50x", type: "winner", pivot: 23.10 },
    { ticker: "QRVO", company: "Qorvo Inc", sector: "Technology", price: 112.36, change: 6.77, vol: "2.25M", relVol: "2.10x", type: "winner", pivot: 110.80 },
    { ticker: "AAPL", company: "Apple Inc.", sector: "Technology", price: 326.57, change: 3.56, vol: "69.4M", relVol: "1.45x", type: "winner", pivot: 323.27 },

    // LOSERS
    { ticker: "NAVN", company: "Navan Inc", sector: "Technology", price: 20.26, change: -21.75, vol: "19.1M", relVol: "5.60x", type: "loser", pivot: 22.40 },
    { ticker: "COO", company: "Cooper Companies Inc", sector: "Healthcare", price: 54.17, change: -14.67, vol: "18.6M", relVol: "4.80x", type: "loser", pivot: 57.80 },
    { ticker: "AXGN", company: "Axogen Inc", sector: "Healthcare", price: 41.85, change: -11.47, vol: "3.76M", relVol: "3.10x", type: "loser", pivot: 44.10 },
    { ticker: "NVDA", company: "NVIDIA Corporation", sector: "Technology", price: 218.36, change: -2.37, vol: "100.6M", relVol: "1.85x", type: "loser", pivot: 218.85 },
    { ticker: "META", company: "Meta Platforms Inc.", sector: "Communication Services", price: 644.38, change: -1.42, vol: "20.4M", relVol: "1.65x", type: "loser", pivot: 650.01 }
];

const MARKET_INDEXES = [
    { name: "S&P 500", val: "5,582.40", chg: "+0.82%", pos: true },
    { name: "NASDAQ", val: "17,680.12", chg: "+1.15%", pos: true },
    { name: "DOW JONES", val: "40,842.10", chg: "+0.34%", pos: true },
    { name: "BITCOIN", val: "$58,420.00", chg: "+3.24%", pos: true },
    { name: "ETHEREUM", val: "$2,510.50", chg: "+2.18%", pos: true }
];

let currentTypeFilter = "all";
let currentSectorFilter = "ALL";
let currentSearchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
    initTickerRibbon();
    initFilters();
    loadScannerResults();
});

function loadScannerResults() {
    fetch("market_analysis_results.json")
        .then(res => res.json())
        .then(data => {
            if (data.marketMovers && data.marketMovers.length > 0) {
                MOVERS_DATA = data.marketMovers.map(item => ({
                    ticker: item.symbol,
                    company: item.symbol + " Corp",
                    sector: getSectorForSymbol(item.symbol),
                    price: item.close,
                    change: item.changePercent,
                    vol: item.volume >= 1000000 ? (item.volume / 1000000).toFixed(1) + "M" : (item.volume / 1000).toFixed(1) + "K",
                    relVol: (item.relVolume || (item.volume / Math.max(1, item.avgVolume))).toFixed(2) + "x",
                    type: item.changePercent >= 0 ? "winner" : "loser",
                    pivot: item.pivots.pivot
                }));
            }
            renderMoversTable();
        })
        .catch(err => {
            console.log("Using default movers data:", err);
            renderMoversTable();
        });
}

function getSectorForSymbol(sym) {
    const map = {
        "AAPL": "Technology", "MSFT": "Technology", "NVDA": "Technology",
        "AMZN": "Consumer Cyclical", "GOOGL": "Communication Services",
        "META": "Communication Services", "TSLA": "Consumer Cyclical",
        "XOM": "Energy", "JPM": "Financials", "LLY": "Healthcare",
        "XLK": "Technology", "XLE": "Energy", "XLF": "Financials"
    };
    return map[sym] || "General";
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

function initFilters() {
    document.querySelectorAll("#moverTypeControl .seg-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#moverTypeControl .seg-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTypeFilter = btn.getAttribute("data-type");
            renderMoversTable();
        });
    });

    const sectorSelect = document.getElementById("sectorFilter");
    if (sectorSelect) {
        sectorSelect.addEventListener("change", (e) => {
            currentSectorFilter = e.target.value;
            renderMoversTable();
        });
    }

    const searchInput = document.getElementById("moversTableFilter");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearchQuery = e.target.value.trim().toUpperCase();
            renderMoversTable();
        });
    }
}

function renderMoversTable() {
    const tbody = document.getElementById("moversTableBody");
    if (!tbody) return;

    let filtered = MOVERS_DATA.filter(item => {
        if (currentTypeFilter === "winners" && item.type !== "winner") return false;
        if (currentTypeFilter === "losers" && item.type !== "loser") return false;

        if (currentSectorFilter !== "ALL" && item.sector !== currentSectorFilter) return false;

        if (currentSearchQuery) {
            const matchesTicker = item.ticker.includes(currentSearchQuery);
            const matchesCompany = item.company.toUpperCase().includes(currentSearchQuery);
            if (!matchesTicker && !matchesCompany) return false;
        }

        return true;
    });

    filtered.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 24px;">No market movers match your filter criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((item, index) => {
        const isPos = item.change >= 0;
        return `
            <tr onclick="window.location.href='index.html?ticker=${item.ticker}'">
                <td>${index + 1}</td>
                <td>
                    <div class="ticker-cell">
                        <span class="symbol-tag">${item.ticker}</span>
                        <span style="font-size: 0.82rem; color: #94a3b8;">${item.company}</span>
                    </div>
                </td>
                <td><span class="badge-sector">${item.sector}</span></td>
                <td class="price-cell">$${item.price.toFixed(2)}</td>
                <td class="change-cell ${isPos ? 'positive' : 'negative'}">
                    ${isPos ? '+' : ''}${item.change.toFixed(2)}%
                </td>
                <td class="vol-cell">${item.vol}</td>
                <td class="vol-cell"><span style="color: #3b82f6; font-weight: 700;">${item.relVol}</span></td>
                <td class="vol-cell"><span style="color: #8b5cf6; font-weight: 700;">$${item.pivot ? item.pivot.toFixed(2) : '-'}</span></td>
                <td>
                    <button class="btn-analyze" onclick="event.stopPropagation(); window.location.href='index.html?ticker=${item.ticker}'">
                        Analyze <i class="fa-solid fa-arrow-trend-up"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}
