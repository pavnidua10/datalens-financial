export default function MulticollinearityPanel({ data }) {
  if (data.status === "skipped") {
    return (
      <div className="regime-clean">ℹ {data.reason}</div>
    );
  }

  const cols = data.columns || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Summary */}
      <div className={`finding-card ${data.high_corr_pairs.length > 0 ? "finding-warning" : "finding-info"}`}>
        <div className="finding-header">
          <span className="finding-cat">Correlation Summary</span>
          <span className={`badge ${data.high_corr_pairs.length > 0 ? "badge-warning" : "badge-info"}`}>
            {data.high_corr_pairs.length} PAIRS FLAGGED
          </span>
        </div>
        <p className="finding-text">{data.summary}</p>
      </div>

      {/* High correlation pairs */}
      {data.high_corr_pairs.length > 0 && (
        <div>
          <div className="sidebar-heading" style={{ marginBottom: "0.5rem" }}>Flagged Pairs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.high_corr_pairs.map((pair, i) => (
              <div key={i} className={`finding-card ${pair.severity === "critical" ? "finding-critical" : "finding-warning"}`}>
                <div className="finding-header">
                  <span className="finding-cat">
                    <code style={{ color: "var(--accent)", background: "rgba(0,229,255,0.08)", padding: "1px 6px", borderRadius: "2px", fontSize: "0.7rem" }}>
                      {pair.col_a}
                    </code>
                    {" ↔ "}
                    <code style={{ color: "var(--accent)", background: "rgba(0,229,255,0.08)", padding: "1px 6px", borderRadius: "2px", fontSize: "0.7rem" }}>
                      {pair.col_b}
                    </code>
                  </span>
                  <span className={`badge ${pair.severity === "critical" ? "badge-critical" : "badge-warning"}`}>
                    {(pair.correlation * 100).toFixed(1)}% CORR
                  </span>
                </div>
                <div className="finding-fix">
                  <span className="fix-label">FIX</span>
                  {pair.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIF table */}
      {data.vif_scores.length > 0 && (
        <div>
          <div className="sidebar-heading" style={{ marginBottom: "0.5rem" }}>Variance Inflation Factor (VIF)</div>
          <div className="table-wrap">
            <table className="stat-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>VIF Score</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {data.vif_scores.map((row) => (
                  <tr key={row.column}>
                    <td className="col-name">{row.column}</td>
                    <td style={{ fontFamily: "'Space Mono', monospace" }}>{row.vif}</td>
                    <td>
                      <span className={`pill ${
                        row.severity === "critical" ? "pill-bad"
                        : row.severity === "warning" ? "pill-warn"
                        : "pill-good"
                      }`}>
                        {row.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correlation heatmap — simple grid */}
      {cols.length > 0 && cols.length <= 8 && (
        <div>
          <div className="sidebar-heading" style={{ marginBottom: "0.5rem" }}>Correlation Heatmap</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontFamily: "'Space Mono', monospace", fontSize: "0.6rem" }}>
              <thead>
                <tr>
                  <th style={{ padding: "6px 10px", color: "var(--muted)", fontWeight: 400 }}></th>
                  {cols.map(c => (
                    <th key={c} style={{ padding: "6px 8px", color: "var(--muted)", fontWeight: 400, maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.length > 6 ? c.slice(0, 6) + "…" : c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cols.map(rowCol => (
                  <tr key={rowCol}>
                    <td style={{ padding: "6px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {rowCol.length > 8 ? rowCol.slice(0, 8) + "…" : rowCol}
                    </td>
                    {cols.map(colCol => {
                      const val = data.corr_matrix?.[rowCol]?.[colCol] ?? 0;
                      const abs = Math.abs(val);
                      // Color scale: dark = high correlation
                      const alpha = rowCol === colCol ? 0.15 : abs * 0.8;
                      const bg = val >= 0
                        ? `rgba(0,229,255,${alpha})`
                        : `rgba(255,107,53,${alpha})`;
                      const textColor = abs > 0.6 ? "var(--text)" : "var(--muted2)";
                      return (
                        <td key={colCol} style={{
                          padding: "6px 8px",
                          background: bg,
                          color: textColor,
                          textAlign: "center",
                          border: "1px solid var(--border)",
                          transition: "background 0.2s",
                        }}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}