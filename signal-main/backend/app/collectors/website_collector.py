import urllib.request
import re
from typing import Dict, Any
from app.collectors.base_collector import BaseCollector

class WebsiteCollector(BaseCollector):
    """Collector for parsing minimal data directly from a website URL."""
    
    def collect(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = payload.get("url")
        if not url:
            return {}
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
            
            # Very basic extraction without BeautifulSoup
            title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            title = title_match.group(1) if title_match else "Unknown"
            
            # Attempt to find a meta description
            desc_match = re.search(r'<meta name="description" content="(.*?)"', html, re.IGNORECASE)
            desc = desc_match.group(1) if desc_match else title
            
            return {"title": title, "content": desc, "url": url}
        except Exception as e:
            return {"error": str(e), "url": url}
        
    def validate(self, raw_data: Dict[str, Any]) -> bool:
        return "title" in raw_data and "error" not in raw_data
        
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_data["title"]
        # Guess company from title (usually before a pipe or dash)
        company = title.split('|')[0].split('-')[0].strip()
        
        return {
            "company_name": company,
            "source": "Website",
            "signal_type": None,
            "raw_text": raw_data.get("content", title),
            "source_url": raw_data.get("url")
        }
