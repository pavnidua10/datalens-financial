export default function FindingCard({ finding }) {
  const border = {
    critical: "finding-critical",
    warning: "finding-warning",
    info: "finding-info",
  }[finding.severity] || "finding-info";

  const badge = {
    critical: <span className="badge badge-critical">CRITICAL</span>,
    warning: <span className="badge badge-warning">WARNING</span>,
    info: <span className="badge badge-info">INFO</span>,
  }[finding.severity];

  return (
    <div className={`finding-card ${border}`}>
      <div className="finding-header">
        <span className="finding-cat">{finding.category}</span>
        {badge}
      </div>
      <p className="finding-text">{finding.finding}</p>
      <div className="finding-fix">
        <span className="fix-label">FIX</span>
        {finding.fix}
      </div>
      <p className="finding-impact">
        <strong>Impact:</strong> {finding.impact}
      </p>
    </div>
  );
}