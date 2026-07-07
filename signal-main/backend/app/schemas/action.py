"""
Action Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.action import ActionStatusEnum


class ActionBase(BaseModel):
    lead_id: int
    recommended_action: str
    action_status: ActionStatusEnum = ActionStatusEnum.PENDING
    scheduled_time: Optional[datetime] = None


class ActionCreate(ActionBase):
    pass


class ActionUpdate(BaseModel):
    recommended_action: Optional[str] = None
    action_status: Optional[ActionStatusEnum] = None
    scheduled_time: Optional[datetime] = None


class ActionResponse(ActionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
