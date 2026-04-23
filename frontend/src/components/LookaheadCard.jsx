export default function LookaheadCard({ data }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-3">🔍 Look-Ahead Bias Detection</h2>
      {data.detected ? (
        <div className="space-y-2">
          {data.issues.map((issue, i) => (
            <div key={i} className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300">
              ⚠ {issue}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-green-400 text-sm">✓ No look-ahead bias detected</p>
      )}
    </div>
  );
}