import { describe, expect, it } from 'vitest'
import { detectBoundarySignals } from './boundary.rules.js'
import { detectBurnoutSignals } from './burnout.rules.js'

// Fixtures mirror repository rows (snake_case). Dates are relative to "now"
// so the rolling window logic is exercised, not wall-clock values.
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()

function row(over = {}) {
  return {
    energy_score: 3,
    drain_score: 2,
    emotions: [],
    context_tags: [],
    occurred_at: hoursAgo(5),
    ...over,
  }
}

describe('burnout rules', () => {
  it('flags a low-energy streak with evidence', () => {
    const rows = [row({ energy_score: 1 }), row({ energy_score: 2 }), row({ energy_score: 2 })]
    const signals = detectBurnoutSignals(rows)
    expect(signals.map((s) => s.type)).toContain('low_energy_streak')
    const streak = signals.find((s) => s.type === 'low_energy_streak')
    expect(streak.evidence).toMatchObject({ windowDays: 7, checkins: 3, lowEnergyCount: 3 })
  })

  it('flags repeated high drain', () => {
    const rows = [row({ drain_score: 4 }), row({ drain_score: 5 }), row({ drain_score: 4 })]
    expect(detectBurnoutSignals(rows).map((s) => s.type)).toContain('high_drain_repeat')
  })

  it('flags repeated emotions', () => {
    const rows = [row({ emotions: ['tired'] }), row({ emotions: ['tired', 'flat'] }), row()]
    const found = detectBurnoutSignals(rows).find((s) => s.type === 'repeated_emotions')
    expect(found.evidence.repeated[0]).toMatchObject({ tag: 'tired', count: 2 })
  })

  it('returns no signals on insufficient data', () => {
    expect(detectBurnoutSignals([row(), row()])).toEqual([])
    expect(detectBurnoutSignals([])).toEqual([])
  })

  it('returns no signals when nothing repeats (conflicting/one-off mix)', () => {
    const rows = [
      row({ energy_score: 4, drain_score: 2, emotions: ['ok'] }),
      row({ energy_score: 5, drain_score: 1, emotions: ['good'] }),
      row({ energy_score: 3, drain_score: 3, emotions: ['meh'] }),
    ]
    expect(detectBurnoutSignals(rows)).toEqual([])
  })

  it('ignores check-ins outside the window', () => {
    const old = hoursAgo(24 * 30)
    const rows = [
      row({ energy_score: 1, occurred_at: old }),
      row({ energy_score: 1, occurred_at: old }),
      row({ energy_score: 1, occurred_at: old }),
      row(),
    ]
    expect(detectBurnoutSignals(rows)).toEqual([])
  })

  it('honors threshold overrides (configurable, not hardcoded)', () => {
    const rows = [row({ energy_score: 1 }), row({ energy_score: 1 })]
    expect(detectBurnoutSignals(rows)).toEqual([])
    const signals = detectBurnoutSignals(rows, { minCheckins: 2 })
    expect(signals.map((s) => s.type)).toContain('low_energy_streak')
  })
})

describe('boundary rules', () => {
  it('flags a context that repeatedly coincides with high drain', () => {
    const rows = [
      row({ drain_score: 5, context_tags: ['family dinner'] }),
      row({ drain_score: 4, context_tags: ['family dinner', 'weekend'] }),
      row({ drain_score: 1, context_tags: ['walk'] }),
    ]
    const signals = detectBoundarySignals(rows)
    expect(signals).toHaveLength(1)
    expect(signals[0]).toMatchObject({
      type: 'repeated_draining_context',
      evidence: { context: 'family dinner', highDrainCount: 2 },
    })
  })

  it('stays silent on one-off drain and on repeated low-drain contexts', () => {
    const once = [
      row({ drain_score: 5, context_tags: ['dentist'] }),
      row({ drain_score: 1 }),
      row({ drain_score: 2 }),
    ]
    expect(detectBoundarySignals(once)).toEqual([])

    const calm = [
      row({ drain_score: 1, context_tags: ['walk'] }),
      row({ drain_score: 2, context_tags: ['walk'] }),
      row({ drain_score: 1, context_tags: ['walk'] }),
    ]
    expect(detectBoundarySignals(calm)).toEqual([])
  })

  it('returns no signals on insufficient data', () => {
    expect(detectBoundarySignals([row({ drain_score: 5, context_tags: ['x'] })])).toEqual([])
  })
})
