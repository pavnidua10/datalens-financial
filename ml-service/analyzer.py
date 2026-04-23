import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller
from sklearn.ensemble import IsolationForest
from explanation_engine import generate_explanations 
from statsmodels.stats.outliers_influence import variance_inflation_factor
from sklearn.feature_selection import mutual_info_regression
from sklearn.model_selection import TimeSeriesSplit
import warnings
warnings.filterwarnings('ignore')

def analyze_dataset(df: pd.DataFrame) -> dict:
    results = {}

    results["basic_info"] = get_basic_info(df)
    results["lookahead_bias"] = detect_lookahead_bias(df)
    results["stationarity"] = test_stationarity(df)
    results["regime_change"] = detect_regime_change(df)
    results["anomalies"] = detect_anomalies(df)
    results["ml_readiness_score"] = compute_ml_readiness_score(results)
    results["explanations"] = generate_explanations(results)
    # In analyze_dataset(), add these four lines:
    results["multicollinearity"]   = check_multicollinearity(df)
    results["rolling_stats"]       = rolling_stats_analysis(df)
    results["split_validation"]    = validate_split_strategy(df)
    results["data_sufficiency"]    = check_data_sufficiency(df)
    return results


# ── 1. Basic Info ────────────────────────────────────────────────
def get_basic_info(df: pd.DataFrame) -> dict:
    return {
        "rows": len(df),
        "columns": list(df.columns),
        "missing_values": df.isnull().sum().to_dict(),
        "missing_pct": (df.isnull().mean() * 100).round(2).to_dict(),
        "dtypes": df.dtypes.astype(str).to_dict(),
    }


# ── 2. Look-Ahead Bias Detection ─────────────────────────────────
# Look-ahead bias = future data leaking into past rows
# Classic example: using tomorrow's closing price as a feature for today's prediction
def detect_lookahead_bias(df: pd.DataFrame) -> dict:
    issues = []

    # Check for date/time columns
    date_cols = [col for col in df.columns if any(
        kw in col.lower() for kw in ["date", "time", "timestamp"]
    )]

    if not date_cols:
        return {"detected": False, "reason": "No date column found to check"}

    date_col = date_cols[0]

    try:
        df[date_col] = pd.to_datetime(df[date_col])
        df_sorted = df.sort_values(date_col)

        # Check if dataset is already sorted chronologically
        is_sorted = df[date_col].is_monotonic_increasing
        if not is_sorted:
            issues.append("Data is not sorted chronologically — future rows may appear before past rows")

        # Check for 'future' columns (e.g., next_day_return, future_price)
        future_keywords = ["future", "next", "forward", "lead", "tomorrow"]
        future_cols = [col for col in df.columns if any(kw in col.lower() for kw in future_keywords)]
        if future_cols:
            issues.append(f"Columns with future-leaking names detected: {future_cols}")

        # Check for shifted correlations (a strong signal of leakage)
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) >= 2:
            target_candidates = [c for c in numeric_cols if any(
                kw in c.lower() for kw in ["close", "price", "return", "target", "label"]
            )]
            if target_candidates:
                target = target_candidates[0]
                for col in numeric_cols:
                    if col == target:
                        continue
                    shifted_corr = df[col].shift(1).corr(df[target])
                    direct_corr = df[col].corr(df[target])
                    # If correlation DROPS when shifted, the original might have future info
                    if abs(direct_corr) > 0.95 and abs(direct_corr) > abs(shifted_corr) + 0.1:
                        issues.append(
                            f"Column '{col}' has suspiciously high correlation ({direct_corr:.2f}) "
                            f"with target '{target}' — possible look-ahead bias"
                        )

    except Exception as e:
        return {"detected": False, "reason": f"Could not parse date column: {str(e)}"}

    return {
        "detected": len(issues) > 0,
        "issues": issues,
        "date_column_used": date_col,
    }


