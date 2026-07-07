from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.lead import Lead
from app.models.signal import Signal
from app.models.intent import Intent
from app.models.action import Action
from app.services.automation_agent import execute_workflow

router = APIRouter(prefix="/api/v1", tags=["Automation"])

@router.post("/automation/{lead_id}", status_code=status.HTTP_200_OK)
def trigger_automation(lead_id: int, db: Session = Depends(get_db)):
    """
    Triggers the automation workflow for a specified lead.
    Generates emails, CRM entries, LinkedIn messages, and follow-up reminders.
    """
    try:
        # Fetch full context traversing DB relations
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found.")
            
        signal = db.query(Signal).filter(Signal.id == lead.signal_id).first()
        intent = db.query(Intent).filter(Intent.signal_id == signal.id).first()
        action = db.query(Action).filter(Action.lead_id == lead.id).first()
        
        if not (signal and intent and action):
            raise HTTPException(status_code=400, detail="Incomplete lead context (missing signal/intent/action).")
            
        # Execute Workflow
        workflow_data = execute_workflow(
            company_name=signal.company_name,
            raw_text=signal.raw_text,
            intent=intent.intent,
            lead_score=lead.lead_score,
            recommendation=action.recommended_action,
            priority=lead.priority.name
        )
        
        return {
            "message": "Workflow successfully generated.",
            "workflow_summary": {
                "email": {
                    "subject": workflow_data["email_subject"],
                    "body": workflow_data["email_body"]
                },
                "linkedin_message": workflow_data["linkedin_message"],
                "crm_entry": workflow_data["crm_entry"],
                "reminder": workflow_data["reminder"]
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in automation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate automation workflow: {str(e)}")
