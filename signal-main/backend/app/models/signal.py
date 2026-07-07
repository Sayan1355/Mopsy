"""
Signal Model

Represents every raw business signal collected from the web.
Each signal is the entry point into the Signal-Main pipeline.

Flow: Signal → Intent → Lead → Action
"""
import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class SourceEnum(str, enum.Enum):
    LINKEDIN = "LinkedIn"
    TWITTER = "Twitter"
    WEBSITE = "Website"
    NEWS = "News"
    MANUAL = "Manual"


class SignalTypeEnum(str, enum.Enum):
    HIRING = "Hiring"
    FUNDING = "Funding"
    EXPANSION = "Expansion"
    PARTNERSHIP = "Partnership"
    PRODUCT_LAUNCH = "Product Launch"


class Signal(Base):
    __tablename__ = "signal"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    company_name = Column(String(255), nullable=False, index=True)

    source = Column(
        Enum(SourceEnum, name="source_enum"),
        nullable=False,
        default=SourceEnum.MANUAL,
    )

    signal_type = Column(
        Enum(SignalTypeEnum, name="signal_type_enum"),
        nullable=True,
    )

    raw_text = Column(Text, nullable=False)

    source_url = Column(String(2048), nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # ----------------------------------------------------------------
    # Relationships (back-populated from child models)
    # ----------------------------------------------------------------
    intent = relationship(
        "Intent",
        back_populates="signal",
        uselist=False,          # Signal → Intent is 1-to-1
        cascade="all, delete-orphan",
    )

    lead = relationship(
        "Lead",
        back_populates="signal",
        uselist=False,          # Signal → Lead is 1-to-1
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Signal id={self.id} company={self.company_name!r} source={self.source}>"
