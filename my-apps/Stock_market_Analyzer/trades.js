/* ==========================================================================
   PulseMarket Terminal — Asymmetric Low-Risk Trades Controller
   ========================================================================== */

const MARKET_INDEXES = [
    { name: "S&P 500", val: "5,582.40", chg: "+0.82%", pos: true },
    { name: "NASDAQ", val: "17,680.12", chg: "+1.15%", pos: true },
    { name: "DOW JONES", val: "40,842.10", chg: "+0.34%", pos: true },
    { name: "BITCOIN", val: "$58,420.00", chg: "+3.24%", pos: true },
    { name: "ETHEREUM", val: "$2,510.50", chg: "+2.18%", pos: true }
];

let allTradeCandidates = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
    initTickerRibbon();
    initFilterControls();
    loadTradesData();
});

function initTickerRibbon() {
    const track = document.getElementById("tickerTrack");
    if (!track) return;

    const itemsHTML = MARKET_INDEXES.map(idx => `
        <div class="ticker-item">
            <span class="ticker-name">${idx.name}</span>
            <span class="ticker-val">${idx.val}</span>
            <span class="ticker-chg ${idx.pos ? 'positive' : 'negative'}">
                <i class="fa-solid fa-caret-${idx.pos ? 'up' : 'down'}"></i> ${idx.chg}
            </span>
        </div>
    `).join('');

    track.innerHTML = itemsHTML + itemsHTML;
}

async function loadTradesData() {
    try {
        const resp = await fetch('validated_yahoo_data.json');
        if (resp.ok) {
            const data = await resp.json();
            let candidates = data.filter(item => item.Risk_Reward && item.Risk_Reward.rr_ratio >= 1.2);
            candidates.sort((a, b) => b.Risk_Reward.rr_ratio - a.Risk_Reward.rr_ratio);
            
            if (candidates.length > 0) {
                allTradeCandidates = candidates;
                renderTop6Grid(candidates.slice(0, 6));
                renderTradesTable(candidates);
                return;
            }
        }
    } catch (e) {
        console.warn("Could not fetch validated_yahoo_data.json, using fallback candidates.", e);
    }

    // Fallback Candidates
    allTradeCandidates = [
        { Ticker: "JNJ", Company: "Johnson & Johnson", "Yahoo Price": 266.32, S1: 264.52, R1: 269.84, "Pivot P": 268.03, Risk_Reward: { rr_ratio: 1.96, risk_percent: 0.68, reward_percent: 1.32 } },
        { Ticker: "PEP", Company: "PepsiCo, Inc.", "Yahoo Price": 136.34, S1: 135.40, R1: 138.05, "Pivot P": 137.10, Risk_Reward: { rr_ratio: 1.82, risk_percent: 0.69, reward_percent: 1.25 } },
        { Ticker: "APD", Company: "Air Products", "Yahoo Price": 287.13, S1: 284.67, R1: 291.48, "Pivot P": 289.01, Risk_Reward: { rr_ratio: 1.77, risk_percent: 0.86, reward_percent: 1.51 } },
        { Ticker: "NEE", Company: "NextEra Energy", "Yahoo Price": 81.63, S1: 81.19, R1: 82.41, "Pivot P": 81.96, Risk_Reward: { rr_ratio: 1.77, risk_percent: 0.54, reward_percent: 0.96 } },
        { Ticker: "EQIX", Company: "Equinix, Inc.", "Yahoo Price": 998.72, S1: 986.67, R1: 1019.14, "Pivot P": 1007.10, Risk_Reward: { rr_ratio: 1.69, risk_percent: 1.21, reward_percent: 2.04 } },
        { Ticker: "OSIS", Company: "OSI Systems, Inc.", "Yahoo Price": 199.95, S1: 198.31, R1: 202.65, "Pivot P": 201.01, Risk_Reward: { rr_ratio: 1.65, risk_percent: 0.82, reward_percent: 1.35 } },
        { Ticker: "XLU", Company: "Utilities ETF", "Yahoo Price": 41.82, S1: 41.56, R1: 42.25, "Pivot P": 42.00, Risk_Reward: { rr_ratio: 1.65, risk_percent: 0.62, reward_percent: 1.03 } },
        { Ticker: "CVX", Company: "Chevron Corp", "Yahoo Price": 212.17, S1: 209.75, R1: 216.13, "Pivot P": 213.70, Risk_Reward: { rr_ratio: 1.64, risk_percent: 1.14, reward_percent: 1.87 } },
        { Ticker: "BAC", Company: "Bank of America", "Yahoo Price": 59.47, S1: 58.12, R1: 61.64, "Pivot P": 60.28, Risk_Reward: { rr_ratio: 1.61, risk_percent: 2.27, reward_percent: 3.65 } }
    ];

    renderTop6Grid(allTradeCandidates.slice(0, 6));
    renderTradesTable(allTradeCandidates);
}

