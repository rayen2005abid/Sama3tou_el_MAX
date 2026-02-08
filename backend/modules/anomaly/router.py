from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from .service import AnomalyService
from backend.models import Anomaly

router = APIRouter(
    prefix="/anomaly",
    tags=["anomaly"]
)

@router.get("/detect/{symbol}")
def detect_anomalies(symbol: str, db: Session = Depends(get_db)):
    """
    Trigger anomaly detection for a specific symbol.
    Returns a list of detected anomalies.
    """
    service = AnomalyService(db)
    anomalies = service.check_anomalies(symbol)
    return anomalies

@router.get("/latest")
def get_latest_anomalies(limit: int = 10, db: Session = Depends(get_db)):
    """
    Get the latest detected anomalies from the database.
    """
    return db.query(Anomaly).order_by(Anomaly.detected_at.desc()).limit(limit).all()

@router.get("/validate/{symbol}")
def validate_model(symbol: str, db: Session = Depends(get_db)):
    """
    Run synthetic validation for anomaly detection model.
    Returns Precision, Recall, F1-Score.
    """
    service = AnomalyService(db)
    metrics = service.validate_model(symbol)
    if "error" in metrics:
        raise HTTPException(status_code=400, detail=metrics["error"])
    return metrics
