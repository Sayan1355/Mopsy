"""
Intent Model

Represents the AI-classified intent derived from a Signal.
One Signal produces exactly one Intent record.

Flow: Signal → Intent → Lead → Action
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class Intent(Base):
    __tablename__ = "intent"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key — each Intent belongs to exactly one Signal
    signal_id = Column(
        Integer,
        ForeignKey("signal.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,    # enforces the 1-to-1 relationship at DB level
        index=True,
    )

    # AI-classified intent label
    # e.g. "Hiring Signal", "Fundraising Signal", "Expansion Intent"
    intent = Column(String(255), nullable=False)

    # Confidence score from AI classifier (0.0 – 1.0)
    confidence = Column(Float, nullable=False, default=0.0)

    # Human-readable explanation from AI (or regex fallback note)
    reasoning = Column(Text, nullable=True)

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
        back_populates="intent",
    )

    def __repr__(self) -> str:
        return (
            f"<Intent id={self.id} signal_id={self.signal_id} "
            f"intent={self.intent!r} confidence={self.confidence:.2f}>"
        )
