export default function AnomalyCard({ data }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-3">🚨 Anomaly Detection (Isolation Forest)</h2>
      <div className="flex gap-6 text-center mb-4">
        <div>
          <p className="text-3xl font-bold text-orange-400">{data.anomaly_count}</p>
          <p className="text-xs text-gray-500">Anomalous Rows</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-orange-400">{data.anomaly_pct}%</p>
          <p className="text-xs text-gray-500">of Dataset</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-400">{data.total_rows}</p>
          <p className="text-xs text-gray-500">Total Rows</p>
        </div>
      </div>
      {data.anomaly_indices.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Flagged row indices (first 20):</p>
          <div className="flex flex-wrap gap-2">
            {data.anomaly_indices.map((idx) => (
              <span key={idx} className="bg-orange-950 border border-orange-800 text-orange-300 text-xs px-2 py-0.5 rounded-full">
                #{idx}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}