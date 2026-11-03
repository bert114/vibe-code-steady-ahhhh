import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { dbQuery } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { insightsRouter } from './insights.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities: the checkins suite owns USER_A/USER_B and vitest
// runs files in parallel, so sharing ids would pollute both suites.
const USER_A = 'test_insights_user_a'
const USER_B = 'test_insights_user_b'

describe('insights signals boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    const app = createApp()
    for (const [method, path] of [
      ['get', '/api/insights/signals'],
      ['get', '/api/insights'],
      ['post', '/api/insights/analyze'],
    ]) {
      const res = await request(app)[method](path)
      expect(res.status, `${method} ${path}`).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    }
  })
})

function authedApp(userId) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = { id: userId }
    next()
  })
  app.use('/api/insights', insightsRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

describe.skipIf(!HAS_DB)('insights signals (db)', () => {
  it('returns evidence for a drained user and nothing for a fresh one', async () => {
    await dbQuery('INSERT INTO users (clerk_id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    await dbQuery(
      `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
       VALUES ($1, now(), 1, 1, 5, '{tired}', '{overtime}', ''),
              ($1, now() - interval '1 day', 3, 1, 5, '{tired}', '{overtime}', ''),
              ($1, now() - interval '2 days', 1, 1, 5, '{flat}', '{overtime}', '')`,
      [USER_A],
    )

    try {
      const drained = await request(authedApp(USER_A)).get('/api/insights/signals')
      expect(drained.status).toBe(200)
      expect(drained.body.checkinsConsidered).toBe(3)
      const types = drained.body.signals.map((s) => s.type)
      expect(types).toContain('low_energy_streak')
      expect(types).toContain('high_drain_repeat')
      expect(types).toContain('repeated_draining_context')

      // Isolation: the fresh user gets their own (empty) answer.
      const fresh = await request(authedApp(USER_B)).get('/api/insights/signals')
      expect(fresh.status).toBe(200)
      expect(fresh.body.signals).toEqual([])
    } finally {
      await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)

  it('returns the all-time check-in total alongside stored insights', async () => {
    await dbQuery('INSERT INTO users (clerk_id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    await dbQuery(
      `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
       VALUES ($1, now(), 3, 3, 3, '{}', '{}', ''),
              ($1, now() - interval '1 day', 3, 3, 3, '{}', '{}', ''),
              ($1, now() - interval '2 days', 3, 3, 3, '{}', '{}', '')`,
      [USER_A],
    )

    try {
      const overview = await request(authedApp(USER_A)).get('/api/insights')
      expect(overview.status).toBe(200)
      expect(overview.body.totalCheckins).toBe(3)
      expect(Array.isArray(overview.body.insights)).toBe(true)
      expect(Number.isNaN(new Date(overview.body.firstCheckinAt).getTime())).toBe(false)
      expect(overview.body.weeklyBurnout).toEqual({
        windowDays: 7,
        checkins: 3,
        minimumCheckins: 3,
        level: 'steady',
        signals: [],
      })

      // Isolation: a user with no history gets their own zero, not USER_A's.
      const fresh = await request(authedApp(USER_B)).get('/api/insights')
      expect(fresh.status).toBe(200)
      expect(fresh.body.totalCheckins).toBe(0)
      expect(fresh.body.firstCheckinAt).toBeNull()
      expect(fresh.body.weeklyBurnout).toEqual({
        windowDays: 7,
        checkins: 0,
        minimumCheckins: 3,
        level: 'insufficient',
        signals: [],
      })
    } finally {
      await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
  }, 30000)

  it('returns the rolling 7-day drain average and excludes older check-ins', async () => {
    await dbQuery('INSERT INTO users (clerk_id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    await dbQuery(
      `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
       VALUES ($1, now(), 3, 3, 1, '{}', '{}', ''),
              ($1, now() - interval '1 day', 3, 3, 5, '{}', '{}', ''),
              ($1, now() - interval '2 days', 3, 3, 5, '{}', '{}', ''),
              ($1, now() - interval '10 days', 3, 3, 3, '{}', '{}', '')`,
      [USER_A],
    )

    try {
      const overview = await request(authedApp(USER_A)).get('/api/insights')
      expect(overview.status).toBe(200)
      expect(overview.body.weeklyDrain).toEqual({
        windowDays: 7,
        averageDrain: 3.7,
        checkins: 3,
      })
      // The older row still counts toward all-time history, not this window.
      expect(overview.body.totalCheckins).toBe(4)

      const fresh = await request(authedApp(USER_B)).get('/api/insights')
      expect(fresh.status).toBe(200)
      expect(fresh.body.weeklyDrain).toEqual({
        windowDays: 7,
        averageDrain: null,
        checkins: 0,
      })
    } finally {
      await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
  }, 30000)

  it('returns the weekly burnout level with evidence and excludes boundary signals', async () => {
    await dbQuery('INSERT INTO users (clerk_id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    await dbQuery(
      `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
       VALUES ($1, now(), 1, 1, 5, '{tired}', '{overtime}', ''),
              ($1, now() - interval '1 day', 3, 1, 5, '{tired}', '{overtime}', ''),
              ($1, now() - interval '2 days', 1, 1, 5, '{tired}', '{overtime}', '')`,
      [USER_A],
    )

    try {
      const overview = await request(authedApp(USER_A)).get('/api/insights')
      expect(overview.status).toBe(200)
      expect(overview.body.weeklyBurnout).toMatchObject({
        windowDays: 7,
        checkins: 3,
        minimumCheckins: 3,
        level: 'elevated',
      })
      const types = overview.body.weeklyBurnout.signals.map((s) => s.type)
      expect(types).toEqual(['low_energy_streak', 'high_drain_repeat', 'repeated_emotions'])
      expect(types).not.toContain('repeated_draining_context')
      expect(overview.body.weeklyBurnout.signals[0].evidence).toMatchObject({
        checkins: 3,
        lowEnergyCount: 3,
      })

      const fresh = await request(authedApp(USER_B)).get('/api/insights')
      expect(fresh.status).toBe(200)
      expect(fresh.body.weeklyBurnout).toMatchObject({
        checkins: 0,
        level: 'insufficient',
        signals: [],
      })
    } finally {
      await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
  }, 30000)
})
