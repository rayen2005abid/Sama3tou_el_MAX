from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from backend.database import Base

class MarketAlert(Base):
    __tablename__ = "market_alerts"

    id = Column(Integer, primary_key=True, index=True)
    stock_symbol = Column(String, index=True)
    alert_type = Column(String) # Volume Spike, Price Shock
    severity = Column(String) # High, Medium, Low
    description = Column(String)
    limitations = Column(String) # "Data is simulated", etc.
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
