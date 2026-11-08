import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInsightsStore } from '../store.js'
import WeeklyBurnout from '../components/WeeklyBurnout.jsx'
import './InsightsPage.css'

// One reading column: high-contrast top stats strip (Week / Month selector,
// analyze button, period averages, most draining interaction, interactions logged)
// followed by scannable 2-zone emotion translation cards below.

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Week (7 days)', days: 7 },
  { value: 'month', label: 'Month (30 days)', days: 30 },
]

const TYPE_LABELS = [
  { key: 'pattern', label: 'Pattern' },
  { key: 'burnout', label: 'Burnout signal' },
  { key: 'boundary', label: 'Boundary' },
  { key: 'general', label: 'General trend' },
].reduce((acc, item) => ({ ...acc, [item.key]: item.label }), {})

// Confidence in words a person can act on, not a score.
const CONFIDENCE_LABELS = {
  high: 'Clear pattern',
  medium: 'Possible pattern',
  low: 'Early hint',
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 4c.55 3.1 1.4 3.95 4.5 4.5-3.1.55-3.95 1.4-4.5 4.5-.55-3.1-1.4-3.95-4.5-4.5C9.6 7.95 10.45 7.1 11 4Z" />
      <path d="M17.5 14.5c.3 1.7.8 2.2 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.3 2.2-.8 2.5-2.5Z" />
    </svg>
  )
}

function InsightTypeIcon({ type }) {
  if (type === 'boundary') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z" />
      </svg>
    )
  }
  if (type === 'burnout') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M3 15c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </svg>
  )
}

