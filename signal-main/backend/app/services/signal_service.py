"""
Signal CRUD Service
"""
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.signal import Signal
from app.schemas.signal import SignalCreate, SignalUpdate


def create_signal(db: Session, signal_data: SignalCreate) -> Signal:
    """Create a new signal record."""
    db_signal = Signal(**signal_data.model_dump())
    try:
        db.add(db_signal)
        db.commit()
        db.refresh(db_signal)
        return db_signal
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_signal(db: Session, signal_id: int) -> Optional[Signal]:
    """Retrieve a signal by its ID."""
    return db.query(Signal).filter(Signal.id == signal_id).first()


def get_all_signals(db: Session, skip: int = 0, limit: int = 100) -> List[Signal]:
    """Retrieve all signals with pagination."""
    return db.query(Signal).offset(skip).limit(limit).all()


def update_signal(db: Session, signal_id: int, signal_data: SignalUpdate) -> Optional[Signal]:
    """Update an existing signal."""
    db_signal = get_signal(db, signal_id)
    if not db_signal:
        return None

    update_data = signal_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_signal, key, value)

    try:
        db.commit()
        db.refresh(db_signal)
        return db_signal
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def delete_signal(db: Session, signal_id: int) -> bool:
    """Delete a signal by its ID."""
    db_signal = get_signal(db, signal_id)
    if not db_signal:
        return False

    try:
        db.delete(db_signal)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise e
