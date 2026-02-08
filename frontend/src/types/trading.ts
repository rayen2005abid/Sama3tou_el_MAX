// Types for the BVMT Trading Assistant

export interface Stock {
  symbol: string;
  name: string;
  nameAr?: string;
  sector: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  marketCap?: number;
}

export interface StockHistorical {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceForecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface ForecastResponse {
  ticker: string;
  current_price: number;
  prediction_t1: number;
  log_return_t1: number;
  log_return_t5: number;
}

export interface SentimentData {
  date: string;
  score: number; // -1 to 1
  label: "positive" | "negative" | "neutral";
  articleCount: number;
}

export interface SentimentSignal {
  id: number;
  stock_symbol: string;
  sentiment_score: number;
  sentiment_label: string;
  confidence: number;
  article_count: number;
  date: string;
}

export interface NewsArticle {
  id: number;
  stock_symbol: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  sentiment_score: number;
  language: string;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  stock: string;
  type: "volume_spike" | "price_jump" | "suspicious_pattern";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  details: string;
  resolved: boolean;
}

export interface PortfolioPosition {
  stock: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  positions: PortfolioPosition[];
}

export interface Recommendation {
  stock: string;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reason: string;
  signals: string[];
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export type RiskProfile = "conservative" | "moderate" | "aggressive";
