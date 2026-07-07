"""
Intent Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IntentBase(BaseModel):
    signal_id: int
    intent: str
    confidence: float
    reasoning: Optional[str] = None


class IntentCreate(IntentBase):
    pass


class IntentResponse(IntentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
