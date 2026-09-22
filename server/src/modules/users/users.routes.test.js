import express from 'express'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { usersRouter } from './users.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities: checkins 1111/2222, insights 3333/4444, ai.service
// 5555/6666, dashboard 8888/9999, reminders aaaa/bbbb — vitest runs files
// in parallel, so sharing ids would pollute both suites.
const USER_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const USER_B = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'

// --- No database needed: auth boundary ---

describe('users boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    const res = await request(createApp()).delete('/api/users/me')
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
  app.use('/api/users', usersRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

async function seedUser(userId) {
  await pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId])
  await pool.query(
    `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score)
     VALUES ($1, now(), 3, 3, 3)`,
    [userId],
  )
  const { rows: runs } = await pool.query(
    `INSERT INTO analysis_runs (user_id, status, completed_at, input_checkin_count)
     VALUES ($1, 'completed', now(), 1) RETURNING id`,
    [userId],
  )
  const { rows: insights } = await pool.query(
    `INSERT INTO insights (user_id, analysis_run_id, insight_type, title, summary)
     VALUES ($1, $2, 'general', 'Seed', 'Seed.') RETURNING id`,
    [userId, runs[0].id],
  )
  await pool.query(`INSERT INTO reminders (user_id, insight_id, kind, message) VALUES ($1, $2, 'insight', 'Seed.')`, [
    userId,
    insights[0].id,
  ])
  await pool.query('INSERT INTO auth_identities (clerk_sub, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
    `test_sub_${userId.slice(0, 8)}`,
    userId,
  ])
}

async function countOwned(userId) {
  const tables = ['checkins', 'analysis_runs', 'insights', 'reminders', 'auth_identities']
  const counts = {}
  for (const table of tables) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table} WHERE user_id = $1`, [
      userId,
    ])
    counts[table] = rows[0].c
  }
  return counts
}

async function resetUsers() {
  for (const userId of [USER_A, USER_B]) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId])
  }
}

describe.skipIf(!HAS_DB)('users delete (db)', () => {
  // One shared pool per file: ending it per-test breaks the tests that follow.
  afterAll(() => pool.end())
  it('deletes the account and cascades to every owned row, leaving others intact', async () => {
    await resetUsers()
    await seedUser(USER_A)
    await seedUser(USER_B)

    try {
      const before = await countOwned(USER_A)
      expect(Object.values(before).every((c) => c >= 1)).toBe(true)

      const res = await request(authedApp(USER_A)).delete('/api/users/me')
      expect(res.status).toBe(204)

      const after = await countOwned(USER_A)
      expect(after).toEqual({
        checkins: 0,
        analysis_runs: 0,
        insights: 0,
        reminders: 0,
        auth_identities: 0,
      })

      // Isolation: B's rows are untouched by A's deletion.
      const other = await countOwned(USER_B)
      expect(Object.values(other).every((c) => c >= 1)).toBe(true)

      // Second delete is a 404 with the contract, not a crash.
      const again = await request(authedApp(USER_A)).delete('/api/users/me')
      expect(again.status).toBe(404)
      expect(again.body.error.code).toBe('USER_NOT_FOUND')
    } finally {
      await resetUsers()
    }
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)

  it('returns 404 for an authenticated id with no account row', async () => {
    const res = await request(authedApp(UNKNOWN_ID)).delete('/api/users/me')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('USER_NOT_FOUND')
  },
  30000)
})
