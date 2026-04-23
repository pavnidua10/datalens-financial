export default function DataSufficiencyPanel({ data }) {
  const statusColor = { ok: "var(--good)", warning: "#FAC775", critical: "var(--warn)" };
  const statusBadge = { ok: "badge-info", warning: "badge-warning", critical: "badge-critical" };
  const barColor    = { ok: "var(--good)", warning: "#FAC775", critical: "var(--warn)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Overall verdict */}
      <div className="summary-bar">
        <div className="summary-icon">📊</div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: "var(--text)", marginBottom: "3px" }}>
            {data.overall}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "var(--muted2)" }}>
            {data.n_rows} rows · {data.n_features} features · {data.row_to_feature_ratio}x ratio · {data.effective_rows} complete rows
          </div>
        </div>
      </div>

      {/* Date coverage */}
      {data.date_coverage && (
        <div className={`finding-card ${
          data.date_coverage.status === "critical" ? "finding-critical"
          : data.date_coverage.status === "warning" ? "finding-warning"
          : "finding-info"
        }`}>
          <div className="finding-header">
            <span className="finding-cat">Date Coverage</span>
            <span className={`badge ${statusBadge[data.date_coverage.status]}`}>
              {data.date_coverage.years} YRS
            </span>
          </div>
          <p className="finding-text">
            {data.date_coverage.start} → {data.date_coverage.end} · {data.date_coverage.days} days
          </p>
          <p className="finding-text" style={{ marginBottom: 0 }}>{data.date_coverage.verdict}</p>
        </div>
      )}

      {/* Verdicts from checks */}
      {data.verdicts.map((v, i) => (
        <div key={i} className={`finding-card ${
          v.status === "critical" ? "finding-critical"
          : v.status === "warning" ? "finding-warning"
          : "finding-info"
        }`}>
          <div className="finding-header">
            <span className="finding-cat">{v.check}</span>
            <span className={`badge ${statusBadge[v.status]}`}>{v.value}</span>
          </div>
          <p className="finding-text">{v.detail}</p>
          {v.fix && (
            <div className="finding-fix">
              <span className="fix-label">FIX</span>
              {v.fix}
            </div>
          )}
        </div>
      ))}

      {/* Model readiness bars */}
      <div>
        <div className="sidebar-heading" style={{ marginBottom: "0.75rem" }}>Model Readiness</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.model_readiness.map((m) => {
            const pct = Math.min(100, Math.round((m.your_rows / m.min_rows) * 100));
            const color = barColor[m.status];
            return (
              <div key={m.model}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.68rem", color: "var(--text)" }}>
                    {m.model}
                  </span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color }}>
                    {m.verdict}
                  </span>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: "2px", height: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: "2px",
                    transition: "width 0.8s ease",
                  }} />
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: "var(--muted)", marginTop: "3px" }}>
                  {m.your_rows} / {m.min_rows} recommended rows ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}