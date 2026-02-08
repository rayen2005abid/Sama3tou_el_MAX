from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MarketAlertBase(BaseModel):
    stock_symbol: str
    alert_type: str
    severity: str
    description: str
    limitations: str
    confidence: float

class MarketAlertResponse(MarketAlertBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
