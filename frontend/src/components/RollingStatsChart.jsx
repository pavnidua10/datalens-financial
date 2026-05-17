import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";

export default function RollingStatsChart({ data }) {
  if (data.status === "skipped") {
    return <div className="regime-clean">ℹ {data.reason}</div>;
  }

  const stabilityColor = {
    stable:          "var(--good)",
    moderate:        "var(--warn)",
    highly_unstable: "var(--danger)",
  }[data.stability] || "var(--muted)";

  const tooltipStyle = {
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.68rem",
    color: "var(--text2)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--muted)" }}>
          Column: <span style={{ color: "var(--accent)" }}>{data.column_analyzed}</span>
          {" · "}Window: <span style={{ color: "var(--accent)" }}>{data.window}</span> periods
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: stabilityColor }}>
          ● {data.stability_msg}
        </span>
      </div>

      {/* Metric chips */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          ["CV", data.coefficient_of_variation],
          ["Mean Rolling Std", data.mean_rolling_std],
          ["Volatility Spikes", data.spike_count],
        ].map(([label, val]) => (
          <div key={label} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "6px 12px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.68rem",
          }}>
            <span style={{ color: "var(--muted2)", display: "block", fontSize: "0.58rem", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            <span style={{ color: "var(--text2)", fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Price + Rolling Mean */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
        <div className="sidebar-heading" style={{ marginBottom: "0.75rem" }}>Price + Rolling Mean</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.chart_data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="index" tick={{ fill: "#A8A29E", fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#A8A29E", fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} width={55} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--accent)" }} />
            <Legend wrapperStyle={{ fontFamily: "DM Mono", fontSize: "0.62rem", color: "var(--muted)" }} />
            <Line type="monotone" dataKey="value" stroke="rgba(44,95,138,0.25)" dot={false} strokeWidth={1} name="Raw Value" connectNulls />
            <Line type="monotone" dataKey="rolling_mean" stroke="#2C5F8A" dot={false} strokeWidth={1.5} name={`${data.window}-period Mean`} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling Std */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
        <div className="sidebar-heading" style={{ marginBottom: "0.75rem" }}>Rolling Volatility (Std Dev)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.chart_data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="index" tick={{ fill: "#A8A29E", fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#A8A29E", fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} width={55} />
            <Tooltip contentStyle={tooltipStyle} />
            {data.spike_count > 0 && (
              <ReferenceLine y={data.mean_rolling_std} stroke="rgba(200,135,58,0.4)" strokeDasharray="4 4"
                label={{ value: "mean", fill: "#A8A29E", fontSize: 9, fontFamily: "DM Mono" }} />
            )}
            <Line type="monotone" dataKey="rolling_std" stroke="#C8873A" dot={false} strokeWidth={1.5} name="Rolling Std" connectNulls />
          </LineChart>
        </ResponsiveContainer>
        {data.spike_count > 0 && (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--warn)", marginTop: "0.5rem" }}>
            ⚠ {data.spike_count} volatility spike(s) detected — likely high-impact market events
          </p>
        )}
      </div>
    </div>
  );
}