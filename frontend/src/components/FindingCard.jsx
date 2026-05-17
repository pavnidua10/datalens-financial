export default function FindingCard({ finding }) {
  const borderClass = {
    critical: "finding-critical",
    warning:  "finding-warning",
    info:     "finding-info",
  }[finding.severity] || "finding-info";

  const badge = {
    critical: <span className="badge badge-critical">Critical</span>,
    warning:  <span className="badge badge-warning">Warning</span>,
    info:     <span className="badge badge-info">Info</span>,
  }[finding.severity];

  return (
    <div className={`finding-card ${borderClass}`}>
      <div className="finding-header">
        <span className="finding-cat">{finding.category}</span>
        {badge}
      </div>
      <p className="finding-text">{finding.finding}</p>
      <div className="finding-fix">
        <span className="fix-label">Fix</span>
        {finding.fix}
      </div>
      <p className="finding-impact">
        <strong>Impact:</strong> {finding.impact}
      </p>
    </div>
  );
}