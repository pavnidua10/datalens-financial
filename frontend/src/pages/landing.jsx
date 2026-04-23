import { useRef } from "react";

export default function Landing({ onLaunch, onAnalyze }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onAnalyze(f);
  };

  const features = [
    {
      tag: "LOOK-AHEAD BIAS",
      title: "Future Leak Detection",
      desc: "Detects future-named columns, unsorted timestamps, and suspicious correlation patterns that signal data leakage.",
      badge: "CRITICAL CHECK",
      badgeClass: "badge-critical",
    },
    {
      tag: "ADF TEST",
      title: "Stationarity Analysis",
      desc: "Augmented Dickey-Fuller on every numeric column. Column-aware fixes — log returns for price, pct change for volume.",
      badge: "STATISTICAL TEST",
      badgeClass: "badge-warning",
    },
    {
      tag: "REGIME ENGINE",
      title: "Market Regime Detection",
      desc: "Rolling window mean and volatility shift analysis. Flags COVID-style breaks, structural changes, and volatility clustering.",
      badge: "ML IMPACT: HIGH",
      badgeClass: "badge-warning",
    },
    {
      tag: "ISOLATION FOREST",
      title: "Anomaly Detection",
      desc: "Sklearn Isolation Forest flags statistically anomalous rows. Tiered severity with winsorization recommendations.",
      badge: "ML POWERED",
      badgeClass: "badge-info",
    },
    {
      tag: "SCORING ENGINE",
      title: "ML Readiness Score",
      desc: "Composite 0–100 score with weighted penalties across all dimensions. Deterministic — same dataset, same score.",
      badge: "DETERMINISTIC",
      badgeClass: "badge-info",
    },
    {
      tag: "RULE ENGINE",
      title: "Expert Explanations",
      desc: "Zero AI calls. Pure rule-based engine produces finding, fix, and impact for every issue — specific to your column names.",
      badge: "NO API COST",
      badgeClass: "badge-info",
    },
  ];

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="logo">
          <span className="logo-dot" />
          DataLens Financial
        </div>
        
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-tag">Financial ML Dataset Intelligence</div>
        <h1>Your dataset is<br /><span className="gradient-text">lying to you.</span></h1>
        <p className="hero-sub">
          Look-ahead bias. Regime shifts. Non-stationary columns.<br />
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
          ["100%", "Rule-Based Engine"],
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
            <div className="feat-tag">
              <span className="feat-dot" />
              {f.tag}
            </div>
            <div className="feat-title">{f.title}</div>
            <div className="feat-desc">{f.desc}</div>
            <span className={`badge ${f.badgeClass}`}>{f.badge}</span>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bottom-cta">
        <h2>Ready to audit your<br /><span className="gradient-text">financial dataset?</span></h2>
        <p>Upload a CSV. Get a full ML readiness report in seconds.</p>
        <button className="btn-primary" onClick={() => fileRef.current.click()}>
          Open Analyzer →
        </button>
      </div>
    </div>
  );
}