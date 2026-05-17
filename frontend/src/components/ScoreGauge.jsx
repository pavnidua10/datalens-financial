export default function ScoreGauge({ score, verdict }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 85 ? "#2E7D4F" :
    score >= 70 ? "#C8873A" :
    score >= 50 ? "#C0392B" : "#8B1E1E";

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 100 100" className="gauge-svg">
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke="#E2DED6"
          strokeWidth="7"
        />
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x="50" y="54"
          textAnchor="middle"
          fontFamily="'Instrument Serif', serif"
          fontSize="22"
          fill={color}
        >
          {score}
        </text>
      </svg>
      <div className="gauge-verdict">{verdict}</div>
    </div>
  );
}