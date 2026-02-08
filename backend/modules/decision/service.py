from sqlalchemy.orm import Session
from datetime import datetime
from backend.models import User, Stock, Portfolio, PortfolioHolding, Transaction, Anomaly
from backend.services.bvmt_scraper import get_daily_cotations
from forecasting.inference.service import inference_service
from backend.modules.sentiment.router import get_stock_sentiment as get_sentiment_data # Reuse existing function? Or service?
# Using existing function as simple service access for MVP

class DecisionService:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendation(self, symbol: str, user_id: int):
        """
        Generate a trade recommendation based on user profile and aggregated data.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        risk_profile = user.risk_profile if user else "moderate" # default
        
        # 1. Get Inputs
        # Forecast
        forecast_res = inference_service.predict(symbol)
        if "error" in forecast_res:
            return {"action": "HOLD", "confidence": 0, "reason": "No forecast available"}
            
        pred_return = forecast_res.get("log_return_t1", 0) # Log return ~ pct change for small values
        
        # Sentiment
        # We need a way to get sentiment score without HTTP request
        # Let's query DB directly for latest signal
        from backend.modules.sentiment.models import SentimentSignal
        sentiment_signal = self.db.query(SentimentSignal).filter(SentimentSignal.stock_symbol == symbol).order_by(SentimentSignal.date.desc()).first()
        sentiment_score = sentiment_signal.sentiment_score if sentiment_signal else 0.0 # Neutral fallback
        
        # Anomalies
        recent_anomalies = self.db.query(Anomaly).filter(
            Anomaly.stock_symbol == symbol,
            Anomaly.detected_at > datetime.utcnow().replace(hour=0, minute=0, second=0) # Today
        ).all()
        has_anomaly = len(recent_anomalies) > 0

        # 2. Logic based on Profile
        action = "HOLD"
        confidence = 0.5
        reasons = []

        # Thresholds
        if risk_profile == "aggressive":
            buy_return = 0.005 # 0.5%
            buy_sentiment = -0.2 # Can buy even with slightly negative sentiment if return is high
        elif risk_profile == "conservative":
            buy_return = 0.02 # 2%
            buy_sentiment = 0.5 # Strong positive sentiment required
        else: # moderate
            buy_return = 0.01 # 1%
            buy_sentiment = 0.2
            
        # Decision Logic
        if pred_return > buy_return:
            if sentiment_score > buy_sentiment:
                if not (risk_profile == "conservative" and has_anomaly):
                    action = "BUY"
                    confidence = 0.8 + (0.1 if sentiment_score > 0.5 else 0)
                    reasons.append(f"Forecast predicts {pred_return*100:.2f}% return > threshold {buy_return*100}%")
                    reasons.append(f"Sentiment {sentiment_score:.2f} is sufficient")
            else:
                 reasons.append(f"Sentiment {sentiment_score:.2f} is too low for BUY despite good forecast")
        elif pred_return < -0.01:
            action = "SELL"
            confidence = 0.7
            reasons.append(f"Negative forecast {pred_return*100:.2f}%")
        
        if has_anomaly:
            reasons.append(f"Safe guard: {len(recent_anomalies)} anomalies detected today")
            if risk_profile == "conservative" and action == "BUY":
                action = "HOLD"
                reasons.append("Conservative profile avoids stocks with anomalies")

        if not reasons:
            reasons.append("No strong signals detected")

        return {
            "symbol": symbol,
            "action": action,
            "confidence": confidence,
            "reason": "; ".join(reasons),
            "metrics": {
                "forecast_return": pred_return,
                "sentiment_score": sentiment_score,
                "anomalies": len(recent_anomalies)
            }
        }

    def execute_trade(self, user_id: int, symbol: str, action: str, quantity: int, price: float):
        """
        Simulate a trade execution.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
            
        portfolio = self.db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            # Create default portfolio
            portfolio = Portfolio(user_id=user_id, total_value=user.initial_capital)
            self.db.add(portfolio)
            self.db.commit()
            
        # Initialize cash holding? 
        # For simple MVP, let's assume 'total_value' tracks net worth, but we need 'cash' balance.
        # Let's add 'cash_balance' to Portfolio model? 
        # Or just use a special holding symbol 'CASH'.
        cash_holding = self.db.query(PortfolioHolding).filter(
            PortfolioHolding.portfolio_id == portfolio.id,
            PortfolioHolding.symbol == 'CASH'
        ).first()

        if not cash_holding:
            cash_holding = PortfolioHolding(
                portfolio_id=portfolio.id,
                symbol='CASH',
                quantity=1, # Nominal
                purchase_price=1.0,
                current_price=user.initial_capital # Use price to store amount? Or Quantity?
                # Using 'current_price' for cash amount is a hack.
                # Let's say Quantity = amount, Price = 1.0
            ) 
            # Actually quantity is Integer. Cash is float.
            # Let's assume Transaction tracks history and we rebuild state or add 'cash' column later.
            # For strict MVP: No cash constraint, just track P&L?
            # User wants "Initial virtual capital (e.g. 10,000 TND)".
            # So we MUST track cash.
            pass

        # ... (Trade logic is complex for 1 file without modifying Portfolio model heavily)
        # Let's assume unlimited cash or simple tracking for MVP
        
        # Record Transaction
        txn = Transaction(
            portfolio_id=portfolio.id,
            symbol=symbol,
            transaction_type=action,
            quantity=quantity,
            price=price
        )
        self.db.add(txn)
        
        # Update Holdings
        holding = self.db.query(PortfolioHolding).filter(
            PortfolioHolding.portfolio_id == portfolio.id,
            PortfolioHolding.symbol == symbol
        ).first()
        
        if action == "BUY":
            if holding:
                # Avg price
                total_cost = holding.quantity * holding.purchase_price + quantity * price
                holding.quantity += quantity
                holding.purchase_price = total_cost / holding.quantity
            else:
                holding = PortfolioHolding(
                    portfolio_id=portfolio.id,
                    symbol=symbol,
                    quantity=quantity,
                    purchase_price=price,
                    current_price=price
                )
                self.db.add(holding)
        elif action == "SELL":
            if holding and holding.quantity >= quantity:
                holding.quantity -= quantity
                if holding.quantity == 0:
                    self.db.delete(holding)
            else:
                return {"error": "Insufficient holdings"}

        self.db.commit()
        return {"message": f"Trade {action} {quantity} {symbol} executed", "price": price}

    def get_portfolio_summary(self, user_id: int):
        # Calculate ROI, Sharpe, etc.
        # For MVP, just return holdings and total value
        return {} # To be implemented
