from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(
    prefix="/market",
    tags=["market"],
    responses={404: {"description": "Not found"}},
)

class MarketIndex(BaseModel):
    name: str
    value: float
    change: float
    changePercent: float

@router.get("/indices", response_model=List[MarketIndex])
async def get_indices():
    return [
        {"name": "TUNINDEX", "value": 8500.23, "change": 38.45, "changePercent": 0.45},
        {"name": "TUNINDEX20", "value": 3800.12, "change": 12.32, "changePercent": 0.32},
    ]

@router.get("/recommendations")
async def get_recommendations():
     return [
        {"stock": "Société de Fabrication des Boissons de Tunisie", "symbol": "SFBT", "action": "BUY", "confidence": 0.85, "reason": "Strong breakout above resistance", "signals": ["Volume spike", "MACD crossover"]},
        {"stock": "Banque Internationale Arabe de Tunisie", "symbol": "BIAT", "action": "HOLD", "confidence": 0.60, "reason": "Consolidating near all-time highs", "signals": ["RSI Neutral"]},
    ]

# Old overview endpoint (might not be needed if frontend calls individual endpoints)
@router.get("/overview")
async def get_market_overview():
    return {
        "indices": [
            {"name": "TUNINDEX", "value": 8500.23, "change": 0.45},
            {"name": "TUNINDEX20", "value": 3800.12, "change": 0.32},
        ],
        "top_gainers": [
            {"symbol": "SFBT", "change": 2.5},
            {"symbol": "BIAT", "change": 1.8},
        ],
        "top_losers": [
            {"symbol": "SERVICOM", "change": -3.2},
            {"symbol": "UADH", "change": -2.1},
        ],
        "global_sentiment": "Neutral",
        "recent_alerts": 2
    }
