// Boundary-awareness rules: pure functions over check-in rows.
// These flag REPEATED drain in the SAME context so the user can notice a
// possible overextension pattern. Wording stays observational — the system
// never labels people, never tells the user what to do, and never decides
// whether a boundary should change. That decision is always the user's.

function windowDays() {
  return Number(process.env.BURNOUT_SIGNAL_WINDOW_DAYS ?? 7)
}

function minCheckins() {
  return Number(process.env.BURNOUT_SIGNAL_MIN_CHECKINS ?? 3)
}

// Contexts where drain ran high more than once inside the window.
export function detectBoundarySignals(allRows, overrides = {}) {
  const days = overrides.windowDays ?? windowDays()
  const min = overrides.minCheckins ?? minCheckins()
  const highDrainMin = overrides.highDrainMin ?? Number(process.env.HIGH_DRAIN_MIN ?? 4)

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const rows = allRows.filter((r) => new Date(r.occurred_at ?? r.occurredAt).getTime() >= cutoff)
  if (rows.length < min) return []

  const byContext = new Map()
  for (const row of rows) {
    if (row.drain_score < highDrainMin) continue
    for (const tag of row.context_tags ?? []) {
      const entry = byContext.get(tag) ?? { highDrainCount: 0, checkins: 0 }
      entry.highDrainCount += 1
      byContext.set(tag, entry)
    }
  }
  // Denominator: how many window check-ins mentioned the context at all.
  for (const row of rows) {
    for (const tag of row.context_tags ?? []) {
      const entry = byContext.get(tag)
      if (entry) entry.checkins += 1
    }
  }

  const signals = []
  for (const [context, { highDrainCount, checkins }] of byContext) {
    if (highDrainCount >= 2) {
      signals.push({
        type: 'repeated_draining_context',
        evidence: { windowDays: days, context, highDrainCount, checkins },
      })
    }
  }
  return signals.sort((a, b) => b.evidence.highDrainCount - a.evidence.highDrainCount)
}
