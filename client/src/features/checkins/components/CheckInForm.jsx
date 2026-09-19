import { Fragment, useEffect, useRef, useState } from "react";
import {
  BatteryEmpty,
  BatteryFull,
  BatteryHigh,
  BatteryLow,
  BatteryMedium,
  Check,
  Drop,
  DropHalf,
  DropHalfBottom,
  DropSimple,
  DropSlash,
  Smiley,
  SmileyBlank,
  SmileyMeh,
  SmileySad,
  SmileyWink,
} from "@phosphor-icons/react";
import { useCheckinsStore } from "../store.js";

const SCORES = [1, 2, 3, 4, 5];

// Shape lock: option boxes use radius-md, buttons use full pill,
// progress nodes are circles. documented, applied consistently.
// Icons are one family (Phosphor, bold weight, single size).
// Values and field names stay 1-5 so save logic and API payload
// are unchanged. Numbers never render visibly; captions do.
const ICON_SIZE = 36;
const SCORE_ICONS = {
  moodScore: [SmileySad, SmileyMeh, SmileyBlank, Smiley, SmileyWink],
  energyScore: [
    BatteryEmpty,
    BatteryLow,
    BatteryMedium,
    BatteryHigh,
    BatteryFull,
  ],
  drainScore: [DropSlash, Drop, DropSimple, DropHalf, DropHalfBottom],
};
const SCORE_CAPTIONS = {
  moodScore: ["Rough", "Low", "Okay", "Good", "Steady"],
  energyScore: ["Empty", "Low", "Okay", "High", "Full"],
  drainScore: ["Light", "Low", "Medium", "High", "Heavy"],
};

const STEPS = [
  {
    key: "mood",
    label: "Mood",
    title: "How are you feeling right now?",
    hint: "1 is low, 5 is steady. Pick what fits this moment.",
    field: "moodScore",
  },
  {
    key: "energy",
    label: "Energy",
    title: "How is your energy?",
    hint: "1 is empty, 5 is full. No wrong answer.",
    field: "energyScore",
  },
  {
    key: "drain",
    label: "Drain",
    title: "How drained do you feel?",
    hint: "1 is light, 5 is heavy.",
    field: "drainScore",
  },
  {
    key: "context",
    label: "Context",
    title: "What was going on?",
    hint: "Add a few words if you want. Everything here is optional. Press Continue when you're ready. Nothing saves until the Review step.",
  },
  {
    key: "review",
    label: "Review",
    title: "Does this look right?",
    hint: "Take a moment. Only the Save button below will save your check-in.",
  },
];

