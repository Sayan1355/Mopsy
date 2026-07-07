"""
Action CRUD Service
"""
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.action import Action
from app.schemas.action import ActionCreate


def create_action(db: Session, action_data: ActionCreate) -> Action:
    """Create a new action record."""
    db_action = Action(**action_data.model_dump())
    try:
        db.add(db_action)
        db.commit()
        db.refresh(db_action)
        return db_action
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_action(db: Session, action_id: int) -> Optional[Action]:
    """Retrieve an action by its ID."""
    return db.query(Action).filter(Action.id == action_id).first()
