import Logo from './Logo.jsx'
import DoctorIllustration from './DoctorIllustration.jsx'
import { NAV_LINKS } from './Navbar.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        

        <div className="footer__hero">
          <span className="footer__word footer__word--health">HEALTH</span>
          <DoctorIllustration className="footer__doctor" />
          <span className="footer__word footer__word--care">CHATTER</span>
        </div>

        <div className="footer__mid">
          <p className="footer__lead">
            AI-Powered Care For
            <br />
            Modern Nigerian Hospitals
          </p>
          <p className="footer__note">
            Simplify complex healthcare workflows with intelligent automation and real-time
            clinical insights.
          </p>
        </div>

        <div className="footer__bottom">
          <span>© 2026 Healthchatter. All rights reserved.</span>
          <span className="footer__legal">
            <a href="#terms">Terms &amp; Conditions</a>
            <a href="#privacy">Privacy Policy</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
