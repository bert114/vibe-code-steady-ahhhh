import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { pool } from '../db/pool.js'
import { errorHandler, notFound } from './error.js'
import { createClerkResolver } from './clerk.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Clerk subject strings (never UUIDs) — no collision with suites that own
// UUID identities, even though vitest runs files in parallel.
const SUB_NEW = 'test_clerk_resolver_new'
const SUB_OTHER = 'test_clerk_resolver_other'

function probeApp(getAuthFn) {
  const app = express()
  app.use(express.json())
  app.use(createClerkResolver({ getAuthFn }))
  app.get('/probe', (req, res) => {
    if (!req.user?.id) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', details: [] },
      })
    }
    res.json({ userId: req.user.id })
  })
  app.use(notFound)
  app.use(errorHandler)
  return app
}

const unauthenticated = () => ({ isAuthenticated: false, userId: null })

async function cleanupSubs() {
  await pool.query('DELETE FROM users WHERE id IN (SELECT user_id FROM auth_identities WHERE clerk_sub IN ($1, $2))', [
    SUB_NEW,
    SUB_OTHER,
  ])
}

describe('clerk resolver (no db wiring)', () => {
  it('passes through without a user when the session is invalid', async () => {
    const res = await request(probeApp(unauthenticated)).get('/probe')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('passes through without a user when verification throws', async () => {
    const throwing = () => {
      throw new Error('bad token')
    }
    const res = await request(probeApp(throwing)).get('/probe')
    expect(res.status).toBe(401)
  })

  it('leaves a bypass-resolved user untouched', async () => {
    const app = express()
    app.use(express.json())
    app.use((req, _res, next) => {
      req.user = { id: 'dev-user' }
      next()
    })
    let verifyCalls = 0
    app.use(
      createClerkResolver({
        getAuthFn: () => {
          verifyCalls += 1
          return { isAuthenticated: true, userId: SUB_NEW }
        },
      }),
    )
    app.get('/probe', (req, res) => res.json({ userId: req.user.id }))
    app.use(notFound)
    app.use(errorHandler)
    const res = await request(app).get('/probe')
    expect(res.body.userId).toBe('dev-user')
    expect(verifyCalls).toBe(0)
  })
})

describe.skipIf(!HAS_DB)('clerk resolver (db)', () => {
  it('provisions on first sight and maps stably afterwards, isolated per sub', async () => {
    await cleanupSubs()
    const authed = (sub) => () => ({ isAuthenticated: true, userId: sub })

    try {
      const first = await request(probeApp(authed(SUB_NEW))).get('/probe')
      expect(first.status).toBe(200)
      expect(first.body.userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )

      const second = await request(probeApp(authed(SUB_NEW))).get('/probe')
      expect(second.body.userId).toBe(first.body.userId)

      const other = await request(probeApp(authed(SUB_OTHER))).get('/probe')
      expect(other.status).toBe(200)
      expect(other.body.userId).not.toBe(first.body.userId)
    } finally {
      await cleanupSubs()
    }
    await pool.end()
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)
})
