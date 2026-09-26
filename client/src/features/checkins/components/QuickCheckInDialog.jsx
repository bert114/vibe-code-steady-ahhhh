import { useEffect, useRef, useState } from 'react'
import { useCheckinsStore } from '../store.js'
import DrainIcon from './DrainIcon.jsx'
import EnergyIcon from './EnergyIcon.jsx'
import FaceIcon from './FaceIcon.jsx'

const EMPTY_CHECK_IN = {
  moodScore: null,
  energyScore: null,
  drainScore: null,
  emotions: '',
  contextTags: '',
  note: '',
}

const DIMENSIONS = [
  { key: 'moodScore', name: 'quick-mood', title: 'Mood', question: "How's your mood?", captions: ['Rough', 'Okay', 'Great'], Icon: FaceIcon },
  { key: 'energyScore', name: 'quick-energy', title: 'Energy', question: "How's your energy?", captions: ['Low', 'Steady', 'Full'], Icon: EnergyIcon },
  { key: 'drainScore', name: 'quick-drain', title: 'Drain', question: 'How draining has it felt?', captions: ['Light', 'Some', 'A lot'], Icon: DrainIcon },
]

function QuickRating({ dimension, value, onChange }) {
  const { Icon } = dimension
  return (
    <fieldset className="quick-checkin__rating">
      <legend>{dimension.question}</legend>
      <div className="quick-checkin__choices">
        {[1, 3, 5].map((score, index) => (
          <label key={score} className={`quick-checkin__choice${Number(value) === score ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name={dimension.name}
              value={score}
              checked={Number(value) === score}
              onChange={() => onChange(dimension.key, score)}
            />
            <Icon score={score} />
            <span>{dimension.captions[index]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function QuickCheckInDialog({ open, onClose }) {
  const dialogRef = useRef(null)
  const [draft, setDraft] = useState(EMPTY_CHECK_IN)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const saveQuickCheckIn = useCheckinsStore((state) => state.saveQuickCheckIn)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (open) {
      setDraft({ ...EMPTY_CHECK_IN })
      setSaveFailed(false)
    }
  }, [open])

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close()
    onClose()
  }

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveFailed(false)
    try {
      await saveQuickCheckIn(draft)
      closeDialog()
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="quick-checkin"
      aria-labelledby="quick-checkin-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        closeDialog()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog()
      }}
    >
      <form className="quick-checkin__form" onSubmit={save}>
        <header className="quick-checkin__header">
          <div>
            <p className="quick-checkin__eyebrow">A moment for you</p>
            <h2 id="quick-checkin-title">Quick check-in</h2>
            <p className="quick-checkin__intro">Notice where you are. You can add context if you want.</p>
          </div>
          <button type="button" className="quick-checkin__close" aria-label="Close quick check-in" onClick={closeDialog}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>

        <div className="quick-checkin__ratings">
          {DIMENSIONS.map((dimension) => (
            <QuickRating
              key={dimension.key}
              dimension={dimension}
              value={draft[dimension.key]}
              onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </div>

        <details className="quick-checkin__details">
          <summary>Add a note or context <span>Optional</span></summary>
          <div className="quick-checkin__optional-fields">
            <label>
              What words fit how you feel?
              <input value={draft.emotions} onChange={(event) => setDraft((current) => ({ ...current, emotions: event.target.value }))} placeholder="e.g. tired, hopeful" />
            </label>
            <label>
              What was going on?
              <input value={draft.contextTags} onChange={(event) => setDraft((current) => ({ ...current, contextTags: event.target.value }))} placeholder="e.g. a busy day, family" />
            </label>
            <label>
              Anything else?
              <textarea value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} rows={3} maxLength={5000} placeholder="Only if it helps you remember this moment" />
            </label>
          </div>
        </details>

        <p className="quick-checkin__hint">Choose one response in each row to save.</p>

        {saveFailed && <p className="quick-checkin__error" role="alert">Your check-in couldn't be saved. Please try again.</p>}

        <footer className="quick-checkin__footer">
          <button type="button" className="quick-checkin__cancel" onClick={closeDialog}>Cancel</button>
          <button type="submit" className="quick-checkin__save" disabled={saving || DIMENSIONS.some(({ key }) => !draft[key])}>
            {saving ? 'Saving…' : 'Save check-in'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
