import { useEffect } from "react";
import { Link } from "react-router-dom";
import { latestCheckin } from "../components/energyBattery.helpers.js";
import EnergyBattery from "../components/EnergyBattery.jsx";
import EnergyOverview from "../components/EnergyOverview.jsx";
import FeedbackLink from "../components/FeedbackLink.jsx";
import SignalsPanel from "../components/SignalsPanel.jsx";
import { useReveal } from "../hooks/useReveal.js";
import { useDashboardStore } from "../store.js";

const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL ?? "";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M4 12 12 4M6.5 4H12v5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function confidenceTag(confidence) {
  switch (confidence) {
    case "high":
      return "tag tag--green";
    case "medium":
      return "tag tag--yellow";
    case "low":
      return "tag tag--neutral";
    default:
      return "tag tag--neutral";
  }
}

function CurrentBattery({ checkins }) {
  const latest = latestCheckin(checkins);
  if (!latest) {
    return (
      <section
        className="dashboard-panel dashboard-panel--battery-compact reveal"
        style={{ "--index": 1 }}
        aria-labelledby="battery-label"
      >
        <div className="battery-head">
          <h2 id="battery-label">
            Current Energy
          </h2>
        </div>
        <div className="battery-body">
          <EnergyBattery checkins={checkins} />
          <p className="battery-note">
            No reading yet.{" "}
            <Link className="dashboard-panel__link" to="/check-in">
              Record a check-in
            </Link>
          </p>
        </div>
      </section>
    );
  }
  const updated = new Date(latest.occurredAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <section
      className="dashboard-panel dashboard-panel--battery-compact reveal"
      style={{ "--index": 1 }}
      aria-labelledby="battery-label"
    >
      <div className="battery-head">
        <h2 id="battery-label">
          Current Energy
        </h2>
        <p className="battery-updated">Updated {updated}</p>
      </div>
      <div className="battery-body">
        <EnergyBattery checkins={checkins} />
      </div>
    </section>
  );
}

function RecentEnergy({ checkins }) {
  if (!checkins || checkins.length === 0) {
    return (
      <p className="dashboard-panel__empty">
        No check-ins yet. Your recent history will appear here.
      </p>
    );
  }
  return <EnergyOverview checkins={checkins} />;
}

function LatestInsight({ insight }) {
  return (
    <article className="dashboard-panel dashboard-panel--feature">
      <h2
        className="dashboard-panel__insight-heading"
        id="insight-heading-featured"
      >
        Latest insight
      </h2>
      {insight ? (
        <>
          {insight.confidence && (
            <p className={confidenceTag(insight.confidence)}>
              {insight.confidence}
            </p>
          )}
          <h3>{insight.title}</h3>
          <p>{insight.summary}</p>
          <p>
            <Link className="dashboard-panel__link" to="/insights">
              Open insights <ArrowIcon />
            </Link>
          </p>
        </>
      ) : (
        <p className="dashboard-panel__empty">
          No insights yet. Record a few check-ins, then run an analysis.
        </p>
      )}
    </article>
  );
}

function Reminders({ reminders, unreadReminders, markingId, onMarkRead }) {
  if (reminders.length === 0) {
    return <p className="dashboard-panel__empty">No reminders right now.</p>;
  }
  return (
    <>
      {unreadReminders > 0 && (
        <p role="status">
          <span className="tag tag--blue">
            {unreadReminders} unread reminder{unreadReminders === 1 ? "" : "s"}
          </span>
        </p>
      )}
      <ul className="reminder-list">
        {reminders.map((r) => (
          <li key={r.id}>
            <p>{r.message}</p>
            {r.readAt ? (
              <p>
                <span className="tag tag--neutral">Read</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => onMarkRead(r.id)}
                disabled={markingId === r.id}
              >
                {markingId === r.id ? "Marking…" : "Mark as read"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function DashboardPage() {
  const { summary, status, markingId, load, markRead } =
    useDashboardStore();
  const loading = status === "loading" || status === "idle";
  const scopeRef = useReveal([status, summary]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderEnergyOverview = () => (
    <div className="dashboard-page__duo">
      <CurrentBattery checkins={summary?.recentCheckins ?? []} />
      <section
        className="dashboard-panel dashboard-panel--overview reveal"
        style={{ "--index": 2 }}
        aria-labelledby="recent-heading"
      >
        <h2 id="recent-heading">Energy Overview</h2>
        <RecentEnergy checkins={summary?.recentCheckins ?? []} />
        <div className="dashboard-actions">
          <Link className="dashboard-cta" to="/check-in">
            Record a check-in <ArrowIcon />
          </Link>
          <Link className="dashboard-secondary-cta" to="/insights">
            View all insights
          </Link>
        </div>
      </section>
    </div>
  );

  const renderInsight = () => (
    <section
      className="dashboard-page__featured-insight reveal"
      style={{ "--index": 3 }}
      aria-labelledby="insight-heading-featured"
    >
      <LatestInsight insight={summary?.latestInsight ?? null} />
    </section>
  );

  const renderSignals = () => (
    <div
      className="dashboard-panel reveal dashboard-page__grid-signals dashboard-page__signals--concise dashboard-page__signals--micro"
      style={{ "--index": 4 }}
    >
      <SignalsPanel signals={summary?.signals ?? []} concise />
    </div>
  );

  const renderReminders = () => (
    <section
      className="dashboard-panel reveal dashboard-page__grid-reminders"
      style={{ "--index": 5 }}
      aria-labelledby="reminders-heading"
    >
      <p className="dashboard-panel__label">For later</p>
      <h2 id="reminders-heading">Reminders</h2>
      <Reminders
        reminders={summary?.reminders ?? []}
        unreadReminders={summary?.unreadReminders ?? 0}
        markingId={markingId}
        onMarkRead={(id) => markRead(id).catch(() => {})}
      />
    </section>
  );

  const renderSupportGrid = () => (
    <div className="dashboard-page__grid dashboard-page__grid--support">
      {renderSignals()}
      {renderReminders()}
    </div>
  );

  const renderDashboardBody = () => (
    <>
      <div
        className="dashboard-page__heading dashboard-page__heading--copy-wide reveal"
        style={{ "--index": 0 }}
      >
        <div className="dashboard-page__heading-title">
          <h1>How are you holding up?</h1>
        </div>
        <div className="dashboard-page__heading-support">
          <p className="dashboard-page__heading-copy">
            Come back to yourself without needing to solve everything at once.
          </p>
          <p className="dashboard-page__date">
            Today ·{" "}
            {new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      {loading ? (
        <p>Looking at your recent check-ins…</p>
      ) : summary ? (
        <>
          {renderEnergyOverview()}
          {renderInsight()}
          {renderSupportGrid()}
        </>
      ) : null}
      <FeedbackLink url={FEEDBACK_URL} />
    </>
  );

  return (
    <main
      className="dashboard-page dashboard-page--insight-later dashboard-page--energy-shelf"
      ref={scopeRef}
    >
      {renderDashboardBody()}
    </main>
  );
}
