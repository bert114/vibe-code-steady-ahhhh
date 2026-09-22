import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { insightsRouter } from './insights.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities: the checkins suite owns USER_A/USER_B and vitest
// runs files in parallel, so sharing ids would pollute both suites.
const USER_A = '33333333-3333-4333-8333-333333333333'
const USER_B = '44444444-4444-4444-8444-444444444444'

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
    await pool.query('INSERT INTO users (id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await pool.query('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    await pool.query(
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
      await pool.query('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
    await pool.end()
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)
})
