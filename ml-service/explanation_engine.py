import numpy as np

def generate_explanations(results: dict) -> dict:
    """
    Rule-based ML explanation engine.
    Each check produces: severity, plain-english finding, and exact fix.
    """
    findings = []

    findings += _explain_lookahead(results["lookahead_bias"])
    findings += _explain_stationarity(results["stationarity"])
    findings += _explain_regime(results["regime_change"])
    findings += _explain_anomalies(results["anomalies"])
    findings += _explain_missing(results["basic_info"])

    # Sort by severity: critical first
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    findings.sort(key=lambda x: severity_order[x["severity"]])

    return {
        "findings": findings,
        "summary": _generate_summary(findings, results["ml_readiness_score"]["score"])
    }


# ── Look-Ahead Bias ──────────────────────────────────────────────
def _explain_lookahead(data: dict) -> list:
    findings = []

    if not data.get("detected"):
        findings.append({
            "severity": "info",
            "category": "Look-Ahead Bias",
            "finding": "No look-ahead bias detected.",
            "fix": "None required.",
            "impact": "No impact on model validity."
        })
        return findings

    for issue in data.get("issues", []):

        # Future-named columns
        if "future-leaking names" in issue:
            cols = issue.split(":")[1].strip() if ":" in issue else "unknown"
            findings.append({
                "severity": "critical",
                "category": "Look-Ahead Bias",
                "finding": f"Columns with future-referencing names detected: {cols}. "
                           f"These likely contain data not available at prediction time.",
                "fix": "Drop these columns before training. If they are targets, move them to y — never use as features.",
                "impact": "Model will appear to perform perfectly in backtesting but fail completely in live trading."
            })

        # Unsorted dates
        elif "not sorted chronologically" in issue:
            findings.append({
                "severity": "critical",
                "category": "Look-Ahead Bias",
                "finding": "Dataset rows are not in chronological order. "
                           "Train/test splits on unordered data will leak future rows into training.",
                "fix": "Sort by date column before any split: df.sort_values('date', inplace=True). "
                       "Always use TimeSeriesSplit, never random train_test_split.",
                "impact": "Your model is trained on the future. Backtest results are meaningless."
            })

        # High correlation suggesting leakage
        elif "suspiciously high correlation" in issue:
            findings.append({
                "severity": "critical",
                "category": "Look-Ahead Bias",
                "finding": issue,
                "fix": "Shift the suspicious column by 1 period: df['col'] = df['col'].shift(1). "
                       "This ensures only past values are used to predict the present.",
                "impact": "Without shifting, your model sees today's value to predict today — "
                          "a perfect but useless predictor."
            })

    return findings


# ── Stationarity ─────────────────────────────────────────────────
def _explain_stationarity(data: dict) -> list:
    findings = []

    non_stationary = [(col, info) for col, info in data.items() if not info["is_stationary"]]
    stationary = [(col, info) for col, info in data.items() if info["is_stationary"]]

    if not non_stationary:
        findings.append({
            "severity": "info",
            "category": "Stationarity",
            "finding": f"All {len(stationary)} numeric column(s) are stationary.",
            "fix": "None required.",
            "impact": "Dataset is well-suited for ARIMA, LSTM, and regression models."
        })
        return findings

    for col, info in non_stationary:
        p = info["p_value"]

        # Determine severity by how far p-value is from significance threshold
        if p > 0.5:
            severity = "critical"
            degree = "strongly"
        elif p > 0.2:
            severity = "warning"
            degree = "moderately"
        else:
            severity = "warning"
            degree = "slightly"

        findings.append({
            "severity": severity,
            "category": "Stationarity",
            "finding": f"Column '{col}' is {degree} non-stationary (ADF p-value: {p}). "
                       f"Its mean or variance drifts over time.",
            "fix": _recommend_stationarity_fix(col, p),
            "impact": "ARIMA models require stationarity. LSTMs trained on non-stationary data "
                      "learn the trend, not the pattern — leading to poor generalization."
        })

    return findings


