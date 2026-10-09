// Deterministic "At a glance" rules for the Trends page.
//
// Pure functions over the GET /api/check-ins/trends payload — no React, no
// SQL, no AI. The component stays presentational; every number and sentence
// here is derived from the user's own day buckets.

export const FLAT_THRESHOLD = 0.3

function round1(n) {
  return Math.round(n * 10) / 10
}

function totalWeight(days) {
  return days.reduce((sum, d) => sum + (d.checkins || 0), 0)
}

function weightedSum(days, key) {
  return days.reduce((sum, d) => sum + (d[key] || 0) * (d.checkins || 0), 0)
}

// Checkin-weighted mean of one metric across day buckets, 1 decimal.
// Returns null when there is nothing to average.
export function weightedAvg(days, key) {
  const weight = totalWeight(days)
  if (!days || days.length === 0 || weight === 0) {
    return null
  }
  return round1(weightedSum(days, key) / weight)
}

// Late-half minus early-half weighted average (buckets sorted by date).
// Single-bucket windows and empty input return 0 (flat).
export function halfDelta(days, key) {
  if (!days || days.length < 2) {
    return 0
  }
  const sorted = [...days].sort((a, b) => new Date(a.date) - new Date(b.date))
  const mid = Math.floor(sorted.length / 2)
  const early = weightedAvg(sorted.slice(0, mid), key)
  const late = weightedAvg(sorted.slice(mid), key)
  if (early === null || late === null) {
    return 0
  }
  return round1(late - early)
}

export function directionOf(delta, threshold = FLAT_THRESHOLD) {
  if (delta >= threshold) {
    return 'up'
  }
  if (delta <= -threshold) {
    return 'down'
  }
  return 'flat'
}

export function moodLine(avg) {
  if (avg === null) {
    return ''
  }
  if (avg < 2.5) {
    return 'Running low lately'
  }
  if (avg < 3) {
    return 'A little below your middle ground'
  }
  if (avg <= 3.5) {
    return 'Around your middle ground'
  }
  return 'Above your middle ground'
}

export function energyLine(energyDirection, moodDirection) {
  if (energyDirection === 'flat') {
    return 'Holding steady lately'
  }
  if (energyDirection === moodDirection) {
    return 'Following the same rhythm as mood'
  }
  return 'Moving differently from mood lately'
}

export function drainLine(topDrainingTags) {
  const top = topDrainingTags && topDrainingTags[0]
  if (!top || !top.tag) {
    return 'No single context stands out'
  }
  const label = top.tag.charAt(0).toUpperCase() + top.tag.slice(1)
  return `${label} shows up most often here`
}

// Full glance model for one metric card. `invert` flips the meaning of
// up/down (drain rising is unfavorable, the opposite of mood/energy).
export function glanceMetric(days, { key, invert = false } = {}) {
  const avg = weightedAvg(days, key)
  const delta = halfDelta(days, key)
  const direction = directionOf(delta)
  return { avg, delta, direction, invert }
}

export function glanceModel(data) {
  const days = (data && data.days) || []
  const topDrainingTags = (data && data.topDrainingTags) || []
  const mood = glanceMetric(days, { key: 'avgMood' })
  const energy = glanceMetric(days, { key: 'avgEnergy' })
  const drain = glanceMetric(days, { key: 'avgDrain', invert: true })
  return {
    totalCheckins: (data && data.totalCheckins) || 0,
    mood: { ...mood, line: moodLine(mood.avg) },
    energy: { ...energy, line: energyLine(energy.direction, mood.direction) },
    drain: { ...drain, line: drainLine(topDrainingTags) },
  }
}
