from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    trading_experience: Optional[str] = None
    initial_capital: Optional[float] = None
    risk_profile: Optional[str] = None
    preferred_investment_types: Optional[str] = None # comma separated
    notification_preferences: Optional[str] = None # comma separated

class UserResponse(UserBase):
    id: int
    email: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[int] = None
    trading_experience: str
    risk_score: int
    initial_capital: float
    risk_profile: Optional[str] = None
    preferred_investment_types: Optional[str] = None
    notification_preferences: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class QuizSubmission(BaseModel):
    trading_experience: str
    risk_score: int

class TransactionCreate(BaseModel):
    symbol: str
    quantity: int
    action: str # "BUY" or "SELL"
    price: float

class PortfolioPosition(BaseModel):
    stock: str
    symbol: str
    quantity: int
    avgPrice: float
    currentPrice: float
    pnl: float
    pnlPercent: float
    allocation: float

class PortfolioSummary(BaseModel):
    totalValue: float
    totalCost: float
    totalPnl: float
    totalPnlPercent: float
    roi: float
    sharpeRatio: float
    maxDrawdown: float
    positions: list[PortfolioPosition]
