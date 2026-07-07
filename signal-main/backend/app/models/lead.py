"""
Lead Model

Represents a scored lead generated from a Signal.
One Signal produces exactly one Lead record.

Flow: Signal → Intent → Lead → Action
"""
import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class LeadPriorityEnum(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class LeadStatusEnum(str, enum.Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    DISQUALIFIED = "Disqualified"


class Lead(Base):
    __tablename__ = "lead"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key — each Lead belongs to exactly one Signal
    signal_id = Column(
        Integer,
        ForeignKey("signal.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,    # enforces 1-to-1 relationship
        index=True,
    )

    # Score indicating likelihood of conversion
    lead_score = Column(Float, nullable=False, default=0.0)

    priority = Column(
        Enum(LeadPriorityEnum, name="lead_priority_enum"),
        nullable=False,
        default=LeadPriorityEnum.LOW,
    )

    industry = Column(String(255), nullable=True)

    company_size = Column(String(255), nullable=True)

    status = Column(
        Enum(LeadStatusEnum, name="lead_status_enum"),
        nullable=False,
        default=LeadStatusEnum.NEW,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------
    signal = relationship(
        "Signal",
        back_populates="lead",
    )

    # A Lead can have one Action (1-to-1 based on requirements, or 1-to-N if multiple actions. We assume 1-to-1 based on the arrow diagrams).
    # Arrow diagram: Lead 1 ↓ Action. Using 1-to-1 or 1-to-many. Let's use 1-to-many but typically 1 in MVP.
    # The requirement says: "Lead 1 ↓ Action".
    # I will set it up as a 1-to-many relationship from Lead to Action, as a lead could have multiple actions over time, but the spec says "Lead 1 -> Action". I'll configure it as 1-to-many but easy to treat as 1-to-1. Wait, let's use 1-to-many for flexibility, or 1-to-1. The instructions literally say "Lead 1 ↓ Action". I'll use 1-to-many to be safe but standard, or 1-to-1. Let's stick to a 1-to-many list of actions.
    actions = relationship(
        "Action",
        back_populates="lead",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<Lead id={self.id} signal_id={self.signal_id} "
            f"score={self.lead_score} priority={self.priority}>"
        )
