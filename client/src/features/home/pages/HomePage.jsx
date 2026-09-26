import { Link } from 'react-router-dom'
import { clerkEnabled } from '../../../app/auth.jsx'
import './HomePage.css'

const STEPS = [
  {
    title: 'Daily Energy Check-In',
    body: 'Record your mood, energy, and what happened, without needing to explain everything.',
  },
  {
    title: 'Pattern Recognition',
    body: 'As your check-ins build, simple rules look for recurring situations and changes in your energy.',
  },
  {
    title: 'Boundary Awareness',
    body: 'Notice which interactions leave you drained and reflect on where a boundary might help. You decide if anything changes.',
  },
]

function HeroImagePlaceholder() {
  return (
    <div
      className="landing-hero__image-placeholder"
      role="img"
      aria-label="Placeholder for the person-led homepage photograph"
    >
      <span>Person-led image placeholder</span>
    </div>
  )
}

function FieldRecord() {
  return (
    <aside className="field-record" aria-label="Illustrative example of a check-in and pattern insight">
      <div className="field-record__topline">
        <p className="field-record__label">An evening, made legible</p>
        <p className="field-record__sample">Illustrative example · synthetic entries</p>
      </div>

      <section className="field-record__entry" aria-labelledby="record-entry-title">
        <p className="field-record__section-label">Tonight&apos;s check-in</p>
        <h3 id="record-entry-title">Thursday, 7:40 pm</h3>
        <dl className="field-record__readings">
          <div><dt>Feeling</dt><dd>Drained</dd></div>
          <div><dt>Energy</dt><dd>2 <span>/ 5</span></dd></div>
        </dl>
        <p className="field-record__note">“Said yes to plans I dreaded.”</p>
      </section>

      <section className="field-record__evidence" aria-labelledby="record-evidence-title">
        <p className="field-record__section-label" id="record-evidence-title">What the check-ins show</p>
        <ul>
          <li><strong>3</strong><span>draining evenings in 7 days</span></li>
          <li><strong>×2</strong><span>low energy after late plans</span></li>
          <li><strong>×3</strong><span>context tag “obligation”</span></li>
        </ul>
      </section>

      <section className="field-record__reflection" aria-label="Example insight">
        <p><strong>Observed</strong> Several recent check-ins mention feeling drained after agreeing to plans.</p>
        <p><strong>Reflection</strong> Notice whether you say yes when you would rather rest.</p>
        <p className="field-record__confidence">A reflection to consider · based on 4 check-ins</p>
      </section>
    </aside>
  )
}

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-hero-wrapper">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-hero__eyebrow">A little room to check in with yourself</p>
            <h1 className="landing-hero__title" id="landing-title">
              Make sense of what’s weighing on you.
              <span>Notice patterns. Honor your energy.</span>
            </h1>
            <p className="landing-hero__trust">Pattern awareness, never a diagnosis.</p>
          </div>

          <div className="landing-hero__visual">
            <HeroImagePlaceholder />
            <div className="landing-hero__support">
              <p>
                Record how you feel, notice what tends to drain you, and reflect on your boundaries.
                The patterns come from your own check-ins; any next step is yours to choose.
              </p>
              <div className="landing-hero__actions">
                <Link to="/check-in" className="landing-button landing-button--primary">Take a 30-second check-in</Link>
                <a className="landing-button landing-button--secondary" href="#how-it-works">See how it works</a>
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
          </div>
        </section>
      </div>

      <section className="landing-example" aria-labelledby="example-title">
        <div className="landing-example__intro">
          <h2 id="example-title">One check-in can become a useful reflection.</h2>
          <p>
            Your own notes are the starting point. Over time, repeated experiences may reveal a pattern
            worth pausing with.
          </p>
        </div>
        <FieldRecord />
      </section>

      <section className="landing-process" id="how-it-works" aria-labelledby="process-title">
        <div className="landing-section-heading">
          <h2 id="process-title">From check-in to reflection</h2>
          <p>A little history can make recurring patterns easier to notice.</p>
        </div>
        <ol className="landing-process__list">
          {STEPS.map((step) => (
            <li className="landing-process__row" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-privacy" aria-labelledby="privacy-title">
        <div className="landing-privacy__copy">
          <h2 id="privacy-title">Your reflections belong only to you</h2>
          <p>
            Your reflections stay yours. You can view your timeline, export your data, or erase
            your history whenever you choose. Insights are for pattern awareness, not diagnosis.
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
