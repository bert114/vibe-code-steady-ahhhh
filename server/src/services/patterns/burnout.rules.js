// Deterministic burnout-pattern rules: pure functions over check-in rows.
// Thresholds are product heuristics (env-configurable), NOT medical
// thresholds. Rules produce evidence; the AI phase later turns evidence
// into user-facing wording. No SQL, no Express, no side effects here.

function thresholds() {
  return {
    windowDays: Number(process.env.BURNOUT_SIGNAL_WINDOW_DAYS ?? 7),
    minCheckins: Number(process.env.BURNOUT_SIGNAL_MIN_CHECKINS ?? 3),
    lowEnergyMax: Number(process.env.LOW_ENERGY_MAX ?? 2),
    highDrainMin: Number(process.env.HIGH_DRAIN_MIN ?? 4),
  }
}

function inWindow(rows, windowDays, now = new Date()) {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000
  return rows.filter((r) => new Date(r.occurred_at ?? r.occurredAt).getTime() >= cutoff)
}

function countRepeats(rows, key) {
  const counts = new Map()
  for (const row of rows) {
    for (const tag of row[key] ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([tag, n]) => ({ tag, count: n }))
    .sort((a, b) => b.count - a.count)
}

// Returns signals (possibly empty). Empty input or too few check-ins
// yields no signals — never a guess.
export function detectBurnoutSignals(allRows, overrides = {}) {
  const t = { ...thresholds(), ...overrides }
  const rows = inWindow(allRows, t.windowDays)
  if (rows.length < t.minCheckins) return []

  const signals = []
  const lowEnergyCount = rows.filter((r) => r.energy_score <= t.lowEnergyMax).length
  const highDrainCount = rows.filter((r) => r.drain_score >= t.highDrainMin).length

  if (lowEnergyCount >= t.minCheckins) {
    signals.push({
      type: 'low_energy_streak',
      evidence: {
        windowDays: t.windowDays,
        checkins: rows.length,
        lowEnergyCount,
      },
    })
  }

  if (highDrainCount >= t.minCheckins) {
    signals.push({
      type: 'high_drain_repeat',
      evidence: {
        windowDays: t.windowDays,
        checkins: rows.length,
        highDrainCount,
      },
    })
  }

  const repeatedEmotions = countRepeats(rows, 'emotions')
  if (repeatedEmotions.length > 0) {
    signals.push({
      type: 'repeated_emotions',
      evidence: {
        windowDays: t.windowDays,
        checkins: rows.length,
        repeated: repeatedEmotions,
      },
    })
  }

  return signals
}

export { thresholds }
