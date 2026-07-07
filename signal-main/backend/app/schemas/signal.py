"""
Signal Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.signal import SignalTypeEnum, SourceEnum


class SignalBase(BaseModel):
    company_name: str
    source: SourceEnum
    signal_type: Optional[SignalTypeEnum] = None
    raw_text: str
    source_url: Optional[str] = None


class SignalCreate(SignalBase):
    pass


class SignalUpdate(BaseModel):
    company_name: Optional[str] = None
    source: Optional[SourceEnum] = None
    signal_type: Optional[SignalTypeEnum] = None
    raw_text: Optional[str] = None
    source_url: Optional[str] = None


class SignalResponse(SignalBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
