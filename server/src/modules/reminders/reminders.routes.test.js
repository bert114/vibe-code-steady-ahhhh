import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { remindersRouter } from './reminders.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities: other suites own 1111/2222 (checkins), 3333/4444
// (insights), 5555/6666 (ai.service), 8888/9999 (dashboard), and vitest
// runs files in parallel, so sharing ids would pollute both suites.
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const UNKNOWN_ID = '77777777-7777-4777-8777-777777777777'

// --- No database needed: auth boundary ---

describe('reminders boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    const app = createApp()
    for (const [method, path] of [
      ['get', '/api/reminders'],
      ['patch', `/api/reminders/${UNKNOWN_ID}/read`],
    ]) {
      const res = await request(app)[method](path)
      expect(res.status, `${method} ${path}`).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('rejects malformed ids with VALIDATION_ERROR before touching the db', async () => {
    const app = express()
    app.use(express.json())
    app.use((req, _res, next) => {
      req.user = { id: USER_A }
      next()
    })
    app.use('/api/reminders', remindersRouter)
    app.use(notFound)
    app.use(errorHandler)
    const res = await request(app).patch('/api/reminders/not-a-uuid/read')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
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
  app.use('/api/reminders', remindersRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

describe.skipIf(!HAS_DB)('reminders api (db)', () => {
  it('lists own reminders, marks read, and isolates users', async () => {
    await pool.query('INSERT INTO users (id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await pool.query('DELETE FROM reminders WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    const { rows } = await pool.query(
      `INSERT INTO reminders (user_id, kind, message)
       VALUES ($1, 'insight', 'Test reminder.') RETURNING id`,
      [USER_A],
    )
    const reminderId = rows[0].id

    try {
      const list = await request(authedApp(USER_A)).get('/api/reminders')
      expect(list.status).toBe(200)
      expect(list.body.reminders).toHaveLength(1)
      expect(list.body.reminders[0]).toMatchObject({
        id: reminderId,
        kind: 'insight',
        message: 'Test reminder.',
        readAt: null,
      })

      // User isolation: B sees neither the list entry nor the row.
      const otherList = await request(authedApp(USER_B)).get('/api/reminders')
      expect(otherList.body.reminders).toHaveLength(0)
      const crossRead = await request(authedApp(USER_B)).patch(`/api/reminders/${reminderId}/read`)
      expect(crossRead.status).toBe(404)
      expect(crossRead.body.error.code).toBe('REMINDER_NOT_FOUND')

      // Unknown id is a 404 with the same contract.
      const missing = await request(authedApp(USER_A)).patch(`/api/reminders/${UNKNOWN_ID}/read`)
      expect(missing.status).toBe(404)
      expect(missing.body.error.code).toBe('REMINDER_NOT_FOUND')

      // Mark read sets read_at; a second PATCH is idempotent.
      const first = await request(authedApp(USER_A)).patch(`/api/reminders/${reminderId}/read`)
      expect(first.status).toBe(200)
      expect(first.body.readAt).toBeTruthy()
      const second = await request(authedApp(USER_A)).patch(`/api/reminders/${reminderId}/read`)
      expect(second.status).toBe(200)
      expect(second.body.readAt).toBe(first.body.readAt)
    } finally {
      await pool.query('DELETE FROM reminders WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
    await pool.end()
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)
})