function renderTop6Grid(top6) {
    const container = document.getElementById("top6TradeGrid");
    if (!container) return;

    container.innerHTML = top6.map((item, index) => {
        const symbol = item.Ticker || item.symbol;
        const company = item.Company || item.company || symbol;
        const price = item["Yahoo Price"] || item.close || 100.0;
        const s1 = item.S1 || item.s1;
        const r1 = item.R1 || item.r1;
        const rr = item.Risk_Reward ? item.Risk_Reward.rr_ratio : 1.5;
        const riskPct = item.Risk_Reward ? item.Risk_Reward.risk_percent : 1.0;
        const rewardPct = item.Risk_Reward ? item.Risk_Reward.reward_percent : 2.0;
        const medal = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : `#${index + 1} `;

        return `
            <div class="low-risk-trade-card" onclick="window.location.href='index.html?ticker=${symbol}'" title="Click to view ${symbol} chart">
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

function renderTradesTable(list) {
    const tbody = document.getElementById("tradesTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">No matching trade candidates found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((item, index) => {
        const symbol = item.Ticker || item.symbol;
        const company = item.Company || item.company || symbol;
        const price = item["Yahoo Price"] || item.close || 100.0;
        const s1 = item.S1 || item.s1;
        const r1 = item.R1 || item.r1;
        const pivot = item["Pivot P"] || item.pivotP || 0.0;
        const rr = item.Risk_Reward ? item.Risk_Reward.rr_ratio : 1.5;
        const riskPct = item.Risk_Reward ? item.Risk_Reward.risk_percent : 1.0;
        const rewardPct = item.Risk_Reward ? item.Risk_Reward.reward_percent : 2.0;
        const rankBadge = index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : index === 2 ? "🥉 #3" : `#${index + 1}`;

        return `
            <tr>
                <td style="font-weight: 700; color: var(--accent-gold);">${rankBadge}</td>
                <td>
                    <div style="font-weight: 700; font-family: 'Outfit', sans-serif; font-size: 1rem;">${symbol}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${company}</div>
                </td>
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--accent-blue);">$${price}</td>
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--bearish-red);">$${s1}</td>
                <td style="font-family: 'JetBrains Mono', monospace; color: var(--bearish-red); font-weight: 600;">-${riskPct}%</td>
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--bullish-green);">$${r1}</td>
                <td style="font-family: 'JetBrains Mono', monospace; color: var(--bullish-green); font-weight: 600;">+${rewardPct}%</td>
                <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-secondary);">$${pivot}</td>
                <td>
                    <span class="lr-rr-badge" style="display: inline-block;"><i class="fa-solid fa-shield-halved"></i> ${rr}x R/R</span>
                </td>
                <td style="text-align: right;">
                    <a href="index.html?ticker=${symbol}" class="btn-analyze" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                        Analyze <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

function initFilterControls() {
    const rrButtons = document.querySelectorAll("#rrFilterControl .seg-btn");
    rrButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            rrButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-rr");
            applyFilters();
        });
    });

    const searchInput = document.getElementById("tradesTableFilter");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            applyFilters();
        });
    }
}

function applyFilters() {
    const query = (document.getElementById("tradesTableFilter")?.value || "").toUpperCase().trim();

    let filtered = allTradeCandidates.filter(item => {
        const symbol = (item.Ticker || item.symbol || "").toUpperCase();
        const company = (item.Company || item.company || "").toUpperCase();
        const matchesQuery = !query || symbol.includes(query) || company.includes(query);

        const rr = item.Risk_Reward ? item.Risk_Reward.rr_ratio : 1.5;
        const riskPct = item.Risk_Reward ? item.Risk_Reward.risk_percent : 1.0;

        let matchesType = true;
        if (currentFilter === "high") {
            matchesType = rr >= 1.5;
        } else if (currentFilter === "tight") {
            matchesType = riskPct <= 1.0;
        }

        return matchesQuery && matchesType;
    });

    renderTradesTable(filtered);
}
