import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSignals } from '../api.js'
import SignalsPanel from '../components/SignalsPanel.jsx'

export default function DashboardPage() {
  const [signals, setSignals] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSignals()
      .then((data) => setSignals(data.signals ?? []))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <main>
      <h1>Dashboard</h1>
      {error ? (
        <p role="alert">Couldn&apos;t load your patterns right now: {error}</p>
      ) : signals === null ? (
        <p>Looking at your recent check-ins…</p>
      ) : (
        <SignalsPanel signals={signals} />
      )}
      <p>
        <Link to="/check-in">Record a check-in</Link>
      </p>
    </main>
  )
}