# ── 3. Stationarity Test ─────────────────────────────────────────
# A time series is stationary if its stats (mean, variance) don't change over time
# Non-stationary data is much harder to model — ARIMA and LSTMs assume stationarity
def test_stationarity(df: pd.DataFrame) -> dict:
    results = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 20:
            continue
        try:
            adf_stat, p_value, _, _, critical_values, _ = adfuller(series)
            results[col] = {
                "adf_statistic": round(adf_stat, 4),
                "p_value": round(p_value, 4),
                # p < 0.05 means stationary (we can reject the null of a unit root)
                "is_stationary": bool(p_value < 0.05),
                "verdict": "Stationary ✓" if p_value < 0.05 else "Non-stationary ✗ — consider differencing",
            }
        except Exception:
            continue

    return results


# ── 4. Regime Change Detection ───────────────────────────────────
# A regime change = a point where the statistical properties of the data shift
# Example: pre-COVID vs post-COVID stock behavior
def detect_regime_change(df: pd.DataFrame) -> dict:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        return {"detected": False}

    target_col = numeric_cols[0]  # Use first numeric column
    series = df[target_col].dropna().values

    if len(series) < 30:
        return {"detected": False, "reason": "Not enough data points"}

    # Split into rolling windows and compare means — simple but effective
    window = len(series) // 4
    changes = []

    for i in range(window, len(series) - window, window // 2):
        before = series[i - window:i]
        after = series[i:i + window]
        mean_shift = abs(np.mean(after) - np.mean(before))
        std_shift = abs(np.std(after) - np.std(before))

        # If mean or volatility shifts dramatically, flag it
        if mean_shift > 2 * np.std(series) or std_shift > np.std(series):
            changes.append({
                "at_index": int(i),
                "mean_before": round(float(np.mean(before)), 4),
                "mean_after": round(float(np.mean(after)), 4),
                "volatility_before": round(float(np.std(before)), 4),
                "volatility_after": round(float(np.std(after)), 4),
            })

    return {
        "detected": len(changes) > 0,
        "column_analyzed": target_col,
        "regime_shifts": changes,
        "recommendation": (
            "Consider training separate models for each regime"
            if changes else "No significant regime shifts detected"
        ),
    }


# ── 5. Anomaly Detection ─────────────────────────────────────────
# Isolation Forest isolates anomalies by randomly partitioning data
# Anomalies are isolated faster (fewer partitions needed) than normal points
def detect_anomalies(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number]).dropna()
    if numeric_df.empty or len(numeric_df) < 10:
        return {"anomaly_indices": [], "anomaly_count": 0}

    model = IsolationForest(contamination=0.05, random_state=42)
    preds = model.fit_predict(numeric_df)

    anomaly_indices = numeric_df.index[preds == -1].tolist()
    return {
        "anomaly_count": len(anomaly_indices),
        "anomaly_indices": anomaly_indices[:20],  # Cap at 20 for response size
        "total_rows": len(df),
        "anomaly_pct": round(len(anomaly_indices) / len(df) * 100, 2),
    }


# ── 6. ML Readiness Score ────────────────────────────────────────
# Composite score out of 100 based on all checks
def compute_ml_readiness_score(results: dict) -> dict:
    score = 100
    penalties = []

    # Penalize for look-ahead bias
    if results["lookahead_bias"].get("detected"):
        score -= 30
        penalties.append("Look-ahead bias detected (-30)")

    # Penalize for non-stationary columns
    stationarity = results["stationarity"]
    non_stationary = [col for col, info in stationarity.items() if not info["is_stationary"]]
    if non_stationary:
        penalty = min(20, len(non_stationary) * 5)
        score -= penalty
        penalties.append(f"{len(non_stationary)} non-stationary columns (-{penalty})")

    # Penalize for regime changes
    if results["regime_change"].get("detected"):
        score -= 15
        penalties.append("Regime shifts detected (-15)")

    # Penalize for high anomaly rate
    anomaly_pct = results["anomalies"].get("anomaly_pct", 0)
    if anomaly_pct > 10:
        score -= 15
        penalties.append(f"High anomaly rate {anomaly_pct}% (-15)")
    elif anomaly_pct > 5:
        score -= 7
        penalties.append(f"Moderate anomaly rate {anomaly_pct}% (-7)")

    # Penalize for missing values
    missing = results["basic_info"]["missing_pct"]
    high_missing = {k: v for k, v in missing.items() if v > 20}
    if high_missing:
        penalty = min(20, len(high_missing) * 5)
        score -= penalty
        penalties.append(f"{len(high_missing)} columns with >20% missing values (-{penalty})")

    score = max(0, score)

    verdict = (
        "Excellent — Ready for ML" if score >= 85 else
        "Good — Minor fixes needed" if score >= 70 else
        "Fair — Significant issues to address" if score >= 50 else
        "Poor — Major issues detected"
    )

    return {"score": score, "verdict": verdict, "penalties": penalties}


