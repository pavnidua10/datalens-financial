export default function ScoreGauge({ score, verdict }) {
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "#00FF94" : score >= 70 ? "#FAC775" : score >= 50 ? "#FF6B35" : "#FF3B3B";

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 120 120" className="gauge-svg">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="50" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="gauge-score" style={{ color }}>{score}</div>
      <div className="gauge-verdict">{verdict}</div>
    </div>
  );
}