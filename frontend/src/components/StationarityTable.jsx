export default function StationarityTable({ data }) {
  return (
    <div className="table-wrap">
      <table className="stat-table">
        <thead>
          <tr>
            <th>Column</th>
            <th>ADF Statistic</th>
            <th>p-value</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([col, info]) => (
            <tr key={col}>
              <td className="col-name">{col}</td>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>{info.adf_statistic}</td>
              <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>{info.p_value}</td>
              <td>
                <span className={`pill ${info.is_stationary ? "pill-good" : "pill-bad"}`}>
                  {info.is_stationary ? "Stationary ✓" : "Non-stationary ✗"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}