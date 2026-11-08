import { useEffect, useRef, useState } from 'react'
import { showDialogForLiveSession } from '../../../lib/ui/liveDialogMode.js'
import { ACTIVITIES, DURATIONS } from '../store.js'

function ActivityIcon({ id }) {
  switch (id) {
    case 'breathe':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12c1.5-2 3-2 4 0s2.5 2 4 0" />
        </svg>
      )
    case 'walk':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <path d="m9 20 3-6 2 3 3-5" />
          <path d="m6 13 4-3 3 2 4-3" />
        </svg>
      )
    case 'stretch':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <path d="m6 9 6 3 6-3" />
          <path d="M12 12v8" />
          <path d="m8 20 4-2 4 2" />
        </svg>
      )
    case 'water':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      )
    case 'music':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    case 'quiet':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )
  }
}

// 7-segment arched energy gauge inspired by the reference design
function ArchedEnergyGauge() {
  const segments = [
    { start: 194, end: 212, active: true },
    { start: 217, end: 235, active: true },
    { start: 240, end: 258, active: true },
    { start: 263, end: 281, active: true },
    { start: 286, end: 304, active: false },
    { start: 309, end: 327, active: false },
    { start: 332, end: 350, active: false },
  ]

  const cx = 95
  const cy = 82
  const r = 62

  function describeArc(startAngle, endAngle) {
    const rad = (deg) => ((deg - 90) * Math.PI) / 180.0
    const x1 = cx + r * Math.cos(rad(startAngle))
    const y1 = cy + r * Math.sin(rad(startAngle))
    const x2 = cx + r * Math.cos(rad(endAngle))
    const y2 = cy + r * Math.sin(rad(endAngle))
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }

  return (
    <div className="recovery-arch-gauge" aria-hidden="true">
      <svg viewBox="0 0 190 95" className="recovery-arch-svg" focusable="false">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={describeArc(seg.start, seg.end)}
            fill="none"
            stroke={seg.active ? '#e07a5f' : '#ded6cb'}
            strokeWidth="8"
            strokeLinecap="round"
            className={seg.active ? 'recovery-arch-segment--active' : 'recovery-arch-segment--resting'}
          />
        ))}
      </svg>
      <div className="recovery-arch-center-note">
        <span className="recovery-arch-center-tag">Resting</span>
      </div>
    </div>
  )
}

