import { useEffect, useRef, useState } from 'react'
import { useCheckinsStore } from '../store.js'
import DrainIcon from './DrainIcon.jsx'
import EnergyIcon from './EnergyIcon.jsx'
import FaceIcon from './FaceIcon.jsx'

const SCORES = [1, 3, 5]

// One question at a time, in plain language, with the scale explained in
// words instead of asking the user to interpret a bare number.
// Three options per step (ends + middle); the server accepts only {1, 3, 5}.
const SCORE_STEPS = [
  {
    key: 'moodScore',
    name: 'moodScore',
    question: "How's your mood right now?",
    captions: ['Rough', 'Okay', 'Great'],
    Icon: FaceIcon,
  },
  {
    key: 'energyScore',
    name: 'energyScore',
    question: "How's your energy?",
    captions: ['Running on empty', 'Steady', 'Full tank'],
    Icon: EnergyIcon,
  },
  {
    key: 'drainScore',
    name: 'drainScore',
    question: 'How draining has it been?',
    captions: ['Light', 'Moderate', 'Overwhelming'],
    Icon: DrainIcon,
  },
]

// Total steps = one per score, plus a final "anything else" step.
const TOTAL_STEPS = SCORE_STEPS.length + 1

const STEP_NAMES = ['Mood', 'Energy', 'Drain', 'Details']

function StepperSteps({ step, onJump }) {
  return (
    <ol className="stepper-steps">
      {STEP_NAMES.map((name, i) => {
        if (i === step) {
          return (
            <li key={name} aria-current="step" className="stepper-steps__item stepper-steps__item--active">
              <span className="stepper-steps__dot" aria-hidden="true" />
              {name}
            </li>
          )
        }
        if (i < step) {
          return (
            <li key={name} className="stepper-steps__item">
              <button type="button" className="stepper-steps__link" onClick={() => onJump(i)}>
                <span className="stepper-steps__dot stepper-steps__dot--done" aria-hidden="true" />
                {name}
              </button>
            </li>
          )
        }
        return (
          <li key={name} className="stepper-steps__item stepper-steps__item--todo" aria-disabled="true">
            <span className="stepper-steps__dot" aria-hidden="true" />
            {name}
          </li>
        )
      })}
    </ol>
  )
}

function ScoreStep({ meta, value, onSelect }) {
  const { Icon } = meta
  return (
    <fieldset className="score-step">
      <legend><h2 className="score-step__question">{meta.question}</h2></legend>
      <div role="radiogroup" aria-label={meta.question} className="score-options">
        {SCORES.map((score, i) => (
          <label key={score} className="score-option">
            <input
              type="radio"
              name={meta.name}
              value={score}
              checked={Number(value) === score}
              onChange={() => onSelect(score)}
            />
            <Icon score={score} />
            <span className="score-option__caption">{meta.captions[i]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function preventImplicitSubmit(event) {
  if (event.key === 'Enter') event.preventDefault()
}

function DetailsStep({ draft, setDraft, onEditAnswers, summaryRef }) {
  return (
    <div className="checkin-details">
      <p className="checkin-summary" ref={summaryRef} tabIndex={-1}>
        <span>
          Mood {draft.moodScore} · Energy {draft.energyScore} · Drain {draft.drainScore}
        </span>
        <button type="button" className="link-button" onClick={onEditAnswers}>
          Edit answers
        </button>
      </p>
      <p className="checkin-details__hint">Everything below is optional.</p>

      <div className="field">
        <label htmlFor="checkin-emotions">Emotions (comma-separated)</label>
        <input
          id="checkin-emotions"
          type="text"
          value={draft.emotions}
          onChange={(e) => setDraft({ emotions: e.target.value })}
          onKeyDown={preventImplicitSubmit}
          placeholder="e.g. tired, hopeful"
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="checkin-context">What was going on?</label>
        <input
          id="checkin-context"
          type="text"
          value={draft.contextTags}
          onChange={(e) => setDraft({ contextTags: e.target.value })}
          onKeyDown={preventImplicitSubmit}
          placeholder="e.g. work, family dinner"
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="checkin-note">Anything else?</label>
        <textarea
          id="checkin-note"
          value={draft.note}
          onChange={(e) => setDraft({ note: e.target.value })}
          rows={4}
          maxLength={5000}
        />
      </div>
    </div>
  )
}

// A short, one-decision-per-screen wizard: pick a score and the form moves
// on by itself, so recording a check-in never feels like filling out a
// questionnaire. All state and submission logic still lives in the store —
// this component only tracks which step is currently showing.
export default function CheckInForm({ onSubmit, saving }) {
  const { draft, setDraft, status } = useCheckinsStore()
  const [step, setStep] = useState(0)
  const prevStatusRef = useRef(status)
  const detailsSummaryRef = useRef(null)

  // A successful save clears the draft back to defaults — start the next
  // check-in from the first question instead of leaving the wizard parked
  // on the review step.
  useEffect(() => {
    if (prevStatusRef.current === 'saving' && status === 'succeeded') {
      setStep(0)
    }
    prevStatusRef.current = status
  }, [status])

  const isDetailsStep = step === SCORE_STEPS.length

  // When Step 4 mounts, move focus off the nav slot (where Next just
  // unmounted and Save mounts in the same spot) so a lingering Enter,
  // Space, or double-click intended as "Next" can't bleed into Save.
  useEffect(() => {
    if (isDetailsStep) detailsSummaryRef.current?.focus()
  }, [isDetailsStep])

  const currentMeta = SCORE_STEPS[step]

  function goNext() {
    setStep((s) => Math.min(s + 1, SCORE_STEPS.length))
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <form
      className="checkin-stepper"
      // No submit button exists in this form on purpose: Step 4 saves only
      // through an explicit Save click, never through implicit submission
      // (Enter in a field, repeated Next-keypress bleed, double-click).
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <div className="stepper-side">
        <p className="stepper-side__title">Check-In</p>
        <p className="stepper-progress__label">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
        <nav aria-label="Check-in steps">
          <StepperSteps step={step} onJump={setStep} />
        </nav>
      </div>

      <div className="stepper-main">
        {!isDetailsStep && (
          <ScoreStep
            meta={currentMeta}
            value={draft[currentMeta.key]}
            onSelect={(v) => {
              setDraft({ [currentMeta.key]: v })
              goNext()
            }}
          />
        )}

        {isDetailsStep && (
          <DetailsStep
            draft={draft}
            setDraft={setDraft}
            onEditAnswers={() => setStep(0)}
            summaryRef={detailsSummaryRef}
          />
        )}

        <div className="stepper-nav">
          {step > 0 && (
            <button type="button" className="stepper-nav__back" onClick={goBack}>
              Back
            </button>
          )}
          {!isDetailsStep ? (
            <button type="button" className="stepper-nav__next" onClick={goNext}>
              Next <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="button" className="stepper-nav__submit" onClick={onSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save check-in'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
