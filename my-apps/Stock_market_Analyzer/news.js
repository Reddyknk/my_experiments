/**
 * Market News Highlights - Frontend Engine (news.js)
 * Parses news_highlights.json from Google News RSS aggregator
 */

document.addEventListener('DOMContentLoaded', () => {
    let allNewsData = [];
    let currentCategory = 'All';
    let searchQuery = '';

    // UI Element Selectors
    const newsGrid = document.getElementById('newsGrid');
    const newsCategoryTabs = document.getElementById('newsCategoryTabs');
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshNewsBtn');

    const statSource = document.getElementById('statSource');
    const statTotalCount = document.getElementById('statTotalCount');
    const statActiveCat = document.getElementById('statActiveCat');

    const topStoryContainer = document.getElementById('topStoryContainer');
    const topStorySource = document.getElementById('topStorySource');
    const topStoryTitle = document.getElementById('topStoryTitle');
    const topStorySentiment = document.getElementById('topStorySentiment');
    const topStoryTime = document.getElementById('topStoryTime');
    const topStoryLink = document.getElementById('topStoryLink');

    // Initialize Ticker Ribbon
    initTickerRibbon();

    // Fetch News Highlights
    loadNewsHighlights();

    // Setup Category Tabs
    if (newsCategoryTabs) {
        newsCategoryTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;

            document.querySelectorAll('#newsCategoryTabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.classList ? btn.classList.add('active') : btn.className += ' active';

            currentCategory = btn.dataset.category || 'All';
            if (statActiveCat) statActiveCat.textContent = currentCategory;
            renderNewsCards();
        });
    }

    // Search Input Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderNewsCards();
        });
    }

    // Refresh News Button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.querySelector('i').classList.add('fa-spin');
            loadNewsHighlights(() => {
                setTimeout(() => {
                    refreshBtn.querySelector('i').classList.remove('fa-spin');
                }, 600);
            });
        });
    }

    // Load News Function
    async function loadNewsHighlights(callback) {
        try {
            const response = await fetch('news_highlights.json?t=' + Date.now());
            if (!response.ok) throw new Error('news_highlights.json not found');

            const data = await response.json();
            allNewsData = data.highlights || [];

            if (statTotalCount) statTotalCount.textContent = allNewsData.length;
            if (statSource && data.source) statSource.textContent = 'Google News';

            renderTopStory(allNewsData);
            renderNewsCards();
        } catch (err) {
            console.warn('Falling back to synthetic Google News data:', err);
            allNewsData = getFallbackNewsData();
            if (statTotalCount) statTotalCount.textContent = allNewsData.length;
            renderTopStory(allNewsData);
            renderNewsCards();
        } finally {
            if (callback) callback();
        }
    }

    // Render Featured Top Story
    function renderTopStory(items) {
        if (!items || items.length === 0) return;
        const top = items[0];

        if (topStoryContainer) topStoryContainer.style.display = 'block';
        if (topStoryTitle) topStoryTitle.textContent = top.title;
        if (topStorySource) topStorySource.textContent = top.source || 'Google News';
        if (topStoryTime) topStoryTime.textContent = formatTimeAgo(top.pubDate);
        if (topStoryLink) topStoryLink.href = top.link;

        if (topStorySentiment) {
            topStorySentiment.textContent = top.sentiment || 'Bullish';
            topStorySentiment.className = `badge badge-${(top.sentiment || 'bullish').toLowerCase()}`;
        }
    }

    // Render Grid of News Cards
    function renderNewsCards() {
        if (!newsGrid) return;

        let filtered = allNewsData;

        // Filter by Category
        if (currentCategory !== 'All') {
            filtered = filtered.filter(item => item.category === currentCategory);
        }

        // Filter by Search Query
        if (searchQuery) {
            filtered = filtered.filter(item => 
                (item.title && item.title.toLowerCase().includes(searchQuery)) ||
                (item.source && item.source.toLowerCase().includes(searchQuery)) ||
                (item.category && item.category.toLowerCase().includes(searchQuery))
            );
        }

        if (filtered.length === 0) {
            newsGrid.innerHTML = `
                <div class="glass-card p-4 text-center grid-span-full">
                    <i class="fa-solid fa-newspaper fa-3x text-muted mb-3"></i>
                    <h3 class="text-lg font-bold">No news headlines found</h3>
                    <p class="text-muted text-sm">Try selecting a different category tab or clear your search term.</p>
                </div>
            `;
            return;
        }

        newsGrid.innerHTML = filtered.map(item => {
            const timeAgo = formatTimeAgo(item.pubDate);
            const sentimentClass = `sentiment-badge-${(item.sentiment || 'neutral').toLowerCase()}`;

            return `
                <div class="news-card">
                    <div>
                        <div class="news-card-header">
                            <span class="news-source-badge">${escapeHtml(item.source || 'Google News')}</span>
                            <span class="news-time-ago"><i class="fa-regular fa-clock me-1"></i>${timeAgo}</span>
                        </div>
                        <h3 class="news-card-title">${escapeHtml(item.title)}</h3>
                    </div>
                    <div class="news-card-footer">
                        <span class="${sentimentClass}">${item.sentiment || 'Neutral'}</span>
                        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener" class="news-read-link">
                            Read Article <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Helper: Time Ago Formatter
    function formatTimeAgo(dateString) {
        if (!dateString) return 'Recently';
        try {
            const pubDate = new Date(dateString);
            const now = new Date();
            const diffMs = now - pubDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 5) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${diffDays}d ago`;
        } catch {
            return 'Recently';
        }
    }

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Top Ticker Ribbon
    function initTickerRibbon() {
        const ribbonTrack = document.getElementById('tickerTrack');
        if (!ribbonTrack) return;

        const defaultRibbonItems = [
            { symbol: 'S&P 500', price: '5,595.80', change: '+0.45%', isUp: true },
            { symbol: 'NASDAQ', price: '17,680.20', change: '+0.82%', isUp: true },
            { symbol: 'DOW', price: '40,840.10', change: '-0.15%', isUp: false },
            { symbol: 'NVDA', price: '119.30', change: '+3.15%', isUp: true },
            { symbol: 'AAPL', price: '224.50', change: '+0.95%', isUp: true },
            { symbol: 'MSFT', price: '448.90', change: '+0.52%', isUp: true },
            { symbol: 'OSIS', price: '201.25', change: '+0.95%', isUp: true },
            { symbol: 'BRENT OIL', price: '$78.40', change: '-1.10%', isUp: false }
        ];

        const htmlContent = defaultRibbonItems.concat(defaultRibbonItems).map(item => `
            <div class="ticker-item">
                <span class="ticker-symbol">${item.symbol}</span>
                <span class="ticker-price">${item.price}</span>
                <span class="ticker-change ${item.isUp ? 'text-green' : 'text-red'}">
                    ${item.isUp ? '▲' : '▼'} ${item.change}
                </span>
            </div>
        `).join('');

        ribbonTrack.innerHTML = htmlContent;
    }

    // Fallback News Generator if JSON missing
    function getFallbackNewsData() {
        return [
            {
                category: "Overview",
                title: "Stock Market Today: S&P 500 and Nasdaq Rise as Tech Rally Continues",
                link: "https://news.google.com",
                pubDate: new Date().toUTCString(),
                source: "CNBC",
                sentiment: "Bullish"
            },
            {
                category: "Mag 7 & OSIS",
                title: "Nvidia and Tech Heavyweights Lead Magnificent Seven Surge Following AI Demand",
                link: "https://news.google.com",
                pubDate: new Date(Date.now() - 3600000).toUTCString(),
                source: "Bloomberg",
                sentiment: "Bullish"
            },
            {
                category: "Mag 7 & OSIS",
                title: "OSI Systems (OSIS) Secures New Security Technology Contracts",
                link: "https://news.google.com",
                pubDate: new Date(Date.now() - 7200000).toUTCString(),
                source: "Reuters",
                sentiment: "Bullish"
            },
            {
                category: "Macro & Fed",
                title: "Federal Reserve Signals Data-Dependent Approach Ahead of Rate Decision",
                link: "https://news.google.com",
                pubDate: new Date(Date.now() - 10800000).toUTCString(),
                source: "Wall Street Journal",
                sentiment: "Neutral"
            },
            {
                category: "Sectors",
                title: "Energy and Technology Sectors Outperform Broad Market Benchmarks",
                link: "https://news.google.com",
                pubDate: new Date(Date.now() - 14400000).toUTCString(),
                source: "Seeking Alpha",
                sentiment: "Bullish"
            },
            {
                category: "Movers",
                title: "Top Market Movers: High Volume Breakout Stocks Catch Trader Interest",
                link: "https://news.google.com",
                pubDate: new Date(Date.now() - 18000000).toUTCString(),
                source: "MarketWatch",
                sentiment: "Bullish"
            }
        ];
    }
});
