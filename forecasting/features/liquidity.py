import pandas as pd
import numpy as np

class LiquidityFeatures:
    def __init__(self):
        pass

    def add_all_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Adds liquidity-related features."""
        df = df.copy()
        df = self.add_log_volume(df)
        df = self.add_amihud(df)
        df = self.add_turnover(df)
        df = self.add_zero_trade_streak(df)
        return df

    def add_log_volume(self, df: pd.DataFrame) -> pd.DataFrame:
        """Log transformed volume to handle skewness."""
        # Add 1 to avoid log(0)
        df['log_volume'] = np.log1p(df['Volume'])
        df['log_capital'] = np.log1p(df['Capital'])
        return df

    def add_amihud(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """
        Amihud Illiquidity Ratio = |Return| / (Price * Volume)
        Using Capital (Price * Vol) directly.
        """
        # Avoid division by zero
        capital = df['Capital'].replace(0, np.nan) 
        
        # Daily Illiquidity
        df['illiquid_daily'] = np.abs(df['log_ret_1d']) / capital
        
        # Rolling Mean Illiquidity (Smoothed)
        df['amihud_20d'] = df['illiquid_daily'].rolling(window=window).mean()
        
        # Fill NaNs created by 0 capital with 0 (or max illiquidity? No, 0 trade = infinite illiquidity technically, but for ML we use a proxy)
        # Actually, if Volume is 0, Amihud is undefined.
        # Let's fill with the max observed illiquidity to penalize 0 volume days.
        max_illiq = df['illiquid_daily'].max()
        df['illiquid_daily'] = df['illiquid_daily'].fillna(max_illiq)
        df['amihud_20d'] = df['amihud_20d'].fillna(max_illiq)
        
        return df

    def add_turnover(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Turnover Ratio = Volume / Outstanding Shares.
        Since we don't have Outstanding Shares in the daily feed, we can use 
        Capital / MarketCap if available, or just Capital as a proxy for value traded.
        
        We'll use Capital / Close (Approx Volume) which is redundancy.
        Instead, let's use Capital directly as 'Value Traded'.
        """
        # If we had 'Outstanding Shares', we'd use that.
        # For now, we rely on Log Capital.
        return df # Placeholder if we get fundamental data

    def add_zero_trade_streak(self, df: pd.DataFrame) -> pd.DataFrame:
        """Counts consecutive days with 0 volume."""
        # Create a boolean series where True = 0 Volume
        is_zero = (df['Volume'] == 0)
        
        # Group by consecutive values
        # We want to count the cumsum of 0s, resetting when it's not 0.
        # Trick: Group by (is_zero != is_zero.shift()).cumsum()
        streak = df.groupby((is_zero != is_zero.shift()).cumsum()).cumcount() + 1
        
        # Apply mask: Only keep counts where is_zero is True, else 0
        df['zero_streak'] = streak * is_zero
        return df
