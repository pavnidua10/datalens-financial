export default function AnomalyPanel({ data }) {
  return (
    <div className="anomaly-panel">
      <div className="metric-row">
        <div className="metric-cell">
          <span className="metric-val warn">{data.anomaly_count}</span>
          <span className="metric-key">Anomalous Rows</span>
        </div>
        <div className="metric-cell">
          <span className="metric-val warn">{data.anomaly_pct}%</span>
          <span className="metric-key">of Dataset</span>
        </div>
        <div className="metric-cell">
          <span className="metric-val">{data.total_rows}</span>
          <span className="metric-key">Total Rows</span>
        </div>
      </div>
      {data.anomaly_indices.length > 0 && (
        <div className="anomaly-chips">
          {data.anomaly_indices.map((idx) => (
            <span className="chip" key={idx}>#{idx}</span>
          ))}
        </div>
      )}
    </div>
  );
}