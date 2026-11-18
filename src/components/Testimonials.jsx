/* PLACEHOLDER testimonial copied in shape from the demo. Replace with a real,
   consented clinician quote before launch. */
const LETTERS = [
  { ch: 'D', x: '6%', y: '8%', r: -12 },
  { ch: 'A', x: '38%', y: '0%', r: 8 },
  { ch: 'T', x: '70%', y: '10%', r: -6 },
  { ch: 'A', x: '2%', y: '52%', r: 10 },
  { ch: 'A', x: '44%', y: '58%', r: -8 },
  { ch: 'R', x: '78%', y: '54%', r: 6 },
]

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="testimonials__letters" aria-hidden="true">
        {LETTERS.map((l, i) => (
          <span key={i} style={{ left: l.x, top: l.y, transform: `rotate(${l.r}deg)` }}>
            {l.ch}
          </span>
        ))}
      </div>

      <div className="container testimonials__inner">
        <h2 className="doodle-title doodle-title--light">Testimonials</h2>

        <div className="testimonials__head">
          <p className="testimonials__lead">
            What Clinicians
            <br />
            Say About Us
          </p>
          <p className="testimonials__note">
            How Healthchatter Fits Into Their Daily Routine — And Gives Time Back To Patient Care.
          </p>
        </div>

        <figure className="t-card">
          <figcaption className="t-card__who">
            <span className="avatar" style={{ background: '#0E9C8F' }}>NO</span>
            <b>Dr. Ngozi Okonkwo</b>
          </figcaption>
          <div className="t-card__stars" aria-label="5 out of 5 stars">★★★★★</div>
          <blockquote>
            Healthchatter helped our doctors turn complex patient data into clear decisions within
            seconds. It improved both speed and confidence during critical moments.
          </blockquote>
        </figure>
      </div>
    </section>
  )
}
