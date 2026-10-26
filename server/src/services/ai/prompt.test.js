import { describe, expect, it } from 'vitest'
import { buildAnalysisPrompt } from './prompt.js'

const rows = [
  {
    occurred_at: '2026-09-18T10:00:00.000Z',
    mood_score: 2,
    energy_score: 1,
    drain_score: 5,
    emotions: ['tired'],
    context_tags: ['overtime'],
    note: 'Long day.',
  },
]

describe('analysis prompt (no db)', () => {
  it('embeds safety rules and only the supplied data', () => {
    const { system, user } = buildAnalysisPrompt({ checkins: rows, signals: [], aggregates: null })
    expect(system).toMatch(/never.*diagnosis/i)
    expect(system).toMatch(/ONLY the data provided/i)
    expect(system).toMatch(/ONLY JSON/i)
    expect(user).toContain('mood 2/5')
    expect(user).toContain('Long day.')
  })

  it('guides boundary insights toward Observed/Reflection phrasing', () => {
    const signals = [
      {
        type: 'repeated_draining_context',
        evidence: { windowDays: 7, context: 'overtime', highDrainCount: 3, checkins: 4 },
      },
    ]
    const { system, user } = buildAnalysisPrompt({ checkins: rows, signals, aggregates: null })
    expect(system).toMatch(/Observed:/)
    expect(system).toMatch(/Reflection:/)
    expect(system).toMatch(/never.*label other people/i)
    // Boundary evidence reaches the model untouched for rephrasing.
    expect(user).toContain('repeated_draining_context')
    expect(user).toContain('overtime')
  })

  it('truncates oversized payloads to the input budget', () => {    process.env.AI_MAX_INPUT_CHARS = '100'
    try {
      const big = Array.from({ length: 50 }, (_, i) => ({ ...rows[0], note: `note-${i}-`.repeat(20) }))
      const { user } = buildAnalysisPrompt({ checkins: big, signals: [], aggregates: null })
      expect(user.length).toBeLessThan(2000)
      expect(user).toContain('[truncated]')
    } finally {
      delete process.env.AI_MAX_INPUT_CHARS
    }
  })
})
