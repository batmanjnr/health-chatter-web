const REPORTS = ['ECG Auto-Read', 'CBC Panel', 'Chest X-Ray (AI)', 'Lipid Profile', 'Blood Sugar']

const VITALS = [
  { label: 'HR', value: '112 bpm' },
  { label: 'BP', value: '148/92' },
  { label: 'SpO₂', value: '94%' },
  { label: 'Temp', value: '37.8°C' },
]

export default function Workspace() {
  return (
    <section className="workspace" id="workspace">
      <div className="container">
        <h2 className="doodle-title">Clinical Workspace</h2>

        <div className="ws-window">
          <div className="ws-window__bar">
            <span className="ws-dots" aria-hidden="true">
              <i /> <i /> <i />
            </span>
            <span className="ws-window__crumb">Patients / 02581</span>
          </div>

          <div className="ws-grid">
            <div className="ws-card ws-card--yellow">
              <small>Risk Score</small>
              <p className="ws-score">
                7.8 <span>/10 high</span>
              </p>
              <div className="ws-meter">
                <span style={{ width: '78%' }} />
              </div>
              <small className="ws-muted">
                Predicted Deterioration In Next 12h
                <br />
                Recommended: Triage + ECG
              </small>
            </div>

            <div className="ws-card ws-card--teal">
              <small>Live Vitals</small>
              <div className="ws-vitals">
                {VITALS.map((v) => (
                  <div key={v.label} className="ws-vital">
                    <small>{v.label}</small>
                    <b>{v.value}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="ws-card ws-card--blue">
              <small>AI Insight</small>
              <p className="ws-insight">
                Pattern Matches Acute Coronary Syndrome · 72% Confidence
              </p>
              <ul>
                <li>3 Elevated Vitals In Last 6h</li>
                <li>Family History Flagged</li>
                <li>Prior Similar Admission 2024</li>
              </ul>
            </div>

            <div className="ws-card ws-card--chart">
              <div className="ws-card__row">
                <small>Heart Rate · Last 60 Min</small>
                <small className="ws-up">+18%</small>
              </div>
              <svg viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 140 C40 140 60 20 110 20 C160 20 170 140 200 140 C230 140 240 20 290 20 C340 20 360 140 400 140"
                  fill="none"
                  stroke="#2E7BEF"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                />
                <circle cx="230" cy="62" r="6" fill="#2E7BEF" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>

            <div className="ws-card ws-card--reports">
              <small>Recent Reports</small>
              <ul>
                {REPORTS.map((r) => (
                  <li key={r}>
                    <span>{r}</span>
                    <small>Today</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
