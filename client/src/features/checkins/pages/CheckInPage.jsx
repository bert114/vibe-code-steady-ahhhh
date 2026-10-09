import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CheckInForm from '../components/CheckInForm.jsx'
import CheckInHistoryList from '../components/CheckInHistoryList.jsx'
import { useCheckinsStore } from '../store.js'

export default function CheckInPage() {
  const location = useLocation()
  const { checkins, status, saveDraft, loadHistory, resetDraft, removeCheckin } = useCheckinsStore()
  const saving = status === 'saving'

  useEffect(() => {
    resetDraft()
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (location.hash === '#history-heading') {
      document.getElementById('history-heading')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <main className="checkin-page">
      <header className="checkin-page__header">
        <p className="checkin-page__eyebrow">Daily Reflection</p>
        <h1>A brief moment to check in.</h1>
        <p className="checkin-page__intro">Take it one question at a time.</p>
      </header>

      <div className="card checkin-card">
        <CheckInForm onSubmit={saveDraft} saving={saving} />
      </div>

      <section aria-labelledby="history-heading" className="checkin-history">
        <h2 id="history-heading">Previous check-ins</h2>
        <CheckInHistoryList checkins={checkins} onDelete={removeCheckin} />
      </section>
    </main>
  )
}

