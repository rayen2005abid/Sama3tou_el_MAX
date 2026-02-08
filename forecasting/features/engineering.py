import pandas as pd
import numpy as np

# RSI
def compute_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / (loss + 1e-6)
    return 100 - (100 / (1 + rs))

# MACD
def compute_macd(series, fast=12, slow=26, signal=9):
    exp1 = series.ewm(span=fast, adjust=False).mean()
    exp2 = series.ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd - signal_line

# Bollinger Bands
def compute_bollinger(series, window=20):
    ma = series.rolling(window).mean()
    std = series.rolling(window).std()
    upper = ma + (2 * std)
    lower = ma - (2 * std)
    return (series - lower) / ((upper - lower) + 1e-6) # Normalized position

def add_technical_indicators(df):
    df = df.copy()
    
    # Log Returns
    df["log_return"] = np.log(df["CLOTURE"] / df["CLOTURE"].shift(1))
    
    # Volatility
    df["volatility_20"] = df["log_return"].rolling(20).std()
    
    # RSI
    df["rsi"] = compute_rsi(df["CLOTURE"])
    
    # MACD Histogram
    df["macd_hist"] = compute_macd(df["CLOTURE"])
    
    # Bollinger Position
    df["bb_pos"] = compute_bollinger(df["CLOTURE"])
    
    # Volume Change
    df["volume_change"] = np.log((df["QUANTITE_NEGOCIEE"] + 1) / (df["QUANTITE_NEGOCIEE"].shift(1) + 1))

    # Drop NaNs created by rolling windows
    df = df.dropna()
    return df
