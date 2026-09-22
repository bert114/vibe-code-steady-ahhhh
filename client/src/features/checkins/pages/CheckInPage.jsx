import { useEffect } from 'react'
import CheckInForm from '../components/CheckInForm.jsx'
import { useCheckinsStore } from '../store.js'

function HistoryList({ checkins }) {
  if (checkins.length === 0) {
    return <p className="checkin-history__empty">No check-ins yet. Your history will appear here.</p>
  }
  return (
    <ul className="checkin-history__list">
      {checkins.map((c) => (
        <li key={c.id}>
          <time dateTime={c.occurredAt}>{new Date(c.occurredAt).toLocaleString()}</time>
          {' — '}mood {c.moodScore}, energy {c.energyScore}, drain {c.drainScore}
          {c.emotions?.length > 0 && ` · ${c.emotions.join(', ')}`}
        </li>
      ))}
    </ul>
  )
}

export default function CheckInPage() {
  const { checkins, status, saveDraft, loadHistory, resetDraft } = useCheckinsStore()
  const saving = status === 'saving'

  useEffect(() => {
    resetDraft()
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="checkin-page">
      <p className="page-eyebrow">A moment for yourself</p>
      <h1>Check-In</h1>
      <p className="checkin-page__intro">Answer one question at a time — it only takes a moment.</p>

      <div className="card checkin-card">
        <CheckInForm onSubmit={() => saveDraft().catch(() => {})} saving={saving} />
      </div>

      <section aria-labelledby="history-heading" className="checkin-history">
        <h2 id="history-heading">Previous check-ins</h2>
        <HistoryList checkins={checkins} />
      </section>
    </main>
  )
}
