// API service layer — connected to FastAPI

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers as any,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      // optional: window.location.href = "/login";
    }
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

import type {
  Stock, StockHistorical, PriceForecast, SentimentData, ForecastResponse,
  SentimentSignal, NewsArticle,
  Anomaly, PortfolioSummary, Recommendation, MarketIndex,
} from "@/types/trading";

// Mock generators for historical/forecast since backend mocks these too for now
// but ideally we fetch them. For MVP, we can mock locally or fetch if backend provides.
// Backend `stock/{symbol}` provides forecast. `history` might need separate endpoint.
import { generateHistorical, generateForecast, generateSentiment } from "@/data/mockData";

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
  },
  register: async (username: string, password: string, email?: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
  },
  getMe: async (): Promise<any> => fetchJSON("/auth/me"),
  updateProfile: async (data: any): Promise<any> => {
    return fetchJSON("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  submitQuiz: async (trading_experience: string, risk_score: number) => {
    return fetchJSON("/auth/quiz", {
      method: "POST",
      body: JSON.stringify({ trading_experience, risk_score }),
    });
  },

  // Market
  getStocks: async (): Promise<Stock[]> => fetchJSON("/stocks/"),
  getIndices: async (): Promise<MarketIndex[]> => fetchJSON("/market/indices"),



  // Stock detail
  getStockHistory: async (_symbol: string): Promise<StockHistorical[]> => generateHistorical(90),

  getStockForecast: async (symbol: string): Promise<PriceForecast[]> => {
    try {
      const res: ForecastResponse = await fetchJSON(`/forecast/predict/${symbol}`);

      const currentPrice = res.current_price;
      const t1Price = res.prediction_t1;
      const t5Price = currentPrice * Math.exp(res.log_return_t5); // Calculate T+5 price

      const days: PriceForecast[] = [];
      const today = new Date();

      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        let price: number;
        if (i === 1) price = t1Price;
        else if (i === 5) price = t5Price;
        else {
          // Linear interpolation for intermediate days
          price = t1Price + (i - 1) * (t5Price - t1Price) / 4;
        }

        // Heuristic Confidence Interval: widens over time
        const volatility = 0.015 + (i * 0.005);

        days.push({
          date: date.toISOString().split('T')[0],
          predicted: price,
          lower: price * (1 - volatility),
          upper: price * (1 + volatility),
        });
      }
      return days;
    } catch (e) {
      console.error("Forecast fetch failed, falling back to mock", e);
      return generateForecast();
    }
  },

  getStockSentiment: async (_symbol: string): Promise<SentimentData[]> => generateSentiment(30),

  // Real Sentiment API
  getLatestSentiment: async (symbol: string): Promise<SentimentSignal> => fetchJSON(`/sentiment/${symbol}`),
  getSentimentArticles: async (symbol: string): Promise<NewsArticle[]> => fetchJSON(`/sentiment/${symbol}/articles`),

  // Anomalies
  getAnomalies: async (): Promise<Anomaly[]> => {
    try {
      // Fetch latest anomalies
      const res = await fetchJSON<any[]>("/anomaly/latest?limit=10");
      return res.map(a => ({
        id: a.id.toString(),
        timestamp: a.detected_at,
        stock: a.stock_symbol, // backend uses stock_symbol
        type: a.anomaly_type === "VOLUME_SPIKE" ? "volume_spike" : "price_jump", // simple mapping
        severity: a.confidence > 0.8 ? "critical" : "high", // heuristic
        description: a.description,
        details: `Value: ${a.metric_value}`,
        resolved: false
      }));
    } catch (e) {
      console.error("Failed to fetch anomalies", e);
      return [];
    }
  },

  getAnomalyValidationMetrics: async (symbol: string): Promise<any> => {
    return fetchJSON(`/anomaly/validate/${symbol}`);
  },

  // Portfolio & Decision
  getPortfolio: async (): Promise<PortfolioSummary> => fetchJSON("/portfolio/"),

  executeTransaction: async (symbol: string, quantity: number, action: "BUY" | "SELL", price: number) => {
    return fetchJSON("/portfolio/transaction", {
      method: "POST",
      body: JSON.stringify({ symbol, quantity, action, price }),
    });
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    try {
      const res = await fetchJSON<any[]>("/decision/recommendations");
      return res.map(r => ({
        stock: r.symbol,
        symbol: r.symbol,
        action: r.action,
        confidence: r.confidence,
        reason: r.reason,
        signals: Object.entries(r.metrics || {}).map(([k, v]) => `${k}: ${v}`)
      }));
    } catch (e) {
      console.error("Failed to fetch recommendations", e);
      return [];
    }
  },

  getDecisionRecommendation: async (symbol: string): Promise<Recommendation> => {
    const r = await fetchJSON<any>(`/decision/recommendation/${symbol}`);
    return {
      stock: r.symbol,
      symbol: r.symbol,
      action: r.action,
      confidence: r.confidence,
      reason: r.reason,
      signals: Object.entries(r.metrics || {}).map(([k, v]) => `${k}: ${v}`)
    };
  },

  chat: async (query: string): Promise<{ answer: string; type: string; related_data?: any }> => {
    return fetchJSON("/chat/query", {
      method: "POST",
      body: JSON.stringify({ query })
    });
  },
};
