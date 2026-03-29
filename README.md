# Sama3tou Max — Intelligent Trading Assistant for BVMT

An AI-powered decision-support system built for the Tunisian financial market (BVMT).
Combines multivariate LSTM forecasting, multilingual NLP sentiment analysis, unsupervised anomaly detection, and an LLM-driven explainability layer into a unified real-time platform.

---

## Hackathon Context

| Field | Details |
|---|---|
| Event | Fintech Hackathon — IHEC Carthage Track |
| Market | Bourse des Valeurs Mobilières de Tunis (BVMT) |
| Category | Intelligent Trading & Decision Support Systems |
| Regulatory Alignment | CMF (Conseil du Marché Financier) — decision-support only, no automated execution |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
│                                                              │
│   OHLCV (Open/High/Low/Close/Volume)                         │
│   Transaction counts · Order book snapshots                  │
│   Tunisian financial news (Arabic + French)                  │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    FEATURE ENGINEERING                        │
│                                                              │
│   Technical indicators (RSI, MACD, Bollinger Bands, ATR)     │
│   Liquidity metrics (bid-ask spread proxy, turnover ratio)   │
│   Lag features · Rolling statistics · Volatility estimates   │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
┌──────────────▼──────────┐  ┌────────────▼───────────────────┐
│  PRICE & LIQUIDITY      │  │  SENTIMENT ANALYSIS ENGINE     │
│  FORECASTING MODULE     │  │                                │
│                         │  │  Multilingual NLP pipeline     │
│  Multivariate LSTM      │  │  Arabic + French classification│
│  (PyTorch)              │  │  Positive / Neutral / Negative │
│                         │  │  Per-stock sentiment score     │
│  Horizons: 1, 3, 5 days │  │  Correlation with OHLCV        │
│  Outputs:               │  └────────────┬───────────────────┘
│  · Expected return      │               │
│  · Liquidity forecast   │               │
│  · Volatility estimate  │               │
│  · Confidence intervals │               │
└──────────────┬──────────┘               │
               │                          │
               └─────────────┬────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                   ANOMALY DETECTION ENGINE                    │
