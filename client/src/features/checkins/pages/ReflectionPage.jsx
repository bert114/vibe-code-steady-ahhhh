import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReflectionForm from "../components/ReflectionForm.jsx";
import ReflectionHistoryList from "../components/ReflectionHistoryList.jsx";
import { useCheckinsStore } from "../store.js";

export default function ReflectionPage() {
  const location = useLocation();
  const {
    checkins,
    status,
    saveDraft,
    loadHistory,
    setDraft,
    resetDraft,
    removeCheckin,
  } = useCheckinsStore();
  const saving = status === "saving";

  useEffect(() => {
    resetDraft();
    const initialMood = Number(new URLSearchParams(location.search).get("mood"));
    if (initialMood === 1 || initialMood === 3 || initialMood === 5) {
      setDraft({ moodScore: initialMood });
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.hash === "#history-heading") {
      document
        .getElementById("history-heading")
        ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <main className="checkin-page checkin-layout checkin-layout--flow">
      <header className="checkin-page__header">
        <h1>How are you feeling today?</h1>
        <p className="checkin-page__intro">
          Three quick questions about your mood, energy, and how drained you
          feel. Add details if you like.
        </p>
      </header>
      <div className="card checkin-card">
        <ReflectionForm onSubmit={saveDraft} saving={saving} />
      </div>
      <section aria-labelledby="history-heading" className="checkin-history">
        <h2 id="history-heading">Past reflections</h2>
        <ReflectionHistoryList checkins={checkins} onDelete={removeCheckin} />
      </section>
    </main>
  );
}

