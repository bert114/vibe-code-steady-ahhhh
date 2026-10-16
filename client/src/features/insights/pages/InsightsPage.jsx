import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInsightsStore } from '../store.js'

function confidenceBadge(level) {
  switch (level) {
    case 'high':
      return { label: 'Strong pattern', cls: 'tag tag--green' }
    case 'medium':
      return { label: 'Growing pattern', cls: 'tag tag--yellow' }
    case 'low':
    default:
      return { label: 'Early observation', cls: 'tag tag--neutral' }
  }
}

function insightCategory(type) {
  switch (type) {
    case 'boundary':
      return { label: 'Boundary Reflection', cls: 'chip--context' }
    case 'burnout':
      return { label: 'Burnout Signal', cls: 'badge--mood-rough' }
    default:
      return { label: 'Pattern Observation', cls: 'chip--emotion' }
  }
}

function InsightCard({ insight }) {
  // Boundary insights use Observed / Reflection framing: the system notes
  // what it sees and offers a noticing prompt — never a verdict or directive.
  const isBoundary = insight.type === 'boundary' || insight.insight_type === 'boundary'
  const conf = confidenceBadge(insight.confidence)
  const cat = insightCategory(insight.type || insight.insight_type)

  return (
    <article className="insight-card-rich">
      <header className="insight-card-rich__header">
        <div className="insight-card-rich__tags">
          <span className={`chip ${cat.cls}`}>{cat.label}</span>
          <span className={conf.cls}>{conf.label}</span>
        </div>
        <p className="insight-card-rich__disclaimer">Observation, not a diagnosis</p>
      </header>

      <h2 className="insight-card-rich__title">{insight.title}</h2>
      <p className="insight-card-rich__summary">{insight.summary}</p>

      <div className="insight-card-rich__content-grid">
        {insight.evidence?.length > 0 && (
          <section
            aria-label={isBoundary ? 'Observed' : 'Supporting observations'}
            className="insight-callout insight-callout--observed"
          >
            <h3 className="insight-callout__heading">
              {isBoundary ? 'Observed' : 'What this is based on'}
            </h3>
            <ul className="insight-callout__list">
              {insight.evidence.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {insight.suggestions?.length > 0 && (
          <section
            aria-label={isBoundary ? 'Reflection' : 'Optional reflections'}
            className="insight-callout insight-callout--reflection"
          >
            <h3 className="insight-callout__heading">
              {isBoundary ? 'Reflection' : 'Something to consider'}
            </h3>
            <ul className="insight-callout__list">
              {insight.suggestions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}

export default function InsightsPage() {
  const { insights, lastInsight, status, load, analyze } = useInsightsStore()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'burnout' | 'boundary'
  const busy = status === 'loading' || status === 'analyzing'

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rawShown = insights.length > 0 ? insights : lastInsight ? [lastInsight] : []

  const filteredShown = rawShown.filter((item) => {
    if (activeTab === 'burnout') return (item.type || item.insight_type) === 'burnout'
    if (activeTab === 'boundary') return (item.type || item.insight_type) === 'boundary'
    return true
  })

  return (
    <div
      data-impeccable-variants="22c4b009"
      data-impeccable-variant-count="2"
      style={{ display: "contents" }}
    >
      {/* impeccable-variants-start 22c4b009 */}
      {/* Original */}
      <div data-impeccable-variant="original">
        <main className="insights-page">
          <div className="insights-page__header">
            <p className="page-eyebrow">Patterns, not verdicts</p>
            <h1>Insights</h1>
            <p className="insights-page__lead">
              Notice recurring emotional triggers and overextension patterns with enough space to decide what they mean for you.
            </p>

            <div className="insights-toolbar">
              <div className="insights-tabs" role="tablist" aria-label="Insight categories">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                  className={`insights-tab ${activeTab === 'all' ? 'insights-tab--active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Patterns
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'boundary'}
                  className={`insights-tab ${activeTab === 'boundary' ? 'insights-tab--active' : ''}`}
                  onClick={() => setActiveTab('boundary')}
                >
                  Boundaries
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'burnout'}
                  className={`insights-tab ${activeTab === 'burnout' ? 'insights-tab--active' : ''}`}
                  onClick={() => setActiveTab('burnout')}
                >
                  Burnout Signals
                </button>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={analyze}
                disabled={busy}
              >
                {status === 'analyzing' ? 'Analyzing…' : 'Analyze my recent check-ins'}
              </button>
            </div>
          </div>

          {!busy && rawShown.length === 0 && (
            <div className="insights-empty-card">
              <h2>No insights yet</h2>
              <p>
                Insights appear once you have accumulated a few check-ins. The pattern engine needs at least 3 entries to identify recurring patterns or boundary pressures.
              </p>
              <Link to="/check-in" className="btn-secondary">
                Record a check-in now
              </Link>
            </div>
          )}

          {!busy && rawShown.length > 0 && filteredShown.length === 0 && (
            <div className="insights-empty-card">
              <p>No insights found under this category filter.</p>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setActiveTab('all')}>
                View all insights
              </button>
            </div>
          )}

          <div className="insights-list">
            {filteredShown.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </main>
      </div>
      <style data-impeccable-css="22c4b009">{`
@scope ([data-impeccable-variant="1"]) {
  :scope > .insights-page--quiet-underline .insights-tabs {
    gap: calc(1.1rem * var(--p-density, 1));
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  :scope > .insights-page--quiet-underline .insights-tab {
    padding: 0.55rem 0.1rem;
    border: 0;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    font-weight: 500;
  }

  :scope > .insights-page--quiet-underline .insights-tab--active {
    background: transparent;
    color: var(--text);
    border-bottom-color: var(--primary);
  }
}

@scope ([data-impeccable-variant="2"]) {
  :scope > .insights-page--quiet-surface .insights-tabs {
    gap: calc(0.25rem * var(--p-density, 1));
    border-color: color-mix(in oklch, var(--border-muted) 70%, transparent);
    background: color-mix(in oklch, var(--bg-light) 72%, transparent);
  }

  :scope > .insights-page--quiet-surface .insights-tab {
    font-weight: 500;
  }

  :scope > .insights-page--quiet-surface .insights-tab--active {
    background: color-mix(in oklch, var(--primary) 12%, var(--bg-light));
    color: var(--primary);
    box-shadow: inset 0 -1px 0 color-mix(in oklch, var(--primary) 42%, transparent);
  }
}

@media (max-width: 760px) {
  @scope ([data-impeccable-variant="1"]) {
    :scope > .insights-page--quiet-underline .insights-tabs {
      gap: 0.75rem;
      overflow-x: auto;
      scrollbar-width: thin;
    }
  }
}
`}</style>
      <div
        data-impeccable-variant="1"
        data-impeccable-params='[{"id":"density","kind":"range","min":0.8,"max":1.2,"step":0.05,"default":1,"label":"Tab spacing"}]'
      >
        <main className="insights-page insights-page--quiet-underline">
          <div className="insights-page__header">
            <p className="page-eyebrow">Patterns, not verdicts</p>
            <h1>Insights</h1>
            <p className="insights-page__lead">
              Notice recurring emotional triggers and overextension patterns with enough space to decide what they mean for you.
            </p>
            <div className="insights-toolbar">
              <div className="insights-tabs" role="tablist" aria-label="Insight categories">
                <button type="button" role="tab" aria-selected={activeTab === 'all'} className={`insights-tab ${activeTab === 'all' ? 'insights-tab--active' : ''}`} onClick={() => setActiveTab('all')}>All Patterns</button>
                <button type="button" role="tab" aria-selected={activeTab === 'boundary'} className={`insights-tab ${activeTab === 'boundary' ? 'insights-tab--active' : ''}`} onClick={() => setActiveTab('boundary')}>Boundaries</button>
                <button type="button" role="tab" aria-selected={activeTab === 'burnout'} className={`insights-tab ${activeTab === 'burnout' ? 'insights-tab--active' : ''}`} onClick={() => setActiveTab('burnout')}>Burnout Signals</button>
              </div>
              <button type="button" className="btn-primary" onClick={analyze} disabled={busy}>{status === 'analyzing' ? 'Analyzing…' : 'Analyze my recent check-ins'}</button>
            </div>
          </div>
          {!busy && rawShown.length === 0 && (
            <div className="insights-empty-card">
              <h2>No insights yet</h2>
              <p>Insights appear once you have accumulated a few check-ins. The pattern engine needs at least 3 entries to identify recurring patterns or boundary pressures.</p>
              <Link to="/check-in" className="btn-secondary">Record a check-in now</Link>
            </div>
          )}
          {!busy && rawShown.length > 0 && filteredShown.length === 0 && (
            <div className="insights-empty-card">
              <p>No insights found under this category filter.</p>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setActiveTab('all')}>View all insights</button>
            </div>
          )}
          <div className="insights-list">{filteredShown.map((insight) => <InsightCard key={insight.id} insight={insight} />)}</div>
        </main>
      </div>
      <div data-impeccable-variant="2" style={{ display: "none" }} data-impeccable-params='[{"id":"density","kind":"range","min":0.8,"max":1.2,"step":0.05,"default":1,"label":"Tab spacing"}]'>
        <main className="insights-page insights-page--quiet-surface">
          <div className="insights-page__header">
            <p className="page-eyebrow">Patterns, not verdicts</p>
            <h1>Insights</h1>
            <p className="insights-page__lead">Notice recurring emotional triggers and overextension patterns with enough space to decide what they mean for you.</p>
            <div className="insights-toolbar">
              <div className="insights-tabs" role="tablist" aria-label="Insight categories">
                <button type="button" role="tab" aria-selected={activeTab === 'all'} className={`insights-tab ${activeTab === 'all' ? 'insights-tab--active' : ''}`} onClick={() => setActiveTab('all')}>All Patterns</button>
                <button type="button" role="tab" aria-selected={activeTab === 'boundary'} className={`insights-tab ${activeTab === 'boundary' ? 'insights-tab--active' : ''}`} onClick={() => setActiveTab('boundary')}>Boundaries</button>
                <button type="button" role="tab" aria-selected={activeTab === 'burnout'} className={`insights-tab ${activeTab === 'burnout' ? 'insights-tab--active' : ''}`} onClick={() => setActiveTab('burnout')}>Burnout Signals</button>
              </div>
              <button type="button" className="btn-primary" onClick={analyze} disabled={busy}>{status === 'analyzing' ? 'Analyzing…' : 'Analyze my recent check-ins'}</button>
            </div>
          </div>
          {!busy && rawShown.length === 0 && (
            <div className="insights-empty-card">
              <h2>No insights yet</h2>
              <p>Insights appear once you have accumulated a few check-ins. The pattern engine needs at least 3 entries to identify recurring patterns or boundary pressures.</p>
              <Link to="/check-in" className="btn-secondary">Record a check-in now</Link>
            </div>
          )}
          {!busy && rawShown.length > 0 && filteredShown.length === 0 && (
            <div className="insights-empty-card">
              <p>No insights found under this category filter.</p>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setActiveTab('all')}>View all insights</button>
            </div>
          )}
          <div className="insights-list">{filteredShown.map((insight) => <InsightCard key={insight.id} insight={insight} />)}</div>
        </main>
      </div>
      {/* impeccable-variants-end 22c4b009 */}
    </div>
  )
}
