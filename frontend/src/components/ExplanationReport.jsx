export default function ExplanationReport({ data }) {
    if (!data || !data.findings) return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm">
      No explanation data available.
    </div>
  );
  const severityStyle = {
    critical: "border-red-800 bg-red-950 text-red-300",
    warning: "border-yellow-800 bg-yellow-950 text-yellow-200",
    info: "border-gray-700 bg-gray-900 text-gray-400",
  };

  const severityLabel = {
    critical: "🔴 Critical",
    warning: "🟡 Warning",
    info: "🔵 Info",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-2">🧠 ML Explanation Engine</h2>
      <p className="text-sm text-gray-500 mb-4">{data.summary}</p>
      <div className="space-y-3">
        {data.findings.map((f, i) => (
          <div key={i} className={`border rounded-xl p-4 ${severityStyle[f.severity]}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{f.category}</span>
              <span className="text-xs font-bold">{severityLabel[f.severity]}</span>
            </div>
            <p className="text-sm mb-2">{f.finding}</p>
            <p className="text-xs opacity-70"><span className="font-semibold">Fix:</span> {f.fix}</p>
            <p className="text-xs opacity-60 mt-1"><span className="font-semibold">Impact:</span> {f.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}