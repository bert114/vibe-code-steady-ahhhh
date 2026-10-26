import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInsightsStore } from '../store.js'
<<<<<<< HEAD

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
=======
import './InsightsPage.css'

function IconClock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function IconSparkle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 4c.55 3.1 1.4 3.95 4.5 4.5-3.1.55-3.95 1.4-4.5 4.5-.55-3.1-1.4-3.95-4.5-4.5C9.6 7.95 10.45 7.1 11 4Z" />
      <path d="M17.5 14.5c.3 1.7.8 2.2 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.3 2.2-.8 2.5-2.5Z" />
    </svg>
  )
}

function IconArrow({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="M12.5 6.5 19 12l-6.5 5.5" />
    </svg>
  )
}

function IconInfo({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16.5v-5" />
      <path d="M12 8.2h.01" />
    </svg>
  )
}

function IconWaves({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0 2.7-1.6 4 0 2.7 1.6 4 0" />
      <path d="M3 12c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0 2.7-1.6 4 0 2.7 1.6 4 0" />
      <path d="M3 16.5c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0 2.7-1.6 4 0 2.7 1.6 4 0" />
    </svg>
  )
}

function IconHeart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  )
}

function IconEye({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-6.8 10-6.8S22 12 22 12s-3.6 6.8-10 6.8S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function TypeLabel(type) {
  const labels = {
    pattern: 'Pattern',
    burnout: 'Burnout Signal',
    boundary: 'Boundary Awareness',
    general: 'General Trend',
  }
  return labels[type] || labels.general
}

function BetaBanner({ status, notice }) {
  const analyzing = status === 'analyzing'
  const state = analyzing ? 'analyzing' : notice ? 'notice' : 'default'

  return (
    <div className="insights-banner" role="status" aria-live="polite" data-state={state}>
      <span className="insights-banner__icon" aria-hidden="true">
        {analyzing ? <span className="insights-banner__pulse" /> : <IconInfo />}
      </span>
      <div className="insights-banner__body">
        <strong>{analyzing ? 'Analysis in progress' : 'Insights are in beta'}</strong>
        <span>
          {analyzing
            ? 'Analyzing your recent check-ins…'
            : notice ||
              "Analysis may be temporarily unavailable. We'll only show observations grounded in your check-ins."}
        </span>
      </div>
      <span className="insights-banner__tag">{analyzing ? 'Analyzing' : 'Beta preview'}</span>
    </div>
  )
}

function InsightCard({ insight }) {
  const isBoundary = insight.type === 'boundary'
  const confidence = insight.confidence

  return (
    <article className="insight-card" aria-labelledby={`insight-title-${insight.id}`}>
      <header className="insight-card__head">
        <span className="insight-card__tile" aria-hidden="true">
          <IconWaves />
        </span>
        <span className="insight-card__type" data-type={insight.type}>
          {TypeLabel(insight.type)}
        </span>
        <span className="insight-card__confidence" data-confidence={confidence} aria-label={`Confidence: ${confidence}`}>
          <span className="insight-card__confidence-bar" aria-hidden="true">
            <span className="insight-card__confidence-fill" />
          </span>
          <span className="insight-card__confidence-text">{confidence}</span>
        </span>
      </header>

      <h3 id={`insight-title-${insight.id}`} className="insight-card__title">
        {insight.title}
      </h3>

      <p className="insight-card__summary">{insight.summary}</p>

      {insight.evidence?.length > 0 && (
        <dl className="insight-card__block">
          <dt role="heading" aria-level={4}>
            {isBoundary ? 'Observed' : 'What this is based on'}
          </dt>
          <dd>
            <ul role="list">
              {insight.evidence.map((item, i) => (
                <li key={i} role="listitem" className="insight-card__item">{item}</li>
              ))}
            </ul>
          </dd>
        </dl>
      )}

      {insight.suggestions?.length > 0 && (
        <dl className="insight-card__block">
          <dt role="heading" aria-level={4}>
            {isBoundary ? 'Reflection' : 'Something to consider'}
          </dt>
          <dd>
            <ul role="list">
              {insight.suggestions.map((item, i) => (
                <li key={i} role="listitem" className="insight-card__item insight-card__item--reflection">{item}</li>
              ))}
            </ul>
          </dd>
        </dl>
      )}

      <p className="insight-card__foot">Observation, not a diagnosis</p>
>>>>>>> new
    </article>
  )
}

<<<<<<< HEAD
export default function InsightsPage() {
  const { insights, lastInsight, status, load, analyze } = useInsightsStore()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'burnout' | 'boundary'
  const busy = status === 'loading' || status === 'analyzing'

  useEffect(() => {
    load()
=======
function InsightSpace({ loading }) {
  return (
    <div className="insight-space">
      <span className="insight-space__rings" aria-hidden="true">
        <svg width="180" height="180" viewBox="0 0 180 180" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="90" cy="90" r="40" />
          <circle cx="90" cy="90" r="62" />
          <circle cx="90" cy="90" r="84" />
        </svg>
      </span>

      <span className="insight-card__tile" aria-hidden="true">
        <IconWaves />
      </span>

      <p className="insight-space__eyebrow">Your insight space</p>
      <h3 className="insight-space__title">Your check-ins will shape this space</h3>
      <p className="insight-space__text">
        {loading
          ? 'Gathering your recent check-ins…'
          : 'Analysis needs a little history first — at least 3 check-ins over several days. Everything you record gathers quietly here until a pattern is worth showing.'}
      </p>

      {!loading && (
        <Link to="/check-in" className="insight-space__link">
          Record a check-in now
          <IconArrow />
        </Link>
      )}
    </div>
  )
}

function LoadingState({ message }) {
  return (
    <div className="insights-loading" aria-hidden="true">
      <div className="insights-loading__bar">
        <span className="insights-loading__progress" />
      </div>
      <p>{message}</p>
    </div>
  )
}

function CloserLook({ insights }) {
  const boundaryInsights = insights.filter((i) => i.type === 'boundary')

  const repeatedTags = new Map()
  boundaryInsights.forEach((insight) => {
    insight.evidence?.forEach((item) => {
      const tags = item.match(/#(\w+)/g) || []
      tags.forEach((tag) => repeatedTags.set(tag, (repeatedTags.get(tag) || 0) + 1))
    })
  })
  const topTags = Array.from(repeatedTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const firstReflection = boundaryInsights
    .flatMap((i) => i.suggestions || [])[0]
  const question = firstReflection || 'Where might a little more space around your yes or no feel supportive?'

  return (
    <section className="closer-look" aria-labelledby="closer-look-title">
      <header className="closer-look__head">
        <span className="insight-card__tile" aria-hidden="true">
          <IconWaves />
        </span>
        <p className="closer-look__eyebrow">A closer look</p>
      </header>

      <h2 id="closer-look-title" className="closer-look__title">
        Boundary <em>awareness</em>
      </h2>
      <p className="closer-look__lead">
        Noticing where your energy goes can offer a little more room to choose.
      </p>

      <hr className="closer-look__rule" />

      <div className="closer-look__meta">
        <span>Repeated contexts</span>
        <span>when present</span>
      </div>

      {topTags.length > 0 ? (
        <ul className="closer-look__tags" aria-label="Repeated situation tags">
          {topTags.map(([tag, count]) => (
            <li key={tag} className="closer-look__tag">
              <span className="closer-look__tag-name">{tag}</span>
              <span className="closer-look__tag-count" aria-hidden="true">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="closer-look__hint">
          <IconWaves size={17} />
          <span>
            Repeated context tags may appear here when there's enough recent check-in history to
            notice a pattern.
          </span>
        </p>
      )}

      <p className="closer-look__note">No assumptions, just what your check-ins show.</p>

      <div className="closer-look__reflect">
        <span className="closer-look__reflect-icon" aria-hidden="true">
          <IconHeart />
        </span>
        <p className="closer-look__reflect-eyebrow">A moment to reflect</p>
        <p className="closer-look__reflect-question">{question}</p>
        <p className="closer-look__reflect-note">Only if it feels useful to you.</p>
      </div>
    </section>
  )
}

export default function InsightsPage() {
  const { insights, lastInsight, status, notice, load, analyze } = useInsightsStore()
  const [activeTab, setActiveTab] = useState('all')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const busy = status === 'analyzing'
  const isLoading = status === 'loading'

  useEffect(() => {
    load().finally(() => setIsInitialLoad(false))
>>>>>>> new
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rawShown = insights.length > 0 ? insights : lastInsight ? [lastInsight] : []
<<<<<<< HEAD

  const filteredShown = rawShown.filter((item) => {
    if (activeTab === 'burnout') return (item.type || item.insight_type) === 'burnout'
    if (activeTab === 'boundary') return (item.type || item.insight_type) === 'boundary'
    return true
  })

  return (
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
=======
  const hasInsights = rawShown.length > 0

  const filteredShown = rawShown.filter((item) => {
    const type = item.type || item.insight_type
    if (activeTab === 'burnout') return type === 'burnout'
    if (activeTab === 'boundary') return type === 'boundary'
    return true
  })

  const showEmptyState = !isLoading && !busy && !hasInsights

  return (
    <main className="insights-page">
      <header className="insights-hero">
        <div className="insights-hero__copy">
          <p className="insights-hero__eyebrow">
            <span className="insights-hero__rule" aria-hidden="true" />
            A pause for perspective
          </p>
          <h1 className="insights-hero__title">Insights</h1>
          <p className="insights-hero__subtitle">
            Gentle observations from your check-ins, to help you notice what&rsquo;s been taking
            shape.
          </p>
          <p className="insights-hero__note">
            <IconClock size={15} />
            <span>These are reflections on your check-ins, never medical diagnoses.</span>
          </p>
        </div>

        <button
          type="button"
          className="insights-run"
          onClick={analyze}
          disabled={busy || isLoading}
          aria-busy={busy || isLoading}
        >
          <IconSparkle />
          <span>{busy ? 'Analyzing…' : 'Analyze my recent check-ins'}</span>
          <IconArrow />
        </button>
      </header>

      <BetaBanner status={status} notice={notice} />

      <div className="insights-layout">
        <div className="insights-feed-col">
          <div className="insights-section-head">
            <div className="insights-section-head__text">
              <p className="insights-section-head__eyebrow">Your reflections</p>
              <h2 className="insights-section-head__title">What&rsquo;s been showing up</h2>
            </div>
            <p className="insights-section-head__meta">
              <IconClock size={14} />
              <span>Your latest check-ins</span>
            </p>
          </div>

          {hasInsights && (
            <div className="insights-filter" role="tablist" aria-label="Insight categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`insights-filter__item ${activeTab === 'all' ? 'insights-filter__item--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Patterns
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'boundary'}
                className={`insights-filter__item ${activeTab === 'boundary' ? 'insights-filter__item--active' : ''}`}
                onClick={() => setActiveTab('boundary')}
              >
                Boundaries
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'burnout'}
                className={`insights-filter__item ${activeTab === 'burnout' ? 'insights-filter__item--active' : ''}`}
                onClick={() => setActiveTab('burnout')}
              >
                Burnout Signals
              </button>
            </div>
          )}

          {busy && <LoadingState message="Analyzing your recent check-ins…" />}

          {isLoading && !isInitialLoad && <LoadingState message="Loading insights…" />}

          {!busy && !isLoading && showEmptyState && <InsightSpace loading={isInitialLoad} />}

          {!busy && !isLoading && !showEmptyState && filteredShown.length === 0 && (
            <div className="insights-filtered">
              <p>No insights found under this category filter.</p>
              <button type="button" className="btn-ghost" onClick={() => setActiveTab('all')}>
                View all insights
              </button>
            </div>
          )}

          {!busy && !isLoading && !showEmptyState && filteredShown.length > 0 && (
            <div className="insights-feed" role="feed" aria-label="Your insights">
              {filteredShown.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>

        <aside className="insights-aside">
          <CloserLook insights={rawShown} />

          <section className="aside-note" aria-labelledby="aside-note-title">
            <span className="insight-card__tile" aria-hidden="true">
              <IconEye />
            </span>
            <div>
              <h2 id="aside-note-title" className="aside-note__title">
                Observations, not answers
              </h2>
              <p className="aside-note__text">
                Insights rephrase what your check-ins already show, with uncertainty stated.
                Nothing here diagnoses you &mdash; you decide what fits.
              </p>
            </div>
          </section>
        </aside>
>>>>>>> new
      </div>
    </main>
  )
}
