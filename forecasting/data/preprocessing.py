import pandas as pd
import numpy as np
from typing import Tuple, List

class Preprocessor:
    def __init__(self):
        self.scaler_params = {}

    def resample_daily(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Resamples data to ensure a continuous daily timeline (business days).
        - Price columns (Open, High, Low, Close): Forward Fill.
        - Volume columns (Volume, Transactions, Capital): Fill with 0.
        """
        if df.empty:
            return df

        df = df.set_index('Date').sort_index()
        
        # Create full date range (Business Days: Mon-Fri)
        full_idx = pd.date_range(start=df.index.min(), end=df.index.max(), freq='B')
        
        # Reindex
        df_reindexed = df.reindex(full_idx)
        
        # Fill Prices: Forward Fill (If no trade today, price is same as yesterday)
        price_cols = ['Open', 'High', 'Low', 'Close']
        df_reindexed[price_cols] = df_reindexed[price_cols].ffill()
        
        # Fill Volume-like: Fill 0 (No trade means 0 volume)
        vol_cols = ['Volume', 'Transactions', 'Capital']
        df_reindexed[vol_cols] = df_reindexed[vol_cols].fillna(0)
        
        # Fill Ticker column (forward fill is safe)
        if 'Ticker' in df.columns:
            df_reindexed['Ticker'] = df_reindexed['Ticker'].ffill()

        # Drop any remaining NaNs (e.g. at the very start before first trade)
        df_reindexed = df_reindexed.dropna()
        
        # Reset index
        df_reindexed.index.name = 'Date'
        return df_reindexed.reset_index()

    def normalize(self, train_df: pd.DataFrame, val_df: pd.DataFrame, cols: List[str]) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Normalizes specified columns using Z-score (StandardScaler).
        Fits ONLY on train_df to avoid leakage. applies to both.
        """
        train_out = train_df.copy()
        val_out = val_df.copy()
        
        for col in cols:
            mean = train_df[col].mean()
            std = train_df[col].std()
            
            # Handle constant columns (std=0)
            if std == 0:
                std = 1.0
            
            self.scaler_params[col] = {'mean': mean, 'std': std}
            
            train_out[col] = (train_df[col] - mean) / std
            val_out[col] = (val_df[col] - mean) / std
            
        return train_out, val_out

if __name__ == "__main__":
    # verification
    dates = pd.to_datetime(['2023-01-01', '2023-01-04']) # Gap of 2 days
    data = {'Open': [10, 12], 'Close': [11, 13], 'Volume': [100, 200], 'Ticker': ['TEST', 'TEST']}
    df = pd.DataFrame(data, index=dates)
    df.index.name = 'Date'
    df = df.reset_index()
    
    p = Preprocessor()
    resampled = p.resample_daily(df)
    print("Resampled Data:")
    print(resampled)
    # Expectation: 2023-01-02 and 03 should exist. 02/03 prices=11(ffill), vol=0.
