from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.business_copilot import generate_chat_response

router = APIRouter(prefix="/api/v1", tags=["Copilot"])

class ChatRequest(BaseModel):
    message: str

@router.post("/copilot/chat", status_code=status.HTTP_200_OK)
def copilot_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Business Copilot chat endpoint.
    Answers natural language queries about the database using AI context.
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty.")
            
        result = generate_chat_response(request.message, db)
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in copilot: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate copilot response: {str(e)}")
