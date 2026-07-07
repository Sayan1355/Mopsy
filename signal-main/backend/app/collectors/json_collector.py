import json
from typing import Dict, Any
from app.collectors.base_collector import BaseCollector

class JSONCollector(BaseCollector):
    """Collector for ingesting raw JSON data formats/files."""
    
    def collect(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Payload might contain stringified json or raw dict representing file contents
        if "json_string" in payload:
            return json.loads(payload["json_string"])
        return payload.get("data", {})
        
    def validate(self, raw_data: Dict[str, Any]) -> bool:
        return "company" in raw_data and "content" in raw_data
        
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "company_name": raw_data["company"],
            "source": "JSON File",
            "signal_type": raw_data.get("type"),
            "raw_text": raw_data["content"],
            "source_url": raw_data.get("url")
        }
