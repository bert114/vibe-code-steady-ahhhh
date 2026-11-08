import { useState } from "react";
import { Link } from "react-router-dom";
import { useRecoveryStore } from "../../recovery/api.js";
import {
  hasCheckedInToday,
  isRecentDrainInteraction,
  latestCheckin,
} from "./energyBattery.helpers.js";

const MOOD_CHOICES = [
  { value: 1, label: "Low", to: "/check-in?mood=1" },
  { value: 3, label: "Okay", to: "/check-in?mood=3" },
  { value: 5, label: "Good", to: "/check-in?mood=5" },
];

const MOUTHS = {
  1: "M9 17 Q16 11 23 17",
  3: "M10 16 H22",
  5: "M9 14 Q16 20.5 23 14",
};

function MoodFace({ score }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className="checkin-guide__face"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="16" r="12.5" />
      {score === 1 ? (
        <>
          <path d="M8.5 9.5 12.5 11" />
          <path d="M23.5 9.5 19.5 11" />
        </>
      ) : null}
      {score === 5 ? (
        <>
          <path d="M9.5 12 Q11.5 10 13.5 12" />
          <path d="M18.5 12 Q20.5 10 22.5 12" />
        </>
      ) : (
        <>
          <circle cx="11.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="20.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
        </>
      )}
      <path d={MOUTHS[score] ?? MOUTHS[3]} />
    </svg>
  );
}

export default function CheckInGuide({ checkins }) {
  const [dismissed, setDismissed] = useState(false);
  const checkedInToday = hasCheckedInToday(checkins);
  const latest = latestCheckin(checkins);
  const isRecentDrain = isRecentDrainInteraction(latest);
  const isDraining = useRecoveryStore(
    (s) =>
      Boolean(s.state?.drainingStatus?.isDraining) ||
      Boolean(s.state?.suggestBreak) ||
      Boolean(s.state?.activeBreak) ||
      Boolean(s.state?.dueBreak)
  );

  if (dismissed || checkedInToday || isRecentDrain || isDraining) {
    return null;
  }

  return (
    <section
      className="dashboard-panel checkin-guide reveal"
      style={{ "--index": 1 }}
      aria-labelledby="checkin-guide-heading"
    >
      <div className="checkin-guide__head">
        <div className="checkin-guide__copy">
          <p className="checkin-guide__eyebrow">Guest guidance · Optional check-in guide</p>
          <h2 id="checkin-guide-heading">How are you feeling today?</h2>
          <p className="checkin-guide__lead">
            Take a quiet moment to check in—pick how your mood feels to begin,
            or skip whenever you like. There is no pressure here.
          </p>
        </div>
        <button
          type="button"
          className="checkin-guide__skip"
          onClick={() => setDismissed(true)}
        >
          Skip for now
        </button>
      </div>

      <div
        className="checkin-guide__choices"
        role="group"
        aria-label="How are you feeling today?"
      >
        {MOOD_CHOICES.map((choice) => (
          <Link
            key={choice.value}
            to={choice.to}
            className="checkin-guide__choice"
          >
            <span className="checkin-guide__choice-icon">
              <MoodFace score={choice.value} />
            </span>
            <span className="checkin-guide__choice-label">{choice.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

