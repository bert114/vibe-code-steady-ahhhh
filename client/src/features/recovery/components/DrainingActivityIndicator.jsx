export default function DrainingActivityIndicator({ drainingActivity, onOpenSuggestions, onDismiss }) {
  if (!drainingActivity) return null

  return (
    <aside className="recovery-draining-chip" role="status" aria-label="Draining activity notice">
      <div className="recovery-draining-chip__content">
        <span className="recovery-draining-chip__dot" aria-hidden="true" />
        <div className="recovery-draining-chip__info">
          <span className="recovery-draining-chip__label">Experiencing draining activity</span>
          <strong className="recovery-draining-chip__name">{drainingActivity}</strong>
        </div>
        <button
          type="button"
          className="recovery-draining-chip__action"
          onClick={onOpenSuggestions}
        >
          Suggested activities &rarr;
        </button>
        <button
          type="button"
          className="recovery-draining-chip__close"
          aria-label="Dismiss draining notice"
          onClick={onDismiss}
        >
          &times;
        </button>
      </div>
    </aside>
  )
}

