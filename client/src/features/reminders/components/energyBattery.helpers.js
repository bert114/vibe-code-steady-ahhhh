// Pure helpers for the battery ring: latest pick + energy band.
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
