import { useEffect, useRef, useState } from "react";
import { useCheckinsStore } from "../store.js";
import DrainIcon from "./DrainIcon.jsx";
import EnergyIcon from "./EnergyIcon.jsx";
import FaceIcon from "./FaceIcon.jsx";

const SCORES = [1, 3, 5];

// One question at a time, in plain language, with the scale explained in
// words instead of asking the user to interpret a bare number.
// Three options per step (ends + middle); the server accepts only {1, 3, 5}.
const SCORE_STEPS = [
  {
    key: "moodScore",
    name: "moodScore",
    question: "How has your mood been today?",
    captions: ["Low", "Okay", "Good"],
    Icon: FaceIcon,
  },
  {
    key: "energyScore",
    name: "energyScore",
    question: "How much energy do you have today?",
    captions: ["Very little", "Some", "A lot"],
    Icon: EnergyIcon,
  },
  {
    key: "drainScore",
    name: "drainScore",
    question: "How drained do you feel today?",
    captions: ["Not at all", "A little", "A lot"],
    Icon: DrainIcon,
  },
];

// Only the three ratings are counted steps. Optional notes live in a dialog.
const TOTAL_STEPS = SCORE_STEPS.length;

const STEP_NAMES = ["Mood", "Energy", "Feeling drained"];

const OPTIONAL_DETAIL_PROMPTS = [
  {
    key: "emotions",
    title: "Which words describe your feelings?",
    placeholder: "e.g. tired, hopeful",
    type: "text",
  },
  {
    key: "contextTags",
    title: "What was happening?",
    placeholder: "e.g. work, family dinner",
    type: "text",
  },
  {
    key: "note",
    title: "Add a note",
    placeholder: "Write a note to remember this moment.",
    type: "textarea",
  },
];

function ScoreStep({ meta, value, onSelect }) {
  const { Icon } = meta;
  return (
    <fieldset className="score-step">
      <legend>
        <h2 className="score-step__question">{meta.question}</h2>
      </legend>
      <p className="score-step__hint">Choose the option that feels closest.</p>
      <div
        role="radiogroup"
        aria-label={meta.question}
        className="score-options"
      >
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
  );
}

function preventImplicitSubmit(event) {
  if (event.key === "Enter") event.preventDefault();
}

function OptionalDetailsDialog({
  open,
  onClose,
  draft,
  setDraft,
  detailsExpanded,
  detailsIndex,
  detailsInputRef,
  onAddDetails,
  onBackFromDetails,
  onContinueDetails,
  onSave,
  saving,
  saveError,
}) {
  const dialogRef = useRef(null);
  const detailPrompt = OPTIONAL_DETAIL_PROMPTS[detailsIndex];
  const detailValue = draft[detailPrompt.key] ?? "";
  const isLastDetail = detailsIndex === OPTIONAL_DETAIL_PROMPTS.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    if (open && detailsExpanded) detailsInputRef.current?.focus();
  }, [open, detailsExpanded, detailsIndex, detailsInputRef]);

  function closeDialog() {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="reflection-save-dialog"
      aria-labelledby="reflection-save-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="reflection-save-dialog__content">
        <header className="reflection-save-dialog__header">
          <div>
            <h2 id="reflection-save-title">
              {detailsExpanded ? detailPrompt.title : "Add details?"}
            </h2>
          </div>
          <button
            type="button"
            className="reflection-save-dialog__close"
            aria-label="Close save options"
            onClick={closeDialog}
            disabled={saving}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {detailsExpanded && (
          <div className="reflection-save-dialog__fields">
            <div className="field">
              {detailPrompt.type === "textarea" ? (
                <textarea
                  ref={detailsInputRef}
                  id={`checkin-${detailPrompt.key}`}
                  aria-labelledby="reflection-save-title"
                  value={detailValue}
                  onChange={(event) =>
                    setDraft({ [detailPrompt.key]: event.target.value })
                  }
                  rows={4}
                  maxLength={5000}
                  placeholder={detailPrompt.placeholder}
                />
              ) : (
                <input
                  ref={detailsInputRef}
                  id={`checkin-${detailPrompt.key}`}
                  aria-labelledby="reflection-save-title"
                  type="text"
                  value={detailValue}
                  onChange={(event) =>
                    setDraft({ [detailPrompt.key]: event.target.value })
                  }
                  onKeyDown={preventImplicitSubmit}
                  placeholder={detailPrompt.placeholder}
                  autoComplete="off"
                />
              )}
            </div>
          </div>
        )}

        <footer className="reflection-save-dialog__actions">
          {detailsExpanded ? (
            <button
              type="button"
              className="reflection-save-dialog__back"
              onClick={onBackFromDetails}
              disabled={saving}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="reflection-save-dialog__add"
              onClick={onAddDetails}
              disabled={saving}
            >
              Add details
            </button>
          )}
          <button
            type="button"
            className="reflection-save-dialog__save"
            onClick={detailsExpanded ? onContinueDetails : onSave}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : detailsExpanded
                ? isLastDetail
                  ? "Save check-in"
                  : detailValue.trim()
                    ? "Continue"
                    : "Skip this"
              : "Save without details"}
          </button>
        </footer>
        {saveError && (
          <p
            className="reflection-save-dialog__error quick-checkin__error"
            role="alert"
          >
            {saveError}
          </p>
        )}
      </div>
    </dialog>
  );
}

