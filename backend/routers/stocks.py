from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from ..services import bvmt_scraper

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
    scraped_data = bvmt_scraper.get_daily_cotations()
    stocks = []
    
    for item in scraped_data:
        stocks.append({
            "symbol": item["symbol"],
            "name": item["name"],
            "sector": "Tunis Stock Exchange", # Default sector as we don't have it in the simple table
            "lastPrice": item["last"],
            "change": item["last"] * (item["change_percent"] / 100),
            "changePercent": item["change_percent"],
            "volume": item["volume"],
            "high": item.get("high", item["last"]),
            "low": item.get("low", item["last"]),
            "open": item.get("open", item["last"]),
            "marketCap": 0
        })
            
    return stocks

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
