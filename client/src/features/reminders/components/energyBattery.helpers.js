// Pure helpers for energy widgets: latest pick, energy band, rolling 7-day bucket.
// No React, no fetching — safe to share between components.
export function latestCheckin(checkins) {
  if (!checkins || checkins.length === 0) return null
  return [...checkins].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0]
}

export function statusFor(energy) {
  if (energy <= 2) return { label: 'Low', className: 'tag tag--red', stroke: '#9F2F2D' }
  if (energy === 3) return { label: 'Steady', className: 'tag tag--yellow', stroke: '#956400' }
  return { label: 'Charged', className: 'tag tag--green', stroke: '#346538' }
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Rolling 7-day window ending on anchor (latest check-in, else today).
// Empty days get value null so the chart renders a faint track.
export function bucketWeek(checkins, anchorInput) {
  const list = Array.isArray(checkins) ? checkins : []
  const latest = latestCheckin(list)
  const anchor = startOfDay(anchorInput ? new Date(anchorInput) : latest ? new Date(latest.occurredAt) : new Date())

  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(anchor)
    date.setDate(anchor.getDate() - i)
    const matches = list
      .filter((c) => c?.occurredAt && sameDay(new Date(c.occurredAt), date))
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    const pick = matches[0] ?? null
    const energy = pick ? Math.min(5, Math.max(1, Number(pick.energyScore) || 1)) : null
    days.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      energy,
      percent: energy ? energy * 20 : null,
      checkinId: pick?.id ?? null,
    })
  }

  let activeIndex = -1
  if (latest) {
    const latestDay = startOfDay(new Date(latest.occurredAt))
    activeIndex = days.findIndex((d) => sameDay(d.date, latestDay))
  }

  return { days, activeIndex, current: activeIndex >= 0 ? days[activeIndex] : null }
}
