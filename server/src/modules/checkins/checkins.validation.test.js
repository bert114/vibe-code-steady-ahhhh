import { describe, expect, it } from 'vitest'
import {
  checkinIdSchema,
  createCheckinSchema,
  listCheckinsSchema,
} from './checkins.validation.js'

// Pure schema tests — no database needed.
describe('checkins validation', () => {
  const valid = {
    mood_score: 3,
    energy_score: 1,
    drain_score: 5,
  }

  it('accepts a minimal valid body and applies defaults', () => {
    const parsed = createCheckinSchema.parse(valid)
    expect(parsed).toMatchObject({
      mood_score: 3,
      emotions: [],
      context_tags: [],
      note: '',
    })
  })

  it('accepts full payloads with tags and notes', () => {
    const parsed = createCheckinSchema.parse({
      ...valid,
      occurred_at: '2026-09-18T10:00:00.000Z',
      emotions: ['tired', 'hopeful'],
      context_tags: ['work'],
      note: 'Long day.',
    })
    expect(parsed.emotions).toEqual(['tired', 'hopeful'])
  })

  it.each([
    [{ ...valid, mood_score: 0 }, 'mood_score'],
    [{ ...valid, energy_score: 6 }, 'energy_score'],
    [{ ...valid, drain_score: 2.5 }, 'drain_score'],
    [{ ...valid, mood_score: 2 }, 'mood_score'],
    [{ ...valid, energy_score: 4 }, 'energy_score'],
    [{ ...valid, drain_score: 2 }, 'drain_score'],
    [{ ...valid, mood_score: '3' }, 'mood_score'],
    [{ ...valid, note: 'x'.repeat(5001) }, 'note'],
    [{ ...valid, emotions: ['x'.repeat(41)] }, 'emotions'],
    [{ energy_score: 1, drain_score: 5 }, 'mood_score'],
  ])('rejects invalid body (%s)', (body) => {
    expect(() => createCheckinSchema.parse(body)).toThrow()
  })

  it('coerces and bounds list query params', () => {
    expect(listCheckinsSchema.parse({})).toEqual({ limit: 30, offset: 0 })
    expect(listCheckinsSchema.parse({ limit: '10' }).limit).toBe(10)
    expect(() => listCheckinsSchema.parse({ limit: '999' })).toThrow()
  })

  it('requires a uuid id param', () => {
    expect(() =>
      checkinIdSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    ).not.toThrow()
    expect(() => checkinIdSchema.parse({ id: 'not-a-uuid' })).toThrow()
  })
})
