from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from backend.database import Base

class SentimentSignal(Base):
    __tablename__ = "sentiment_signals"

    id = Column(Integer, primary_key=True, index=True)
    stock_symbol = Column(String, index=True) # Loose coupling with Stock table
    date = Column(DateTime, default=datetime.utcnow)
    sentiment_score = Column(Float) # -1.0 to 1.0
    sentiment_label = Column(String) # positive, neutral, negative
    confidence = Column(Float) # 0.0 to 1.0
    article_count = Column(Integer)

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    stock_symbol = Column(String, index=True)
    title = Column(String)
    url = Column(String, unique=True)
    source = Column(String) # ilboursa, tustex, etc.
    content = Column(Text)
    published_date = Column(DateTime)
    sentiment_score = Column(Float)
    language = Column(String) # ar, fr
