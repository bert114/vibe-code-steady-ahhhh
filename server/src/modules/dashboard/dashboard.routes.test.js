import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { dashboardRouter } from './dashboard.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities: other suites own their own ids and vitest runs
// files in parallel, so sharing ids would pollute both suites.
const USER_A = '88888888-8888-4888-8888-888888888888'
const USER_B = '99999999-9999-4999-8999-999999999999'

// --- No database needed: auth boundary ---

describe('dashboard boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    const res = await request(createApp()).get('/api/dashboard/summary')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

// --- Database-backed: full stack minus authResolver (user injected) ---

function authedApp(userId) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = { id: userId }
    next()
  })
  app.use('/api/dashboard', dashboardRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

async function resetUser(userId) {
  await pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId])
  await pool.query('DELETE FROM reminders WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM insights WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM analysis_runs WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM checkins WHERE user_id = $1', [userId])
}

describe.skipIf(!HAS_DB)('dashboard summary (db)', () => {
  it('returns empty collections and a null insight for a fresh user', async () => {
    await resetUser(USER_B)

    try {
      const res = await request(authedApp(USER_B)).get('/api/dashboard/summary')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        recentCheckins: [],
        latestInsight: null,
        signals: [],
        signalsMeta: expect.objectContaining({ checkinsConsidered: 0 }),
        reminders: [],
        unreadReminders: 0,
      })
    } finally {
      await resetUser(USER_B)
    }
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)

  it('aggregates check-ins, insight, signals, and reminders for the owner only', async () => {
    await resetUser(USER_A)
    await resetUser(USER_B)
    await pool.query(
      `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
       VALUES ($1, now(), 2, 1, 5, '{tired}', '{overtime}', ''),
              ($1, now() - interval '1 day', 2, 2, 4, '{tired}', '{overtime}', ''),
              ($1, now() - interval '2 days', 3, 1, 5, '{flat}', '{overtime}', '')`,
      [USER_A],
    )
    const { rows: runs } = await pool.query(
      `INSERT INTO analysis_runs (user_id, status, completed_at, input_checkin_count)
       VALUES ($1, 'completed', now(), 3) RETURNING id`,
      [USER_A],
    )
    const { rows: insights } = await pool.query(
      `INSERT INTO insights (user_id, analysis_run_id, insight_type, title, summary, evidence, confidence, suggestions)
       VALUES ($1, $2, 'boundary', 'Overtime keeps draining you', 'Observed over three check-ins.',
         '["drained after overtime"]', 'medium', '[]') RETURNING id`,
      [USER_A, runs[0].id],
    )
    await pool.query(
      `INSERT INTO reminders (user_id, insight_id, kind, message)
       VALUES ($1, $2, 'insight', 'Notice what overtime does to your energy.')`,
      [USER_A, insights[0].id],
    )

    try {
      const res = await request(authedApp(USER_A)).get('/api/dashboard/summary')
      expect(res.status).toBe(200)
      expect(res.body.recentCheckins).toHaveLength(3)
      expect(res.body.recentCheckins[0]).toMatchObject({ moodScore: 2, drainScore: 5 })
      expect(res.body.latestInsight).toMatchObject({
        type: 'boundary',
        title: 'Overtime keeps draining you',
      })
      expect(res.body.signals.map((s) => s.type)).toContain('repeated_draining_context')
      expect(res.body.signalsMeta.checkinsConsidered).toBe(3)
      expect(res.body.reminders).toHaveLength(1)
      expect(res.body.reminders[0]).toMatchObject({ readAt: null })
      expect(res.body.unreadReminders).toBe(1)

      // Isolation: the fresh user gets their own empty summary.
      const other = await request(authedApp(USER_B)).get('/api/dashboard/summary')
      expect(other.status).toBe(200)
      expect(other.body).toEqual({
        recentCheckins: [],
        latestInsight: null,
        signals: [],
        signalsMeta: expect.objectContaining({ checkinsConsidered: 0 }),
        reminders: [],
        unreadReminders: 0,
      })
    } finally {
      await resetUser(USER_A)
      await resetUser(USER_B)
    }
    await pool.end()
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)
})
