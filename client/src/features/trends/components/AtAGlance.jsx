import { glanceModel } from '../glance.js'

function HeartPulseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.2 12h5.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function TrendingDownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
}

function TrendGlyph({ direction }) {
  if (direction === 'up') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    )
  }
  if (direction === 'down') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="7" x2="17" y2="17" />
        <polyline points="17 7 17 17 7 17" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" />
    </svg>
  )
}

const DIRECTION_WORD = { up: 'rising', down: 'falling', flat: 'steady' }

function trendClass(direction, invert) {
  if (direction === 'flat') {
    return 'glance-card__trend--flat'
  }
  const favorable = invert ? direction === 'down' : direction === 'up'
  return favorable ? 'glance-card__trend--good' : 'glance-card__trend--bad'
}

function GlanceCard({ name, TileIcon, metric, line }) {
  return (
    <article className="glance-card">
      <div className={`glance-card__tile glance-card__tile--${name.toLowerCase()}`} aria-hidden="true">
        <TileIcon />
      </div>
      <p className="glance-card__label">{name}</p>
      <div className="glance-card__measure">
        <p className="glance-card__value">
          {metric.avg === null ? '–' : metric.avg.toFixed(1)}
          <span className="glance-card__scale">/5</span>
        </p>
        <span
          className={`glance-card__trend ${trendClass(metric.direction, metric.invert)}`}
          role="img"
          aria-label={`${name} trend: ${DIRECTION_WORD[metric.direction]}`}
        >
          <TrendGlyph direction={metric.direction} />
        </span>
      </div>
      <p className="glance-card__line">{line}</p>
    </article>
  )
}

// Presentational: every number and sentence comes from glanceModel(data).
export default function AtAGlance({ data }) {
  const model = glanceModel(data)
  const count = model.totalCheckins
  return (
    <section className="glance" aria-labelledby="glance-heading">
      <div className="glance__header">
        <h2 id="glance-heading">At a glance</h2>
        <p className="glance__count">
          {count} check-in{count === 1 ? '' : 's'} logged
        </p>
      </div>
      <div className="glance__grid">
        <GlanceCard name="Mood" TileIcon={HeartPulseIcon} metric={model.mood} line={model.mood.line} />
        <GlanceCard name="Energy" TileIcon={ActivityIcon} metric={model.energy} line={model.energy.line} />
        <GlanceCard name="Drain" TileIcon={TrendingDownIcon} metric={model.drain} line={model.drain.line} />
      </div>
    </section>
  )
}
