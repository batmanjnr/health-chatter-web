const STEPS = [
  {
    n: '01',
    title: 'Upload Patient Data',
    text: 'Records, labs and vitals sync securely — even after offline capture.',
    icon: '☁️',
    pos: 'step--1',
  },
  {
    n: '02',
    title: 'AI Analyzes Records',
    text: 'Models Cross-Reference History, Signals, And Guidelines In Seconds.',
    icon: '🧠',
    pos: 'step--2',
  },
  {
    n: '03',
    title: 'Risk Is Scored',
    text: 'Vitals and results are scored against clinical thresholds in real time.',
    icon: '📊',
    pos: 'step--3',
  },
  {
    n: '04',
    title: 'System Predicts Condition',
    text: 'Ranked Differentials With Confidence Scores And Supporting Evidence.',
    icon: '🛡️',
    pos: 'step--4',
  },
  {
    n: '05',
    title: 'Doctor Reviews & Confirms',
    text: 'A verified clinician makes the final call and signs the record.',
    icon: '👨🏿‍⚕️',
    pos: 'step--5',
  },
]

export default function HowItWorks() {
  return (
    <section className="how" id="how-it-works">
      <div className="how__stars" aria-hidden="true" />
      <div className="container how__inner">
        <h2 className="doodle-title doodle-title--light">How It Works</h2>

        <div className="how__head">
          <p className="how__lead">
            From Signal To
            <br />
            Decision In Seconds
          </p>
          <p className="how__note">
            Turn Healthcare Data Into Real-Time Insights For Faster, Smarter Decisions.
          </p>
        </div>

        <ol className="how__steps">
          {STEPS.map((s) => (
            <li key={s.n} className={`step ${s.pos}`}>
              <div className="step__body">
                <span className="step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              <span className="step__icon" aria-hidden="true">{s.icon}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
