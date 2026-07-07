"""
Lead Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.lead import LeadPriorityEnum, LeadStatusEnum


class LeadBase(BaseModel):
    signal_id: int
    lead_score: float
    priority: LeadPriorityEnum
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: LeadStatusEnum


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    lead_score: Optional[float] = None
    priority: Optional[LeadPriorityEnum] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: Optional[LeadStatusEnum] = None


class LeadResponse(LeadBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