def check_multicollinearity(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number]).dropna()

    if numeric_df.shape[1] < 2:
        return {"status": "skipped", "reason": "Need at least 2 numeric columns"}

    # ── Correlation pairs ────────────────────────────────────────
    corr_matrix = numeric_df.corr().abs()
    high_corr_pairs = []

    cols = corr_matrix.columns
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            val = corr_matrix.iloc[i, j]
            if val > 0.85:
                severity = "critical" if val > 0.95 else "warning"
                high_corr_pairs.append({
                    "col_a": cols[i],
                    "col_b": cols[j],
                    "correlation": round(float(val), 4),
                    "severity": severity,
                    "fix": _corr_fix(cols[i], cols[j], val)
                })

    # ── VIF scores ───────────────────────────────────────────────
    # VIF > 10 = severe multicollinearity
    # VIF 5-10 = moderate
    # VIF < 5  = acceptable
    vif_scores = []
    try:
        # VIF needs enough rows
        if len(numeric_df) > numeric_df.shape[1] + 5:
            for i, col in enumerate(numeric_df.columns):
                vif = variance_inflation_factor(numeric_df.values, i)
                vif_scores.append({
                    "column": col,
                    "vif": round(float(vif), 2),
                    "severity": (
                        "critical" if vif > 10
                        else "warning" if vif > 5
                        else "ok"
                    ),
                    "verdict": (
                        "Severe multicollinearity — consider dropping"
                        if vif > 10 else
                        "Moderate — monitor"
                        if vif > 5 else
                        "Acceptable ✓"
                    )
                })
    except Exception:
        pass

    # ── Correlation matrix for heatmap ──────────────────────────
    corr_for_frontend = {}
    for col in corr_matrix.columns:
        corr_for_frontend[col] = {
            other: round(float(corr_matrix.loc[col, other]), 3)
            for other in corr_matrix.columns
        }

    return {
        "high_corr_pairs": high_corr_pairs,
        "vif_scores": vif_scores,
        "corr_matrix": corr_for_frontend,
        "columns": list(numeric_df.columns),
        "summary": (
            f"{len(high_corr_pairs)} highly correlated pair(s) found."
            if high_corr_pairs
            else "No severe multicollinearity detected."
        )
    }


def _corr_fix(col_a: str, col_b: str, corr: float) -> str:
    col_a_l, col_b_l = col_a.lower(), col_b.lower()

    # OHLC columns — classic redundancy in financial data
    ohlc = ["open", "high", "low", "close", "adj"]
    if any(k in col_a_l for k in ohlc) and any(k in col_b_l for k in ohlc):
        return (
            f"'{col_a}' and '{col_b}' are OHLC price columns with {corr:.0%} correlation. "
            f"Use only one raw price column and derive 'daily_range' = high - low, "
            f"'gap' = open - prev_close as engineered features instead."
        )

    if corr > 0.95:
        return (
            f"Drop one: these columns carry nearly identical information. "
            f"Keeping both wastes model capacity and inflates feature importance scores. "
            f"Prefer dropping '{col_b}' and keeping '{col_a}' unless domain knowledge says otherwise."
        )

    return (
        f"Consider PCA to combine '{col_a}' and '{col_b}' into a single component, "
        f"or use regularization (Ridge/Lasso) to let the model handle the redundancy."
    )


