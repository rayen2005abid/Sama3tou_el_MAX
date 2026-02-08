from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    hashed_password = Column(String)
    risk_profile = Column(String) # conservative, moderate, aggressive - derived or set
    initial_capital = Column(Float, default=10000.0)
    
    # Preferences (stored as JSON string or comma-separated for MVP)
    preferred_investment_types = Column(String, default="stocks") 
    notification_preferences = Column(String, default="email,app") # comma separated: email,app,sms

    # New fields for questionnaire
    trading_experience = Column(String, default="new") # new, basics, active
    risk_score = Column(Integer, default=0)

    portfolios = relationship("Portfolio", back_populates="owner")

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    sector = Column(String)

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="portfolios")
    
    # Simple JSON storage for holdings or separate table? 
    # For MVP, let's just track holdings in a separate table for better querying
    holdings = relationship("PortfolioHolding", back_populates="portfolio")
    total_value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    portfolio = relationship("Portfolio", back_populates="holdings")
    
    symbol = Column(String)
    quantity = Column(Integer)
    purchase_price = Column(Float)
    current_price = Column(Float) # cached or updated

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    stock_symbol = Column(String, index=True)
    anomaly_type = Column(String) # VOLUME_SPIKE, PRICE_SHOCK, PATTERN
    description = Column(String)
    metric_value = Column(Float) # e.g. volume value or % change
    confidence = Column(Float, default=1.0)
    detected_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    portfolio = relationship("Portfolio")
    
    symbol = Column(String)
    transaction_type = Column(String) # BUY, SELL
    quantity = Column(Integer)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
