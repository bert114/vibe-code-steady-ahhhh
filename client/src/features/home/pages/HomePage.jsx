import { Link } from 'react-router-dom'
import { clerkEnabled } from '../../../app/auth.jsx'
import './HomePage.css'

const STEPS = [
  {
    title: 'Daily Energy Check-In',
    body: 'Check in with how you feel in seconds. A simple scale helps you register mood and drain without overthinking.',
    example: <><span>Evening</span><span>drained</span><span>energy 2/5</span></>,
    label: 'Illustrative check-in',
  },
  {
    title: 'Pattern Recognition',
    body: 'Rule-based evidence brings recurring draining days and energy dips into view before any interpretation.',
    example: <><span>3 draining evenings / 7 days</span><span>low energy ×2 after late plans</span></>,
    label: 'Illustrative pattern evidence',
  },
  {
    title: 'Boundary Awareness',
    body: 'A reflection can help you notice where you may be overextending yourself. You decide what, if anything, to do next.',
    example: <><span>Observed: drained after agreeing to plans.</span><span>Reflection: notice when you say yes but mean rest.</span></>,
    label: 'Illustrative observation and reflection',
  },
]

function FieldRecord() {
  return (
    <aside className="field-record" aria-label="Illustrative example of a check-in and pattern insight">
      <div className="field-record__topline">
        <p className="field-record__label">An evening, made legible</p>
        <p className="field-record__sample">Illustrative example · synthetic entries</p>
      </div>

      <section className="field-record__entry" aria-labelledby="record-entry-title">
        <p className="field-record__section-label">Tonight&apos;s check-in</p>
        <h2 id="record-entry-title">Thursday, 7:40 pm</h2>
        <dl className="field-record__readings">
          <div><dt>Feeling</dt><dd>Drained</dd></div>
          <div><dt>Energy</dt><dd>2 <span>/ 5</span></dd></div>
        </dl>
        <p className="field-record__note">“Said yes to plans I dreaded.”</p>
      </section>

      <section className="field-record__evidence" aria-labelledby="record-evidence-title">
        <p className="field-record__section-label" id="record-evidence-title">What the rules observe</p>
        <ul>
          <li><strong>3</strong><span>draining evenings in 7 days</span></li>
          <li><strong>×2</strong><span>low energy after late plans</span></li>
          <li><strong>×3</strong><span>context tag “obligation”</span></li>
        </ul>
      </section>

      <section className="field-record__reflection" aria-label="Example insight">
        <p><strong>Observed</strong> Several recent check-ins mention feeling drained after agreeing to plans.</p>
        <p><strong>Reflection</strong> Notice whether you say yes when you would rather rest.</p>
        <p className="field-record__confidence">Confidence: medium · based on 4 check-ins</p>
      </section>
    </aside>
  )
}

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy">
          <h1 className="landing-hero__title" id="landing-title">
            Steady-Ahh
            <span>Notice your patterns. Honor your energy.</span>
          </h1>
          <p className="landing-hero__lead">
            Steady-Ahh helps you understand where your energy goes. A 30-second check-in becomes
            objective evidence of draining patterns, explained calmly with boundary reflections
            you decide on. Pattern awareness, never medical diagnosis.
          </p>
          <div className="landing-hero__actions">
            <a className="landing-button landing-button--primary" href="#how-it-works">See how it works</a>
            <Link to="/check-in" className="landing-button landing-button--secondary">Take a 30-second check-in</Link>
          </div>
          <p className="landing-hero__auth-hint">
            {clerkEnabled ? (
              <>Already have an account? <Link to="/sign-in">Sign in</Link> or{' '}
                <Link to="/sign-up">create a private account</Link>.</>
            ) : (
              <>Returning? <Link to="/dashboard">Open dashboard</Link>.</>
            )}
          </p>
        </div>
        <FieldRecord />
      </section>

      <section className="landing-process" id="how-it-works" aria-labelledby="process-title">
        <div className="landing-section-heading">
          <h2 id="process-title">How Steady-Ahh works</h2>
          <p>A small record can make recurring patterns easier to see.</p>
        </div>
        <ol className="landing-process__list">
          {STEPS.map((step) => (
            <li className="landing-process__row" key={step.title}>
              <div className="landing-process__description">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              <p className="landing-process__example" aria-label={step.label}>{step.example}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-privacy" aria-labelledby="privacy-title">
        <div className="landing-privacy__copy">
          <h2 id="privacy-title">Your reflections belong only to you</h2>
          <p>
            No invasive profiling, no medical diagnosis, and no unsolicited advice. You can view
            your complete timeline, export your data anytime as JSON, or erase your history
            whenever you choose.
          </p>
        </div>
        <ul className="landing-privacy__assurances" aria-label="Privacy assurances">
          <li>Export anytime</li>
          <li>Erase anytime</li>
          <li>Never a diagnosis</li>
        </ul>
        <div className="landing-privacy__actions">
          <Link to="/settings" className="landing-button landing-button--secondary">Review privacy &amp; settings</Link>
          <Link to="/check-in" className="landing-button landing-button--primary">Start with tonight&apos;s check-in</Link>
        </div>
      </section>
    </main>
  )
}