def rolling_stats_analysis(df: pd.DataFrame, window: int = 30) -> dict:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Find the best candidate column — prefer price/close/target
    target_keywords = ["close", "price", "return", "target", "adj"]
    candidate = next(
        (c for c in numeric_cols if any(k in c.lower() for k in target_keywords)),
        numeric_cols[0] if numeric_cols else None
    )

    if not candidate:
        return {"status": "skipped", "reason": "No numeric columns found"}

    series = df[candidate].dropna().reset_index(drop=True)

    if len(series) < window * 2:
        return {
            "status": "skipped",
            "reason": f"Need at least {window * 2} rows for rolling analysis"
        }

    rolling_mean = series.rolling(window).mean()
    rolling_std  = series.rolling(window).std()

    # Detect instability zones — where std spikes sharply
    std_mean = rolling_std.mean()
    std_std  = rolling_std.std()
    spike_indices = rolling_std[rolling_std > std_mean + 2 * std_std].index.tolist()

    # Sample points evenly for frontend charting — cap at 300 points
    step = max(1, len(series) // 300)
    indices = list(range(0, len(series), step))

    chart_data = [
        {
            "index": int(i),
            "value":        round(float(series.iloc[i]), 4)        if not np.isnan(series.iloc[i])        else None,
            "rolling_mean": round(float(rolling_mean.iloc[i]), 4)  if not np.isnan(rolling_mean.iloc[i])  else None,
            "rolling_std":  round(float(rolling_std.iloc[i]), 4)   if not np.isnan(rolling_std.iloc[i])   else None,
        }
        for i in indices
    ]

    # Stability verdict
    cv = float(rolling_std.mean() / (abs(series.mean()) + 1e-9))  # coefficient of variation
    if cv > 0.5:
        stability = "highly_unstable"
        stability_msg = "High variance relative to mean — series is highly volatile"
    elif cv > 0.2:
        stability = "moderate"
        stability_msg = "Moderate variance — some volatility clustering present"
    else:
        stability = "stable"
        stability_msg = "Low variance relative to mean — relatively stable series"

    return {
        "column_analyzed": candidate,
        "window": window,
        "chart_data": chart_data,
        "spike_count": len(spike_indices),
        "spike_indices": spike_indices[:10],
        "stability": stability,
        "stability_msg": stability_msg,
        "coefficient_of_variation": round(cv, 4),
        "mean_rolling_std": round(float(rolling_std.mean()), 4),
    }


def validate_split_strategy(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number])
    n_rows = len(df)
    n_features = numeric_df.shape[1]

    issues = []
    recommendations = []

    # ── Detect date column ───────────────────────────────────────
    date_cols = [c for c in df.columns if any(
        k in c.lower() for k in ["date", "time", "timestamp"]
    )]
    has_date = bool(date_cols)

    # ── Is random split dangerous? ───────────────────────────────
    if has_date:
        issues.append({
            "severity": "critical",
            "issue": "Time-series data detected — random train_test_split will cause look-ahead bias in your split itself.",
            "fix": "Use sklearn's TimeSeriesSplit or manually split: train = df.iloc[:int(n*0.8)], test = df.iloc[int(n*0.8):]"
        })

    # ── TimeSeriesSplit simulation ───────────────────────────────
    n_splits = 5
    tscv = TimeSeriesSplit(n_splits=n_splits)
    folds = []

    for fold_idx, (train_idx, test_idx) in enumerate(tscv.split(numeric_df)):
        train_size = len(train_idx)
        test_size  = len(test_idx)

        # Check if fold has enough data for meaningful training
        fold_issue = None
        if train_size < 50:
            fold_issue = "Training set too small — model won't generalize"
        elif train_size < n_features * 10:
            fold_issue = f"Training rows ({train_size}) < 10x features ({n_features}) — risk of overfitting"

        folds.append({
            "fold": fold_idx + 1,
            "train_size": train_size,
            "test_size": test_size,
            "train_pct": round(train_size / n_rows * 100, 1),
            "test_pct":  round(test_size  / n_rows * 100, 1),
            "issue": fold_issue,
        })

    # ── Recommended split sizes ──────────────────────────────────
    # Standard for time-series: 70/15/15 train/val/test
    train_end = int(n_rows * 0.70)
    val_end   = int(n_rows * 0.85)

    recommended_split = {
        "train": {"start": 0,         "end": train_end, "size": train_end},
        "val":   {"start": train_end, "end": val_end,   "size": val_end - train_end},
        "test":  {"start": val_end,   "end": n_rows,    "size": n_rows - val_end},
    }

    # ── Minimum data warnings ────────────────────────────────────
    if n_rows < 252:
        issues.append({
            "severity": "critical",
            "issue": f"Only {n_rows} rows — less than 1 trading year (252 days). ARIMA and LSTM models need at least 2–3 years of daily data.",
            "fix": "Collect more historical data or switch to a simpler model (linear regression, Ridge)."
        })
    elif n_rows < 504:
        issues.append({
            "severity": "warning",
            "issue": f"{n_rows} rows — between 1–2 trading years. Borderline for deep learning models.",
            "fix": "Prefer traditional models (ARIMA, XGBoost) over LSTMs with this data volume."
        })

    # ── Regime shift across split boundary ──────────────────────
    if n_rows >= 20:
        train_slice = numeric_df.iloc[:train_end]
        test_slice  = numeric_df.iloc[val_end:]
        for col in numeric_df.columns:
            train_mean = train_slice[col].mean()
            test_mean  = test_slice[col].mean()
            if abs(test_mean - train_mean) > 2 * train_slice[col].std():
                issues.append({
                    "severity": "warning",
                    "issue": f"Column '{col}': test set mean ({test_mean:.2f}) differs significantly from train mean ({train_mean:.2f}). Your model will be evaluated on a distribution it never saw.",
                    "fix": f"Consider including more recent data in training, or use walk-forward validation instead of a fixed split."
                })
                break  # one warning is enough

    return {
        "n_rows": n_rows,
        "n_features": n_features,
        "has_time_column": has_date,
        "recommended_strategy": "TimeSeriesSplit" if has_date else "StratifiedKFold",
        "n_splits": n_splits,
        "folds": folds,
        "recommended_split": recommended_split,
        "issues": issues,
    }


