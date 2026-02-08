from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from .service import ChatbotService
from .schemas import ChatQuery, ChatResponse

router = APIRouter(
    prefix="/chat",
    tags=["AI Assistant"]
)

@router.post("/query", response_model=ChatResponse)
def chat_query(query: ChatQuery, db: Session = Depends(get_db)):
    service = ChatbotService(db)
    response = service.process_query(query.query)
    return response
