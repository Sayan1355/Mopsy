import logging
from typing import Dict, Type
from app.collectors.base_collector import BaseCollector
from app.collectors.manual_collector import ManualCollector
from app.collectors.json_collector import JSONCollector
from app.collectors.rss_collector import RSSCollector
from app.collectors.website_collector import WebsiteCollector
from app.collectors.adscraper_adapter import AdscraperAdapter

logger = logging.getLogger(__name__)

# Registry of supported collectors
COLLECTORS: Dict[str, Type[BaseCollector]] = {
    "manual": ManualCollector,
    "json": JSONCollector,
    "rss": RSSCollector,
    "website": WebsiteCollector,
    "adscraper": AdscraperAdapter
}

def get_collector(source_type: str) -> BaseCollector:
    """Factory method to return the appropriate collector."""
    collector_class = COLLECTORS.get(source_type.lower())
    if not collector_class:
        raise ValueError(f"Unsupported source type: {source_type}")
    return collector_class()
