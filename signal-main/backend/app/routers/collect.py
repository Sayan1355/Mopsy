import time
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.collectors import get_collector
from app.schemas.signal import SignalCreate
from app.routers.signals import ingest_signal

router = APIRouter(prefix="/api/v1", tags=["Collection"])


@router.post("/collect", status_code=status.HTTP_201_CREATED)
def collect_signal(request: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Universal ingestion endpoint for all supported signal sources.
    Requires 'source_type' (e.g. 'manual', 'json', 'rss', 'website') and 'payload'.
    """
    source_type = request.get("source_type")
    payload = request.get("payload")
    
    if not source_type or payload is None:
        raise HTTPException(status_code=400, detail="Missing 'source_type' or 'payload' in request body.")
        
    start_time = time.time()
    
    try:
        # Get appropriate collector
        collector = get_collector(source_type)
        
        # Collect, validate, and normalize the data
        normalized_data = collector.process(payload)
        
        # Build the standard Pydantic schema used by the pipeline
        signal_create = SignalCreate(**normalized_data)
        
        # Pipe directly into the existing AI pipeline without duplicating code
        response = ingest_signal(signal_in=signal_create, db=db)
        
        process_time = time.time() - start_time
        
        # Log successful collection
        print(f"[Collection Agent] Type: {source_type} | Time: {process_time:.2f}s | Success: True")
        
        return response
        
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        print(f"[Collection Agent] Type: {source_type} | Error: {e} | Success: False")
        raise HTTPException(status_code=500, detail=f"Collection failed: {str(e)}")
