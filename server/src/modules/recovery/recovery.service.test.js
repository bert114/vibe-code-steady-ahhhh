import { describe, expect, it } from 'vitest'
import { decideBreakSuggestion } from './recovery.service.js'

const NOW = new Date('2026-11-08T12:00:00.000Z')
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()
const checkin = (drainScore, h = 1) => ({ id: 'c1', drainScore, occurredAt: hoursAgo(h) })
const pattern = [{ type: 'high_drain_repeat', evidence: {} }]

describe('decideBreakSuggestion (pure, no db)', () => {
  it('suggests a break right after a check-in with drain "A lot" (5) or drain score 1', () => {
    expect(decideBreakSuggestion({ latestCheckin: checkin(5), now: NOW })).toEqual({
      reason: 'latest_checkin',
      checkinId: 'c1',
    })
    expect(decideBreakSuggestion({ latestCheckin: checkin(1), now: NOW })).toEqual({
      reason: 'latest_checkin',
      checkinId: 'c1',
    })
  })

  it('suggests a break when energy is low (<= 2) or mood is drained (<= 2)', () => {
    expect(
      decideBreakSuggestion({
        latestCheckin: { id: 'c1', drainScore: 3, energyScore: 1, moodScore: 3, occurredAt: hoursAgo(1) },
        now: NOW,
      }),
    ).toEqual({
      reason: 'latest_checkin',
      checkinId: 'c1',
    })
    expect(
      decideBreakSuggestion({
        latestCheckin: { id: 'c1', drainScore: 3, energyScore: 3, moodScore: 2, occurredAt: hoursAgo(1) },
        now: NOW,
      }),
    ).toEqual({
      reason: 'latest_checkin',
      checkinId: 'c1',
    })
  })

  it('stays quiet for neutral drain with steady energy and mood', () => {
    expect(
      decideBreakSuggestion({
        latestCheckin: { id: 'c1', drainScore: 3, energyScore: 3, moodScore: 3, occurredAt: hoursAgo(1) },
        now: NOW,
      }),
    ).toBeNull()
  })

  it('ignores a high-drain check-in older than 12 hours', () => {
    expect(decideBreakSuggestion({ latestCheckin: checkin(5, 13), now: NOW })).toBeNull()
  })

  it('does not re-suggest once a break started after that check-in', () => {
    expect(
      decideBreakSuggestion({
        latestCheckin: checkin(5, 2),
        latestBreak: { startedAt: hoursAgo(1) },
        now: NOW,
      }),
    ).toBeNull()
  })

  it('suggests from the repeated high-drain pattern', () => {
    expect(decideBreakSuggestion({ latestCheckin: checkin(3), signals: pattern, now: NOW })).toEqual({
      reason: 'drain_pattern',
      checkinId: null,
    })
  })

  it('applies a 24 hour cooldown to pattern suggestions after any break', () => {
    expect(
      decideBreakSuggestion({ signals: pattern, latestBreak: { startedAt: hoursAgo(5) }, now: NOW }),
    ).toBeNull()
    expect(
      decideBreakSuggestion({ signals: pattern, latestBreak: { startedAt: hoursAgo(30) }, now: NOW }),
    ).toEqual({ reason: 'drain_pattern', checkinId: null })
  })

  it('ignores unrelated signals and empty history', () => {
    expect(decideBreakSuggestion({ signals: [{ type: 'low_energy_streak' }], now: NOW })).toBeNull()
    expect(decideBreakSuggestion({ now: NOW })).toBeNull()
  })

  it('detects and passes draining activity from check-in context tags', () => {
    expect(
      decideBreakSuggestion({
        latestCheckin: { id: 'c2', drainScore: 5, contextTags: ['work'], occurredAt: hoursAgo(1) },
        now: NOW,
      }),
    ).toEqual({
      reason: 'latest_checkin',
      checkinId: 'c2',
      drainingActivity: 'Work',
    })
  })

  it('detects and passes draining activity from repeated draining context signal', () => {
    const signal = [{ type: 'repeated_draining_context', evidence: { context: 'study' } }]
    expect(
      decideBreakSuggestion({
        signals: signal,
        now: NOW,
      }),
    ).toEqual({
      reason: 'drain_pattern',
      checkinId: null,
      drainingActivity: 'Study',
    })
  })

  it('continues suggesting when a past break did not help (outcome: not_really)', () => {
    expect(
      decideBreakSuggestion({
        latestCheckin: { id: 'c3', drainScore: 5, contextTags: ['social'], occurredAt: hoursAgo(2) },
        latestBreak: { checkinId: 'c3', startedAt: hoursAgo(1), outcome: 'not_really' },
        now: NOW,
      }),
    ).toEqual({
      reason: 'latest_checkin',
      checkinId: 'c3',
      drainingActivity: 'Social',
    })
  })
})

