import { useEffect, useRef } from 'react'
import { showDialogForLiveSession } from '../../../lib/ui/liveDialogMode.js'
import { resolveActivity, useRecoveryStore } from '../store.js'

export default function HelpedPromptModal({
  open,
  targetBreak,
  thankYouMessage,
  offerAnotherActivity = false,
  drainingActivity = null,
  onSubmit,
  onSkip,
  onClose,
  onTryAnother,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      showDialogForLiveSession(dialog)
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  if (!open) return null

  const customActivities = useRecoveryStore.getState().state.customActivities || []
  const activityMeta = resolveActivity(targetBreak?.activity, customActivities)
  const activityName = activityMeta ? activityMeta.label.toLowerCase() : 'break'
  const contextName = drainingActivity || targetBreak?.drainingActivity

  return (
    <dialog
      ref={dialogRef}
      className="recovery-modal recovery-modal--prompt"
      aria-labelledby="recovery-prompt-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="recovery-modal__content">
        <header className="recovery-modal__header">
          <div className="recovery-modal__eyebrow">
            <span className="recovery-modal__eyebrow-dot" aria-hidden="true" />
            <span>Steady Mind · Follow-up</span>
          </div>

          <h2 id="recovery-prompt-title" className="recovery-modal__title">
            {offerAnotherActivity
              ? 'Would you like to try another activity?'
              : thankYouMessage
              ? 'Pause recorded'
              : `Welcome back. Did the ${activityName} help?`}
          </h2>
          <p className="recovery-modal__lead">
            {offerAnotherActivity
              ? `Since ${activityName} didn’t fully ease the strain, trying a different pause (like a short walk or glass of water) might help you reset.`
              : thankYouMessage ||
                (contextName
                  ? `Steady Mind noticed you were carrying drain from ${contextName}. Did this pause help recharge your energy?`
                  : 'Steady Mind learns what helps you recharge so future suggestions feel more supportive.')}
          </p>
        </header>

        {offerAnotherActivity ? (
          <div className="recovery-followup-box">
            <div className="recovery-modal__actions">
              <button
                type="button"
                className="btn recovery-modal__start-btn"
                onClick={onTryAnother}
              >
                Try another activity &rarr;
              </button>
              <button
                type="button"
                className="recovery-modal__dismiss-btn"
                onClick={onClose}
              >
                I&apos;ll rest for now
              </button>
            </div>
          </div>
        ) : !thankYouMessage ? (
          <>
            <div className="recovery-outcomes-grid" role="group" aria-label="Did that help?">
              <button
                type="button"
                className="recovery-outcome-btn recovery-outcome-btn--helped"
                onClick={() => onSubmit('helped')}
              >
                <span className="recovery-outcome-btn__emoji" aria-hidden="true">🌱</span>
                <strong>Helped</strong>
                <span>Felt noticeably better</span>
              </button>

              <button
                type="button"
                className="recovery-outcome-btn recovery-outcome-btn--a-little"
                onClick={() => onSubmit('a_little')}
              >
                <span className="recovery-outcome-btn__emoji" aria-hidden="true">🌤️</span>
                <strong>A little</strong>
                <span>Slight relief or pause</span>
              </button>

              <button
                type="button"
                className="recovery-outcome-btn recovery-outcome-btn--not-really"
                onClick={() => onSubmit('not_really')}
              >
                <span className="recovery-outcome-btn__emoji" aria-hidden="true">🍂</span>
                <strong>Not really</strong>
                <span>Still feeling drained</span>
              </button>
            </div>

            <footer className="recovery-modal__actions recovery-modal__actions--center">
              <button
                type="button"
                className="recovery-modal__skip-link"
                onClick={onSkip}
              >
                Skip for now
              </button>
            </footer>
          </>
        ) : (
          <div className="recovery-thankyou-badge">
            <span className="recovery-thankyou-icon" aria-hidden="true">✓</span>
            <span>Saved to your personal recovery history</span>
          </div>
        )}
      </div>
    </dialog>
  )
}
