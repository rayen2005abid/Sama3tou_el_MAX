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
  Stock, StockHistorical, PriceForecast, SentimentData,
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

  // Recommendations
  getRecommendations: async (): Promise<Recommendation[]> => fetchJSON("/market/recommendations"),

  // Stock detail
  getStockHistory: async (_symbol: string): Promise<StockHistorical[]> => generateHistorical(90),
  getStockForecast: async (_symbol: string): Promise<PriceForecast[]> => generateForecast(),
  getStockSentiment: async (_symbol: string): Promise<SentimentData[]> => generateSentiment(30),

  // Anomalies
  getAnomalies: async (): Promise<Anomaly[]> => fetchJSON("/alerts/"),

  // Portfolio
  getPortfolio: async (): Promise<PortfolioSummary> => fetchJSON("/portfolio/"),
  executeTransaction: async (symbol: string, quantity: number, action: "BUY" | "SELL", price: number) => {
    return fetchJSON("/portfolio/transaction", {
      method: "POST",
      body: JSON.stringify({ symbol, quantity, action, price }),
    });
  },
};
