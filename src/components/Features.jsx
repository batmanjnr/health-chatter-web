function XrayVisual() {
  return (
    <svg viewBox="0 0 200 170" aria-hidden="true">
      <defs>
        <radialGradient id="xglow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#3CF2C5" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3CF2C5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="170" fill="#F4F6F7" />
      <circle cx="100" cy="80" r="80" fill="url(#xglow)" opacity="0.45" />
      {/* skull profile */}
      <path
        d="M60 95 C50 55 75 25 112 25 C148 25 168 52 160 85 C156 100 150 104 150 116 L132 120 L128 136 L100 136 L98 122 C80 122 66 112 60 95 Z"
        fill="#1DE2B0"
        stroke="#0B6B57"
        strokeWidth="2"
      />
      <ellipse cx="128" cy="72" rx="12" ry="10" fill="#0B4F5C" />
      <path d="M104 136 L104 148 M112 136 L112 150 M120 136 L120 148" stroke="#0B6B57" strokeWidth="3" />
      {/* spine */}
      {[148, 158].map((y) => (
        <rect key={y} x="84" y={y} width="22" height="8" rx="3" fill="#1DE2B0" stroke="#0B6B57" strokeWidth="1.5" />
      ))}
    </svg>
  )
}

function Hand() {
  return (
    <svg className="features__hand" viewBox="0 0 300 380" aria-hidden="true">
      <defs>
        <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#F2F2F2" />
          <stop offset="50%" stopColor="#B9BCC0" />
          <stop offset="100%" stopColor="#6F7378" />
        </linearGradient>
      </defs>
      <path d="M95 260 L205 260 L225 380 L75 380 Z" fill="url(#metal)" stroke="#4A4E53" strokeWidth="3" />
      <rect x="85" y="300" width="130" height="16" rx="6" fill="#55595E" />
      <rect x="85" y="335" width="130" height="10" rx="5" fill="#55595E" />
      <path
        d="M70 150 C70 120 90 110 120 110 L190 110 C220 110 236 130 236 160 L236 230 C236 260 214 272 186 272 L114 272 C86 272 70 250 70 222 Z"
        fill="url(#metal)"
        stroke="#4A4E53"
        strokeWidth="3"
      />
      <path
        d="M236 170 C268 150 282 120 270 96 C262 82 246 86 240 100 L226 140"
        fill="url(#metal)"
        stroke="#4A4E53"
        strokeWidth="3"
      />
    </svg>
  )
}

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container features__inner">
        <h2 className="doodle-title">Features</h2>

        <div className="features__stage">
          <Hand />
          <article className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">🧠</span>
            <h3>AI Diagnosis Assistant</h3>
            <p>Suggests Differential Diagnoses Ranked By Likelihood, With Evidence Trails.</p>
            <div className="feature-card__screen">
              <XrayVisual />
            </div>
          </article>
          <div className="features__fingers" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} />
            ))}
          </div>
        </div>

        <div className="features__foot">
          <p className="features__lead">
            One Intelligent System
            <br />
            For Healthcare.
          </p>
          <p className="features__note">
            Smarter Decisions, Faster Care, And Seamless Patient Management For Nigerian Hospitals,
            Powered By Intelligent Technology.
          </p>
        </div>
      </div>
    </section>
  )
}
