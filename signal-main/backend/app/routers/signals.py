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
from app.schemas.intent import IntentCreate, IntentResponse
from app.schemas.lead import LeadCreate
from app.models.lead import LeadPriorityEnum
from app.services import signal_service, intent_service, lead_service
from app.services.intent_agent import analyze_intent
from app.services.lead_scoring_agent import analyze_lead

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest_signal(signal_in: SignalCreate, db: Session = Depends(get_db)):
    """
    Ingest a raw business signal, store it, analyze intent, store intent, score lead, and store lead.
    """
    try:
        # 1. Store Signal
        new_signal = signal_service.create_signal(db=db, signal_data=signal_in)
        
        # 2. Analyze Intent
        intent_analysis = analyze_intent(
            company_name=new_signal.company_name,
            raw_text=new_signal.raw_text
        )
        
        # 3. Store Intent
        intent_data = IntentCreate(
            signal_id=new_signal.id,
            intent=intent_analysis["intent"],
            confidence=intent_analysis["confidence"],
            reasoning=intent_analysis["reasoning"]
        )
        new_intent = intent_service.create_intent(db=db, intent_data=intent_data)
        
        # 4. Lead Scoring Agent
        lead_analysis = analyze_lead(
            company_name=new_signal.company_name,
            raw_text=new_signal.raw_text,
            intent=intent_analysis["intent"],
            intent_confidence=intent_analysis["confidence"]
        )
        
        # Priority mapping to Enum
        raw_priority = lead_analysis.get("priority", "Low").upper()
        if raw_priority in ["CRITICAL", "HIGH"]:
            db_priority = LeadPriorityEnum.HIGH
        elif raw_priority == "MEDIUM":
            db_priority = LeadPriorityEnum.MEDIUM
        else:
            db_priority = LeadPriorityEnum.LOW

        # 5. Store Lead
        lead_data = LeadCreate(
            signal_id=new_signal.id,
            lead_score=float(lead_analysis["lead_score"]),
            priority=db_priority,
            status="New"
        )
        new_lead = lead_service.create_lead(db=db, lead_data=lead_data)
        
        # 6. Return all
        return {
            "message": "Signal analyzed successfully",
            "signal": SignalResponse.model_validate(new_signal),
            "intent": {
                "intent": new_intent.intent,
                "confidence": new_intent.confidence,
                "reasoning": new_intent.reasoning,
                "category": intent_analysis["category"]
            },
            "lead": {
                "lead_score": new_lead.lead_score,
                "priority": lead_analysis["priority"],
                "opportunity_level": lead_analysis["opportunity_level"],
                "lead_quality": lead_analysis["lead_quality"],
                "confidence": lead_analysis["confidence"],
                "reason": lead_analysis["reason"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest and analyze signal: {str(e)}")


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
