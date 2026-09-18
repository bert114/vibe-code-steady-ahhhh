import { useEffect } from 'react'
import { useInsightsStore } from '../store.js'

function Confidence({ level }) {
  const labels = { low: 'Early observation', medium: 'Growing pattern', high: 'Strong pattern' }
  return <p>Confidence: {labels[level] ?? level} — an observation, not a diagnosis.</p>
}

function InsightCard({ insight }) {
  return (
    <article>
      <h2>{insight.title}</h2>
      <p>{insight.summary}</p>
      {insight.evidence?.length > 0 && (
        <section aria-label="Supporting observations">
          <h3>What this is based on</h3>
          <ul>
            {insight.evidence.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {insight.suggestions?.length > 0 && (
        <section aria-label="Optional reflections">
          <h3>Something to consider</h3>
          <ul>
            {insight.suggestions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <Confidence level={insight.confidence} />
    </article>
  )
}

export default function InsightsPage() {
  const { insights, lastInsight, status, notice, error, load, analyze } = useInsightsStore()
  const busy = status === 'loading' || status === 'analyzing'

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = insights.length > 0 ? insights : lastInsight ? [lastInsight] : []

  return (
    <main>
      <h1>Insights</h1>
      <button type="button" onClick={analyze} disabled={busy}>
        {status === 'analyzing' ? 'Analyzing…' : 'Analyze my recent check-ins'}
      </button>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">Couldn&apos;t load insights right now: {error}</p>}
      {!busy && shown.length === 0 && !notice && (
        <p>No insights yet. Record a few check-ins, then run an analysis.</p>
      )}
      {shown.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </main>
  )
}
