from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    type: str
    related_data: Optional[Dict[str, Any]] = None
