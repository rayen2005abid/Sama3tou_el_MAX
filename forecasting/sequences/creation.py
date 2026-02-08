import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
from forecasting.features.engineering import add_technical_indicators

def create_dataset(final_df, seq_len=60, horizons=[1, 5]):
    print("Preprocessing data...", flush=True)
    # Process per stock to avoid data leakage across tickers
    grouped = final_df.groupby("CODE")
    processed_dfs = []
    
    for code, group in grouped:
        if len(group) > 200: # Minimum history requirement
            processed_dfs.append(add_technical_indicators(group.copy()))
            
    if not processed_dfs:
        print("No valid data after preprocessing.", flush=True)
        return None, None, None # Return scaler as well
        
    df_all = pd.concat(processed_dfs)
    
    FEATURES = ["log_return", "volatility_20", "rsi", "macd_hist", "bb_pos", "volume_change"]
    TARGET = "log_return" # Predicting next log return
    
    print(f"Features: {FEATURES}", flush=True)
    
    # Scaling - RobustScaler is crucial for financial data (outliers)
    scaler = RobustScaler()
    df_all[FEATURES] = scaler.fit_transform(df_all[FEATURES].values)
    
    X_all = []
    y_all = []
    
    # Sequence generation
    print("Generating sequences...", flush=True)
    for code, group in df_all.groupby("CODE"):
        data = group[FEATURES].values
        target = group[TARGET].values
        
        if len(data) < seq_len + max(horizons):
            continue
            
        # Vectorized sequence creation preferred, but loop is clearer for variable horizons
        for i in range(len(data) - seq_len - max(horizons)):
            X_all.append(data[i:i+seq_len])
            # Target: Return at t+1 and t+5
            y_all.append([target[i+seq_len], target[i+seq_len+4]]) 
            
    X_all = np.array(X_all)
    y_all = np.array(y_all)
    
    print(f"Dataset Shape: X={X_all.shape}, y={y_all.shape}", flush=True)
    return X_all, y_all, scaler