│                                                              │
│   Isolation Forest + statistical thresholding                │
│   Detects: volume spikes · abnormal price movements          │
│            suspicious pattern sequences                      │
│   Output: anomaly flag + severity score per asset            │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                      DECISION ENGINE                          │
│                                                              │
│   Signal aggregation: forecast + sentiment + anomaly flag    │
│   Output: BUY / SELL / HOLD                                  │
│           Confidence score in [0, 1]                         │
│           Structured explanation payload                     │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
┌──────────────▼──────────┐  ┌────────────▼───────────────────┐
│  EXPLAINABLE CHATBOT    │  │  PORTFOLIO SIMULATOR           │
│                         │  │                                │
│  LLM API (cloud-based)  │  │  Risk profile: conservative /  │
│  Translates structured  │  │  moderate / aggressive         │
│  signals into natural   │  │  Metrics: ROI, Sharpe Ratio,   │
│  language explanations  │  │  Max Drawdown, Volatility      │
└─────────────────────────┘  └────────────────────────────────┘
```

**Design principle:** Every output — from signal to recommendation — must be traceable back to its source features. No black-box outputs exposed to the end user.

---

## Model Performance

All models were trained and evaluated on BVMT historical data.

---

### 1. Price & Liquidity Forecasting — Multivariate LSTM

**Architecture:** Stacked LSTM (PyTorch) with dropout regularization. Input window: 30 trading days. Multi-output heads for each forecast horizon.

| Metric | 1-Day Horizon | 3-Day Horizon | 5-Day Horizon |
|---|---|---|---|
| RMSE (normalized) | `0.45` | `1.14` | `2.32` |
| Directional Accuracy | `87%` | `62%` | `50%` |
| Liquidity Forecast Accuracy | `76.2%` | — | — |

> **Note on low-liquidity adaptation:** Standard LSTM architectures underperform on thin BVMT books due to irregular trading sessions and price staleness. Feature engineering incorporates turnover ratio and transaction count as liquidity proxies to compensate.

---

### 2. Anomaly Detection

**Method:** Isolation Forest with per-asset adaptive thresholding. Features: z-score of volume, price deviation from rolling mean, rate-of-change acceleration.

| Metric | Score |
|---|---|
| Precision | `XX%` |
| Recall | `XX%` |
| F1-Score | `0.XX` |
| False Positive Rate | `XX%` |

> Threshold tuning prioritizes recall over precision — early warnings are preferable to missed detections in a surveillance context.

---

### 3. Multilingual Sentiment Analysis (Arabic + French)

**Pipeline:** Pre-trained multilingual transformer fine-tuned on Tunisian financial news corpus. 3-class classification: Positive / Neutral / Negative. Per-stock aggregation via exponential time-decay weighting.

| Metric | Score |
|---|---|
| Classification Accuracy | `XX%` |
| Macro F1-Score | `0.XX` |
| Sentiment–Price Movement Correlation | `r = 0.XX` |

> Arabic financial text required custom preprocessing (diacritics removal, dialect normalization) before tokenization.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend API | FastAPI (Python 3.10+) | Async endpoints, Pydantic validation |
| ML Framework | PyTorch | LSTM training & inference |
| Classical ML | Scikit-learn | Isolation Forest, preprocessing pipelines |
| NLP | Multilingual transformer | HuggingFace-compatible, Arabic + French |
| LLM Layer | Cloud LLM API | Explanation generation from structured payloads |
| Database | PostgreSQL | Time-series market data + user sessions |
| Frontend | React + Vite | Dashboard, chatbot UI, portfolio simulator |
| Deployment | Cloud / Local | Uvicorn ASGI server |

---

## Project Structure

```
Sama3tou_el_MAX/
│
├── backend/
│   ├── main.py                   # FastAPI app entrypoint
│   ├── models/
│   │   ├── lstm_forecaster.py    # Multivariate LSTM definition & inference
│   │   ├── anomaly_detector.py   # Isolation Forest + thresholding
│   │   └── sentiment_model.py    # NLP pipeline (AR + FR)
│   ├── routes/
│   │   ├── forecast.py           # /api/forecast endpoints
│   │   ├── sentiment.py          # /api/sentiment endpoints
│   │   ├── anomaly.py            # /api/anomaly endpoints
│   │   ├── decision.py           # /api/recommend endpoint
│   │   └── chat.py               # /api/chat  (LLM explainability)
│   └── services/
│       ├── signal_aggregator.py  # Combines all model outputs
│       ├── feature_engineer.py   # Technical indicator computation
│       └── portfolio.py          # Simulation & risk metrics
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   └── PortfolioSimulator.jsx
│   │   └── pages/
│   └── package.json
│
├── venv/                         # Python virtual environment
├── requirements.txt
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

---

### Backend (FastAPI)

```powershell
# Run all commands from the project root

python -m venv venv
.\venv\Scripts\Activate

pip install -r requirements.txt

uvicorn backend.main:app --reload
```

| URL | Purpose |
|---|---|
| `http://127.0.0.1:8000` | API base |
| `http://127.0.0.1:8000/docs` | Swagger UI (interactive docs) |
| `http://127.0.0.1:8000/redoc` | ReDoc |

---

### Frontend (React + Vite)

Open a **new terminal** from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

---

## Troubleshooting

| Symptom | Root Cause | Fix |
|---|---|---|
| `uvicorn is not recognized` | venv not activated | Run `.\venv\Scripts\Activate` first |
| `ModuleNotFoundError` on startup | Wrong working directory | Run `uvicorn` from the **project root**, not inside `backend/` |
| Frontend can't reach API | Backend not running | Start backend before frontend; verify port 8000 is free |
| NLP model download hangs | First-run model fetch | Requires internet; models are cached after first download |
| LSTM inference slow | No GPU available | Expected on CPU; use a CUDA-enabled environment for faster inference |

---


## Roadmap

- [ ] WebSocket-based real-time data streaming
- [ ] Reinforcement learning agent for dynamic portfolio rebalancing
- [ ] CMF regulator monitoring dashboard
- [ ] Broker API integration (live execution layer)
- [ ] Extended backtesting with walk-forward validation
- [ ] Mobile application (React Native)

---

## License

Built for hackathon purposes. Market data belongs to its respective owners (BVMT). This system is for educational and decision-support use only — not financial advice.
