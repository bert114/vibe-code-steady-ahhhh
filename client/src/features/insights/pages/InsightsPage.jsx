import { useEffect } from 'react'
import { useInsightsStore } from '../store.js'

function Confidence({ level }) {
  const labels = { low: 'Early observation', medium: 'Growing pattern', high: 'Strong pattern' }
  return <p className="insight-card__confidence">Confidence: {labels[level] ?? level} — an observation, not a diagnosis.</p>
}

function InsightCard({ insight }) {
  // Boundary insights use Observed / Reflection framing: the system notes
  // what it sees and offers a noticing prompt — never a verdict or directive.
  const isBoundary = insight.type === 'boundary'
  return (
    <article className="insight-card">
      <h2>{insight.title}</h2>
      <p>{insight.summary}</p>
      {insight.evidence?.length > 0 && (
        <section aria-label={isBoundary ? 'Observed' : 'Supporting observations'}>
          <h3>{isBoundary ? 'Observed' : 'What this is based on'}</h3>
          <ul>
            {insight.evidence.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {insight.suggestions?.length > 0 && (
        <section aria-label={isBoundary ? 'Reflection' : 'Optional reflections'}>
          <h3>{isBoundary ? 'Reflection' : 'Something to consider'}</h3>
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
  const { insights, lastInsight, status, load, analyze } = useInsightsStore()
  const busy = status === 'loading' || status === 'analyzing'

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = insights.length > 0 ? insights : lastInsight ? [lastInsight] : []

  return (
    <main className="insights-page">
      <p className="page-eyebrow">Patterns, not verdicts</p>
      <h1>Insights</h1>
      <div className="insights-toolbar">
        <p>Notice what repeats, with enough space to decide what it means for you.</p>
        <button type="button" onClick={analyze} disabled={busy}>
          {status === 'analyzing' ? 'Analyzing…' : 'Analyze my recent check-ins'}
        </button>
      </div>
      {!busy && shown.length === 0 && (
        <p>No insights yet. Record a few check-ins, then run an analysis.</p>
      )}
      {shown.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </main>
  )
}
