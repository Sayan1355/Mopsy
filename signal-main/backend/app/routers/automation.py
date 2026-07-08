"""
Automation Router

Triggers workflow generation for a lead and moves the lead into the
Execution Queue by marking it CONTACTED.

Endpoints:
  POST /api/v1/automation/{lead_id}  — execute workflow + enqueue lead
  GET  /api/v1/queue                 — all leads in the execution queue
  PATCH /api/v1/queue/{lead_id}/status — update queue item progress
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.action import Action, ActionStatusEnum
from app.models.intent import Intent
from app.models.lead import Lead, LeadStatusEnum
from app.models.signal import Signal
from app.services.automation_agent import execute_workflow

router = APIRouter(prefix="/api/v1", tags=["Automation"])


@router.post("/automation/{lead_id}", status_code=status.HTTP_200_OK)
def trigger_automation(lead_id: int, db: Session = Depends(get_db)):
    """
    Triggers the automation workflow for a specified lead.
    Generates emails, CRM entries, LinkedIn messages, and follow-up reminders.
    Marks the lead as CONTACTED and its action as COMPLETED → moves to queue.
    """
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found.")

        signal = db.query(Signal).filter(Signal.id == lead.signal_id).first()
        intent = db.query(Intent).filter(Intent.signal_id == signal.id).first()
        action = db.query(Action).filter(Action.lead_id == lead.id).first()

        if not (signal and intent and action):
            raise HTTPException(status_code=400, detail="Incomplete lead context.")

        workflow_data = execute_workflow(
            company_name=signal.company_name,
            raw_text=signal.raw_text,
            intent=intent.intent,
            lead_score=lead.lead_score,
            recommendation=action.recommended_action,
            priority=lead.priority.name,
        )

        # ── Move lead to execution queue ──────────────────────────────────
        lead.status = LeadStatusEnum.CONTACTED
        action.action_status = ActionStatusEnum.COMPLETED
        action.scheduled_time = datetime.utcnow()
        db.commit()

        return {
            "message": "Workflow successfully generated.",
            "queued": True,
            "workflow_summary": {
                "email": {
                    "subject": workflow_data["email_subject"],
                    "body": workflow_data["email_body"],
                },
                "linkedin_message": workflow_data["linkedin_message"],
                "crm_entry": workflow_data["crm_entry"],
                "reminder": workflow_data["reminder"],
            },
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in automation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workflow: {str(e)}")


@router.get("/queue")
def get_execution_queue(db: Session = Depends(get_db)):
    """
    Returns all leads that have been moved to the execution queue
    (status = CONTACTED / QUALIFIED).
    """
    queued_leads = (
        db.query(Lead)
        .filter(Lead.status.in_([LeadStatusEnum.CONTACTED, LeadStatusEnum.QUALIFIED]))
        .order_by(Lead.lead_score.desc())
        .limit(20)
        .all()
    )

    queue_items = []
    for lead in queued_leads:
        signal = db.query(Signal).filter(Signal.id == lead.signal_id).first()
        intent = db.query(Intent).filter(Intent.signal_id == lead.signal_id).first()
        action = db.query(Action).filter(Action.lead_id == lead.id).first()
        if signal:
            queue_items.append({
                "lead_id": lead.id,
                "company_name": signal.company_name,
                "intent": intent.intent if intent else "Unknown",
                "lead_score": lead.lead_score,
                "priority": lead.priority.value,
                "status": lead.status.value,
                "action_status": action.action_status.value if action else "Unknown",
                "queued_at": action.scheduled_time.isoformat() if action and action.scheduled_time else None,
                "recommended_action": action.recommended_action if action else "",
            })

    return {"count": len(queue_items), "queue": queue_items}


@router.patch("/queue/{lead_id}/status")
def update_queue_status(lead_id: int, body: dict, db: Session = Depends(get_db)):
    """
    Update the progress status of a queued lead.
    Body: { "status": "Qualified" | "Disqualified" }
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    new_status = body.get("status", "")
    try:
        lead.status = LeadStatusEnum(new_status)
        db.commit()
        return {"message": f"Lead {lead_id} status updated to {new_status}"}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
