from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .config import settings
from .routers import auth, market, portfolio, stocks, alerts

# New Modular Routers
from .modules.sentiment import router as sentiment_router
from .modules.anomaly.router import router as anomaly_router
from .modules.chatbot.router import router as chatbot_router
from .modules.decision.router import router as decision_router
from .routers import forecasting, system

# Import models for auto-creation (Core)
from . import models
# Import models for auto-creation (Modules)
import backend.modules.sentiment.models
# Anomaly models are in backend.models now, so no separate import needed
# Chatbot has no models for MVP

from backend.scheduler import start_scheduler

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Scheduler
start_scheduler()

app = FastAPI(title="Intelligent Trading Assistant API", version="0.1.0")

# Seed initial user
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.username == "admin").first()
    if not user:
        from .auth import get_password_hash
        hashed_password = get_password_hash("samatou")
        user = models.User(username="admin", hashed_password=hashed_password, risk_profile="moderate", initial_capital=50000)
        db.add(user)
        db.commit()
    db.close()

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*"
]
# Append origins from settings if available
if settings.CORS_ORIGINS:
     if isinstance(settings.CORS_ORIGINS, list):
         origins.extend(settings.CORS_ORIGINS)
     else:
         origins.append(settings.CORS_ORIGINS)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers
app.include_router(auth.router)
app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(portfolio.router)
app.include_router(alerts.router)

# Module Routers(Decision Support)
app.include_router(sentiment_router.router)
app.include_router(anomaly_router)
app.include_router(decision_router)
app.include_router(chatbot_router)
app.include_router(forecasting.router)
app.include_router(system.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Trading Assistant API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
