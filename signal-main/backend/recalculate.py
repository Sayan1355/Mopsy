from app.database.database import SessionLocal
from app.models.signal import Signal
from app.models.intent import Intent
from app.models.lead import Lead, LeadPriorityEnum
from app.services.intent_agent import analyze_intent
from app.services.lead_scoring_agent import analyze_lead

db = SessionLocal()
signals = db.query(Signal).all()
for sig in signals:
    # 1. Re-analyze intent
    intent_res = analyze_intent(sig.company_name, sig.raw_text)
    intent = db.query(Intent).filter(Intent.signal_id == sig.id).first()
    if intent:
        intent.intent = intent_res["intent"]
        intent.confidence = intent_res["confidence"]
        
    # 2. Re-analyze lead score
    lead_res = analyze_lead(sig.company_name, sig.raw_text, intent_res["intent"], intent_res["confidence"])
    lead = db.query(Lead).filter(Lead.signal_id == sig.id).first()
    if lead:
        lead.lead_score = float(lead_res["lead_score"])
        raw_p = lead_res.get("priority", "Low").upper()
        if raw_p in ["CRITICAL", "HIGH"]: p = LeadPriorityEnum.HIGH
        elif raw_p == "MEDIUM": p = LeadPriorityEnum.MEDIUM
        else: p = LeadPriorityEnum.LOW
        lead.priority = p
        
db.commit()
print("Recalculation complete.")
