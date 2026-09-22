import { Link, NavLink } from 'react-router-dom'

// Persistent chrome for the whole app: a slim top bar with the four
// destinations a signed-in person needs, so no page is ever a dead end.
// Presentation only — no data fetching, no store access.
const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/check-in', label: 'Check-In' },
  { to: '/insights', label: 'Insights' },
  { to: '/settings', label: 'Settings' },
]

function linkClassName({ isActive }) {
  return isActive ? 'app-nav__link is-active' : 'app-nav__link'
}

export default function AppShell({ children }) {
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
    </div>
  )
}
