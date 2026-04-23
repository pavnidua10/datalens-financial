import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

export default function RollingStatsChart({ data }) {
  if (data.status === "skipped") {
    return <div className="regime-clean">ℹ {data.reason}</div>;
  }

  const stabilityColor = {
    stable:          "var(--good)",
    moderate:        "#FAC775",
    highly_unstable: "var(--warn)",
  }[data.stability] || "var(--muted2)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.68rem", color: "var(--muted2)" }}>
            Column: <span style={{ color: "var(--accent)" }}>{data.column_analyzed}</span>
            {" · "}Window: <span style={{ color: "var(--accent)" }}>{data.window}</span> periods
          </span>
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: stabilityColor }}>
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
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: "3px",
            padding: "6px 12px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.65rem",
          }}>
            <span style={{ color: "var(--muted)", display: "block", fontSize: "0.58rem", marginBottom: "2px" }}>{label}</span>
            <span style={{ color: "var(--text)" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Value + Rolling Mean chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1rem" }}>
        <div className="sidebar-heading" style={{ marginBottom: "0.75rem" }}>Price + Rolling Mean</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.chart_data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="index"
              tick={{ fill: "#5A6A7A", fontSize: 10, fontFamily: "Space Mono" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#5A6A7A", fontSize: 10, fontFamily: "Space Mono" }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                fontFamily: "Space Mono",
                fontSize: "0.65rem",
                color: "#8A9BAB",
              }}
              labelStyle={{ color: "#00E5FF" }}
            />
            <Legend
              wrapperStyle={{ fontFamily: "Space Mono", fontSize: "0.62rem", color: "#5A6A7A" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="rgba(0,229,255,0.35)"
              dot={false}
              strokeWidth={1}
              name="Raw Value"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="rolling_mean"
              stroke="#00E5FF"
              dot={false}
              strokeWidth={1.5}
              name={`${data.window}-period Mean`}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling Std (volatility) chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1rem" }}>
        <div className="sidebar-heading" style={{ marginBottom: "0.75rem" }}>Rolling Volatility (Std Dev)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.chart_data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="index"
              tick={{ fill: "#5A6A7A", fontSize: 10, fontFamily: "Space Mono" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#5A6A7A", fontSize: 10, fontFamily: "Space Mono" }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                fontFamily: "Space Mono",
                fontSize: "0.65rem",
                color: "#8A9BAB",
              }}
            />
            {data.spike_count > 0 && (
              <ReferenceLine
                y={data.mean_rolling_std}
                stroke="rgba(255,107,53,0.4)"
                strokeDasharray="4 4"
                label={{ value: "mean", fill: "#5A6A7A", fontSize: 9, fontFamily: "Space Mono" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="rolling_std"
              stroke="#FF6B35"
              dot={false}
              strokeWidth={1.5}
              name="Rolling Std"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        {data.spike_count > 0 && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.62rem", color: "var(--warn)", marginTop: "0.5rem" }}>
            ⚠ {data.spike_count} volatility spike(s) detected — likely high-impact market events
          </p>
        )}
      </div>
    </div>
  );
}