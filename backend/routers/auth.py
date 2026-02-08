from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=schemas.Token)
async def register_user(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists (if provided)
    if user_data.email:
        existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user with default values
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        trading_experience="new",
        risk_score=0,
        risk_profile="moderate",
        initial_capital=10000.0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default portfolio
    default_portfolio = models.Portfolio(
        user_id=new_user.id,
        total_value=new_user.initial_capital
    )
    db.add(default_portfolio)
    db.commit()
    
    # Create and return access token (auto-login)
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_user_profile(profile_update: schemas.UserProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    if profile_update.age is not None:
        current_user.age = profile_update.age
    if profile_update.trading_experience is not None:
        current_user.trading_experience = profile_update.trading_experience
    if profile_update.initial_capital is not None:
        current_user.initial_capital = profile_update.initial_capital
    if profile_update.risk_profile is not None:
        current_user.risk_profile = profile_update.risk_profile
    if profile_update.preferred_investment_types is not None:
        current_user.preferred_investment_types = profile_update.preferred_investment_types
    if profile_update.notification_preferences is not None:
        current_user.notification_preferences = profile_update.notification_preferences
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/quiz")
async def submit_quiz(submission: schemas.QuizSubmission, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.trading_experience = submission.trading_experience
    current_user.risk_score = submission.risk_score
    
    # Simple logic to set risk profile based on score
    if submission.risk_score <= 3:
        current_user.risk_profile = "conservative"
    elif submission.risk_score <= 7:
        current_user.risk_profile = "moderate"
    else:
        current_user.risk_profile = "aggressive"
        
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "profile": current_user.risk_profile}
