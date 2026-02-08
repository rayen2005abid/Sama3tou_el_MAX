from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from ..services import bvmt_scraper

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
    scraped_data = bvmt_scraper.get_tunindex_data()
    
    val = scraped_data.get("value", 9850.50)
    chg_pct = scraped_data.get("change", 0.05)
    # Approximate point change
    chg = val * (chg_pct / 100)
    
    return [
        {"name": "TUNINDEX", "value": val, "change": float(chg), "changePercent": float(chg_pct)},
            # Mock TUNINDEX20 relative to TUNINDEX or fixed
        {"name": "TUNINDEX20", "value": val * 0.45, "change": float(chg * 0.45), "changePercent": float(chg_pct)},
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
    indices = await get_indices()
    palmares = bvmt_scraper.get_palmares_data()
    
    return {
        "indices": indices,
        "top_gainers": palmares.get("gainers", []),
        "top_losers": palmares.get("losers", []),
        "global_sentiment": "Neutral",
        "recent_alerts": 0
    }
