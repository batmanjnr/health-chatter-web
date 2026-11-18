import DoctorIllustration from './DoctorIllustration.jsx'
import logoMark from '../assets/logo-mark.png'

const STATS = [
  { label: 'Total Patients', value: '2543', icon: '👤' },
  { label: 'AI Diagnoses', value: '892', icon: '🧠' },
  { label: 'Appointments', value: '156', icon: '📅' },
]

const PATIENTS = [
  { name: 'Chidinma Okafor', note: 'General Checkup', color: '#F5B841' },
  { name: 'Babatunde Adeyemi', note: 'Cardiology', color: '#0E9C8F' },
  { name: 'Tunde Bakare', note: 'Orthopedics', color: '#F07FB4' },
  { name: 'Aisha Bello', note: 'Antenatal Care', color: '#2E7BEF' },
]

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__cream">
        <h1 className="hero__title" aria-label="Smart">SMART</h1>
        <p className="hero__kicker">AI HEALTHCARE</p>

        <div className="hero__visuals container">
          <div className="dash" aria-hidden="true">
            <aside className="dash__side">
              <img src={logoMark} alt="" width="22" height="22" />
              <span className="dash__dot is-active" />
              <span className="dash__dot" />
              <span className="dash__dot" />
              <span className="dash__dot" />
            </aside>
            <div className="dash__main">
              <div className="dash__top">
                <strong>AI Healthcare</strong>
                <span className="dash__search">🔍 Search</span>
                <span className="dash__bell">🔔</span>
              </div>
              <div className="dash__stats">
                {STATS.map((s) => (
                  <div className="dash__stat" key={s.label}>
                    <span className="dash__stat-icon">{s.icon}</span>
                    <div>
                      <small>{s.label}</small>
                      <b>{s.value}</b>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dash__body">
                <div className="dash__list">
                  <small>Total Patients</small>
                  {PATIENTS.map((p) => (
                    <div className="dash__patient" key={p.name}>
                      <span className="avatar" style={{ background: p.color }}>
                        {p.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <div>
                        <b>{p.name}</b>
                        <small>{p.note}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dash__chart">
                  <small>Patient Health Trends</small>
                  <svg viewBox="0 0 300 120" preserveAspectRatio="none">
                    <path
                      d="M0 80 C25 20 45 20 65 70 S105 120 130 60 S170 0 195 50 S240 110 260 70 S290 30 300 40"
                      fill="none"
                      stroke="#2E7BEF"
                      strokeWidth="2.5"
                    />
                    <circle cx="65" cy="70" r="5" fill="#2E7BEF" stroke="#fff" strokeWidth="2" />
                  </svg>
                  <div className="dash__days">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="doc-card">
            <div className="doc-card__head">
              <img src={logoMark} alt="" width="22" height="22" />
              <span className="doc-card__year">2026</span>
            </div>
            <DoctorIllustration className="doc-card__img" />
          </div>
        </div>
      </div>

      <div className="hero__band">
        <div className="container hero__band-inner">
          <p>
            Transforming healthcare in Nigeria with AI-powered insights, smarter diagnostics, and
            seamless patient care experiences.
          </p>
          <div className="hero__ctas">
            <a href="/signup" className="btn btn--yellow">Get Started</a>
            <a href="/login" className="btn btn--white">Sign In</a>
          </div>
        </div>
      </div>
    </section>
  )
}
