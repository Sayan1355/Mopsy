from typing import Dict, Any
from app.collectors.base_collector import BaseCollector

class ManualCollector(BaseCollector):
    """Collector for manually inputted business signals."""
    
    def collect(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return payload
        
    def validate(self, raw_data: Dict[str, Any]) -> bool:
        return "company_name" in raw_data and "raw_text" in raw_data
        
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "company_name": raw_data["company_name"],
            "source": "Manual",
            "signal_type": raw_data.get("signal_type"),
            "raw_text": raw_data["raw_text"],
            "source_url": raw_data.get("source_url")
        }
