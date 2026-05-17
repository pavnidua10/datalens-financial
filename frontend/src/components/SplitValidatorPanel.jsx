export default function SplitValidatorPanel({ data }) {
  const split = data.recommended_split;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Strategy */}
      <div className="summary-bar">
        <div className="summary-icon">📐</div>
        <div>
          <div style={{ fontSize: "0.82rem", color: "var(--text2)", marginBottom: "3px" }}>
            Recommended: <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.78rem" }}>{data.recommended_strategy}</span>
            {" with "}<span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{data.n_splits}</span> splits
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {data.has_time_column
              ? "Time column detected — random splits are invalid for this dataset"
              : "No time column — standard cross-validation is acceptable"}
          </div>
        </div>
      </div>

      {/* Issues */}
      {data.issues?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.issues.map((issue, i) => (
            <div key={i} className={`finding-card ${issue.severity === "critical" ? "finding-critical" : "finding-warning"}`}>
              <div className="finding-header">
                <span className="finding-cat">Split Issue</span>
                <span className={`badge ${issue.severity === "critical" ? "badge-critical" : "badge-warning"}`}>
                  {issue.severity}
                </span>
              </div>
              <p className="finding-text">{issue.issue}</p>
              <div className="finding-fix">
                <span className="fix-label">Fix</span>
                {issue.fix}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Split bar */}
      <div>
        <div className="sidebar-heading" style={{ marginBottom: "0.5rem" }}>Recommended 70 / 15 / 15 Split</div>
        <div style={{ display: "flex", gap: "1px", background: "var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "0.5rem" }}>
          {[
            { label: "Train", pct: 70, bg: "rgba(44,95,138,0.08)",  border: "var(--accent)",  rows: split.train.size },
            { label: "Val",   pct: 15, bg: "rgba(200,135,58,0.08)", border: "var(--warn)",    rows: split.val.size   },
            { label: "Test",  pct: 15, bg: "rgba(46,125,79,0.08)",  border: "var(--good)",    rows: split.test.size  },
          ].map(({ label, pct, bg, border, rows }) => (
            <div key={label} style={{ flex: pct, background: bg, borderTop: `2px solid ${border}`, padding: "0.75rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: border, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.2rem", color: "var(--text)", marginTop: "2px" }}>{pct}%</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--muted2)", marginTop: "1px" }}>{rows} rows</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "var(--muted)", background: "var(--surface2)", padding: "0.6rem 0.8rem", borderRadius: "4px", border: "1px solid var(--border)" }}>
          <span style={{ color: "var(--accent)" }}>Code: </span>
          {"train=df.iloc[:{t}], val=df.iloc[{t}:{v}], test=df.iloc[{v}:]"
            .replace("{t}", split.train.end)
            .replace("{v}", split.val.end)
            .replace("{v}", split.val.end)}
        </div>
      </div>

      {/* Folds table */}
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
              {data.folds?.map((fold) => (
                <tr key={fold.fold}>
                  <td className="col-name">#{fold.fold}</td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>
                    {fold.train_size} <span style={{ color: "var(--muted2)", fontSize: "0.65rem" }}>({fold.train_pct}%)</span>
                  </td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>
                    {fold.test_size} <span style={{ color: "var(--muted2)", fontSize: "0.65rem" }}>({fold.test_pct}%)</span>
                  </td>
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