import { Link } from 'react-router-dom'
import { clerkEnabled } from '../../../app/auth.jsx'

function BatteryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
      <line x1="6" y1="11" x2="10" y2="11" />
    </svg>
  )
}

function SignalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2">
      <path d="M3 18v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__badge">A quiet space for emotional clarity</div>
        <h1 className="home-hero__title">
          Steady-Ahh
          <span className="home-hero__subtitle">Notice your patterns. Honor your energy.</span>
        </h1>
        <p className="home-hero__lead">
          Steady-Ahh helps you understand where your energy goes, notice recurring emotional drains before burnout sets in, and reflect on personal boundaries with gentle, non-judgmental awareness.
        </p>

        <div className="home-hero__actions">
          <Link to="/check-in" className="btn-primary home-hero__btn-main">
            Take a 30-second check-in
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Open dashboard
          </Link>
        </div>

        {clerkEnabled && (
          <p className="home-hero__auth-hint">
            Already have an account? <Link to="/sign-in" className="btn-link">Sign in</Link> or{' '}
            <Link to="/sign-up" className="btn-link">create a private account</Link>.
          </p>
        )}
      </section>

      <section className="home-pillars" aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="home-pillars__title">Designed for quiet reflection</h2>
        <div className="home-pillars__grid">
          <article className="pillar-card">
            <div className="pillar-card__icon" aria-hidden="true">
              <BatteryIcon />
            </div>
            <h3>Daily Energy Check-In</h3>
            <p>
              Check in with how you feel in seconds. A simplified 3-point scale and battery metaphor help you register mood and drain without overthinking.
            </p>
          </article>

          <article className="pillar-card">
            <div className="pillar-card__icon" aria-hidden="true">
              <SignalIcon />
            </div>
            <h3>Pattern Recognition</h3>
            <p>
              Rule-based evidence detects consecutive draining days and energy dips. We show you the objective observations before any interpretation.
            </p>
          </article>

          <article className="pillar-card">
            <div className="pillar-card__icon" aria-hidden="true">
              <ShieldIcon />
            </div>
            <h3>Boundary Awareness</h3>
            <p>
              Reflective prompts help you spot situations where you may be overextending yourself, giving you the clarity to decide what boundaries to protect.
            </p>
          </article>
        </div>
      </section>

      <section className="home-sovereignty" aria-labelledby="privacy-heading">
        <div className="home-sovereignty__inner">
          <h2 id="privacy-heading">Your reflections belong only to you</h2>
          <p>
            No invasive profiling, no medical diagnosis, and no unsolicited advice. You can view your complete timeline, export your data anytime as JSON, or erase your history whenever you choose.
          </p>
          <div className="home-sovereignty__links">
            <Link to="/settings" className="btn-ghost btn-sm">
              Review privacy & settings
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
