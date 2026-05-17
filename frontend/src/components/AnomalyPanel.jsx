export default function AnomalyPanel({ data }) {
  const pct = data.anomaly_pct ?? 0;
  const isHigh = pct > 10;
  const isMod  = pct > 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="metric-row">
        <div className="metric-cell">
          <span className={`metric-val ${isHigh ? "danger" : isMod ? "warn" : ""}`}>
            {data.anomaly_count}
          </span>
          <span className="metric-key">Anomalous Rows</span>
        </div>
        <div className="metric-cell">
          <span className={`metric-val ${isHigh ? "danger" : isMod ? "warn" : ""}`}>
            {pct}%
          </span>
          <span className="metric-key">of Dataset</span>
        </div>
        <div className="metric-cell">
          <span className="metric-val">{data.total_rows}</span>
          <span className="metric-key">Total Rows</span>
        </div>
      </div>

      {data.anomaly_indices?.length > 0 && (
        <div>
          <div className="sidebar-heading" style={{ marginBottom: "0.4rem" }}>Flagged Row Indices</div>
          <div className="anomaly-chips">
            {data.anomaly_indices.map((idx) => (
              <span className="chip" key={idx}>#{idx}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}