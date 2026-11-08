import { signalText } from '../../../lib/ui/signalText.js'

// Period summary: burnout signals in plain words, averages for mood, energy,
// and drain with icons, the most draining interaction, and all interactions
// (context_tags) logged in the selected period.
const LEVEL_COPY = {
  steady: {
    label: 'Steady',
    lead: 'No burnout signals stood out in this week\u2019s reflections.',
  },
  some_strain: {
    label: 'Some strain',
    lead: 'One pattern worth noticing appeared this week.',
  },
  elevated: {
    label: 'Elevated',
    lead: 'Several strain signals overlapped this week.',
  },
  insufficient: {
    label: 'Not enough yet',
    lead: null,
  },
}

function MoodIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function EnergyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="7" width="16.5" height="10" rx="2.2" />
      <path d="M21.5 10.5v3" />
      <path d="M6 10.5v3M9.5 10.5v3M13 10.5v3" />
    </svg>
  )
}

function DrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5c0 0-6 7.6-6 11.8a6 6 0 0 0 12 0c0-4.2-6-11.8-6-11.8Z" />
    </svg>
  )
}

function MostDrainingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  )
}

function InteractionIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
    </svg>
  )
}

function plural(n, one, many) {
  return n === 1 ? one : many
}

function describeScore(value, lowWord, midWord, highWord) {
  if (typeof value !== 'number') return null
  if (value < 2.5) return lowWord
  if (value <= 3.5) return midWord
  return highWord
}

