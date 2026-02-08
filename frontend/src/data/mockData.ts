import type {
  Stock, StockHistorical, PriceForecast, SentimentData,
  Anomaly, PortfolioSummary, Recommendation, MarketIndex,
} from "@/types/trading";

// Mock BVMT stocks
export const MOCK_STOCKS: Stock[] = [
  { symbol: "TT", name: "Tunisie Telecom", sector: "Telecom", lastPrice: 8.45, change: 0.21, changePercent: 2.55, volume: 154320, high: 8.52, low: 8.20, open: 8.24 },
  { symbol: "SFBT", name: "SFBT", sector: "Agroalimentaire", lastPrice: 21.30, change: -0.45, changePercent: -2.07, volume: 89200, high: 21.80, low: 21.10, open: 21.75 },
  { symbol: "BNA", name: "Banque Nationale Agricole", sector: "Banque", lastPrice: 12.60, change: 0.35, changePercent: 2.86, volume: 67800, high: 12.70, low: 12.20, open: 12.25 },
  { symbol: "BIAT", name: "BIAT", sector: "Banque", lastPrice: 108.50, change: 1.50, changePercent: 1.40, volume: 12450, high: 109.00, low: 106.50, open: 107.00 },
  { symbol: "PGH", name: "Poulina Group Holding", sector: "Holding", lastPrice: 14.80, change: -0.10, changePercent: -0.67, volume: 45600, high: 15.00, low: 14.70, open: 14.90 },
  { symbol: "DH", name: "Délice Holding", sector: "Agroalimentaire", lastPrice: 18.90, change: 0.60, changePercent: 3.28, volume: 78900, high: 19.10, low: 18.20, open: 18.30 },
  { symbol: "STAR", name: "STAR Assurances", sector: "Assurance", lastPrice: 142.00, change: -2.00, changePercent: -1.39, volume: 3200, high: 144.00, low: 141.50, open: 144.00 },
  { symbol: "ATB", name: "Arab Tunisian Bank", sector: "Banque", lastPrice: 4.85, change: 0.05, changePercent: 1.04, volume: 98700, high: 4.90, low: 4.78, open: 4.80 },
  { symbol: "SAH", name: "SAH Lilas", sector: "Industrie", lastPrice: 6.20, change: 0.15, changePercent: 2.48, volume: 112000, high: 6.30, low: 6.00, open: 6.05 },
  { symbol: "OTH", name: "One Tech Holding", sector: "Technologie", lastPrice: 9.75, change: -0.30, changePercent: -2.98, volume: 34500, high: 10.10, low: 9.70, open: 10.05 },
];

export const MOCK_INDICES: MarketIndex[] = [
  { name: "TUNINDEX", value: 9847.32, change: 23.45, changePercent: 0.24 },
  { name: "TUNINDEX20", value: 4312.18, change: -8.72, changePercent: -0.20 },
];

export function generateHistorical(days: number = 90): StockHistorical[] {
  const data: StockHistorical[] = [];
  let price = 8.0 + Math.random() * 2;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * 0.3;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 0.15;
    const low = Math.min(open, close) - Math.random() * 0.15;
    const volume = Math.floor(50000 + Math.random() * 150000);
    data.push({ date: date.toISOString().split("T")[0], open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume });
    price = close;
  }
  return data;
}

export function generateForecast(): PriceForecast[] {
  const data: PriceForecast[] = [];
  let price = 8.45;
  const now = new Date();
  for (let i = 1; i <= 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const change = (Math.random() - 0.45) * 0.25;
    price += change;
    data.push({
      date: date.toISOString().split("T")[0],
      predicted: +price.toFixed(2),
      lower: +(price - 0.15 - Math.random() * 0.1).toFixed(2),
      upper: +(price + 0.15 + Math.random() * 0.1).toFixed(2),
    });
  }
  return data;
}

export function generateSentiment(days: number = 30): SentimentData[] {
  const data: SentimentData[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const score = +(Math.random() * 2 - 1).toFixed(2);
    data.push({
      date: date.toISOString().split("T")[0],
      score,
      label: score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral",
      articleCount: Math.floor(1 + Math.random() * 8),
    });
  }
  return data;
}

