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
from app.models.lead import LeadPriorityEnum, Lead
from app.models.signal import Signal
from app.schemas.action import ActionCreate
from app.services import signal_service, intent_service, lead_service, action_service
from app.services.intent_agent import analyze_intent
from app.services.lead_scoring_agent import analyze_lead
from app.services.recommendation_agent import analyze_recommendation

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest_signal(signal_in: SignalCreate, db: Session = Depends(get_db)):
    """
    Ingest a raw business signal, store it, analyze intent, store intent, score lead, store lead, generate recommendations, and store action.
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
        
        # 6. Recommendation Agent
        rec_analysis = analyze_recommendation(
            company_name=new_signal.company_name,
            raw_text=new_signal.raw_text,
            intent=intent_analysis["intent"],
            lead_score=new_lead.lead_score
        )
        
        # 7. Store Recommendation (Action)
        action_data = ActionCreate(
            lead_id=new_lead.id,
            recommended_action=rec_analysis["next_best_action"]
        )
        new_action = action_service.create_action(db=db, action_data=action_data)
        
        # 8. Return all
        return {
            "message": "Signal processed successfully",
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
            },
            "recommendation": {
                "next_best_action": rec_analysis["next_best_action"],
                "communication_channel": rec_analysis["communication_channel"],
                "follow_up_timeline": rec_analysis["follow_up_timeline"],
                "opportunity_summary": rec_analysis["opportunity_summary"],
                "risk_level": rec_analysis["risk_level"],
                "reasoning": rec_analysis["reasoning"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process signal: {str(e)}")


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


@router.post("/sweep", status_code=status.HTTP_200_OK)
def sweep_signals(db: Session = Depends(get_db)):
    """
    Sweep all signals that do not yet have a scored lead.
    Runs the full intent → lead-scoring → recommendation pipeline on each,
    then returns a summary of how many were processed.
    """
    from app.models.intent import Intent as IntentModel
    from app.models.lead import LeadStatusEnum

    # Find signals with no linked lead
    unscored = (
        db.query(Signal)
        .outerjoin(Lead, Signal.id == Lead.signal_id)
        .filter(Lead.id == None)
        .all()
    )

    processed, skipped, errors = 0, 0, []

    for sig in unscored:
        try:
            # Check if intent already exists for this signal (unique constraint)
            existing_intent = db.query(IntentModel).filter(IntentModel.signal_id == sig.id).first()

            if existing_intent:
                # Reuse the existing intent record
                intent_analysis = {
                    "intent": existing_intent.intent,
                    "confidence": existing_intent.confidence,
                    "reasoning": existing_intent.reasoning,
                    "category": existing_intent.intent,
                }
                new_intent = existing_intent
            else:
                # Run intent agent and create a fresh record
                intent_analysis = analyze_intent(
                    company_name=sig.company_name,
                    raw_text=sig.raw_text
                )
                intent_data = IntentCreate(
                    signal_id=sig.id,
                    intent=intent_analysis["intent"],
                    confidence=intent_analysis["confidence"],
                    reasoning=intent_analysis["reasoning"]
                )
                new_intent = intent_service.create_intent(db=db, intent_data=intent_data)

            # Lead scoring
            lead_analysis = analyze_lead(
                company_name=sig.company_name,
                raw_text=sig.raw_text,
                intent=intent_analysis["intent"],
                intent_confidence=intent_analysis["confidence"]
            )
            raw_priority = lead_analysis.get("priority", "Low").upper()
            if raw_priority in ["CRITICAL", "HIGH"]:
                db_priority = LeadPriorityEnum.HIGH
            elif raw_priority == "MEDIUM":
                db_priority = LeadPriorityEnum.MEDIUM
            else:
                db_priority = LeadPriorityEnum.LOW

            lead_data = LeadCreate(
                signal_id=sig.id,
                lead_score=float(lead_analysis["lead_score"]),
                priority=db_priority,
                status=LeadStatusEnum.NEW
            )
            new_lead = lead_service.create_lead(db=db, lead_data=lead_data)

            # Recommendation
            rec_analysis = analyze_recommendation(
                company_name=sig.company_name,
                raw_text=sig.raw_text,
                intent=intent_analysis["intent"],
                lead_score=new_lead.lead_score
            )
            action_data = ActionCreate(
                lead_id=new_lead.id,
                recommended_action=rec_analysis["next_best_action"]
            )
            action_service.create_action(db=db, action_data=action_data)

            processed += 1
        except Exception as e:
            db.rollback()  # Reset session state before next iteration
            errors.append({"signal_id": sig.id, "error": str(e)})
            skipped += 1

    total_signals = db.query(Signal).count()
    total_leads = db.query(Lead).count()

    return {
        "message": f"Sweep complete. {processed} signal(s) analyzed.",
        "processed": processed,
        "skipped": skipped,
        "errors": errors,
        "totals": {
            "signals": total_signals,
            "leads": total_leads
        }
    }
