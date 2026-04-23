export default function SplitValidatorPanel({ data }) {
  const statusColor = {
    critical: "var(--warn)",
    warning: "#FAC775",
    ok: "var(--good)",
  };

  const split = data.recommended_split;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Strategy recommendation */}
      <div className="summary-bar">
        <div className="summary-icon">📐</div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: "var(--text)", marginBottom: "3px" }}>
            Recommended: <span style={{ color: "var(--accent)" }}>{data.recommended_strategy}</span>
            {" with "}<span style={{ color: "var(--accent)" }}>{data.n_splits}</span> splits
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--muted2)" }}>
            {data.has_time_column
              ? "Time column detected — random splits are invalid for this dataset"
              : "No time column — standard cross-validation is acceptable"}
          </div>
        </div>
      </div>

      {/* Issues */}
      {data.issues.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.issues.map((issue, i) => (
            <div key={i} className={`finding-card ${issue.severity === "critical" ? "finding-critical" : "finding-warning"}`}>
              <div className="finding-header">
                <span className="finding-cat">Split Issue</span>
                <span className={`badge ${issue.severity === "critical" ? "badge-critical" : "badge-warning"}`}>
                  {issue.severity.toUpperCase()}
                </span>
              </div>
              <p className="finding-text">{issue.issue}</p>
              <div className="finding-fix">
                <span className="fix-label">FIX</span>
                {issue.fix}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended 70/15/15 split */}
      <div>
        <div className="sidebar-heading" style={{ marginBottom: "0.5rem" }}>Recommended 70 / 15 / 15 Split</div>
        <div style={{ display: "flex", gap: "1px", background: "var(--border)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.5rem" }}>
          {[
            { label: "TRAIN", pct: 70, color: "rgba(0,229,255,0.15)", border: "var(--accent)", rows: split.train.size },
            { label: "VAL",   pct: 15, color: "rgba(250,199,117,0.15)", border: "#FAC775",     rows: split.val.size },
            { label: "TEST",  pct: 15, color: "rgba(0,255,148,0.12)", border: "var(--good)",   rows: split.test.size },
          ].map(({ label, pct, color, border, rows }) => (
            <div key={label} style={{
              flex: pct,
              background: color,
              borderTop: `2px solid ${border}`,
              padding: "0.75rem",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: border, letterSpacing: "0.1em" }}>{label}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.78rem", color: "var(--text)", fontWeight: 700, marginTop: "2px" }}>{pct}%</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: "var(--muted)", marginTop: "1px" }}>{rows} rows</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.62rem", color: "var(--muted)", background: "var(--surface2)", padding: "0.6rem 0.8rem", borderRadius: "3px" }}>
          <span style={{ color: "var(--accent)" }}>Code: </span>
          {"train=df.iloc[:{t}], val=df.iloc[{t}:{v}], test=df.iloc[{v}:]"
            .replace("{t}", split.train.end)
            .replace("{v}", split.val.end)
            .replace("{v}", split.val.end)}
        </div>
      </div>

      {/* TimeSeriesSplit folds */}
      <div>
        <div className="sidebar-heading" style={{ marginBottom: "0.5rem" }}>TimeSeriesSplit Fold Preview</div>
        <div className="table-wrap">
          <table className="stat-table">
            <thead>
              <tr>
                <th>Fold</th>
                <th>Train Rows</th>
                <th>Test Rows</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.folds.map((fold) => (
                <tr key={fold.fold}>
                  <td style={{ color: "var(--accent)", fontFamily: "'Space Mono', monospace" }}>#{fold.fold}</td>
                  <td style={{ fontFamily: "'Space Mono', monospace" }}>{fold.train_size} <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>({fold.train_pct}%)</span></td>
                  <td style={{ fontFamily: "'Space Mono', monospace" }}>{fold.test_size} <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>({fold.test_pct}%)</span></td>
                  <td>
                    {fold.issue
                      ? <span className="pill pill-bad" title={fold.issue}>⚠ Issue</span>
                      : <span className="pill pill-good">✓ OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}