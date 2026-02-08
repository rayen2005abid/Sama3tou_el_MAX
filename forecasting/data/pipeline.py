import pandas as pd
from forecasting.data.loader import BVMTLoader
from forecasting.data.preprocessing import Preprocessor
from forecasting.features.technicals import TechnicalFeatures
from forecasting.features.liquidity import LiquidityFeatures
import os

class DataPipeline:
    def __init__(self, data_dir: str):
        self.loader = BVMTLoader(data_dir)
        self.preprocessor = Preprocessor()
        self.technicals = TechnicalFeatures()
        self.liquidity = LiquidityFeatures()

    def run(self, ticker: str) -> pd.DataFrame:
        """
        Runs the full pipeline for a specific ticker:
        1. Load Raw Data
        2. Resample to Business Days (Handle Missing Days)
        3. Add Technical Features
        4. Add Liquidity Features
        5. Drop NaNs created by rolling windows
        """
        print(f"Pipeline started for {ticker}...")
        
        # 1. Load
        raw_df = self.loader.get_ticker_data(ticker)
        if raw_df.empty:
            raise ValueError(f"No data found for ticker {ticker}")
        print(f"Loaded {len(raw_df)} raw rows.")

        # 2. Resample
        df = self.preprocessor.resample_daily(raw_df)
        print(f"Resampled to {len(df)} rows (Business Days).")

        # 3. Features
        df = self.technicals.add_all_features(df)
        df = self.liquidity.add_all_features(df)
        
        # 4. Cleanup
        # Drop rows with NaN features (due to rolling windows, e.g., first 20 days)
        # However, for LSTM sequences, we might deal with it later. 
        # But training data usually shouldn't have NaNs.
        df_clean = df.dropna()
        print(f"Final clean data: {len(df_clean)} rows.")
        
        return df_clean

if __name__ == "__main__":
    # Test
    DATA_DIR = r"c:\Users\user\Downloads\sama3tou max\datasets"
    pipeline = DataPipeline(DATA_DIR)
    
    try:
        # SFBT is a major stock, good for testing
        df = pipeline.run("SFBT")
        print(df.tail())
        print(df.describe())
        
        # Check specific columns
        print("\nCorrelation Matrix:")
        print(df[['log_ret_1d', 'rsi', 'amihud_20d', 'volatility_20d']].corr())
    except Exception as e:
        print(f"Pipeline Error: {e}")
