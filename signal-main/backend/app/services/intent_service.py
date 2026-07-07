"""
Intent CRUD Service
"""
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.intent import Intent
from app.schemas.intent import IntentCreate


def create_intent(db: Session, intent_data: IntentCreate) -> Intent:
    """Create a new intent record."""
    db_intent = Intent(**intent_data.model_dump())
    try:
        db.add(db_intent)
        db.commit()
        db.refresh(db_intent)
        return db_intent
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_intent(db: Session, intent_id: int) -> Optional[Intent]:
    """Retrieve an intent by its ID."""
    return db.query(Intent).filter(Intent.id == intent_id).first()
