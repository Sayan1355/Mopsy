"""
Action Model

Represents AI recommendations for a Lead.
A Lead can have one or more Actions.

Flow: Signal → Intent → Lead → Action
"""
import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class ActionStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


class Action(Base):
    __tablename__ = "action"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key — Action belongs to a Lead
    lead_id = Column(
        Integer,
        ForeignKey("lead.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recommended_action = Column(String(512), nullable=False)

    action_status = Column(
        Enum(ActionStatusEnum, name="action_status_enum"),
        nullable=False,
        default=ActionStatusEnum.PENDING,
    )

    scheduled_time = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------
    lead = relationship(
        "Lead",
        back_populates="actions",
    )

    def __repr__(self) -> str:
        return (
            f"<Action id={self.id} lead_id={self.lead_id} "
            f"status={self.action_status} action={self.recommended_action!r}>"
        )