def _recommend_stationarity_fix(col: str, p_value: float) -> str:
    """Recommend the right transformation based on column name and severity."""
    col_lower = col.lower()

    # Price columns → log returns are standard in finance
    if any(kw in col_lower for kw in ["price", "close", "open", "high", "low", "adj"]):
        return (
            f"Apply log-differencing: df['{col}'] = np.log(df['{col}']).diff(). "
            f"This converts absolute prices to log returns — standard practice in quantitative finance."
        )

    # Volume columns → percent change works better
    elif "volume" in col_lower:
        return (
            f"Apply percent change: df['{col}'] = df['{col}'].pct_change(). "
            f"Volume is highly volatile; relative change is more informative than absolute."
        )

    # Severely non-stationary → first differencing
    elif p_value > 0.5:
        return (
            f"Apply first differencing: df['{col}'] = df['{col}'].diff(). "
            f"If the series is still non-stationary after this, apply second differencing."
        )

    # Moderately non-stationary → try detrending
    else:
        return (
            f"Try detrending: fit a linear trend and subtract it. "
            f"Alternatively apply first differencing: df['{col}'] = df['{col}'].diff()."
        )


# ── Regime Change ────────────────────────────────────────────────
def _explain_regime(data: dict) -> list:
    findings = []

    if not data.get("detected"):
        findings.append({
            "severity": "info",
            "category": "Regime Change",
            "finding": "No significant regime shifts detected in the primary column.",
            "fix": "None required.",
            "impact": "A single model trained on this dataset should generalize well across the time range."
        })
        return findings

    shifts = data.get("regime_shifts", [])
    col = data.get("column_analyzed", "unknown")

    for i, shift in enumerate(shifts):
        mean_change_pct = abs(shift["mean_after"] - shift["mean_before"]) / (abs(shift["mean_before"]) + 1e-9) * 100
        vol_change_pct = abs(shift["volatility_after"] - shift["volatility_before"]) / (abs(shift["volatility_before"]) + 1e-9) * 100

        # Determine what kind of regime shift this is
        if vol_change_pct > 100:
            shift_type = "volatility regime shift (market stress event)"
            severity = "critical"
        elif mean_change_pct > 50:
            shift_type = "mean-level regime shift (structural market change)"
            severity = "critical"
        else:
            shift_type = "mild distributional shift"
            severity = "warning"

        findings.append({
            "severity": severity,
            "category": "Regime Change",
            "finding": (
                f"Regime shift #{i+1} detected in '{col}' at row {shift['at_index']}. "
                f"Type: {shift_type}. "
                f"Mean changed from {shift['mean_before']} to {shift['mean_after']} "
                f"({mean_change_pct:.1f}% shift). "
                f"Volatility changed from {shift['volatility_before']} to {shift['volatility_after']} "
                f"({vol_change_pct:.1f}% shift)."
            ),
            "fix": _recommend_regime_fix(mean_change_pct, vol_change_pct, shift["at_index"]),
            "impact": "A model trained across regime boundaries learns an average that represents neither regime well."
        })

    return findings


def _recommend_regime_fix(mean_change_pct: float, vol_change_pct: float, at_index: int) -> str:
    if vol_change_pct > 100:
        return (
            f"Split your dataset at index {at_index} and train separate models for each regime. "
            f"Alternatively, add a volatility feature (e.g., rolling 20-day std) so the model "
            f"can distinguish market conditions. Consider using GARCH models to handle volatility clustering."
        )
    elif mean_change_pct > 50:
        return (
            f"Split at index {at_index} and train regime-specific models. "
            f"Or use a rolling window training approach — train only on the most recent N rows "
            f"to ensure the model reflects current market conditions."
        )
    else:
        return (
            f"Add a rolling mean feature to help the model adapt to the shift. "
            f"Monitor model performance around index {at_index} in your validation set."
        )


# ── Anomalies ────────────────────────────────────────────────────
def _explain_anomalies(data: dict) -> list:
    pct = data.get("anomaly_pct", 0)
    count = data.get("anomaly_count", 0)
    total = data.get("total_rows", 0)

    # Tiered severity based on anomaly rate
    if pct > 15:
        severity = "critical"
        interpretation = (
            f"{pct}% anomaly rate is extremely high — either the dataset is very noisy, "
            f"or contamination parameter needs tuning. At this rate, anomaly removal would "
            f"significantly reduce training data."
        )
        fix = (
            "Do not remove all flagged rows blindly. First visualize them — they may represent "
            "real market events (crashes, halts). Consider capping outliers using winsorization: "
            "clip values at the 1st and 99th percentile instead of removing rows."
        )
    elif pct > 5:
        severity = "warning"
        interpretation = (
            f"{pct}% anomaly rate ({count}/{total} rows) is moderate. "
            f"These rows have unusual combinations of feature values — common in financial data during "
            f"high-volatility events."
        )
        fix = (
            "Investigate flagged rows before removing them. If they correspond to known market events "
            "(earnings releases, crashes), consider adding an 'is_event_day' binary feature rather than dropping. "
            "If they are data errors, remove: df = df[~df.index.isin(anomaly_indices)]."
        )
    else:
        severity = "info"
        interpretation = (
            f"Low anomaly rate of {pct}% ({count} rows). "
            f"A small number of outlier rows is expected and normal in financial data."
        )
        fix = "Review the flagged indices manually. Safe to remove if they appear to be data errors."

    return [{
        "severity": severity,
        "category": "Anomaly Detection",
        "finding": interpretation,
        "fix": fix,
        "impact": "Anomalous rows can distort model training — especially in regression and neural networks "
                  "which are sensitive to extreme values."
    }]


