export default function RegimeCard({ data }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-3">🔄 Regime Change Detection</h2>
      {data.detected ? (
        <>
          <p className="text-yellow-400 text-sm mb-3">⚠ {data.regime_shifts.length} regime shift(s) detected in <span className="font-mono">{data.column_analyzed}</span></p>
          <div className="space-y-2">
            {data.regime_shifts.map((shift, i) => (
              <div key={i} className="bg-yellow-950 border border-yellow-800 rounded-lg p-3 text-xs text-yellow-200 grid grid-cols-2 gap-2">
                <span>At index: {shift.at_index}</span>
                <span>Mean shift: {shift.mean_before} → {shift.mean_after}</span>
                <span>Volatility before: {shift.volatility_before}</span>
                <span>Volatility after: {shift.volatility_after}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-400">{data.recommendation}</p>
        </>
      ) : (
        <p className="text-green-400 text-sm">✓ No regime shifts detected</p>
      )}
    </div>
  );
}