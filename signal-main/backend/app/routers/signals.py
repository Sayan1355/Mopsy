"""
Signal Router

Handles CRUD operations for business signals.
API Prefix: /api/v1/signals
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.signal import SignalCreate, SignalResponse
from app.services import signal_service

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest_signal(signal_in: SignalCreate, db: Session = Depends(get_db)):
    """
    Ingest a raw business signal.
    """
    try:
        new_signal = signal_service.create_signal(db=db, signal_data=signal_in)
        return {
            "message": "Signal stored successfully",
            "signal": SignalResponse.model_validate(new_signal)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest signal: {str(e)}")


@router.get("", response_model=List[SignalResponse])
def get_all_signals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all stored signals.
    """
    signals = signal_service.get_all_signals(db=db, skip=skip, limit=limit)
    return signals


@router.get("/{signal_id}", response_model=SignalResponse)
def get_signal_by_id(signal_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific signal by ID.
    """
    signal = signal_service.get_signal(db=db, signal_id=signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal


@router.delete("/{signal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_signal(signal_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific signal.
    """
    success = signal_service.delete_signal(db=db, signal_id=signal_id)
    if not success:
        raise HTTPException(status_code=404, detail="Signal not found")
    return None
