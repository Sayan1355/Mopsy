import time
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.signal import SignalCreate
from app.routers.signals import ingest_signal
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/demo", tags=["Demo"])

DEMO_DATA = [
    {"company_name": "Microsoft", "source": "News", "signal_type": "Expansion", "raw_text": "Microsoft announces $2B investment in new AI datacenter in Spain."},
    {"company_name": "Google", "source": "News", "signal_type": "Product Launch", "raw_text": "Google launches Gemini Advanced enterprise tier for cloud customers."},
    {"company_name": "Tesla", "source": "Twitter", "signal_type": "Hiring", "raw_text": "Tesla is hiring 500 robotics engineers for the Optimus project."},
    {"company_name": "Anthropic", "source": "News", "signal_type": "Funding", "raw_text": "Anthropic raises $4B from Amazon to scale foundation models."},
    {"company_name": "Stripe", "source": "LinkedIn", "signal_type": "Partnership", "raw_text": "Stripe partners with OpenAI to power global monetization."},
    {"company_name": "NVIDIA", "source": "Website", "signal_type": "Expansion", "raw_text": "NVIDIA opening new R&D center in Taiwan."},
    {"company_name": "Snowflake", "source": "News", "signal_type": "Acquisition", "raw_text": "Snowflake acquires data observability startup for $150M."},
    {"company_name": "Meta", "source": "Website", "signal_type": "Product Launch", "raw_text": "Meta open sources Llama 3 400B parameter model."}
]

@router.post("/populate", status_code=status.HTTP_201_CREATED)
def populate_demo_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Populates the database with realistic demo signals and runs them through the entire AI pipeline automatically.
    """
    start_time = time.time()
    processed = 0
    
    for item in DEMO_DATA:
        try:
            signal_in = SignalCreate(
                company_name=item["company_name"],
                source=item["source"],
                signal_type=item["signal_type"],
                raw_text=item["raw_text"],
                source_url=None
            )
            ingest_signal(signal_in=signal_in, db=db)
            processed += 1
        except Exception as e:
            print(f"[Demo] Error processing {item['company_name']}: {e}")
            
    elapsed = time.time() - start_time
    return {
        "message": "Demo data successfully generated and processed.",
        "records_processed": processed,
        "time_taken": f"{elapsed:.2f}s"
    }
