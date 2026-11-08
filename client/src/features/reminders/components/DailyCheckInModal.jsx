import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  observeLiveDialogMode,
  showDialogForLiveSession,
} from "../../../lib/ui/liveDialogMode.js";
import { useRecoveryStore } from "../../recovery/api.js";
import {
  hasCheckedInToday,
  isRecentDrainInteraction,
  latestCheckin,
} from "./energyBattery.helpers.js";

const MOOD_CHOICES = [
  {
    value: 1,
    label: "Low",
    nuance: "Heavy or weary",
    to: "/check-in?mood=1",
  },
  {
    value: 3,
    label: "Okay",
    nuance: "Quiet & steady",
    to: "/check-in?mood=3",
  },
  {
    value: 5,
    label: "Good",
    nuance: "Warm & bright",
    to: "/check-in?mood=5",
  },
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
      className="daily-checkin-modal__face"
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

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function DailyCheckInModal({ checkins, defaultOpen }) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
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
  const shouldSuppress = checkedInToday || isRecentDrain || isDraining;

  useEffect(() => observeLiveDialogMode(dialogRef.current), []);

  useEffect(() => {
    if (shouldSuppress) {
      setOpen(false);
      return;
    }

    if (defaultOpen !== undefined) {
      setOpen(Boolean(defaultOpen));
      return;
    }

    try {
      const dismissed = window.sessionStorage?.getItem(
        `steady-ahh:daily-checkin-dismissed:${getTodayKey()}`
      );
      if (!dismissed) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [shouldSuppress, defaultOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      showDialogForLiveSession(dialog);
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  function closeDialog() {
    setOpen(false);
    try {
      window.sessionStorage?.setItem(
        `steady-ahh:daily-checkin-dismissed:${getTodayKey()}`,
        "true"
      );
    } catch {
      // Ignore sessionStorage exceptions
    }
    if (dialogRef.current?.open) {
      if (typeof dialogRef.current.close === "function") {
        dialogRef.current.close();
      } else {
        dialogRef.current.removeAttribute("open");
      }
    }
  }

  if ((shouldSuppress || checkedInToday) && !open) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="daily-checkin-modal"
      aria-labelledby="daily-checkin-modal-title"
      aria-describedby="daily-checkin-modal-desc"
      onClose={() => {
        if (dialogRef.current?.open) return;
        closeDialog();
      }}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
    >
      <div className="daily-checkin-modal__content">
        <header className="daily-checkin-modal__header">
          <div className="daily-checkin-modal__lead-group">
            <div className="daily-checkin-modal__host-pill">
              <span className="daily-checkin-modal__host-badge-dot" aria-hidden="true" />
              <span>Welcome in · A safe space for you</span>
            </div>
            <h2 id="daily-checkin-modal-title">Welcome in — how is your day feeling?</h2>
          </div>
          <button
            type="button"
            className="daily-checkin-modal__close"
            aria-label="Close welcome guide"
            onClick={closeDialog}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="daily-checkin-modal__body-note">
          <p id="daily-checkin-modal-desc" className="daily-checkin-modal__desc">
            Take off whatever you&apos;ve been carrying today. You don&apos;t have
            to perform or fix anything here. Whether you have thirty seconds to
            notice how you feel or just want to rest for a quiet moment, you are
            always welcome.
          </p>
          <div className="daily-checkin-modal__safety-tag">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="daily-checkin-modal__lock-icon">
              <rect x="3" y="6.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M5.5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>Private to you · Zero pressure or streaks</span>
          </div>
        </div>

        <div
          className="daily-checkin-modal__choices"
          role="group"
          aria-label="Choose how you feel today"
        >
          {MOOD_CHOICES.map((choice) => (
            <Link
              key={choice.value}
              to={choice.to}
              className="daily-checkin-modal__choice"
              aria-label={`Start reflection with ${choice.label} mood (${choice.nuance})`}
              onClick={closeDialog}
            >
              <span className="daily-checkin-modal__choice-icon">
                <MoodFace score={choice.value} />
              </span>
              <span className="daily-checkin-modal__choice-label">
                {choice.label}
              </span>
              <span className="daily-checkin-modal__choice-nuance">
                {choice.nuance}
              </span>
            </Link>
          ))}
        </div>

        <footer className="daily-checkin-modal__actions">
          <button
            type="button"
            className="daily-checkin-modal__skip"
            aria-label="Skip daily check-in for now"
            onClick={closeDialog}
          >
            I&apos;m just resting for now
          </button>
          <Link
            to="/check-in"
            className="daily-checkin-modal__start"
            onClick={closeDialog}
          >
            Guide me through a reflection →
          </Link>
        </footer>
      </div>
    </dialog>,
    document.body
  );
}
