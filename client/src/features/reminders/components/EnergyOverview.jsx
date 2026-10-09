// Energy Overview — full-width 7-day capsule chart for the Recent check-ins card.
// Presentational only: buckets existing check-ins into a rolling 7-day
// window (empty days render as faint tracks). No fetching, no store.
import { useMemo } from 'react'
import { bucketWeek, statusFor } from './energyBattery.helpers.js'

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="overview-range__icon">
      <path
        d="m4 6 4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function EnergyOverview({ checkins }) {
  const { days, activeIndex, current } = useMemo(() => bucketWeek(checkins), [checkins])

  return (
    <>
      <div className="overview-head">
        <p className="dashboard-panel__label">Your week at a glance</p>
        <p className="overview-range">
          Last 7 Days <ChevronIcon />
        </p>
      </div>

      <div className="overview-chart" role="img" aria-label={current ? `Energy over the last 7 days, current level ${current.percent} percent` : 'No energy readings in the last 7 days'}>
        {days.map((day, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={day.key}
              type="button"
              className={`capsule-col${isActive ? ' capsule-col--active' : ''}`}
              aria-label={day.percent ? `${day.label} ${day.fullLabel}: ${day.percent} percent` : `${day.label} ${day.fullLabel}: no reading`}
            >
              <span className="capsule-tip" aria-hidden="true">
                <span className="capsule-tip__date">{day.fullLabel}</span>
                <span className="capsule-tip__value">
                  {day.percent ? `${day.percent}% ${statusFor(day.energy).label}` : 'No reading'}
                </span>
              </span>
              <span className="capsule-track">
                {day.percent ? (
                  <span
                    className={`capsule-fill${isActive ? ' capsule-fill--active' : ''}`}
                    style={{ height: `${day.percent}%` }}
                  />
                ) : (
                  <span className="capsule-fill capsule-fill--empty" style={{ height: '100%' }} />
                )}
              </span>
              <span className={`capsule-label${isActive ? ' capsule-label--active' : ''}`}>{day.label}</span>
            </button>
          )
        })}
      </div>

      <table className="visually-hidden">
        <caption>Energy by day, last 7 days</caption>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}>
              <th scope="row">{`${day.label} ${day.fullLabel}`}</th>
              <td>{day.percent ? `${day.percent} percent` : 'No reading'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
