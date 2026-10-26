import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import AtAGlance from '../components/AtAGlance.jsx'
import TrendChart from '../components/TrendChart.jsx'
import { useTrendsStore } from '../store.js'

const WINDOWS = [
  { value: 7, label: 'Week' },
  { value: 30, label: 'Month' },
]

function TopDrainingTags({ tags }) {
  if (!tags || tags.length === 0) {
    return null
  }
  return (
    <section className="trends-page__tags" aria-labelledby="draining-tags-heading">
      <h2 id="draining-tags-heading">What's come up most on draining days</h2>
      <p className="trends-page__tags-hint">
        Observed only — how often each tag appeared on a check-in you scored as highly draining.
      </p>
      <ul className="trends-page__tags-list">
        {tags.map((t) => (
          <li key={t.tag} className="chip chip--context">
            <span>{t.tag}</span> <span className="tag tag--neutral">{t.count}×</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function TrendsPage() {
  const { windowDays, data, status, setWindowDays, load } = useTrendsStore()
  const busy = status === 'loading' || status === 'idle'

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="trends-page">
      <div className="trends-page__header">
        <div className="trends-page__heading-row">
          <h1>Overview</h1>
          <label className="trends-page__range">
            <span>Time range</span>
            <span className="trends-page__select-wrap">
              <select
                aria-label="Time range"
                value={windowDays}
                onChange={(event) => setWindowDays(Number(event.target.value))}
              >
                {WINDOWS.map((window) => (
                  <option key={window.value} value={window.value}>{window.label}</option>
                ))}
              </select>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
            </span>
          </label>
        </div>
        <p className="trends-page__lead">
          A longer view of your mood, energy and drain than the dashboard's recent snapshot —
          zoom out to notice what a single day can't show.
        </p>
      </div>

      {busy && <p>Looking across your check-ins…</p>}

      {!busy && data && data.days.length === 0 && (
        <div className="insights-empty-card">
          <h2>No check-ins in this window</h2>
          <p>Record a check-in and it will start showing up here.</p>
          <Link to="/check-in" className="btn-secondary">
            Record a check-in now
          </Link>
        </div>
      )}

      {!busy && data && data.days.length > 0 && (
        <>
          <AtAGlance data={data} />
          <section className="trends-page__chart" aria-labelledby="trend-chart-heading">
            <h2 id="trend-chart-heading" className="visually-hidden">
              Mood and energy over time
            </h2>
            <TrendChart days={data.days} />
          </section>
          <TopDrainingTags tags={data.topDrainingTags} />
        </>
      )}
    </main>
  )
}