export const MOCK_ANOMALIES: Anomaly[] = [
  { id: "a1", timestamp: "2026-02-07T10:23:00", stock: "SFBT", type: "volume_spike", severity: "high", description: "Volume spike +800% detected on SFBT", details: "Trading volume surged to 712,000 shares at 10:23, 8x above 30-day average. Coincided with unverified partnership rumor.", resolved: false },
  { id: "a2", timestamp: "2026-02-07T09:45:00", stock: "DH", type: "price_jump", severity: "critical", description: "Délice Holding +12% without significant news", details: "Price jumped from 16.87 to 18.90 TND within 45 minutes. No official news or press release found. Volume 10x above average.", resolved: false },
  { id: "a3", timestamp: "2026-02-06T14:12:00", stock: "OTH", type: "suspicious_pattern", severity: "medium", description: "Unusual order pattern on One Tech Holding", details: "Repeated small buy orders (50-100 shares) every 30 seconds for 15 minutes, followed by a large sell order.", resolved: true },
  { id: "a4", timestamp: "2026-02-06T11:30:00", stock: "BNA", type: "volume_spike", severity: "low", description: "Moderate volume increase on BNA", details: "Volume 3.2x above average during morning session. Likely institutional rebalancing.", resolved: true },
  { id: "a5", timestamp: "2026-02-05T15:45:00", stock: "STAR", type: "price_jump", severity: "medium", description: "STAR price drop -5.2% in last hour", details: "Sharp decline in final trading hour without clear catalyst. Possible profit-taking after recent rally.", resolved: false },
];

export const MOCK_PORTFOLIO: PortfolioSummary = {
  totalValue: 12847.50,
  totalCost: 10000,
  totalPnl: 2847.50,
  totalPnlPercent: 28.48,
  roi: 28.48,
  sharpeRatio: 1.42,
  maxDrawdown: -8.3,
  positions: [
    { stock: "Tunisie Telecom", symbol: "TT", quantity: 200, avgPrice: 7.80, currentPrice: 8.45, pnl: 130, pnlPercent: 8.33, allocation: 13.2 },
    { stock: "BIAT", symbol: "BIAT", quantity: 30, avgPrice: 95.00, currentPrice: 108.50, pnl: 405, pnlPercent: 14.21, allocation: 25.3 },
    { stock: "Délice Holding", symbol: "DH", quantity: 150, avgPrice: 16.50, currentPrice: 18.90, pnl: 360, pnlPercent: 14.55, allocation: 22.1 },
    { stock: "SAH Lilas", symbol: "SAH", quantity: 300, avgPrice: 5.40, currentPrice: 6.20, pnl: 240, pnlPercent: 14.81, allocation: 14.5 },
    { stock: "PGH", symbol: "PGH", quantity: 100, avgPrice: 13.20, currentPrice: 14.80, pnl: 160, pnlPercent: 12.12, allocation: 11.5 },
    { stock: "BNA", symbol: "BNA", quantity: 80, avgPrice: 11.50, currentPrice: 12.60, pnl: 88, pnlPercent: 9.57, allocation: 7.8 },
    { stock: "ATB", symbol: "ATB", quantity: 150, avgPrice: 4.60, currentPrice: 4.85, pnl: 37.5, pnlPercent: 5.43, allocation: 5.6 },
  ],
};

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { stock: "Tunisie Telecom", symbol: "TT", action: "BUY", confidence: 0.82, reason: "Positive news sentiment + upward price trend forecast + no anomalies detected. Recent contract announcement supports bullish outlook.", signals: ["Sentiment: +0.72", "5-day forecast: +2.5%", "RSI: 45 (neutral)", "Volume: stable"] },
  { stock: "SFBT", symbol: "SFBT", action: "HOLD", confidence: 0.65, reason: "Unusual volume activity detected. Wait for confirmation before acting. High volatility expected in next 48h.", signals: ["Anomaly: volume spike", "Sentiment: +0.85", "Forecast: uncertain", "Caution advised"] },
  { stock: "BIAT", symbol: "BIAT", action: "BUY", confidence: 0.74, reason: "Strong banking sector performance. BIAT shows consistent upward trend with solid fundamentals.", signals: ["Sentiment: +0.45", "5-day forecast: +1.4%", "RSI: 52", "Sector: bullish"] },
  { stock: "Délice Holding", symbol: "DH", action: "SELL", confidence: 0.71, reason: "⚠️ Critical anomaly detected: +12% price jump without news. High manipulation risk. Recommend taking profits.", signals: ["Anomaly: critical", "No supporting news", "Volume: 10x avg", "Risk: HIGH"] },
  { stock: "One Tech Holding", symbol: "OTH", action: "HOLD", confidence: 0.58, reason: "Mixed signals. Suspicious order pattern recently detected but resolved. Wait for clearer direction.", signals: ["Sentiment: -0.15", "Forecast: flat", "Anomaly: resolved", "RSI: 38"] },
];
