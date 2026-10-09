import { describe, expect, it } from 'vitest'
import {
  directionOf,
  drainLine,
  energyLine,
  glanceModel,
  halfDelta,
  moodLine,
  weightedAvg,
} from './glance.js'

const DAYS = [
  { date: '2026-09-01T00:00:00.000Z', avgMood: 2, avgEnergy: 2, avgDrain: 4, checkins: 2 },
  { date: '2026-09-02T00:00:00.000Z', avgMood: 4, avgEnergy: 3, avgDrain: 3, checkins: 1 },
  { date: '2026-09-03T00:00:00.000Z', avgMood: 3, avgEnergy: 4, avgDrain: 2, checkins: 1 },
]

describe('weightedAvg', () => {
  it('weights day buckets by check-in count', () => {
    // (2*2 + 4*1) / 3 = 8/3 ≈ 2.7
    expect(weightedAvg(DAYS.slice(0, 2), 'avgMood')).toBe(2.7)
  })

  it('returns null with no data or no check-ins', () => {
    expect(weightedAvg([], 'avgMood')).toBeNull()
    expect(weightedAvg([{ date: '2026-09-01', avgMood: 3, checkins: 0 }], 'avgMood')).toBeNull()
  })
})

describe('halfDelta', () => {
  it('compares late-half against early-half averages', () => {
    // early [day1] mood 2, late [day2, day3] mood (4*1 + 3*1)/2 = 3.5
    expect(halfDelta(DAYS, 'avgMood')).toBe(1.5)
  })

  it('returns 0 for fewer than two buckets', () => {
    expect(halfDelta([], 'avgMood')).toBe(0)
    expect(halfDelta([DAYS[0]], 'avgMood')).toBe(0)
  })
})

describe('directionOf', () => {
  it('treats ±0.3 as the flat boundary', () => {
    expect(directionOf(0.3)).toBe('up')
    expect(directionOf(-0.3)).toBe('down')
    expect(directionOf(0.29)).toBe('flat')
    expect(directionOf(-0.29)).toBe('flat')
    expect(directionOf(0)).toBe('flat')
  })
})

describe('subtitle rules', () => {
  it('bands mood copy by value', () => {
    expect(moodLine(2)).toBe('Running low lately')
    expect(moodLine(2.7)).toBe('A little below your middle ground')
    expect(moodLine(3.2)).toBe('Around your middle ground')
    expect(moodLine(4)).toBe('Above your middle ground')
  })

  it('relates energy rhythm to mood direction', () => {
    expect(energyLine('up', 'up')).toBe('Following the same rhythm as mood')
    expect(energyLine('flat', 'up')).toBe('Holding steady lately')
    expect(energyLine('down', 'up')).toBe('Moving differently from mood lately')
  })

  it('names the top draining tag with a neutral fallback', () => {
    expect(drainLine([{ tag: 'work', count: 2 }])).toBe('Work shows up most often here')
    expect(drainLine([])).toBe('No single context stands out')
  })
})

describe('glanceModel', () => {
  it('combines averages, directions, and lines for all three cards', () => {
    const model = glanceModel({ totalCheckins: 4, days: DAYS, topDrainingTags: [] })
    expect(model.totalCheckins).toBe(4)
    expect(model.mood.avg).toBe(2.8)
    expect(model.mood.direction).toBe('up')
    expect(model.energy.line).toBe('Following the same rhythm as mood')
    expect(model.drain.direction).toBe('down')
    expect(model.drain.invert).toBe(true)
    expect(model.drain.line).toBe('No single context stands out')
  })
})