function isScoreValid(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

function ScoreField({ label, name, value, onChange }) {
  const icons = SCORE_ICONS[name] || [];
  const captions = SCORE_CAPTIONS[name] || [];
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, width: "100%" }}>
      <legend
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {label}
      </legend>
      <style>{`@media (max-width: 480px) {
  .score-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}`}</style>
      <div
        role="radiogroup"
        aria-label={label}
        className="score-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "var(--step--5)",
          width: "100%",
        }}
      >
        {SCORES.map((score) => {
          const selected = Number(value) === score;
          const Icon = icons[score - 1];
          const caption = captions[score - 1] || "";
          return (
            <label
              key={score}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--step--6)",
                width: "100%",
                minWidth: 0,
                minHeight: "6rem",
                padding: "0.75rem 0.5rem",
                borderRadius: "var(--radius-md)",
                borderWidth: selected ? "2px" : "1px",
                borderStyle: "solid",
                borderColor: selected
                  ? "var(--text)"
                  : "var(--border)",
                background: selected
                  ? "var(--text)"
                  : "var(--surface-elevated)",
                color: selected ? "var(--bg-dark)" : "var(--text)",
                cursor: "pointer",
                boxShadow: selected
                  ? "var(--shadow-m)"
                  : "var(--shadow-s)",
              }}
            >
              {Icon ? (
                <Icon
                  size={ICON_SIZE}
                  weight="bold"
                  aria-hidden="true"
                  focusable="false"
                />
              ) : null}
              <input
                type="radio"
                name={name}
                value={score}
                checked={selected}
                onChange={() => onChange(score)}
                aria-label={`${label} ${score} ${caption}`.trim()}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                  whiteSpace: "nowrap",
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  fontSize: selected ? "12px" : "11px",
                  lineHeight: 1.25,
                  opacity: selected ? 1 : 0.7,
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {caption}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Shape lock note: progress nodes are circles (50%), option boxes stay
// radius-md. documented exception, applied consistently to all 5 nodes.
// Dark-adapted reference style: filled check nodes, ring-plus-dot current
// node, hollow upcoming nodes, solid connectors, no glow.
const NODE_SIZE = 28;
const NODE_DOT = 8;

function StepperProgress({ step }) {
  return (
    <div style={{ marginBottom: "var(--step--3)" }}>
      <p
        aria-live="polite"
        style={{ margin: "0 0 0.5rem", color: "var(--color-text-muted)" }}
      >
        Step {step + 1} of {STEPS.length}
      </p>
      <ol
        aria-label="Check-in progress"
        style={{
          listStyle: "none",
          display: "flex",
          alignItems: "flex-start",
          padding: 0,
          margin: "0 0 0.5rem",
        }}
      >
        {STEPS.map((s, i) => {
          const completed = i < step;
          const current = i === step;
          return (
            <li
              key={s.key}
              aria-current={current ? "step" : undefined}
              aria-label={`${s.label}${completed ? " (completed)" : ""}${current ? " (current)" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: "2px",
                    background:
                      i === 0
                        ? "transparent"
                        : i <= step
                          ? "var(--text)"
                          : "var(--border)",
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    width: `${NODE_SIZE}px`,
                    height: `${NODE_SIZE}px`,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: completed
                      ? "2px solid var(--text)"
                      : current
                        ? "2px solid var(--text)"
                        : "1.5px solid var(--border)",
                    background: completed
                      ? "var(--text)"
                      : "transparent",
                    color: "var(--bg-dark)",
                    boxShadow: current
                      ? "0 0 0 4px color-mix(in srgb, var(--text) 20%, transparent)"
                      : "none",
                  }}
                >
                  {completed ? (
                    <Check
                      size={14}
                      weight="bold"
                      aria-hidden="true"
                      focusable="false"
                    />
                  ) : current ? (
                    <span
                      aria-hidden="true"
                      style={{
                        width: `${NODE_DOT}px`,
                        height: `${NODE_DOT}px`,
                        borderRadius: "50%",
                        background: "var(--text)",
                      }}
                    />
                  ) : null}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: "2px",
                    background:
                      i === STEPS.length - 1
                        ? "transparent"
                        : i < step
                          ? "var(--text)"
                          : "var(--border)",
                  }}
                />
              </div>
              <span
                aria-hidden="true"
                style={{
                  marginTop: "0.5rem",
                  fontSize: current ? "13px" : "12px",
                  lineHeight: 1.25,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                  color:
                    completed || current
                      ? "var(--text)"
                      : "var(--text-muted)",
                  fontWeight: current ? 600 : 400,
                }}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Presentational stepper: draft state lives in the store, validation mirrors
// the server (1-5 required scores). Submit handling lives in the page.
// Same fields + same save payload — only the flow is one question at a time.
// A+C: Step 4 (context) never saves — Enter there stays editing.
// Step 5 (review) saves ONLY via the explicit Save button, never via Enter.
export default function CheckInForm({ onSubmit, saving }) {
  const { draft, setDraft } = useCheckinsStore();
  const [step, setStep] = useState(0);
  const headingRef = useRef(null);

  const current = STEPS[step];
  const isContext = step === 3;
  const isReview = step === STEPS.length - 1;

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [step]);

  function canContinue() {
    if (step === 0) return isScoreValid(draft.moodScore);
    if (step === 1) return isScoreValid(draft.energyScore);
    if (step === 2) return isScoreValid(draft.drainScore);
    return true;
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleNext() {
    if (canContinue() && step < STEPS.length - 1) setStep(step + 1);
  }

  async function handleSave() {
    try {
      await onSubmit();
      setStep(0);
    } catch {
      // Error state lives in the store and is rendered by the page.
    }
  }

  function handleContextKeyDown(e) {
    // A: Enter inside text inputs must not submit or advance.
    // User stays editing until they explicitly press Continue.
    if (e.key === "Enter") e.preventDefault();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    // Only score steps (0-2) may advance via implicit Enter.
    // Context + Review never submit via the form — explicit buttons only.
    if (step <= 2) {
      handleNext();
    }
  }

  return (
    <form
      className="bg shadow-m gradient-light p1"
      onSubmit={handleFormSubmit}
      noValidate={false}
    >
      <StepperProgress step={step} />

      <h4
        ref={headingRef}
        tabIndex={-1}
        style={{ marginTop: 0, marginBottom: 0, outline: "none", lineHeight: 1.2 }}
      >
        {current.title}
      </h4>
      <p
        style={{
          color: "var(--color-text-muted)",
          marginTop: "var(--step--6)",
          marginBottom: "var(--step--3)",
        }}
      >
        {current.hint}
      </p>

      {step === 0 && (
        <ScoreField
          label="Mood"
          name="moodScore"
          value={draft.moodScore}
          onChange={(v) => setDraft({ moodScore: v })}
        />
      )}

      {step === 1 && (
        <ScoreField
          label="Energy"
          name="energyScore"
          value={draft.energyScore}
          onChange={(v) => setDraft({ energyScore: v })}
        />
      )}

      {step === 2 && (
        <ScoreField
          label="Drain"
          name="drainScore"
          value={draft.drainScore}
          onChange={(v) => setDraft({ drainScore: v })}
        />
      )}

      {isContext && (
        <div style={{ display: "grid", gap: "var(--step--4)" }}>
          <style>{`.checkin-input {
  width: 100%;
  background: var(--bg-light);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-input);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-s);
}
.checkin-input::placeholder {
  color: var(--text-muted);
  opacity: 1;
}
.checkin-input:focus-visible {
  border-color: var(--text);
  box-shadow: var(--shadow-m);
}
input.checkin-input {
  min-height: 3rem;
}
textarea.checkin-input {
  min-height: 7rem;
  resize: vertical;
}`}</style>
          <div style={{ display: "grid", gap: "var(--step--6)" }}>
            <label htmlFor="checkin-emotions">
              Emotions (comma-separated)
            </label>
            <input
              id="checkin-emotions"
              className="checkin-input"
              type="text"
              value={draft.emotions}
              onChange={(e) => setDraft({ emotions: e.target.value })}
              onKeyDown={handleContextKeyDown}
              placeholder="e.g. tired, hopeful"
              autoComplete="off"
            />
          </div>

          <div style={{ display: "grid", gap: "var(--step--6)" }}>
            <label htmlFor="checkin-context">
              What was going on? (comma-separated tags)
            </label>
            <input
              id="checkin-context"
              className="checkin-input"
              type="text"
              value={draft.contextTags}
              onChange={(e) => setDraft({ contextTags: e.target.value })}
              onKeyDown={handleContextKeyDown}
              placeholder="e.g. work, family dinner"
              autoComplete="off"
            />
          </div>

          <div style={{ display: "grid", gap: "var(--step--6)" }}>
            <label htmlFor="checkin-note">What happened? (optional)</label>
            <textarea
              id="checkin-note"
              className="checkin-input"
              value={draft.note}
              onChange={(e) => setDraft({ note: e.target.value })}
              rows={4}
              maxLength={5000}
            />
          </div>
        </div>
      )}

      {isReview &&
        (() => {
          const scoreCaption = (field, n) =>
            SCORE_CAPTIONS[field]?.[Number(n) - 1] || String(n);
          const emotions = draft.emotions.trim();
          const tags = draft.contextTags.trim();
          const note = draft.note.trim();
          const NOTE_LIMIT = 120;
          const noteDisplay =
            note.length > NOTE_LIMIT
              ? `${note.slice(0, NOTE_LIMIT).trimEnd()}...`
              : note;
          const termStyle = {
            color: "var(--text-muted)",
            fontSize: "12px",
            lineHeight: 1.25,
          };
          const valueStyle = {
            margin: 0,
            fontWeight: 600,
            fontSize: "1.1rem",
            lineHeight: 1.3,
          };
          const dividerStyle = {
            width: "1px",
            background: "var(--border-muted)",
            alignSelf: "stretch",
          };
          return (
            <dl
              aria-live="polite"
              style={{
                display: "grid",
                gap: "var(--step--5)",
                margin: 0,
                borderTop: "1px solid var(--border-muted)",
                paddingTop: "var(--step--5)",
              }}
            >
              <style>{`@media (max-width: 480px) {
  .review-scores,
  .review-context {
    grid-template-columns: 1fr;
  }
  .review-divider {
    display: none;
  }
}`}</style>
              <div
                className="review-scores"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr auto 1fr",
                  columnGap: "var(--step--5)",
                  alignItems: "stretch",
                }}
              >
                {[
                  ["Mood", scoreCaption("moodScore", draft.moodScore)],
                  ["Energy", scoreCaption("energyScore", draft.energyScore)],
                  ["Drain", scoreCaption("drainScore", draft.drainScore)],
                ].map(([term, detail], i) => (
                  <Fragment key={term}>
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className="review-divider"
                        style={dividerStyle}
                      />
                    )}
                    <div
                      style={{ display: "grid", gap: "var(--step--6)" }}
                    >
                      <dt style={termStyle}>{term}</dt>
                      <dd style={valueStyle}>{detail}</dd>
                    </div>
                  </Fragment>
                ))}
              </div>
              {(emotions || tags) && (
                <div
                  className="review-context"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      emotions && tags
                        ? "1fr auto 1fr"
                        : "1fr",
                    columnGap: "var(--step--5)",
                    alignItems: "stretch",
                  }}
                >
                  {emotions && (
                    <div
                      style={{ display: "grid", gap: "var(--step--6)" }}
                    >
                      <dt style={termStyle}>Emotions</dt>
                      <dd style={valueStyle}>{emotions}</dd>
                    </div>
                  )}
                  {emotions && tags && (
                    <span
                      aria-hidden="true"
                      className="review-divider"
                      style={dividerStyle}
                    />
                  )}
                  {tags && (
                    <div
                      style={{ display: "grid", gap: "var(--step--6)" }}
                    >
                      <dt style={termStyle}>Tags</dt>
                      <dd style={valueStyle}>{tags}</dd>
                    </div>
                  )}
                </div>
              )}
              {note && (
                <div style={{ display: "grid", gap: "var(--step--6)" }}>
                  <dt style={termStyle}>Note</dt>
                  <dd
                    title={noteDisplay !== note ? note : undefined}
                    style={{
                      margin: 0,
                      fontWeight: 400,
                      fontSize: "1.1rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {noteDisplay}
                  </dd>
                </div>
              )}
            </dl>
          );
        })()}

      <style>{`.checkin-nav-btn {
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.checkin-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.checkin-nav-btn:active:not(:disabled) {
  transform: scale(0.98);
}
.checkin-back {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.checkin-back:hover:not(:disabled) {
  border-color: var(--text);
  color: var(--text);
}
.checkin-primary {
  background: var(--text);
  border: 1px solid var(--text);
  color: var(--bg-dark);
  box-shadow: var(--shadow-m);
}
.checkin-primary:hover:not(:disabled) {
  filter: brightness(0.92);
}`}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--step--5)",
          marginTop: "var(--step--3)",
        }}
      >
        <button
          type="button"
          className="checkin-nav-btn checkin-back"
          onClick={handleBack}
          disabled={step === 0 || saving}
          aria-disabled={step === 0 || saving}
        >
          Back
        </button>

        {!isReview ? (
          <button
            type="button"
            className="checkin-nav-btn checkin-primary"
            onClick={handleNext}
            disabled={!canContinue() || saving}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="checkin-nav-btn checkin-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save check-in"}
          </button>
        )}
      </div>
    </form>
  );
}
