from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

class BaseCollector(ABC):
    """
    Abstract Base Class for all signal collectors.
    Enforces a strict collect -> validate -> normalize architecture.
    """
    
    @abstractmethod
    def collect(self, payload: Dict[str, Any]) -> Any:
        """Extracts data from the specific source payload."""
        pass

    @abstractmethod
    def validate(self, raw_data: Any) -> bool:
        """Validates that the extracted data meets minimum requirements."""
        pass

    @abstractmethod
    def normalize(self, raw_data: Any) -> Dict[str, Any]:
        """
        Converts the raw data into the standard Signal format:
        {
            "company_name": str,
            "source": str,
            "signal_type": Optional[str],
            "raw_text": str,
            "source_url": Optional[str],
            "collected_at": str
        }
        """
        pass
        
    def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Standard pipeline method."""
        raw_data = self.collect(payload)
        if not self.validate(raw_data):
            raise ValueError(f"Validation failed for payload in {self.__class__.__name__}")
        
        normalized = self.normalize(raw_data)
        normalized["collected_at"] = datetime.utcnow().isoformat()
        return normalized
