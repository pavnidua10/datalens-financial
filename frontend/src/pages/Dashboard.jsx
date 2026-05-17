import { useRef } from "react";
import ScoreGauge from "../components/ScoreGauge";
import FindingCard from "../components/FindingCard";
import StationarityTable from "../components/StationarityTable";
import AnomalyPanel from "../components/AnomalyPanel";
import RegimePanel from "../components/RegimePanel";
import MulticollinearityPanel from "../components/MulticollinearityPanel";
import RollingStatsChart from "../components/RollingStatsChart";
import SplitValidatorPanel from "../components/SplitValidatorPanel";
import DataSufficiencyPanel from "../components/DataSufficiencyPanel";

export default function Dashboard({ result, loading, error, fileName, onBack, onAnalyze }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onAnalyze(f);
  };

  const safeResult = result || {};
  const score = safeResult?.ml_readiness_score;
  const explanations = safeResult?.explanations;

  return (
    <div className="dashboard">
      {/* Nav */}
      <div className="dash-nav">
        <div className="dash-nav-left">
          <button className="btn-ghost btn-sm" onClick={onBack}>← Back</button>
          <span className="dash-filename">
            DataLens / {fileName ? fileName.toUpperCase() : "No File"}
          </span>
        </div>
        <div className="status-live" style={{ color: error ? "var(--danger)" : loading ? "var(--warn)" : "var(--good)" }}>
          <span className={`status-dot ${loading ? "dot-loading" : error ? "dot-error" : "dot-done"}`} />
          {loading ? "Analyzing..." : error ? "Error" : "Analysis Complete"}
        </div>
      </div>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <span className="upload-icon">↑</span>
            <div className="upload-label">Drop CSV here<br />or click to upload</div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {score && (
            <>
              <div className="sidebar-section">
                <div className="sidebar-heading">ML Readiness Score</div>
                <ScoreGauge score={score?.score} verdict={score?.verdict} />
              </div>

              <div className="sidebar-section">
                <div className="sidebar-heading">Score Penalties</div>
                {score?.penalties?.length === 0 ? (
                  <div className="penalty-item good">No penalties — clean dataset</div>
                ) : (
                  score?.penalties?.map((p, i) => (
                    <div className="penalty-item" key={i}>
                      <span className="penalty-bullet" />
                      {p}
                    </div>
                  ))
                )}
              </div>

              <div className="sidebar-section">
                <div className="sidebar-heading">Dataset Info</div>
                {[
                  ["Rows",     safeResult?.basic_info?.rows ?? 0],
                  ["Columns",  safeResult?.basic_info?.columns?.length ?? 0],
                  ["Missing",  Object.values(safeResult?.basic_info?.missing_pct || {}).some(v => v > 0) ? "Yes" : "None"],
                  ["Anomalies", `${safeResult?.anomalies?.anomaly_pct ?? 0}%`],
                ].map(([k, v]) => (
                  <div className="info-row" key={k}>
                    <span>{k}</span>
                    <span className="info-val">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {loading && (
            <div className="sidebar-section">
              <div className="loading-pulse">Analyzing dataset...</div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="dash-main">
          {loading && (
            <div className="loading-screen">
              <div className="loading-spinner" />
              <div className="loading-text">Running analysis engine...</div>
              <div className="loading-steps">
                {["Parsing CSV", "ADF stationarity tests", "Isolation Forest", "Regime detection", "Building report"].map((s, i) => (
                  <div className="loading-step" key={i} style={{ animationDelay: `${i * 0.4}s` }}>
                    <span className="step-dot" />{s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="error-card">
              <div className="error-title">Analysis Failed</div>
              <div className="error-msg">{error}</div>
            </div>
          )}

          {!loading && !error && result && (
            <>
              <div className="dash-section">
                <div className="section-title">Summary</div>
                <div className="summary-bar">
                  <div className="summary-icon">🧠</div>
                  <div className="summary-text">{explanations?.summary}</div>
                </div>
              </div>

              {explanations?.findings?.length > 0 && (
                <div className="dash-section">
                  <div className="section-title">Findings</div>
                  <div className="findings-list">
                    {explanations.findings.map((f, i) => <FindingCard key={i} finding={f} />)}
                  </div>
                </div>
              )}

              {Object.keys(safeResult?.stationarity || {}).length > 0 && (
                <div className="dash-section">
                  <div className="section-title">Stationarity Tests (ADF)</div>
                  <StationarityTable data={safeResult.stationarity} />
                </div>
              )}

              <div className="dash-section">
                <div className="section-title">Regime Change Detection</div>
                <RegimePanel data={safeResult?.regime_change} />
              </div>

              <div className="dash-section">
                <div className="section-title">Anomaly Detection</div>
                <AnomalyPanel data={safeResult?.anomalies} />
              </div>

              {safeResult?.multicollinearity && (
                <div className="dash-section">
                  <div className="section-title">Multicollinearity & VIF</div>
                  <MulticollinearityPanel data={safeResult.multicollinearity} />
                </div>
              )}

              {safeResult?.rolling_stats && (
                <div className="dash-section">
                  <div className="section-title">Rolling Statistics</div>
                  <RollingStatsChart data={safeResult.rolling_stats} />
                </div>
              )}

              {safeResult?.split_validation && (
                <div className="dash-section">
                  <div className="section-title">Train / Test Split Validation</div>
                  <SplitValidatorPanel data={safeResult.split_validation} />
                </div>
              )}

              {safeResult?.data_sufficiency && (
                <div className="dash-section">
                  <div className="section-title">Data Sufficiency</div>
                  <DataSufficiencyPanel data={safeResult.data_sufficiency} />
                </div>
              )}
            </>
          )}

          {!loading && !error && !result && (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <div className="empty-title">No dataset loaded</div>
              <div className="empty-sub">Upload a CSV from the sidebar to begin analysis.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}