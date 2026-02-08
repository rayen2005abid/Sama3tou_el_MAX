from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.models import User
from .service import DecisionService

router = APIRouter(
    prefix="/decision",
    tags=["decision"]
)

@router.get("/recommendation/{symbol}")
def get_recommendation(symbol: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get trading recommendation for a specific stock based on user profile.
    """
    service = DecisionService(db)
    return service.get_recommendation(symbol, current_user.id)

@router.get("/recommendations")
def get_all_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get recommendations for a watchlist of stocks (MVP: fixed list).
    """
    service = DecisionService(db)
    # MVP Watchlist
    symbols = ["SFBT", "BIAT", "PGH", "SAH", "TELNET", "ARTES", "SOTUVER", "TPR", "Lilac", "Carthage Cement"]
    # Actually need to make sure symbols exist in our mapping/DB
    
    results = []
    for sym in symbols:
        # We might want to optimize this (batch request)
        rec = service.get_recommendation(sym, current_user.id)
        results.append(rec)
        
    return results
