from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from .service import SentimentService
from .schemas import SentimentSignalResponse, NewsArticleResponse

router = APIRouter(
    prefix="/sentiment",
    tags=["Sentiment Analysis"]
)

@router.get("/{stock_symbol}", response_model=SentimentSignalResponse)
def get_stock_sentiment(stock_symbol: str, db: Session = Depends(get_db)):
    service = SentimentService(db)
    # logic to get latest signal from DB
    from .models import SentimentSignal
    from datetime import datetime
    
    signal = db.query(SentimentSignal).filter(SentimentSignal.stock_symbol == stock_symbol).order_by(SentimentSignal.date.desc()).first()
    
    if not signal:
        # Return mock data instead of 404 error
        from pydantic import BaseModel
        
        class MockSentimentSignal(BaseModel):
            id: int = 0
            stock_symbol: str
            sentiment_label: str = "NEUTRAL"
            sentiment_score: float = 0.5
            confidence: float = 0.0
            article_count: int = 0
            date: datetime = datetime.now()
            
            class Config:
                from_attributes = True
        
        return MockSentimentSignal(
            stock_symbol=stock_symbol,
            sentiment_label="NEUTRAL",
            sentiment_score=0.5,
            confidence=0.0,
            article_count=0
        )
    
    return signal

@router.post("/{stock_symbol}/analyze", response_model=SentimentSignalResponse)
def trigger_analysis(stock_symbol: str, db: Session = Depends(get_db)):
    service = SentimentService(db)
    signal = service.update_stock_sentiment(stock_symbol)
    if not signal:
         raise HTTPException(status_code=404, detail="Could not retrieve sentiment (no news found)")
    return signal

@router.get("/{stock_symbol}/articles", response_model=List[NewsArticleResponse])
def get_stock_articles(stock_symbol: str, db: Session = Depends(get_db)):
    from .models import NewsArticle
    articles = db.query(NewsArticle).filter(NewsArticle.stock_symbol == stock_symbol).order_by(NewsArticle.published_date.desc()).limit(10).all()
    return articles
