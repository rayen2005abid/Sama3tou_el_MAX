from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class NewsArticleBase(BaseModel):
    stock_symbol: str
    title: str
    url: str
    source: str
    published_date: datetime
    language: str

class NewsArticleCreate(NewsArticleBase):
    content: str
    sentiment_score: float

class NewsArticleResponse(NewsArticleBase):
    id: int
    sentiment_score: float

    class Config:
        from_attributes = True

class SentimentSignalBase(BaseModel):
    stock_symbol: str
    sentiment_label: str
    sentiment_score: float
    confidence: float
    article_count: int

class SentimentSignalResponse(SentimentSignalBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True
