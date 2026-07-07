"""
Lead CRUD Service
"""
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.lead import Lead
from app.schemas.lead import LeadCreate


def create_lead(db: Session, lead_data: LeadCreate) -> Lead:
    """Create a new lead record."""
    db_lead = Lead(**lead_data.model_dump())
    try:
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return db_lead
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_lead(db: Session, lead_id: int) -> Optional[Lead]:
    """Retrieve a lead by its ID."""
    return db.query(Lead).filter(Lead.id == lead_id).first()


def get_all_leads(db: Session, skip: int = 0, limit: int = 100) -> List[Lead]:
    """Retrieve all leads with pagination."""
    return db.query(Lead).offset(skip).limit(limit).all()
