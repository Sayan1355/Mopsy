from typing import Dict, Any
from app.collectors.base_collector import BaseCollector

class RSSCollector(BaseCollector):
    """Collector for RSS feed items. (Uses simple dict extraction for demo purposes without external feedparser)"""
    
    def collect(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # In a real app, this would use `feedparser` to fetch the RSS item from a URL.
        # Here we assume the payload provides the RSS item dict directly for demo.
        return payload.get("rss_item", {})
        
    def validate(self, raw_data: Dict[str, Any]) -> bool:
        return "title" in raw_data and "description" in raw_data
        
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        # Naive extraction of company name from RSS title/description
        title = raw_data["title"]
        company = raw_data.get("company_guess", title.split()[0] if title else "Unknown")
        return {
            "company_name": company,
            "source": "News",
            "signal_type": None,
            "raw_text": f"{title}: {raw_data['description']}",
            "source_url": raw_data.get("link")
        }
