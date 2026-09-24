import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { validate } from '../../middleware/validate.js'
import { checkinsRouter } from './checkins.routes.js'
import { createCheckinSchema } from './checkins.validation.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)

// Fixed test identities — created by the 001 migration's users table.
const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

const validBody = {
  mood_score: 3,
  energy_score: 1,
  drain_score: 5,
  emotions: ['tired'],
  context_tags: ['work'],
  note: 'Test note.',
}

// --- No database needed: auth boundary + validation contract ---

describe('checkins boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    // Test env has no dev bypass, so req.user is unset.
    const res = await request(createApp()).get('/api/check-ins')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: expect.any(String), details: [] },
    })
  })

  it('rejects invalid bodies with VALIDATION_ERROR before touching the db', async () => {
    const app = express()
    app.use(express.json())
    app.post(
      '/echo',
      validate(createCheckinSchema, 'body'),
      (req, res) => res.json(req.body),
    )
    app.use(notFound)
    app.use(errorHandler)

    const res = await request(app)
      .post('/echo')
      .send({ mood_score: 99, energy_score: 2, drain_score: 4 })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details.length).toBeGreaterThan(0)
  })

  it('rejects off-allowlist scores with VALIDATION_ERROR before touching the db', async () => {
    const app = express()
    app.use(express.json())
    app.post(
      '/echo',
      validate(createCheckinSchema, 'body'),
      (req, res) => res.json(req.body),
    )
    app.use(notFound)
    app.use(errorHandler)

    const res = await request(app)
      .post('/echo')
      .send({ mood_score: 3, energy_score: 2, drain_score: 5 })
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
  app.use('/api/check-ins', checkinsRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

describe.skipIf(!HAS_DB)('checkins api (db)', () => {
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  it('POST creates, GET lists, GET :id reads — scoped to the owner', async () => {
    await pool.query('INSERT INTO users (id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [
      USER_A,
      USER_B,
    ])
    await pool.query('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])

    try {
      const created = await request(authedApp(USER_A)).post('/api/check-ins').send(validBody)
      expect(created.status).toBe(201)
      expect(created.body).toMatchObject({
        moodScore: 3,
        energyScore: 1,
        drainScore: 5,
        emotions: ['tired'],
      })
      expect(created.body.id).toBeDefined()

      const list = await request(authedApp(USER_A)).get('/api/check-ins')
      expect(list.status).toBe(200)
      expect(list.body.checkins).toHaveLength(1)

      // User isolation: B sees neither the row nor the list entry.
      const otherList = await request(authedApp(USER_B)).get('/api/check-ins')
      expect(otherList.body.checkins).toHaveLength(0)
      const crossRead = await request(authedApp(USER_B)).get(`/api/check-ins/${created.body.id}`)
      expect(crossRead.status).toBe(404)
      expect(crossRead.body.error.code).toBe('CHECKIN_NOT_FOUND')

    // Owner can read it back.
    const ownRead = await request(authedApp(USER_A)).get(`/api/check-ins/${created.body.id}`)
    expect(ownRead.status).toBe(200)
    expect(ownRead.body.id).toBe(created.body.id)

    // User isolation on delete: B cannot delete A's checkin
    const crossDelete = await request(authedApp(USER_B)).delete(`/api/check-ins/${created.body.id}`)
    expect(crossDelete.status).toBe(404)
    expect(crossDelete.body.error.code).toBe('CHECKIN_NOT_FOUND')

    // Owner can delete their checkin
    const ownDelete = await request(authedApp(USER_A)).delete(`/api/check-ins/${created.body.id}`)
    expect(ownDelete.status).toBe(200)
    expect(ownDelete.body.data).toEqual({ id: created.body.id, deleted: true })

    // Subsequent read returns 404
    const afterDelete = await request(authedApp(USER_A)).get(`/api/check-ins/${created.body.id}`)
    expect(afterDelete.status).toBe(404)
    } finally {
      await pool.query('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
    }
    await pool.end()
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)
})