# ── Missing Values ───────────────────────────────────────────────
def _explain_missing(basic_info: dict) -> list:
    findings = []
    missing_pct = basic_info.get("missing_pct", {})

    severe = {k: v for k, v in missing_pct.items() if v > 40}
    moderate = {k: v for k, v in missing_pct.items() if 10 < v <= 40}
    minor = {k: v for k, v in missing_pct.items() if 0 < v <= 10}

    for col, pct in severe.items():
        findings.append({
            "severity": "critical",
            "category": "Missing Values",
            "finding": f"Column '{col}' is {pct}% missing — more than half the data is absent.",
            "fix": f"Drop this column: df.drop(columns=['{col}']). "
                   f"Imputing >40% missing data introduces more noise than signal.",
            "impact": "Any model trained on this column is learning mostly imputed values, not real signal."
        })

    for col, pct in moderate.items():
        findings.append({
            "severity": "warning",
            "category": "Missing Values",
            "finding": f"Column '{col}' has {pct}% missing values.",
            "fix": _recommend_imputation(col, pct),
            "impact": "Missing values in financial features often aren't random — "
                      "they correlate with market halts or data gaps, which carries information."
        })

    for col, pct in minor.items():
        findings.append({
            "severity": "info",
            "category": "Missing Values",
            "finding": f"Column '{col}' has {pct}% missing values (minor).",
            "fix": f"Forward-fill for time series: df['{col}'].fillna(method='ffill'). "
                   f"This assumes the last known value persists until updated — valid for prices.",
            "impact": "Minor — unlikely to affect model performance significantly."
        })

    if not severe and not moderate and not minor:
        findings.append({
            "severity": "info",
            "category": "Missing Values",
            "finding": "No missing values detected.",
            "fix": "None required.",
            "impact": "Clean dataset — no imputation bias introduced."
        })

    return findings


def _recommend_imputation(col: str, pct: float) -> str:
    col_lower = col.lower()

    if any(kw in col_lower for kw in ["price", "close", "open", "high", "low"]):
        return (
            f"Use forward-fill: df['{col}'].fillna(method='ffill'). "
            f"For price data, carrying the last known price forward is the most realistic assumption."
        )
    elif "volume" in col_lower:
        return (
            f"Use median imputation: df['{col}'].fillna(df['{col}'].median()). "
            f"Volume doesn't persist like price — median is safer than forward-fill."
        )
    else:
        return (
            f"Examine the distribution of '{col}' first. "
            f"If roughly symmetric, use mean imputation. "
            f"If skewed, use median: df['{col}'].fillna(df['{col}'].median()). "
            f"Consider adding a binary indicator column: df['{col}_was_missing'] = df['{col}'].isna().astype(int)."
        )


# ── Summary ──────────────────────────────────────────────────────
def _generate_summary(findings: list, score: int) -> str:
    critical = [f for f in findings if f["severity"] == "critical"]
    warnings = [f for f in findings if f["severity"] == "warning"]

    if not critical and not warnings:
        return (
            f"Dataset scored {score}/100. No critical issues found. "
            f"This dataset is well-prepared for ML training."
        )

    parts = [f"Dataset scored {score}/100."]

    if critical:
        categories = list(set(f["category"] for f in critical))
        parts.append(f"{len(critical)} critical issue(s) in: {', '.join(categories)}.")

    if warnings:
        categories = list(set(f["category"] for f in warnings))
        parts.append(f"{len(warnings)} warning(s) in: {', '.join(categories)}.")

    parts.append("Address critical issues before training any model.")
    return " ".join(parts)