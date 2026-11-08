import { useRecoveryStore } from '../store.js'

export default function BreakSuggestionCard() {
  const { state, openPicker, dismissPatternCard, isPatternDismissed } = useRecoveryStore()

  if (state.suggestBreak?.reason !== 'drain_pattern' || isPatternDismissed()) {
    return null
  }

  const drainingActivity = state.suggestBreak?.drainingActivity || state.drainingStatus?.activity

  return (
    <article className="recovery-suggestion-card reveal" style={{ '--index': 1 }} aria-labelledby="recovery-suggestion-heading">
      <div className="recovery-suggestion-card__content">
        <div className="recovery-suggestion-card__eyebrow">
          <span className="recovery-suggestion-card__dot" aria-hidden="true" />
          <span>Steady Mind · Care observation</span>
          {drainingActivity && (
            <span className="recovery-suggestion-card__draining-tag">
              Draining: {drainingActivity}
            </span>
          )}
        </div>
        <h2 id="recovery-suggestion-heading" className="recovery-suggestion-card__title">
          A few draining days have shown up lately
        </h2>
        <p className="recovery-suggestion-card__desc">
          {drainingActivity
            ? `When ${drainingActivity.toLowerCase()} feels especially heavy, taking a quiet 5-minute break can help prevent burnout before it builds.`
            : 'When energy dips across several reflections, taking a quiet 5-minute break can help prevent burnout before it builds.'}
        </p>
        <div className="recovery-suggestion-card__actions">
          <button
            type="button"
            className="btn recovery-suggestion-card__cta"
            onClick={() => openPicker('drain_pattern', null, drainingActivity)}
          >
            Take a gentle break &rarr;
          </button>
          <button
            type="button"
            className="recovery-suggestion-card__dismiss"
            onClick={dismissPatternCard}
          >
            Not now
          </button>
        </div>
      </div>
    </article>
  )
}

