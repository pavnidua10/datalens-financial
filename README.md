# DataLens Financial
[!Live Demo]:https://datalens-frontend-v555.onrender.com

> AI-free, rule-based ML dataset quality analyzer for financial time-series data.


## What it does

Most data quality tools tell you *what* is wrong. DataLens tells you *why it will break your model* and *exactly what to do*.

Upload any financial CSV. Get a full ML readiness report in seconds — zero AI API calls, zero latency, zero cost per request.

---

## Problems this catches that pandas-profiling misses

| Problem | pandas-profiling | DataLens |
|---|---|---|
| Look-ahead bias in features | ✗ | ✓ |
| Unsorted time-series rows | ✗ | ✓ |
| Random split on time-series data | ✗ | ✓ |
| OHLC-specific stationarity fix | ✗ | ✓ |
| Regime shifts across train/test boundary | ✗ | ✓ |
| Model-specific row sufficiency (LSTM vs ARIMA) | ✗ | ✓ |
| VIF multicollinearity scores | ✗ | ✓ |
| Rolling volatility instability zones | ✗ | ✓ |

---

## Architecture

```
┌─────────────────┐     CSV upload      ┌──────────────────┐     forward      ┌──────────────────────┐
│   React + Vite  │ ─────────────────▶  │  Node.js/Express │ ───────────────▶ │   FastAPI (Python)   │
│   (Dashboard)   │                     │  (API Gateway)   │                  │   (ML Engine)        │
│                 │ ◀─────────────────  │  :3001           │ ◀──────────────  │   :8000              │
└─────────────────┘     JSON report     └──────────────────┘   analysis JSON  └──────────────────────┘
                                                                               │
                                                              ┌────────────────┼───────────────────┐
                                                              │                │                   │
                                                        analyzer.py    explanation_engine.py    models
                                                              │
                                                 ┌────────────┼─────────────┐
                                                 │            │             │
                                           statsmodels   sklearn       pandas
                                           (ADF test)  (IsoForest)  (preprocessing)
```

---

## Features

### 1. Look-Ahead Bias Detection
Detects future-leaking column names, unsorted timestamps, and high-correlation patterns that indicate data leakage. The most common cause of models that work in backtesting but fail in production.

### 2. Stationarity Analysis (ADF Test)
Augmented Dickey-Fuller test on every numeric column. Fix recommendations are column-aware:
- Price columns → log-differencing (`np.log(df[col]).diff()`)
- Volume columns → percent change (`.pct_change()`)
- Other columns → first differencing or detrending

### 3. Regime Change Detection
Rolling window mean and volatility shift analysis. Flags structural breaks like COVID-era volatility spikes. Recommends separate models per regime or rolling-window training.

### 4. Anomaly Detection (Isolation Forest)
Sklearn Isolation Forest with tiered severity. Distinguishes between data errors and genuine market events. Recommends winsorization over blind row removal.

### 5. Multicollinearity Check
Pairwise correlation flagging (>0.85 threshold) plus VIF scores per column. OHLC-aware fixes — flags redundant price columns specifically.

### 6. Rolling Statistics Chart
30-period rolling mean and standard deviation visualization. Highlights volatility clustering zones and instability periods.

### 7. Train/Test Split Validator
Simulates TimeSeriesSplit with 5 folds. Warns on:
- Random splits on time-series data
- Regime shifts that cross the train/test boundary
- Insufficient rows per fold

Generates exact index-based split code for your dataset.

### 8. Data Sufficiency Check
Model-specific row threshold checks:
- LSTM: 1000+ rows recommended
- ARIMA: 252+ rows (1 trading year)
- XGBoost: 200+ rows
- Linear: 50+ rows

Row-to-feature ratio check with VIF-aware recommendations.

### 9. ML Readiness Score
Composite 0–100 score. Fully deterministic — same dataset always produces the same score. Weighted penalty system across all eight dimensions.

### 10. Rule-Based Explanation Engine
Every finding has four fields: finding, fix, impact, severity. No LLM calls — all logic is auditable Python. Column names appear in fix recommendations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Recharts |
| Styling | Custom CSS (dark theme, Space Mono + Syne) |
| API Gateway | Node.js + Express |
| ML Engine | Python + FastAPI |
| Statistics | statsmodels (ADF), scipy |
| ML | scikit-learn (Isolation Forest, VIF, TimeSeriesSplit) |
| Data | pandas, numpy |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### 1. Clone

```bash
git clone https://github.com/yourusername/datalens-financial
cd datalens-financial
```

### 2. ML Service

```bash
cd ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install fastapi uvicorn pandas numpy scikit-learn statsmodels python-multipart
uvicorn main:app --reload --port 8000
```

### 3. Backend

```bash
cd backend
npm install
node index.js                   # runs on port 3001
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev                     # runs on port 5173
```

Open `http://localhost:5173`

---

## Demo Dataset

Download any of these from Kaggle to test:

- [AAPL Stock History](https://www.kaggle.com/datasets/tarunpaparaju/apple-aapl-historical-stock-data) — triggers stationarity + regime detection
- [S&P 500 Companies](https://www.kaggle.com/datasets/camnugent/sandp500) — triggers multicollinearity + look-ahead checks
- [Nifty 50 Stock Market Data](https://www.kaggle.com/datasets/rohanrao/nifty50-stock-market-data) — triggers all checks

---

## API

### `POST /api/analyze`

Upload a CSV file for analysis.

**Request**
```
Content-Type: multipart/form-data
Body: file=<csv_file>
```

**Response**
```json
{
  "basic_info": { "rows": 2518, "columns": [...], "missing_pct": {} },
  "lookahead_bias": { "detected": true, "issues": [...] },
  "stationarity": { "close": { "p_value": 0.89, "is_stationary": false } },
  "regime_change": { "detected": true, "regime_shifts": [...] },
  "anomalies": { "anomaly_count": 121, "anomaly_pct": 4.8 },
  "multicollinearity": { "high_corr_pairs": [...], "vif_scores": [...] },
  "rolling_stats": { "chart_data": [...], "stability": "moderate" },
  "split_validation": { "folds": [...], "recommended_split": {} },
  "data_sufficiency": { "model_readiness": [...], "overall": "..." },
  "ml_readiness_score": { "score": 65, "verdict": "Fair", "penalties": [...] },
  "explanations": { "findings": [...], "summary": "..." }
}
```

---

## Project Structure

```
datalens-financial/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/
│   │   │   ├── ScoreGauge.jsx
│   │   │   ├── FindingCard.jsx
│   │   │   ├── StationarityTable.jsx
│   │   │   ├── AnomalyPanel.jsx
│   │   │   ├── RegimePanel.jsx
│   │   │   ├── MulticollinearityPanel.jsx
│   │   │   ├── RollingStatsChart.jsx
│   │   │   ├── SplitValidatorPanel.jsx
│   │   │   └── DataSufficiencyPanel.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
├── backend/
│   ├── index.js
│   └── package.json
├── ml-service/
│   ├── main.py
│   ├── analyzer.py
│   └── explanation_engine.py
└── README.md
```

