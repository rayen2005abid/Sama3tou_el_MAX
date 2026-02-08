import pandas as pd
import numpy as np

class TechnicalFeatures:
    def __init__(self):
        pass

    def add_all_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Adds all technical indicators to the dataframe."""
        df = df.copy()
        df = self.add_log_returns(df)
        df = self.add_volatility(df)
        df = self.add_rsi(df)
        df = self.add_macd(df)
        df = self.add_bollinger_bands(df)
        return df

    def add_log_returns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Adds Log Returns for 1, 3, 5 days."""
        # Log Return = ln(P_t / P_{t-1})
        df['log_ret_1d'] = np.log(df['Close'] / df['Close'].shift(1))
        df['log_ret_3d'] = np.log(df['Close'] / df['Close'].shift(3))
        df['log_ret_5d'] = np.log(df['Close'] / df['Close'].shift(5))
        return df

    def add_volatility(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """
        Adds Volatility measures.
        1. Parkinson Volatility (High-Low based).
        2. Rolling Std Dev of returns.
        """
        # Parkinson Volatility: sqrt(1 / (4 * ln(2)) * ln(High/Low)^2)
        const = 1.0 / (4.0 * np.log(2.0))
        df['parkinson_vol'] = np.sqrt(const * (np.log(df['High'] / df['Low'])**2))
        
        # Rolling Log Return Volatility (Standard Deviation)
        df['volatility_20d'] = df['log_ret_1d'].rolling(window=window).std()
        return df
        
    def add_rsi(self, df: pd.DataFrame, window: int = 14) -> pd.DataFrame:
        """Relative Strength Index."""
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()

        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        return df

    def add_macd(self, df: pd.DataFrame) -> pd.DataFrame:
        """Moving Average Convergence Divergence."""
        # Standard settings: 12, 26, 9
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['macd'] = exp1 - exp2
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
        return df

    def add_bollinger_bands(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """Bollinger Band Width (Volatility indicator)."""
        sma = df['Close'].rolling(window=window).mean()
        std = df['Close'].rolling(window=window).std()
        upper = sma + (2 * std)
        lower = sma - (2 * std)
        
        # Band Width relative to price
        df['bb_width'] = (upper - lower) / sma
        return df
