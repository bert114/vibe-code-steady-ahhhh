import { signalText } from '../../../lib/ui/signalText.js'

const LEVEL_COPY = {
  steady: {
    label: 'Steady',
    lead: 'No burnout signals stood out in this week\u2019s check-ins.',
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

export default function WeeklyBurnout({ weeklyBurnout }) {
  if (!weeklyBurnout) return null

  const level = LEVEL_COPY[weeklyBurnout.level] ? weeklyBurnout.level : 'steady'
  const copy = LEVEL_COPY[level]
  const checkins = Number(weeklyBurnout.checkins ?? 0)
  const windowDays = weeklyBurnout.windowDays ?? 7
  const minimumCheckins = weeklyBurnout.minimumCheckins ?? 3
  const checkinLabel = checkins === 1 ? 'check-in' : 'check-ins'
  const signals = (weeklyBurnout.signals ?? [])
    .map((signal) => ({ ...signal, text: signalText(signal, true) }))
    .filter((signal) => signal.text)
  const lead =
    level === 'insufficient'
      ? `A weekly pattern needs at least ${minimumCheckins} check-ins. You have ${checkins} ${checkinLabel} in the last ${windowDays} days.`
      : copy.lead
  const note =
    checkins > 0
      ? `Based on ${checkins} ${checkinLabel} in the last ${windowDays} days. Observation, not a diagnosis.`
      : 'Observation, not a diagnosis.'

  return (
    <section className="weekly-burnout" aria-labelledby="weekly-burnout-title" data-level={level}>
      <header className="weekly-burnout__head">
        <div>
          <p className="weekly-burnout__eyebrow">This week</p>
          <h2 id="weekly-burnout-title" className="weekly-burnout__title">
            Burnout signals this week
          </h2>
        </div>
        <p className="weekly-burnout__level">{copy.label}</p>
      </header>

      <p className="weekly-burnout__lead">{lead}</p>

      {level !== 'insufficient' && signals.length > 0 && (
        <ul className="weekly-burnout__list" aria-label={`Burnout signals from the last ${windowDays} days`}>
          {signals.map((signal, index) => (
            <li key={`${signal.type}-${index}`}>{signal.text}</li>
          ))}
        </ul>
      )}

      <p className="weekly-burnout__note">{note}</p>
    </section>
  )
}
