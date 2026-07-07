"""
Test script for CRUD operations.
"""
from app.database.database import SessionLocal
from app.schemas.signal import SignalCreate
from app.schemas.intent import IntentCreate
from app.schemas.lead import LeadCreate
from app.schemas.action import ActionCreate
from app.services import (
    create_signal,
    create_intent,
    create_lead,
    create_action,
    get_all_signals,
    get_all_leads
)

def test_crud():
    db = SessionLocal()
    try:
        # Create Signal
        signal_data = SignalCreate(
            company_name="TestCorp",
            source="News",
            signal_type="Funding",
            raw_text="TestCorp raised $10M"
        )
        new_signal = create_signal(db, signal_data)
        print(f"Created Signal ID: {new_signal.id}")

        # Create Intent
        intent_data = IntentCreate(
            signal_id=new_signal.id,
            intent="High intent to buy",
            confidence=0.9,
            reasoning="Mentioned new funding"
        )
        new_intent = create_intent(db, intent_data)
        print(f"Created Intent ID: {new_intent.id}")

        # Create Lead
        lead_data = LeadCreate(
            signal_id=new_signal.id,
            lead_score=85.5,
            priority="High",
            status="New"
        )
        new_lead = create_lead(db, lead_data)
        print(f"Created Lead ID: {new_lead.id}")

        # Create Action
        action_data = ActionCreate(
            lead_id=new_lead.id,
            recommended_action="Send congratulatory email"
        )
        new_action = create_action(db, action_data)
        print(f"Created Action ID: {new_action.id}")

        # Verify Querying
        all_signals = get_all_signals(db)
        print(f"Total Signals: {len(all_signals)}")
        
        all_leads = get_all_leads(db)
        print(f"Total Leads: {len(all_leads)}")

    finally:
        db.close()

if __name__ == "__main__":
    test_crud()