function relativeDay(iso) {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const days = Math.floor((Date.now() - then.getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function cleanSummaryText(raw) {
  if (!raw) return { observed: '', reflection: '' }
  const withoutDumps = raw
    .replace(/\s*\(e\.g\.,[\s\S]*?"\)\s*(?=\.|$)/gi, '')
    .replace(/\s*\(e\.g\.,\s*"-[\s\S]*?\)/gi, '')
    .replace(/\[steady-ahh-demo:[^\]]+\]\s*/gi, '')
    .trim()

  const parts = withoutDumps.split(/\s*Reflection:\s*/i)
  const observed = parts[0].replace(/^Observed:\s*/i, '').trim()
  const reflection = (parts[1] || '').trim()
  return { observed, reflection }
}

function cleanEvidenceItems(items) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => {
    if (typeof item !== 'string') return false
    const text = item.trim()
    if (!text) return false
    // Omit raw machine metric keys (e.g. "avgMood: 2.9") and raw timestamped check-in log dumps
    if (/^(avg[a-z]+|total[a-z]+)\s*:/i.test(text)) return false
    if (/^-\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w+\s+\d+\s+\d{4}/i.test(text)) return false
    if (text.includes('GMT+') || text.includes('[steady-ahh-demo')) return false
    return true
  })
}

function InsightCard({ insight }) {
  const type = insight.type || insight.insight_type || 'general'
  const isBoundary = type === 'boundary'
  const meta = [
    TYPE_LABELS[type] || TYPE_LABELS.general,
    CONFIDENCE_LABELS[insight.confidence],
    relativeDay(insight.createdAt || insight.created_at),
  ].filter(Boolean)
  const { observed, reflection } = cleanSummaryText(insight.summary)
  const cleanEvidence = cleanEvidenceItems(insight.evidence)
  const cleanSuggestions =
    Array.isArray(insight.suggestions) && insight.suggestions.length > 0
      ? insight.suggestions
      : reflection
        ? [reflection]
        : []

  return (
    <article className="insight" data-type={type} aria-labelledby={`insight-title-${insight.id}`}>
      <div className="insight__top">
        <p className="insight__meta" data-type={type}>
          <InsightTypeIcon type={type} />
          <span>{meta.join(' \u00b7 ')}</span>
        </p>
      </div>
      <div className="insight__body">
        <div className="insight__main">
          <h3 id={`insight-title-${insight.id}`} className="insight__title">
            {insight.title}
          </h3>
          {observed && <p className="insight__summary">{observed}</p>}

          {cleanEvidence.length > 0 && (
            <div className="insight__block insight__block--evidence">
              <h4 className="insight__label">{isBoundary ? 'Observed' : 'What this is based on'}</h4>
              <ul>
                {cleanEvidence.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {cleanSuggestions.length > 0 && (
          <div className="insight__block insight__block--reflect">
            <h4 className="insight__label">{isBoundary ? 'Reflection' : 'Something to consider'}</h4>
            <ul>
              {cleanSuggestions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="insights-empty">
      <h3 className="insights-empty__title">Your check-ins will shape this space</h3>
      <p>
        Insights need a little history first: at least 3 check-ins over several days. Then press
        &ldquo;Analyze my recent check-ins&rdquo;.
      </p>
      <Link to="/check-in" className="insights-empty__link">
        Record a check-in
      </Link>
    </div>
  )
}

export default function InsightsPage() {
  const {
    insights,
    lastInsight,
    totalCheckins,
    firstCheckinAt,
    weeklyDrain,
    weeklyBurnout,
    periods,
    status,
    notice,
    load,
    analyze,
  } = useInsightsStore()
  const [period, setPeriod] = useState('week')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const busy = status === 'analyzing'
  const isLoading = status === 'loading' || (isInitialLoad && status !== 'failed')
  const failed = status === 'failed'
  const selectedPeriod = PERIOD_OPTIONS.find((opt) => opt.value === period) ?? PERIOD_OPTIONS[0]

  useEffect(() => {
    load().finally(() => setIsInitialLoad(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allShown = insights.length > 0 ? insights : lastInsight ? [lastInsight] : []
  const cutoff = Date.now() - selectedPeriod.days * 24 * 60 * 60 * 1000
  const shown = [...allShown]
    .filter((item) => {
      const iso = item.createdAt || item.created_at
      if (!iso) return true
      const ts = new Date(iso).getTime()
      return Number.isNaN(ts) ? true : ts >= cutoff
    })
    .sort((a, b) => {
      const ta = new Date(a.createdAt || a.created_at || 0).getTime() || 0
      const tb = new Date(b.createdAt || b.created_at || 0).getTime() || 0
      return tb - ta
    })

  const statusText = busy ? 'Analyzing your recent check-ins\u2026' : notice
  const periodSummary = periods?.[period] ?? null

  return (
    <main className="insights-page">
      <div className="insights-top-card">
        <header className="insights-header">
          <div>
            <h1 className="insights-header__title">Insights</h1>
          </div>

          <div className="insights-controls">
            <label className="insights-period">
              <CalendarIcon />
              <span className="visually-hidden">Time range</span>
              <select
                aria-label="Time range"
                className="insights-period__select"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="insights-run"
              onClick={analyze}
              disabled={busy || isLoading}
              aria-busy={busy}
            >
              <SparkleIcon />
              <span>{busy ? 'Analyzing\u2026' : 'Analyze my recent check-ins'}</span>
            </button>
          </div>
        </header>

        <p className="insights-status" role="status" aria-live="polite" data-active={Boolean(statusText)}>
          {statusText}
        </p>

        <WeeklyBurnout
          period={period}
          periodSummary={periodSummary}
          weeklyBurnout={weeklyBurnout}
          weeklyDrain={weeklyDrain}
          totalCheckins={totalCheckins}
          firstCheckinAt={firstCheckinAt}
        />
      </div>

      <section className="insights-list" aria-labelledby="insights-list-title">
        <div className="insights-list__head">
          <h2 id="insights-list-title" className="insights-list__title">
            What your emotions are saying
          </h2>
        </div>

        {isLoading && <p className="insights-quiet">Loading your insights&hellip;</p>}
        {!isLoading && failed && allShown.length === 0 && (
          <p className="insights-quiet">
            We couldn&rsquo;t load your insights right now. Your check-ins are safe; try again in a
            moment.
          </p>
        )}
        {!isLoading && !failed && allShown.length === 0 && <EmptyState />}
        {!isLoading && !failed && allShown.length > 0 && shown.length === 0 && (
          <div className="insights-empty">
            <p>No insights were generated in this {period === 'week' ? 'week' : 'month'}.</p>
            {period === 'week' && (
              <button
                type="button"
                className="insights-empty__switch"
                onClick={() => setPeriod('month')}
              >
                Show month (30 days)
              </button>
            )}
          </div>
        )}
        {!isLoading && shown.length > 0 && (
          <div className="insights-feed" role="feed" aria-label="Your insights" aria-busy={busy}>
            {shown.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>

      <p className="insights-foot">
        These are observations from your own check-ins, not a diagnosis. You decide what fits.
      </p>
    </main>
  )
}