def check_data_sufficiency(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number])
    n_rows     = len(df)
    n_features = numeric_df.shape[1]
    verdicts   = []
    score      = 100  # Start at 100, subtract for each issue

    # ── Row-to-feature ratio ─────────────────────────────────────
    ratio = n_rows / max(n_features, 1)

    if ratio < 10:
        verdicts.append({
            "check": "Row-to-feature ratio",
            "value": f"{ratio:.1f}x",
            "status": "critical",
            "detail": f"{n_rows} rows / {n_features} features = {ratio:.1f}x. Minimum is 10x.",
            "fix": "Either collect more data or reduce features via PCA or feature selection."
        })
        score -= 30
    elif ratio < 20:
        verdicts.append({
            "check": "Row-to-feature ratio",
            "value": f"{ratio:.1f}x",
            "status": "warning",
            "detail": f"{ratio:.1f}x ratio is borderline. Recommended is 20x+ for robust ML.",
            "fix": "Add more training data or apply L2 regularization to compensate."
        })
        score -= 15
    else:
        verdicts.append({
            "check": "Row-to-feature ratio",
            "value": f"{ratio:.1f}x",
            "status": "ok",
            "detail": f"Good ratio of {ratio:.1f}x rows per feature.",
            "fix": None
        })

    # ── Model-specific thresholds ────────────────────────────────
    model_readiness = []

    # LSTM: needs 1000+ rows ideally, 500 minimum
    lstm_status = "ok" if n_rows >= 1000 else "warning" if n_rows >= 500 else "critical"
    if lstm_status != "ok":
        score -= 20 if lstm_status == "critical" else 10
    model_readiness.append({
        "model": "LSTM / Deep Learning",
        "min_rows": 1000,
        "your_rows": n_rows,
        "status": lstm_status,
        "verdict": (
            f"Ready ({n_rows} rows)" if lstm_status == "ok"
            else f"Borderline ({n_rows}/1000 rows)" if lstm_status == "warning"
            else f"Insufficient ({n_rows}/1000 rows)"
        )
    })

    # ARIMA: needs 100+ observations, better with 252+
    arima_status = "ok" if n_rows >= 252 else "warning" if n_rows >= 100 else "critical"
    if arima_status != "ok":
        score -= 15 if arima_status == "critical" else 5
    model_readiness.append({
        "model": "ARIMA / SARIMA",
        "min_rows": 252,
        "your_rows": n_rows,
        "status": arima_status,
        "verdict": (
            f"Ready ({n_rows} rows)" if arima_status == "ok"
            else f"Marginal ({n_rows}/252 rows)" if arima_status == "warning"
            else f"Too few rows ({n_rows}/100 minimum)"
        )
    })

    # XGBoost / Tree models: flexible, 200+ is fine
    xgb_status = "ok" if n_rows >= 200 else "warning" if n_rows >= 100 else "critical"
    model_readiness.append({
        "model": "XGBoost / Random Forest",
        "min_rows": 200,
        "your_rows": n_rows,
        "status": xgb_status,
        "verdict": (
            f"Ready ({n_rows} rows)" if xgb_status == "ok"
            else f"Marginal ({n_rows}/200 rows)" if xgb_status == "warning"
            else f"Too few rows"
        )
    })

    # Linear / Ridge: works with 50+
    linear_status = "ok" if n_rows >= 50 else "warning"
    model_readiness.append({
        "model": "Linear / Ridge Regression",
        "min_rows": 50,
        "your_rows": n_rows,
        "status": linear_status,
        "verdict": (
            f"Ready ({n_rows} rows)" if linear_status == "ok"
            else f"Very few rows — high variance expected"
        )
    })

    # ── Date range check ─────────────────────────────────────────
    date_coverage = None
    date_cols = [c for c in df.columns if any(
        k in c.lower() for k in ["date", "time", "timestamp"]
    )]
    if date_cols:
        try:
            dates = pd.to_datetime(df[date_cols[0]]).dropna()
            date_range_days = (dates.max() - dates.min()).days
            years = round(date_range_days / 365, 1)

            date_status = "ok" if years >= 2 else "warning" if years >= 1 else "critical"
            if date_status != "ok":
                score -= 15 if date_status == "critical" else 7

            date_coverage = {
                "start": str(dates.min().date()),
                "end":   str(dates.max().date()),
                "days":  date_range_days,
                "years": years,
                "status": date_status,
                "verdict": (
                    f"{years} years of data — excellent coverage" if years >= 2
                    else f"{years} years — borderline (recommend 2+ years)"  if years >= 1
                    else f"{years} years — too short for reliable time-series modeling"
                )
            }
        except Exception:
            pass

    # ── Missing data impact ──────────────────────────────────────
    effective_rows = int(n_rows * (1 - numeric_df.isnull().any(axis=1).mean()))
    if effective_rows < n_rows * 0.8:
        verdicts.append({
            "check": "Effective row count",
            "value": str(effective_rows),
            "status": "warning",
            "detail": f"Only {effective_rows}/{n_rows} rows are fully complete (no missing values in any column).",
            "fix": "Impute missing values to restore full dataset size before training."
        })
        score -= 10

    score = max(0, score)

    return {
        "score": score,
        "n_rows": n_rows,
        "n_features": n_features,
        "effective_rows": effective_rows,
        "row_to_feature_ratio": round(ratio, 1),
        "verdicts": verdicts,
        "model_readiness": model_readiness,
        "date_coverage": date_coverage,
        "overall": (
            "Sufficient for most ML models" if score >= 80
            else "Sufficient for traditional models only" if score >= 60
            else "Insufficient — significant data collection needed"
        )
    }