import urllib.request
import xml.etree.ElementTree as ET
import json

def fetch_google_news(query="stock market economy"):
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            items = []
            for item in root.findall('.//item')[:15]:
                title = item.find('title').text if item.find('title') is not None else ''
                link = item.find('link').text if item.find('link') is not None else ''
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ''
                source = item.find('source').text if item.find('source') is not None else 'Google News'
                
                items.append({
                    "title": title,
                    "link": link,
                    "pubDate": pub_date,
                    "source": source
                })
            print(f"Successfully fetched {len(items)} news items for query: '{query}'")
            print(json.dumps(items[:3], indent=2))
            return items
    except Exception as e:
        print(f"Error fetching Google News: {e}")
        return []

if __name__ == "__main__":
    fetch_google_news("stock market wall street")
