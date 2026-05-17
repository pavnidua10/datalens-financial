export default function RegimePanel({ data }) {
  if (!data?.detected) {
    return <div className="regime-clean">✓ No regime shifts detected</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p className="regime-intro">
        {data.regime_shifts?.length} shift(s) detected in <code>{data.column_analyzed}</code>
      </p>
      {data.regime_shifts?.map((s, i) => (
        <div className="regime-card" key={i}>
          <div className="regime-grid">
            <div><span className="regime-key">At Index</span><span className="regime-val">{s.at_index}</span></div>
            <div><span className="regime-key">Mean Before</span><span className="regime-val">{s.mean_before}</span></div>
            <div><span className="regime-key">Mean After</span><span className="regime-val">{s.mean_after}</span></div>
            <div><span className="regime-key">Vol Before</span><span className="regime-val">{s.volatility_before}</span></div>
            <div><span className="regime-key">Vol After</span><span className="regime-val">{s.volatility_after}</span></div>
          </div>
        </div>
      ))}
      <p className="regime-rec">{data.recommendation}</p>
    </div>
  );
}