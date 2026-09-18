"""
Google News Fetcher Engine - Stock Market Analyzer
===================================================
Fetches and categorizes live financial news highlights from Google News RSS feeds (news.google.com).
Categories:
- Market Overview
- Magnificent Seven & OSIS
- Sector News
- Macroeconomic & Fed
- Market Movers
"""

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import datetime
import html
import re

CATEGORIES = {
    "Overview": "stock market wall street SP500",
    "Mag 7 & OSIS": "Nvidia Apple Microsoft Amazon Tesla Meta Google OSIS stock",
    "Sectors": "stock market sector tech energy healthcare",
    "Macro & Fed": "Federal Reserve interest rates inflation economy",
    "Movers": "stock market gainers movers rally"
}

BULLISH_KEYWORDS = ["surge", "jump", "rally", "gain", "soar", "record", "bull", "outperform", "beat", "upward", "growth", "high"]
BEARISH_KEYWORDS = ["fall", "drop", "plunge", "slide", "down", "bear", "slash", "cut", "inflation", "recession", "warning", "risk", "loss"]

def estimate_sentiment(text):
    text_lower = text.lower()
    bull_score = sum(1 for word in BULLISH_KEYWORDS if word in text_lower)
    bear_score = sum(1 for word in BEARISH_KEYWORDS if word in text_lower)
    
    if bull_score > bear_score:
        return "Bullish"
    elif bear_score > bull_score:
        return "Bearish"
    return "Neutral"

def clean_html(text):
    if not text:
        return ""
    # Unescape HTML entities
    text = html.unescape(text)
    # Remove HTML tags
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

def fetch_category_news(category_name, query, limit=8):
    encoded_query = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    
    items = []
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            
            for item in root.findall('.//item')[:limit]:
                title_elem = item.find('title')
                link_elem = item.find('link')
                pub_elem = item.find('pubDate')
                source_elem = item.find('source')
                
                raw_title = title_elem.text if title_elem is not None else "Market Update"
                title = clean_html(raw_title)
                
                # Split source from title if embedded like "Title - Publisher"
                source_name = source_elem.text if source_elem is not None else "Google News"
                if " - " in title and (source_elem is None or source_elem.text is None):
                    parts = title.rsplit(" - ", 1)
                    title = parts[0]
                    source_name = parts[1]
                
                link = link_elem.text if link_elem is not None else "https://news.google.com"
                pub_date = pub_elem.text if pub_elem is not None else datetime.datetime.now().strftime("%a, %d %b %Y %H:%M:%S GMT")
                
                sentiment = estimate_sentiment(title)
                
                items.append({
                    "category": category_name,
                    "title": title,
                    "link": link,
                    "pubDate": pub_date,
                    "source": source_name,
                    "sentiment": sentiment
                })
    except Exception as e:
        print(f"Warning: Failed to fetch Google News RSS for [{category_name}]: {e}")
        
    return items

def run_news_fetcher():
    print("Fetching Google News highlights across market categories...")
    all_highlights = []
    categorized_data = {}
    
    for cat_name, query in CATEGORIES.items():
        cat_items = fetch_category_news(cat_name, query, limit=6)
        categorized_data[cat_name] = cat_items
        all_highlights.extend(cat_items)
        print(f"  -> {cat_name}: {len(cat_items)} articles fetched")
        
    output_payload = {
        "timestamp": datetime.timezone.utc and datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": "Google News (news.google.com)",
        "totalCount": len(all_highlights),
        "categories": list(CATEGORIES.keys()),
        "highlights": all_highlights,
        "categorized": categorized_data
    }
    
    with open("news_highlights.json", "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(all_highlights)} Google News highlights to news_highlights.json!")
    return output_payload

if __name__ == "__main__":
    run_news_fetcher()
