import { useEffect } from "react";
import CheckInForm from "../components/CheckInForm.jsx";
import { useCheckinsStore } from "../store.js";

function HistoryList({ checkins }) {
  if (checkins.length === 0) {
    return <p>No check-ins yet. Your history will appear here.</p>;
  }
  return (
    <ul>
      {checkins.map((c) => (
        <li key={c.id}>
          <time dateTime={c.occurredAt}>
            {new Date(c.occurredAt).toLocaleString()}
          </time>
          {" — "}mood {c.moodScore}, energy {c.energyScore}, drain{" "}
          {c.drainScore}
          {c.emotions?.length > 0 && ` · ${c.emotions.join(", ")}`}
        </li>
      ))}
    </ul>
  );
}

export default function CheckInPage() {
  const { checkins, status, error, justSaved, saveDraft, loadHistory } =
    useCheckinsStore();
  const saving = status === "saving";

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <h1>Check-In</h1>
      {status === "failed" && (
        <p role="alert">Couldn&apos;t save or load right now: {error}</p>
      )}
      {justSaved && status === "succeeded" && (
        <p role="status">Saved. Thank you for checking in.</p>
      )}
      <CheckInForm onSubmit={() => saveDraft()} saving={saving} />

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Previous check-ins</h2>
        <HistoryList checkins={checkins} />
      </section>
    </main>
  );
}
