from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import market, stocks, portfolio, alerts, auth
from .database import engine, Base, SessionLocal
from . import models, auth as auth_utils

# Create tables (for MVP, auto-create is fine for now, but Alembic is better)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating tables: {e}")
    # Continue anyway so the app can start (API will fail on DB access but that's better than crash)

app = FastAPI(title="Intelligent Trading Assistant API", version="0.1.0")

# Seed initial user
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.username == "admin").first()
    if not user:
        hashed_password = auth_utils.get_password_hash("samatou")
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(portfolio.router)
app.include_router(alerts.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Trading Assistant API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