function historySentence(total, firstCheckinAt) {
  if (!total) return null
  const since = firstCheckinAt
    ? new Date(firstCheckinAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null
  return `You have ${total.toLocaleString()} ${plural(total, 'reflection', 'reflections')} logged${
    since ? ` since ${since}` : ''
  }.`
}

export default function PeriodPatternSummary({
  period = 'week',
  periodSummary,
  weeklyBurnout,
  weeklyDrain,
  totalCheckins,
  firstCheckinAt,
}) {
  const averageMood =
    typeof periodSummary?.averageMood === 'number' ? periodSummary.averageMood : null
  const averageEnergy =
    typeof periodSummary?.averageEnergy === 'number' ? periodSummary.averageEnergy : null
  const averageDrain =
    typeof periodSummary?.averageDrain === 'number'
      ? periodSummary.averageDrain
      : period === 'week' && typeof weeklyDrain?.averageDrain === 'number'
        ? weeklyDrain.averageDrain
        : null
  const interactions = Array.isArray(periodSummary?.interactions) ? periodSummary.interactions : []
  const mostDraining =
    periodSummary?.mostDrainingInteraction ??
    (interactions.length > 0
      ? [...interactions].sort(
          (a, b) => (b.averageDrain ?? 0) - (a.averageDrain ?? 0) || (b.count ?? 0) - (a.count ?? 0),
        )[0]
      : null)
  const hasAverages = averageMood !== null || averageEnergy !== null || averageDrain !== null
  const history = historySentence(totalCheckins, firstCheckinAt)

  if (!weeklyBurnout && !hasAverages && interactions.length === 0 && !mostDraining && !history) {
    return null
  }

  const level = weeklyBurnout && LEVEL_COPY[weeklyBurnout.level] ? weeklyBurnout.level : null
  const copy = level ? LEVEL_COPY[level] : null
  const checkins = Number(periodSummary?.checkins ?? weeklyBurnout?.checkins ?? 0)
  const windowDays = periodSummary?.windowDays ?? weeklyBurnout?.windowDays ?? (period === 'month' ? 30 : 7)
  const minimumCheckins = weeklyBurnout?.minimumCheckins ?? 3
  const signals = (weeklyBurnout?.signals ?? [])
    .map((signal) => ({ ...signal, text: signalText(signal, true) }))
    .filter((signal) => signal.text)
  const lead =
    level === 'insufficient'
      ? `A weekly pattern needs at least ${minimumCheckins} reflections. You have ${
          weeklyBurnout?.checkins ?? 0
        } ${plural(weeklyBurnout?.checkins ?? 0, 'reflection', 'reflections')} in the last ${
          weeklyBurnout?.windowDays ?? 7
        } days.`
      : copy?.lead

  const heading = period === 'month' ? 'This month' : 'This week'

  return (
    <section className="week" aria-labelledby="week-title" data-level={level ?? 'none'}>
      {(hasAverages || mostDraining) && (
        <div className="week__averages" aria-label={`${heading} averages`}>
          {averageMood !== null && (
            <div className="week__stat">
              <div className="week__stat-head">
                <p className="week__stat-label">Average mood</p>
                <span className="week__stat-icon" aria-hidden="true"><MoodIcon /></span>
              </div>
              <p className="week__stat-number">
                <strong>{averageMood}</strong> <small>/ 5</small>
              </p>
              <p className="week__stat-value">
                <span>{describeScore(averageMood, 'Low', 'Steady', 'Good')}</span>
              </p>
            </div>
          )}

          {averageEnergy !== null && (
            <div className="week__stat">
              <div className="week__stat-head">
                <p className="week__stat-label">Average energy</p>
                <span className="week__stat-icon" aria-hidden="true"><EnergyIcon /></span>
              </div>
              <p className="week__stat-number">
                <strong>{averageEnergy}</strong> <small>/ 5</small>
              </p>
              <p className="week__stat-value">
                <span>{describeScore(averageEnergy, 'Running low', 'Steady', 'Full')}</span>
              </p>
            </div>
          )}

          {averageDrain !== null && (
            <div className="week__stat">
              <div className="week__stat-head">
                <p className="week__stat-label">Average drain</p>
                <span className="week__stat-icon" aria-hidden="true"><DrainIcon /></span>
              </div>
              <p className="week__stat-number">
                <strong>{averageDrain}</strong> <small>/ 5</small>
              </p>
              <p className="week__stat-value">
                <span>out of 5 (1 is light, 5 is heavy)</span>
              </p>
            </div>
          )}

          {mostDraining && (
            <div className="week__stat week__stat--draining">
              <div className="week__stat-head">
                <p className="week__stat-label">Most draining interaction</p>
                <span className="week__stat-icon week__stat-icon--draining" aria-hidden="true">
                  <MostDrainingIcon />
                </span>
              </div>
              <p className="week__stat-number week__stat-number--tag">
                <strong>{mostDraining.tag}</strong>
              </p>
              <p className="week__stat-value">
                {typeof mostDraining.averageDrain === 'number' && (
                  <span>{mostDraining.averageDrain} / 5 drain</span>
                )}
                {typeof mostDraining.count === 'number' && (
                  <span> &middot; ({mostDraining.count}&times;)</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {interactions.length > 0 && (
        <div className="week__interactions">
          <p className="week__interactions-title">
            <InteractionIcon />
            <span>Interactions logged:</span>
          </p>
          <ul className="week__interactions-list" aria-label="Interactions logged">
            {interactions.map((item) => (
              <li key={item.tag} className="week__interaction-chip">
                <span>{item.tag}</span>
                <span className="week__interaction-count">{item.count}&times;</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="week__summary-bar">
        <div className="week__head">
          <h2 id="week-title" className="week__title">{heading}</h2>
          {copy && <p className="week__level">{copy.label}</p>}
          {lead && <p className="week__lead">{lead}</p>}
        </div>

        {level && level !== 'insufficient' && signals.length > 0 && (
          <ul className="week__signals" aria-label={`Signals from the last ${weeklyBurnout?.windowDays ?? 7} days`}>
            {signals.map((signal, index) => (
              <li key={`${signal.type}-${index}`}>{signal.text}</li>
            ))}
          </ul>
        )}

        <p className="week__facts">
          {checkins > 0 && (level !== 'insufficient' || period === 'month') && (
            <span>
              Based on {checkins} {plural(checkins, 'reflection', 'reflections')} in the last {windowDays} days.{' '}
            </span>
          )}
          {history && <span>{history}</span>}
        </p>
      </div>
    </section>
  )
}