export default function BreakPickerModal({
  open,
  trigger,
  drainingActivity,
  activityStats,
  customActivities = [],
  onStart,
  onClose,
  onAddCustomActivity,
  initialStep = 1,
}) {
  const dialogRef = useRef(null)
  const [step, setStep] = useState(initialStep)
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0].id)
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [showAddForm, setShowAddForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customHint, setCustomHint] = useState('')
  const [savingCustom, setSavingCustom] = useState(false)
  const [addError, setAddError] = useState(null)

  useEffect(() => {
    if (open) {
      setStep(initialStep)
      setShowAddForm(false)
    }
  }, [open, initialStep])

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

  const isPattern = trigger === 'drain_pattern'
  const isFollowUp = trigger === 'follow_up'
  const title = isFollowUp
    ? 'Let’s try a different activity to help reset your energy.'
    : isPattern
    ? 'A few draining days have shown up lately. A short break might feel good.'
    : 'That sounds like a heavy day. Want to step away for a few minutes?'

  const helpedMap = new Map((activityStats ?? []).map((s) => [s.activity, s.helped > 0]))

  const allActivities = [
    ...ACTIVITIES,
    ...customActivities.map((c) => ({
      id: `custom:${c.id}`,
      label: c.name,
      hint: c.hint || 'Custom recovery activity',
      isCustom: true,
    })),
  ]

  const selectedActivityObj = allActivities.find((a) => a.id === selectedActivity) ?? allActivities[0]

  const handleSaveCustom = async (e) => {
    e.preventDefault()
    if (!customName.trim()) {
      setAddError('Please enter a name for your activity.')
      return
    }
    setSavingCustom(true)
    setAddError(null)
    try {
      const created = await onAddCustomActivity?.({
        name: customName.trim(),
        hint: customHint.trim(),
      })
      if (created?.id) {
        setSelectedActivity(`custom:${created.id}`)
      }
      setCustomName('')
      setCustomHint('')
      setShowAddForm(false)
    } catch {
      setAddError('Could not save your activity right now. Please try again.')
    } finally {
      setSavingCustom(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="recovery-modal"
      aria-labelledby="recovery-picker-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="recovery-modal__content recovery-modal__content--calm">
        <header className="recovery-modal__header recovery-modal__header--end">
          <button
            type="button"
            className="recovery-modal__close-btn"
            aria-label="Close recovery window"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="recovery-modal__calm-body">
          <h2 id="recovery-picker-title" className="recovery-modal__title">
            {drainingActivity ? `${drainingActivity} has been taking a lot out of you.` : 'Just a quiet moment to catch your breath.'}
          </h2>
          <p className="recovery-modal__lead">
            No performance, no solving anything right now. A few minutes is all it takes to reset.
          </p>

          <div className="recovery-modal__calm-activities" role="radiogroup" aria-label="Recovery activity">
            {allActivities.map((act) => {
              const isSelected = selectedActivity === act.id
              const hasHelped = helpedMap.get(act.id)
              return (
                <button
                  key={act.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`recovery-modal__calm-activity-chip ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedActivity(act.id)}
                >
                  <span className="recovery-modal__calm-activity-icon">
                    <ActivityIcon id={act.id} />
                  </span>
                  <span className="recovery-modal__calm-activity-label">{act.label}</span>
                  {hasHelped && (
                    <span className="recovery-modal__calm-activity-badge">Helped</span>
                  )}
                  {act.isCustom && (
                    <span className="recovery-modal__calm-activity-badge">Personal</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="recovery-modal__calm-custom-trigger">
            <button
              type="button"
              className="recovery-modal__add-custom-link"
              onClick={() => {
                setShowAddForm((prev) => !prev)
                setAddError(null)
              }}
            >
              {showAddForm ? 'Hide form' : '+ Add your own activity'}
            </button>
          </div>

          {showAddForm && (
            <form className="recovery-custom-form recovery-custom-form--calm" onSubmit={handleSaveCustom}>
              <div className="recovery-custom-form__head">
                <strong>Add personal recovery activity</strong>
              </div>
              <div className="recovery-custom-form__field">
                <label htmlFor="custom-activity-name">Activity name</label>
                <input
                  id="custom-activity-name"
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Pet my cat, Herbal tea"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={savingCustom}
                  autoFocus
                />
              </div>
              <div className="recovery-custom-form__field">
                <label htmlFor="custom-activity-hint">Note (optional)</label>
                <input
                  id="custom-activity-hint"
                  type="text"
                  maxLength={120}
                  placeholder="e.g. 5 minutes away from screens"
                  value={customHint}
                  onChange={(e) => setCustomHint(e.target.value)}
                  disabled={savingCustom}
                />
              </div>
              {addError && <p className="recovery-custom-form__error">{addError}</p>}
              <div className="recovery-custom-form__actions">
                <button
                  type="submit"
                  className="btn recovery-custom-form__save-btn"
                  disabled={savingCustom}
                >
                  {savingCustom ? 'Saving…' : 'Save & select'}
                </button>
                <button
                  type="button"
                  className="recovery-custom-form__cancel-btn"
                  onClick={() => setShowAddForm(false)}
                  disabled={savingCustom}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="recovery-modal__calm-durations" role="radiogroup" aria-label="Duration">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selectedDuration === d}
                className={`recovery-modal__calm-dur-chip ${selectedDuration === d ? 'is-selected' : ''}`}
                onClick={() => setSelectedDuration(d)}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <footer className="recovery-modal__actions recovery-modal__actions--column">
          <button
            type="button"
            className="btn recovery-modal__start-btn recovery-modal__start-btn--calm"
            onClick={() => onStart(selectedActivity, selectedDuration)}
          >
            Start {selectedDuration}-minute {selectedActivityObj?.label?.toLowerCase() || 'break'} &rarr;
          </button>
          <button
            type="button"
            className="recovery-modal__dismiss-btn"
            onClick={onClose}
          >
            Not right now
          </button>
        </footer>
      </div>
    </dialog>
  )
}
