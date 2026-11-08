import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInsightsStore } from '../store.js'
import WeeklyBurnout from '../components/WeeklyBurnout.jsx'
import './InsightsPage.css'

const RANGE_OPTIONS = [
  { value: 'week', label: 'Last 7 days', days: 7 },
  { value: 'month', label: 'Last 30 days', days: 30 },
  { value: 'quarter', label: 'Last 3 months', days: 90 },
]

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

// Shown only when the insights API is unreachable, so the page still has a
// complete layout to look at. Never mixed with real user data.
const DEMO_DATA = {
  totalCheckins: 128,
  firstCheckinAt: '2026-03-04T10:00:00.000Z',
  weeklyDrain: { windowDays: 7, averageDrain: 3.4, checkins: 6 },
  weeklyBurnout: {
    windowDays: 7,
    checkins: 6,
    minimumCheckins: 3,
    level: 'some_strain',
    signals: [
      { type: 'low_energy_streak', evidence: { checkins: 6, lowEnergyCount: 3 } },
      { type: 'high_drain_repeat', evidence: { checkins: 6, highDrainCount: 3 } },
    ],
  },
  insights: [
    {
      id: 'demo-burnout',
      createdAt: daysAgo(1),
      type: 'burnout',
      title: 'Low energy after back-to-back calls',
      summary:
        'Your recent check-ins show energy dipping on days with several calls in a row.',
      evidence: [
        'Energy scored 2 or lower on 3 of the last 5 days.',
        'Calls appeared in 4 of those check-ins.',
      ],
      suggestions: ['A short gap between calls might be worth testing this week.'],
      confidence: 'high',
    },
    {
      id: 'demo-boundary',
      createdAt: daysAgo(5),
      type: 'boundary',
      title: 'Saying yes when you mean maybe',
      summary:
        'You have noted agreeing to plans, then feeling drained afterwards.',
      evidence: [
        '#work appeared in 3 draining check-ins.',
        'Drain averaged 4.2 after unplanned requests.',
      ],
      suggestions: ['Notice what happens just before you say yes.'],
      confidence: 'medium',
    },
    {
      id: 'demo-pattern',
      createdAt: daysAgo(24),
      type: 'pattern',
      title: 'Mornings are your steadiest window',
      summary: 'Check-ins logged before noon read calmer than evenings.',
      evidence: [
        'Morning check-ins averaged 3.8 / 5 energy.',
        'Evening check-ins averaged 2.1 / 5.',
      ],
      suggestions: ['Consider protecting one slow morning this week.'],
      confidence: 'medium',
    },
  ],
}

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

function TypeLabel(type) {
  const labels = {
    pattern: 'Pattern',
    burnout: 'Burnout Signal',
    boundary: 'Boundary Awareness',
    general: 'General Trend',
  }
  return labels[type] || labels.general
}

function CheckinTotal({ total, firstCheckinAt }) {
  if (!total) return null

  const since = firstCheckinAt
    ? new Date(firstCheckinAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <p className="insights-meta__line">
      <span className="insights-meta__value">{total.toLocaleString()}</span>{' '}
      <span className="insights-meta__label">
        {total === 1 ? 'check-in' : 'check-ins'} logged{since ? ` since ${since}` : ''}
      </span>
    </p>
  )
}

function WeeklyDrain({ weeklyDrain }) {
  const average = weeklyDrain?.averageDrain
  if (typeof average !== 'number') return null

  return (
    <p className="insights-meta__line">
      <span className="insights-meta__value">{average}</span>{' '}
      <span className="insights-meta__label">
        / 5 average interaction drain, last 7 days
      </span>
    </p>
  )
}

function HeaderMeta({ total, firstCheckinAt, weeklyDrain }) {
  const hasTotal = Boolean(total)
  const hasDrain = typeof weeklyDrain?.averageDrain === 'number'
  if (!hasTotal && !hasDrain) return null

  return (
    <div className="insights-meta">
      <CheckinTotal total={total} firstCheckinAt={firstCheckinAt} />
      <WeeklyDrain weeklyDrain={weeklyDrain} />
    </div>
  )
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
    </article>
  )
}

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

