import { useState } from 'react'
import Logo from './Logo.jsx'

export const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="nav container">
      <div className="nav__pill">
        <Logo />
        <button
          className="nav__menu-btn"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <ul className={`nav__links ${open ? 'is-open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          </li>
        ))}
        <li className="nav__actions">
          <a href="/login" className="btn btn--white">Sign In</a>
          <a href="/signup" className="btn btn--yellow">Book Demo</a>
        </li>
      </ul>
    </nav>
  )
}
