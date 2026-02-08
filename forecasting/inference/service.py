import torch
import numpy as np
import pandas as pd
import joblib
import os

from forecasting.data.loader import load_and_merge_data
from forecasting.features.engineering import add_technical_indicators
from forecasting.models.lstm import OptimizedLSTM
from forecasting.symbol_mapping import get_isin_from_symbol

# Configuration
DATA_DIR = r"C:\Users\user\Downloads\sama3tou max\Datasets"
ARTIFACTS_DIR = r"C:\Users\user\Downloads\sama3tou max\forecasting\artifacts"
SEQ_LEN = 60
FEATURES = ["log_return", "volatility_20", "rsi", "macd_hist", "bb_pos", "volume_change"]
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class InferenceService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.load_artifacts()

    def load_artifacts(self):
        model_path = os.path.join(ARTIFACTS_DIR, "best_lstm_model.pth")
        scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.pkl")
        
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            print("Artifacts not found. Please train the model first.")
            return

        # Load Scaler
        self.scaler = joblib.load(scaler_path)
        
        # Load Model
        # We need to know input_dim. It's len(FEATURES) = 6
        self.model = OptimizedLSTM(input_dim=len(FEATURES)).to(device)
        self.model.load_state_dict(torch.load(model_path, map_location=device))
        self.model.eval()
        print("Inference artifacts loaded successfully.")

    def get_latest_data(self, ticker):
        # In a real app, this might fetch from an API. 
        # Here we reload from files for simplicity/MVP.
        # Optimally, we should cache this or use a database.
        df = load_and_merge_data(DATA_DIR)
        if df.empty:
            return pd.DataFrame()
            
        ticker_df = df[df["CODE"] == ticker].copy()
        if ticker_df.empty:
            return pd.DataFrame()
            
        return ticker_df

    def predict(self, ticker):
        import traceback
        
        try:
            if self.model is None:
                self.load_artifacts()
                if self.model is None:
                    return {"error": "Model not trained"}

            # Convert symbol to ISIN code for dataset lookup
            isin_code = get_isin_from_symbol(ticker)
            print(f"Converting symbol '{ticker}' to ISIN '{isin_code}'", flush=True)

            df = self.get_latest_data(isin_code)
            if df.empty:
                return {"error": f"No data found for ticker {ticker} (ISIN: {isin_code})"}
            
            if len(df) < SEQ_LEN + 30: # +30 for rolling windows
                return {"error": f"Not enough history for ticker {ticker}. Found {len(df)} rows, need at least {SEQ_LEN + 30}"}

            # Feature Engineering
            try:
                df = add_technical_indicators(df)
            except Exception as e:
                print(f"Error in add_technical_indicators: {str(e)}", flush=True)
                traceback.print_exc()
                return {"error": f"Feature engineering failed: {str(e)}"}
            
            if df.empty or len(df) < SEQ_LEN:
                return {"error": f"Not enough data after feature engineering for {ticker}. Need at least {SEQ_LEN} rows"}
            
            # Get last sequence
            last_sequence_df = df.iloc[-SEQ_LEN:]
            
            # Scale
            try:
                features = last_sequence_df[FEATURES].values
                features_scaled = self.scaler.transform(features)
            except Exception as e:
                print(f"Error in scaling: {str(e)}", flush=True)
                traceback.print_exc()
                return {"error": f"Scaling failed: {str(e)}"}
            
            # Convert to tensor
            try:
                X = torch.tensor(features_scaled, dtype=torch.float32).unsqueeze(0).to(device) # (1, seq_len, features)
            except Exception as e:
                print(f"Error creating tensor: {str(e)}", flush=True)
                traceback.print_exc()
                return {"error": f"Tensor creation failed: {str(e)}"}
            
            # Predict
            try:
                with torch.no_grad():
                    preds = self.model(X).cpu().numpy()[0] # [pred_t1, pred_t5]
            except Exception as e:
                print(f"Error in model prediction: {str(e)}", flush=True)
                traceback.print_exc()
                return {"error": f"Model prediction failed: {str(e)}"}
                
            # The model predicts log_returns. We need to convert back to price?
            # Predicting returns is standard, but user wants price.
            # Price_t+1 = Price_t * exp(log_return_t+1)
            
            last_close = df["CLOTURE"].iloc[-1]
            
            # Pred T+1
            log_ret_t1 = preds[0]
            price_t1 = last_close * np.exp(log_ret_t1)
            
            # Pred T+5 (This is a simplified view, assuming the T+5 return is cumulative or relative to now)
            # Our model trained Y to be [target[i+SEQ_LEN], target[i+SEQ_LEN+4]]
            # where target is log_return.
            # Actually, if target is just daily log return, simply doing logic above for T+5 is tricky.
            # But let's assume the model learned the "return 5 days from now" relative to "now"?
            # No, in training:
            # y.append([target[i+SEQ_LEN], target[i+SEQ_LEN+4]])
            # target is log_return series.
            # So y[0] is log return of day T+1. y[1] is log return of day T+5.
            # NO. target[k] is log(Price_k / Price_{k-1}).
            # So y[1] is log(Price_{t+5} / Price_{t+4}). This is just the daily return of that future day.
            # This is NOT cumulative return from today.
            
            # If we want Price T+5, we would technically need to predict T+1, T+2... T+5.
            # OR we change the target def in training. 
            # But let's stick to what we have. Predicting single day return 5 days out is ... weird/hard.
            # Usually one predicts return over next 5 days.
            # BUT, let's assume for now we provide the specific forecast for that day. 
            # To get a "Price Target" for T+5, we'd need the intermediate days.
            # For MVP, let's just output the predicted daily return for T+1 and T+5, 
            # and maybe just apply them to current price to show "Potential Price Movement".
            
            # Let's adjust interpretation:
            # Prediction 1: Expected movement tomorrow.
            # Prediction 2: Expected movement 5 days from now (on that specific day).
            
            # Let's calculate Price T+1.
            price_t1 = last_close * np.exp(log_ret_t1)
            
            return {
                "ticker": ticker,
                "current_price": float(last_close),
                "prediction_t1": float(price_t1),
                "log_return_t1": float(log_ret_t1),
                "log_return_t5": float(preds[1]) # Just returning the raw prediction for now
            }
        except Exception as e:
            print(f"Unexpected error in predict for {ticker}: {str(e)}", flush=True)
            traceback.print_exc()
            return {"error": f"Prediction failed: {str(e)}"}

# Singleton instance
inference_service = InferenceService()
