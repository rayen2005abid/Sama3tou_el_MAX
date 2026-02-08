from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..routers.auth import get_current_user
import random # For mock prices

router = APIRouter(
    prefix="/portfolio",
    tags=["portfolio"],
    responses={404: {"description": "Not found"}},
)

# Mock price function - in a real app this would fetch from a market data service
def get_current_price(symbol: str) -> float:
    # Mock prices for common stocks
    prices = {
        "SFBT": 14.50,
        "BIAT": 88.00,
        "PGH": 12.30,
        "SAH": 8.90,
        "TELNET": 6.50
    }
    return prices.get(symbol, 10.0 + random.random() * 5) # Default random price if unknown

@router.get("/", response_model=schemas.PortfolioSummary)
async def get_portfolio(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's portfolio (assuming single portfolio for now)
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.id).first()
    
    if not portfolio:
        # Should be created at registration, but just in case
        portfolio = models.Portfolio(user_id=current_user.id, total_value=current_user.initial_capital)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)

    holdings = db.query(models.PortfolioHolding).filter(models.PortfolioHolding.portfolio_id == portfolio.id).all()
    
    positions = []
    total_holdings_value = 0.0
    total_cost = 0.0
    
    for holding in holdings:
        current_price = get_current_price(holding.symbol)
        
        # Calculate derived values
        market_value = holding.quantity * current_price
        cost_basis = holding.quantity * holding.purchase_price
        pnl = market_value - cost_basis
        pnl_percent = (pnl / cost_basis * 100) if cost_basis > 0 else 0
        
        total_holdings_value += market_value
        total_cost += cost_basis
        
        positions.append({
            "stock": holding.symbol, # Using symbol as name for now, or fetch name map
            "symbol": holding.symbol,
            "quantity": holding.quantity,
            "avgPrice": holding.purchase_price,
            "currentPrice": current_price,
            "pnl": round(pnl, 2),
            "pnlPercent": round(pnl_percent, 2),
            "allocation": 0 # Will verify later
        })

    # Calculate allocations
    total_portfolio_value = total_holdings_value + current_user.initial_capital # "initial_capital" track cash? 
    # Wait, initial_capital in User model might be "deposited cash".
    # But usually a portfolio has "Cash" balance.
    # Let's assume User.initial_capital matches "Current Cash Balance".
    # And Portfolio.total_value matches "Total Assets (Cash + Holdings)".
    
    cash_balance = current_user.initial_capital
    total_assets = cash_balance + total_holdings_value
    
    for pos in positions:
        pos["allocation"] = round((pos["quantity"] * pos["currentPrice"] / total_assets * 100), 2)
        
    total_pnl = total_assets - (total_cost + cash_balance) # Is this right? 
    # PnL is usually Market Value - Cost Basis.
    # Total PnL = (Value of Holdings - Cost of Holdings)
    
    total_pnl_holdings = total_holdings_value - total_cost
    total_pnl_percent = (total_pnl_holdings / total_cost * 100) if total_cost > 0 else 0
    
    # Update portfolio total value in DB
    portfolio.total_value = total_assets
    db.commit()

    return {
        "totalValue": round(total_assets, 2),
        "totalCost": round(total_cost, 2), # Cost of invested capital
        "totalPnl": round(total_pnl_holdings, 2),
        "totalPnlPercent": round(total_pnl_percent, 2),
        "roi": round(total_pnl_percent, 2),
        "sharpeRatio": 1.2, # Mock
        "maxDrawdown": -4.5, # Mock
        "positions": positions
    }

@router.post("/transaction")
async def execute_transaction(transaction: schemas.TransactionCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    current_price = transaction.price
    total_amount = transaction.quantity * current_price
    
    if transaction.action.upper() == "BUY":
        if current_user.initial_capital < total_amount:
             raise HTTPException(status_code=400, detail="Insufficient funds")
             
        # Check if holding exists
        holding = db.query(models.PortfolioHolding).filter(
            models.PortfolioHolding.portfolio_id == portfolio.id,
            models.PortfolioHolding.symbol == transaction.symbol
        ).first()
        
        if holding:
            # Avg Price calculation
            total_cost = (holding.quantity * holding.purchase_price) + total_amount
            new_quantity = holding.quantity + transaction.quantity
            holding.purchase_price = total_cost / new_quantity
            holding.quantity = new_quantity
        else:
            new_holding = models.PortfolioHolding(
                portfolio_id=portfolio.id,
                symbol=transaction.symbol,
                quantity=transaction.quantity,
                purchase_price=current_price,
                current_price=current_price
            )
            db.add(new_holding)
            
        current_user.initial_capital -= total_amount
        
        # Record Transaction
        txn = models.Transaction(
            portfolio_id=portfolio.id,
            symbol=transaction.symbol,
            transaction_type="BUY",
            quantity=transaction.quantity,
            price=current_price
        )
        db.add(txn)
        
    elif transaction.action.upper() == "SELL":
        holding = db.query(models.PortfolioHolding).filter(
            models.PortfolioHolding.portfolio_id == portfolio.id,
            models.PortfolioHolding.symbol == transaction.symbol
        ).first()
        
        if not holding or holding.quantity < transaction.quantity:
            raise HTTPException(status_code=400, detail="Insufficient holdings")
            
        holding.quantity -= transaction.quantity
        if holding.quantity == 0:
            db.delete(holding)
            
        current_user.initial_capital += total_amount
        
        # Record Transaction
        txn = models.Transaction(
            portfolio_id=portfolio.id,
            symbol=transaction.symbol,
            transaction_type="SELL",
            quantity=transaction.quantity,
            price=current_price
        )
        db.add(txn)
        
    db.commit()
    return {"status": "success", "new_balance": current_user.initial_capital}
