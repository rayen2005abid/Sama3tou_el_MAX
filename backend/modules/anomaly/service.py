import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import Anomaly, Stock
from backend.services.bvmt_scraper import get_daily_cotations
from forecasting.inference.service import inference_service
from forecasting.symbol_mapping import get_isin_from_symbol
import random

class AnomalyService:
    def __init__(self, db: Session):
        self.db = db

    def check_anomalies(self, symbol: str, data: pd.DataFrame = None):
        """
        Check for volume spikes and price shocks for a given stock.
        If `data` is provided, it runs detection on the *last row* of that data (for validation/testing).
        Otherwise, it fetches live/latest data.
        """
        anomalies = []
        
        # 1. Get Baseline History
        if data is None:
            # Production Mode
            isin = get_isin_from_symbol(symbol)
            if not isin:
                return []
            hist_df = inference_service.get_latest_data(isin)
            if hist_df.empty:
                return []
            
            # Get Snapshot (Real-time or Mock)
            current_data = self.get_realtime_data(symbol)
            
            current_price = current_data.get('price')
            current_vol = current_data.get('volume')
            
            # Append current snapshot to history for rolling calc (optional, or just use history stats)
            # For robustness, we use history stats and compare current value.
        else:
            # Validation/Backtest Mode
            # We are analyzing the LAST row of `data` against the `data` history
            hist_df = data.iloc[:-1] # History is everything up to now
            current_row = data.iloc[-1]
            current_price = current_row.get('CLOTURE', 0)
            current_vol = current_row.get('QUANTITE_NEGOCIEE', 0)
            
            if hist_df.empty:
                return []

        # --- Volume Spike Detection ---
        # Rule: Volume > Mean + 3 * StdDev
        if "QUANTITE_NEGOCIEE" in hist_df.columns:
            volumes = hist_df["QUANTITE_NEGOCIEE"].dropna().values
            # Use a rolling window if available, else full history
            window_vol = volumes[-30:] if len(volumes) > 30 else volumes
            
            if len(window_vol) > 5:
                mean_vol = np.mean(window_vol)
                std_vol = np.std(window_vol)
                
                if std_vol > 0 and current_vol > 0:
                    z_score = (current_vol - mean_vol) / std_vol
                    if z_score > 3:
                        anomalies.append({
                            "type": "VOLUME_SPIKE",
                            "description": f"Volume {current_vol} is {z_score:.1f}x std dev above mean ({mean_vol:.1f})",
                            "value": float(current_vol),
                            "confidence": min(z_score / 5.0, 1.0) # scaled confidence
                        })

        # --- Price Shock Detection ---
        # Rule: Abs(Return) > 5% (without news? we just check price for now)
        if current_price > 0:
            last_close = hist_df.iloc[-1]["CLOTURE"]
            if last_close > 0:
                pct_change = (current_price - last_close) / last_close
                
                if abs(pct_change) > 0.05:
                    anomalies.append({
                        "type": "PRICE_SHOCK",
                        "description": f"Price changed by {pct_change*100:.1f}% (limit 5%)",
                        "value": float(pct_change),
                        "confidence": 1.0
                    })

        # Save to DB only if NOT in validation mode (data is None)
        if data is None and anomalies:
            self.save_anomalies(symbol, anomalies)
            
        return anomalies

    def validate_model(self, symbol: str):
        """
        Runs a synthetic validation to calculate Precision, Recall, and F1.
        1. Loads historical data.
        2. Injects synthetic anomalies (spikes/shocks).
        3. Runs detection.
        4. Compares results.
        """
        isin = get_isin_from_symbol(symbol)
        if not isin:
            return {"error": f"Symbol {symbol} not found"}
            
        df = inference_service.get_latest_data(isin)
        if df.empty or len(df) < 100:
            return {"error": "Not enough data for validation"}
            
        # Work on a copy for last 200 days max
        test_df = df.tail(200).copy().reset_index(drop=True)
        
        injected_anomalies = {} # index -> type
        
        # 1. Inject Anomalies
        # We'll modify ~5% of rows to be anomalies
        num_injections = max(5, int(len(test_df) * 0.05))
        indices = random.sample(range(31, len(test_df)), num_injections) # start after 30 for history
        
        for idx in indices:
            row = test_df.iloc[idx]
            anomaly_type = random.choice(["VOLUME_SPIKE", "PRICE_SHOCK"])
            
            if anomaly_type == "VOLUME_SPIKE":
                # Make volume massive (10x mean)
                # We need mean of previous... just multiply current by 10 to be safe
                test_df.at[idx, 'QUANTITE_NEGOCIEE'] = (row['QUANTITE_NEGOCIEE'] + 1000) * 10
                injected_anomalies[idx] = "VOLUME_SPIKE"
            else:
                # Price Shock (+- 10%)
                prev_close = test_df.at[idx-1, 'CLOTURE']
                shock = random.choice([1.10, 0.90])
                test_df.at[idx, 'CLOTURE'] = prev_close * shock
                injected_anomalies[idx] = "PRICE_SHOCK"

        # 2. Run Detection
        tp = 0 # True Positive
        fp = 0 # False Positive
        fn = 0 # False Negative
        
        detected_indices = {}
        
        # Iterate and check
        # We simulate "real-time" by passing sliced data up to `i`
        for i in range(31, len(test_df)):
            # slice data 0..i (inclusive of i as "current")
            current_slice = test_df.iloc[:i+1]
            
            # Check
            results = self.check_anomalies(symbol, data=current_slice)
            
            # Did we detect?
            detected_types = [a['type'] for a in results]
            
            if i in injected_anomalies:
                expected = injected_anomalies[i]
                if expected in detected_types:
                    tp += 1
                else:
                    fn += 1 # We missed it
            else:
                if detected_types:
                    fp += 1 # We detected something but nothing was injected
                    
        # 3. Calculate Metrics
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "symbol": symbol,
            "total_samples": len(test_df),
            "injected_anomalies": len(injected_anomalies),
            "detected_true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "metrics": {
                "precision": round(precision, 2),
                "recall": round(recall, 2),
                "f1_score": round(f1, 2)
            }
        }

    def get_realtime_data(self, symbol):
        # ... (Keep existing simple scraping/mock logic)
        try:
            quotes = get_daily_cotations()
            target = next((q for q in quotes if q['symbol'] == symbol), None)
            if target:
                return {
                    'price': float(target.get('last', 0)),
                    'volume': int(target.get('vol', 0).replace(',', '').replace(' ', '') if isinstance(target.get('vol'), str) else target.get('vol', 0))
                }
        except Exception:
            pass
            
        # Fallback Mock
        return {'price': 12.5, 'volume': 5000}

    def save_anomalies(self, symbol, anomalies):
        for a in anomalies:
            db_anomaly = Anomaly(
                stock_symbol=symbol,
                anomaly_type=a['type'],
                description=a['description'],
                metric_value=a['value'],
                confidence=a['confidence'],
                detected_at=datetime.utcnow()
            )
            self.db.add(db_anomaly)
        self.db.commit()
