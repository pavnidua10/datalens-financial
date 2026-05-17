import { useRef } from "react";

export default function Landing({ onLaunch, onAnalyze }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onAnalyze(f);
  };

  const features = [
    {
      tag: "Look-ahead bias",
      title: "Future Leak Detection",
      desc: "Detects future-named columns, unsorted timestamps, and suspicious correlation patterns that signal data leakage.",
      badge: "Critical Check",
      badgeClass: "badge-critical",
    },
    {
      tag: "ADF Test",
      title: "Stationarity Analysis",
      desc: "Augmented Dickey-Fuller on every numeric column. Column-aware fixes — log returns for price, pct change for volume.",
      badge: "Statistical Test",
      badgeClass: "badge-warning",
    },
    {
      tag: "Regime Engine",
      title: "Market Regime Detection",
      desc: "Rolling window mean and volatility shift analysis. Flags structural changes, COVID-style breaks, and volatility clustering.",
      badge: "ML Impact: High",
      badgeClass: "badge-warning",
    },
    {
      tag: "Isolation Forest",
      title: "Anomaly Detection",
      desc: "Sklearn Isolation Forest flags statistically anomalous rows. Tiered severity with winsorization recommendations.",
      badge: "ML Powered",
      badgeClass: "badge-info",
    },
    {
      tag: "Scoring Engine",
      title: "ML Readiness Score",
      desc: "Composite 0–100 score with weighted penalties across all dimensions. Deterministic — same dataset, same score.",
      badge: "Deterministic",
      badgeClass: "badge-info",
    },
    {
      tag: "Rule Engine",
      title: "Expert Explanations",
      desc: "Zero AI calls. Pure rule-based engine produces finding, fix, and impact for every issue — specific to your column names.",
      badge: "No API Cost",
      badgeClass: "badge-good",
    },
  ];

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="logo">
          <div className="logo-mark">
            <svg viewBox="0 0 12 12"><rect x="1" y="4" width="2" height="7"/><rect x="5" y="2" width="2" height="9"/><rect x="9" y="0" width="2" height="11"/></svg>
          </div>
          DataLens Financial
        </div>
        <span className="nav-tag">Financial ML Dataset Intelligence</span>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">Dataset Audit Tool</div>
        <h1>
          Your dataset is<br />
          <em>lying to you.</em>
        </h1>
        <p className="hero-sub">
          Look-ahead bias. Regime shifts. Non-stationary columns.
          DataLens finds what breaks your model before you train it.
        </p>
        <div className="cta-group">
          <button className="btn-primary" onClick={() => fileRef.current.click()}>
            Analyze a Dataset →
          </button>
          <button className="btn-ghost" onClick={onLaunch}>
            View Demo
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>
      </section>

      {/* Stats */}
      <div className="stats-strip">
        {[
          ["6", "Analysis Modules"],
          ["0ms", "AI Latency"],
          ["100%", "Rule-Based"],
          ["∞", "No API Costs"],
        ].map(([num, label]) => (
          <div className="stat-item" key={label}>
            <span className="stat-num">{num}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="features-grid">
        {features.map((f) => (
          <div className="feat-card" key={f.title}>
            <div className="feat-tag">{f.tag}</div>
            <div className="feat-title">{f.title}</div>
            <div className="feat-desc">{f.desc}</div>
            <span className={`badge ${f.badgeClass}`}>{f.badge}</span>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bottom-cta">
        <h2>Ready to audit your<br /><em>financial dataset?</em></h2>
        <p>Upload a CSV. Get a full ML readiness report in seconds.</p>
        <button className="btn-primary" onClick={() => fileRef.current.click()}>
          Open Analyzer →
        </button>
      </div>
    </div>
  );
}