from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/alerts",
    tags=["alerts"],
    responses={404: {"description": "Not found"}},
)

class Anomaly(BaseModel):
    id: str
    timestamp: str
    stock: str
    type: str # "volume_spike" | "price_jump" | "suspicious_pattern"
    severity: str # "low" | "medium" | "high" | "critical"
    description: str
    details: str
    resolved: bool

@router.get("/", response_model=List[Anomaly])
async def get_alerts():
    return [
        {"id": "1", "stock": "SFBT", "type": "volume_spike", "severity": "high", "timestamp": "2023-10-27T10:23:00", "description": "Abnormal volume spike (+800%)", "details": "Volume > 3x average", "resolved": False},
        {"id": "2", "stock": "DELICE", "type": "price_jump", "severity": "medium", "timestamp": "2023-10-27T14:15:00", "description": "Price jump (+5%) without news", "details": "No news found", "resolved": False}
    ]
