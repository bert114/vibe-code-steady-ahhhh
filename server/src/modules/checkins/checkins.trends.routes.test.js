import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { checkinsRouter } from './checkins.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)

// Dedicated identity — other suites own their own ids and vitest runs test
// files in parallel, so sharing ids would pollute both suites.
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function authedApp(userId) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = { id: userId }
    next()
  })
  app.use('/api/check-ins', checkinsRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

// --- No database needed: auth boundary + query validation ---

describe('checkins trends boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    const res = await request(createApp()).get('/api/check-ins/trends')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects an out-of-allowlist windowDays with VALIDATION_ERROR', async () => {
    const res = await request(authedApp(USER_A)).get('/api/check-ins/trends?windowDays=14')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('defaults to a 30-day window when none is given', async () => {
    // No DB rows for this fresh id — still a 200 with empty series.
    const res = await request(authedApp(USER_A)).get('/api/check-ins/trends')
    expect(res.status).toBe(200)
    expect(res.body.windowDays).toBe(30)
  })
})

// --- Database-backed: aggregation, tag frequency, user isolation ---

async function resetUser(userId) {
  await pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId])
  await pool.query('DELETE FROM checkins WHERE user_id = $1', [userId])
}

function insertCheckin(userId, { daysAgo, mood, energy, drain, tags }) {
  const occurredAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return pool.query(
    `INSERT INTO checkins
       (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
     VALUES ($1, $2, $3, $4, $5, '{}', $6, '')`,
    [userId, occurredAt, mood, energy, drain, tags],
  )
}

describe.skipIf(!HAS_DB)('checkins trends (db)', () => {
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  it(
    'aggregates by day, ranks draining tags, and stays scoped to the owner',
    async () => {
      await resetUser(USER_A)
      await resetUser(USER_B)

      try {
        // Two check-ins today for A: averages should land between them.
        await insertCheckin(USER_A, { daysAgo: 0, mood: 1, energy: 1, drain: 5, tags: ['work'] })
        await insertCheckin(USER_A, { daysAgo: 0, mood: 5, energy: 5, drain: 5, tags: ['family'] })
        // One check-in 5 days ago, also high-drain with a repeated tag.
        await insertCheckin(USER_A, { daysAgo: 5, mood: 3, energy: 3, drain: 5, tags: ['work'] })
        // Outside the 7-day window entirely — must not affect a 7-day query.
        await insertCheckin(USER_A, { daysAgo: 20, mood: 1, energy: 1, drain: 5, tags: ['work'] })
        // Other user's data must never leak into A's trends.
        await insertCheckin(USER_B, { daysAgo: 0, mood: 1, energy: 1, drain: 5, tags: ['school'] })

        const res = await request(authedApp(USER_A)).get('/api/check-ins/trends?windowDays=7')
        expect(res.status).toBe(200)
        expect(res.body.windowDays).toBe(7)
        expect(res.body.totalCheckins).toBe(3)
        expect(res.body.days).toHaveLength(2)

        const today = res.body.days[res.body.days.length - 1]
        expect(today.checkins).toBe(2)
        expect(today.avgMood).toBe(3)
        expect(today.avgEnergy).toBe(3)
        expect(today.avgDrain).toBe(5)

        // "work" appears on 2 of the 3 high-drain check-ins in this window.
        expect(res.body.topDrainingTags[0]).toEqual({ tag: 'work', count: 2 })

        const otherView = await request(authedApp(USER_B)).get('/api/check-ins/trends?windowDays=7')
        expect(otherView.body.totalCheckins).toBe(1)
        expect(otherView.body.topDrainingTags).toEqual([{ tag: 'school', count: 1 }])
      } finally {
        await pool.query('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
      }
      await pool.end()
    },
    30000,
  )
})
