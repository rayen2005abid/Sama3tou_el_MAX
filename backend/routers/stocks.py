from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(
    prefix="/stocks",
    tags=["stocks"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models to match frontend interfaces
class Stock(BaseModel):
    symbol: str
    name: str
    sector: str
    lastPrice: float
    change: float
    changePercent: float
    volume: int
    high: float
    low: float
    open: float
    marketCap: float = 0

@router.get("/", response_model=List[Stock])
async def get_stocks():
    # Mock data matching frontend
    return [
        {"symbol": "SFBT", "name": "Société de Fabrication des Boissons de Tunisie", "sector": "Consumer Goods", "lastPrice": 14.50, "change": 0.20, "changePercent": 1.40, "volume": 15000, "high": 14.60, "low": 14.30, "open": 14.30},
        {"symbol": "BIAT", "name": "Banque Internationale Arabe de Tunisie", "sector": "Financials", "lastPrice": 88.00, "change": -1.50, "changePercent": -1.68, "volume": 5000, "high": 89.50, "low": 87.50, "open": 89.50},
        {"symbol": "TT", "name": "Tunisie Telecom", "sector": "Telecommunications", "lastPrice": 3.20, "change": 0.05, "changePercent": 1.59, "volume": 45000, "high": 3.25, "low": 3.10, "open": 3.10},
    ]

@router.get("/{symbol}")
async def get_stock_analysis(symbol: str):
    return {
        "symbol": symbol,
        "current_price": 12.50,
        "forecast_5_day": [12.6, 12.7, 12.5, 12.8, 13.0],
        "sentiment_score": 0.75,
        "recommendation": "BUY",
        "confidence": 0.82
    }