// A short, one-decision-per-screen wizard: choose one score, then explicitly
// continue to the next question so the progress model stays predictable.
// questionnaire. All state and submission logic still lives in the store —
// this component only tracks which step is currently showing.
export default function CheckInForm({ onSubmit, saving }) {
  const { draft, setDraft, status } = useCheckinsStore();
  const [step, setStep] = useState(0);
  const [saveOptionsOpen, setSaveOptionsOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const [saveError, setSaveError] = useState(null);
  const prevStatusRef = useRef(status);
  const detailsInputRef = useRef(null);

  // A successful save clears the draft back to defaults — start the next
  // check-in from the first question instead of leaving the wizard parked
  // on the review step.
  useEffect(() => {
    if (prevStatusRef.current === "saving" && status === "succeeded") {
      setStep(0);
      setSaveOptionsOpen(false);
      setDetailsExpanded(false);
      setDetailsIndex(0);
      setSaveError(null);
    }
    prevStatusRef.current = status;
  }, [status]);

  // Explicit save function: single entry point for each save action.
  // Surfaces failures inside the dialog instead of
  // failing silently — the store + global toast still run underneath.
  async function handleSave() {
    if (saving) return;
    setSaveError(null);
    try {
      await onSubmit();
    } catch (err) {
      setSaveError(
        err?.message || "Your check-in couldn't be saved. Please try again.",
      );
    }
  }

  function handleCloseSaveOptions() {
    setSaveError(null);
    setSaveOptionsOpen(false);
  }

  const currentMeta = SCORE_STEPS[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  function goNext() {
    if (isLastStep) {
      setSaveError(null);
      setSaveOptionsOpen(true);
    } else setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function addDetails() {
    setDetailsIndex(0);
    setDetailsExpanded(true);
  }

  function goBackInDetails() {
    if (detailsIndex > 0) setDetailsIndex((index) => index - 1);
    else setDetailsExpanded(false);
  }

  function continueInDetails() {
    if (detailsIndex < OPTIONAL_DETAIL_PROMPTS.length - 1)
      setDetailsIndex((index) => index + 1);
    else handleSave();
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <form
      className="checkin-stepper"
      // Every action is an explicit button; form submission never saves by
      // accident when someone presses Enter while entering optional details.
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <header className="stepper-progress">
        <div className="stepper-progress__top">
          <p className="stepper-progress__label">
            Question {step + 1} of {TOTAL_STEPS}
          </p>
        </div>
        <div
          className="stepper-progress__track"
          role="progressbar"
          aria-label="Check-in progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step + 1}
          aria-valuetext={`Question ${step + 1} of ${TOTAL_STEPS}: ${STEP_NAMES[step]}`}
        >
          {STEP_NAMES.map((name, index) => (
            <span
              key={name}
              aria-hidden="true"
              className={`stepper-progress__segment${index < step ? " is-complete" : ""}${index === step ? " is-current" : ""}`}
            />
          ))}
        </div>
      </header>

      <div className="stepper-main">
        <ScoreStep
          meta={currentMeta}
          value={draft[currentMeta.key]}
          onSelect={(v) => setDraft({ [currentMeta.key]: v })}
        />

        <div className="stepper-nav">
          {step > 0 && (
            <button
              type="button"
              className="stepper-nav__back"
              onClick={goBack}
            >
              Back
            </button>
          )}
          <button type="button" className="stepper-nav__next" onClick={goNext}>
            {isLastStep ? "Continue to save" : "Next question"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="stepper-reassurance">
          You can change your answers before saving.
        </p>
      </div>

      <OptionalDetailsDialog
        open={saveOptionsOpen}
        onClose={handleCloseSaveOptions}
        draft={draft}
        setDraft={setDraft}
        detailsExpanded={detailsExpanded}
        detailsIndex={detailsIndex}
        detailsInputRef={detailsInputRef}
        onAddDetails={addDetails}
        onBackFromDetails={goBackInDetails}
        onContinueDetails={continueInDetails}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
      />
    </form>
  );
}
