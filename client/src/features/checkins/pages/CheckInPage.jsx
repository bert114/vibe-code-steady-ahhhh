import { useEffect } from 'react'
import CheckInForm from '../components/CheckInForm.jsx'
import CheckInHistoryList from '../components/CheckInHistoryList.jsx'
import { useCheckinsStore } from '../store.js'

export default function CheckInPage() {
  const { checkins, status, saveDraft, loadHistory, resetDraft, removeCheckin } = useCheckinsStore()
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
        <CheckInHistoryList checkins={checkins} onDelete={removeCheckin} />
      </section>
    </main>
  )
}

