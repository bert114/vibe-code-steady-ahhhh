import { Link, NavLink } from 'react-router-dom'
import ToastStack from '../components/ui/Toast.jsx'

// Persistent chrome for the whole app: a slim top bar with the destinations
// a signed-in person needs, so no page is ever a dead end.
// Presentation only — no data fetching, no store access.
const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/check-in', label: 'Check-In' },
  { to: '/trends', label: 'Trends' },
  { to: '/insights', label: 'Insights' },
  { to: '/settings', label: 'Settings' },
]

function linkClassName({ isActive }) {
  return isActive ? 'app-nav__link is-active' : 'app-nav__link'
}

export default function AppShell({ children, variant = 'app' }) {
  if (variant === 'landing') {
    return (
      <div className="app-shell app-shell--landing">
        <header className="app-nav app-nav--landing">
          <div className="app-nav__inner">
            <Link to="/" className="app-nav__brand">
              Steady-Ahh
            </Link>
            <nav className="landing-nav" aria-label="Primary">
              <a href="#how-it-works" className="landing-nav__link">How it works</a>
              <Link to="/check-in" className="landing-nav__start">Start a check-in</Link>
            </nav>
          </div>
        </header>
        {children}
        <ToastStack />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav__inner">
          <Link to="/" className="app-nav__brand">
            Steady-Ahh
          </Link>
          <nav aria-label="Primary">
            <ul className="app-nav__links">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={linkClassName}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      {children}
      <ToastStack />
    </div>
  )
}