function topTags(insights) {
  const repeated = new Map()
  insights
    .filter((insight) => insight.type === 'boundary')
    .forEach((insight) => {
      insight.evidence?.forEach((item) => {
        ;(item.match(/#(\w+)/g) || []).forEach((tag) =>
          repeated.set(tag, (repeated.get(tag) || 0) + 1),
        )
      })
    })
  return Array.from(repeated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
}

function ContextCard({ insights }) {
  const tags = topTags(insights)

  return (
    <section className="insights-tile insights-tile--context" aria-labelledby="context-title">
      <header className="insights-tile__head">
        <span className="insight-card__tile" aria-hidden="true">
          <IconWaves />
        </span>
        <p className="insights-tile__eyebrow">A closer look</p>
      </header>

      <h2 id="context-title" className="insights-tile__title">
        Repeated contexts
      </h2>
      <p className="insights-tile__lead">
        Situations your check-ins keep returning to, when there is enough history to notice.
      </p>

      {tags.length > 0 ? (
        <ul className="insights-tags" aria-label="Repeated situation tags">
          {tags.map(([tag, count]) => (
            <li key={tag} className="insights-tags__item">
              <span>{tag}</span>
              <span className="insights-tags__count" aria-hidden="true">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="insights-tile__hint">
          <IconWaves size={17} />
          <span>Context tags may appear here once a pattern repeats.</span>
        </p>
      )}

      <p className="insights-tile__note">No assumptions, just what your check-ins show.</p>
    </section>
  )
}

function ReflectCard({ insights }) {
  const question =
    insights
      .filter((insight) => insight.type === 'boundary')
      .flatMap((insight) => insight.suggestions || [])[0] ||
    'Where might a little more space around your yes or no feel supportive?'

  return (
    <section className="insights-tile insights-tile--reflect" aria-labelledby="reflect-title">
      <header className="insights-tile__head">
        <span className="insight-card__tile" aria-hidden="true">
          <IconHeart />
        </span>
        <p className="insights-tile__eyebrow">A moment to reflect</p>
      </header>

      <h2 id="reflect-title" className="insights-tile__title">
        One question
      </h2>
      <p className="insights-tile__question">{question}</p>
      <p className="insights-tile__note">Only if it feels useful to you.</p>
    </section>
  )
}

function FeedPanel({
  insights,
  activeTab,
  onTabChange,
  busy,
  isLoading,
  isInitialLoad,
  showEmptyState,
  filtered,
  usingDemo,
  rangeLabel,
  rangeValue,
  onRangeChange,
}) {
  return (
    <section className="insights-panel" aria-labelledby="feed-title">
      <header className="insights-panel__head">
        <div>
          <p className="insights-panel__eyebrow">Your reflections</p>
          <h2 id="feed-title" className="insights-panel__title">
            What&rsquo;s been showing up
          </h2>
        </div>
        <p className="insights-panel__meta">
          <IconClock size={14} />
          <span>
            {usingDemo ? 'Preview data' : 'Your latest check-ins'} &middot; {rangeLabel}
          </span>
        </p>
      </header>

      {insights.length > 0 && (
        <div className="insights-filter" role="tablist" aria-label="Insight categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`insights-filter__item ${activeTab === 'all' ? 'insights-filter__item--active' : ''}`}
            onClick={() => onTabChange('all')}
          >
            All Patterns
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'boundary'}
            className={`insights-filter__item ${activeTab === 'boundary' ? 'insights-filter__item--active' : ''}`}
            onClick={() => onTabChange('boundary')}
          >
            Boundaries
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'burnout'}
            className={`insights-filter__item ${activeTab === 'burnout' ? 'insights-filter__item--active' : ''}`}
            onClick={() => onTabChange('burnout')}
          >
            Burnout Signals
          </button>
        </div>
      )}

      {busy && <LoadingState message="Analyzing your recent check-ins…" />}
      {isLoading && !isInitialLoad && <LoadingState message="Loading insights…" />}

      {!busy && !isLoading && showEmptyState && <InsightSpace loading={isInitialLoad} />}

      {!busy && !isLoading && !showEmptyState && filtered.length === 0 && (
        <div className="insights-filtered">
          <p>
            {insights.length === 0
              ? `Nothing has been captured in the ${rangeLabel.toLowerCase()} yet.`
              : 'No insights found under this category filter.'}
          </p>
          {insights.length === 0 && rangeValue !== 'quarter' ? (
            <button type="button" className="btn-ghost" onClick={() => onRangeChange('quarter')}>
              Show last 3 months
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => onTabChange('all')}>
              View all insights
            </button>
          )}
        </div>
      )}

      {!busy && !isLoading && !showEmptyState && filtered.length > 0 && (
        <div className="insights-feed" role="feed" aria-label="Your insights">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      <p className="insights-panel__foot">
        Observations, not answers. Nothing here diagnoses you &mdash; you decide what fits.
      </p>
    </section>
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
    status,
    notice,
    load,
    analyze,
  } = useInsightsStore()
  const [activeTab, setActiveTab] = useState('all')
  const [rangeValue, setRangeValue] = useState('week')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const busy = status === 'analyzing'
  const isLoading = status === 'loading'
  const usingDemo = status === 'failed'
  const range = RANGE_OPTIONS.find((option) => option.value === rangeValue) ?? RANGE_OPTIONS[0]

  useEffect(() => {
    load().finally(() => setIsInitialLoad(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shownInsights = usingDemo
    ? DEMO_DATA.insights
    : insights.length > 0
      ? insights
      : lastInsight
        ? [lastInsight]
        : []
  const shownTotal = usingDemo ? DEMO_DATA.totalCheckins : totalCheckins
  const shownFirst = usingDemo ? DEMO_DATA.firstCheckinAt : firstCheckinAt
  const shownDrain = usingDemo ? DEMO_DATA.weeklyDrain : weeklyDrain
  const shownBurnout = usingDemo ? DEMO_DATA.weeklyBurnout : weeklyBurnout

  const hasInsights = shownInsights.length > 0
  const cutoff = Date.now() - range.days * 24 * 60 * 60 * 1000
  const rangedShown = shownInsights.filter((item) => {
    const iso = item.createdAt || item.created_at
    if (!iso) return true
    const created = new Date(iso).getTime()
    return Number.isNaN(created) ? true : created >= cutoff
  })

  const filteredShown = rangedShown.filter((item) => {
    const type = item.type || item.insight_type
    if (activeTab === 'burnout') return type === 'burnout'
    if (activeTab === 'boundary') return type === 'boundary'
    return true
  })

  const showEmptyState = !usingDemo && !isLoading && !busy && !hasInsights

  return (
    <main className="insights-page">
      <div className="insights-topbar">
        <div className="insights-topbar__actions">
          {usingDemo && <span className="insights-topbar__tag">Preview data</span>}
          <label className="insights-range">
            <span className="insights-range__label">Show</span>
            <select
              className="insights-range__select"
              aria-label="Insight time range"
              value={rangeValue}
              onChange={(event) => setRangeValue(event.target.value)}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="insights-range__chevron" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </label>
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
        </div>
      </div>

      <header className="insights-header">
        <div className="insights-header__copy">
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

        <HeaderMeta total={shownTotal} firstCheckinAt={shownFirst} weeklyDrain={shownDrain} />
      </header>

      <BetaBanner status={usingDemo ? 'failed' : status} notice={notice} />

      <div className="insights-tiles">
        <WeeklyBurnout weeklyBurnout={shownBurnout} />
        <ContextCard insights={rangedShown} />
        <ReflectCard insights={rangedShown} />
      </div>

      <FeedPanel
        insights={rangedShown}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        busy={busy}
        isLoading={isLoading}
        isInitialLoad={isInitialLoad}
        showEmptyState={showEmptyState}
        filtered={filteredShown}
        usingDemo={usingDemo}
        rangeLabel={range.label}
        rangeValue={rangeValue}
        onRangeChange={setRangeValue}
      />
    </main>
  )
}
