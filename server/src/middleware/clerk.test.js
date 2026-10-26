import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { dbQuery } from '../db/pool.js'
import { errorHandler, notFound } from './error.js'
import { createRequireSyncedUser } from './clerk.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Clerk subject strings (never UUIDs) — no collision with suites that own
// UUID identities, even though vitest runs files in parallel.
const SUB_NEW = 'test_clerk_resolver_new'
const SUB_OTHER = 'test_clerk_resolver_other'

function probeApp(options = {}) {
  const app = express()
  app.use(express.json())
  app.use(createRequireSyncedUser(options))
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
  await dbQuery('DELETE FROM users WHERE clerk_id IN (SELECT user_id FROM auth_identities WHERE clerk_sub IN ($1, $2))', [
    SUB_NEW,
    SUB_OTHER,
  ])
}

describe('clerk resolver (no db wiring)', () => {
  it('passes through without a user when the session is invalid', async () => {
    const res = await request(probeApp({ getAuthFn: unauthenticated })).get('/probe')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('passes through without a user when verification throws', async () => {
    const throwing = () => {
      throw new Error('bad token')
    }
    const res = await request(probeApp({ getAuthFn: throwing })).get('/probe')
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
      createRequireSyncedUser({
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

  it('uses the Clerk subject as the local user key before the controller runs', async () => {
    const resolveUserFn = vi.fn(async (clerkSub) => {
      expect(clerkSub).toBe(SUB_NEW)
      return { id: SUB_NEW, role: 'user' }
    })
    const app = probeApp({
      getAuthFn: () => ({ isAuthenticated: true, userId: SUB_NEW }),
      resolveUserFn,
    })

    const res = await request(app).get('/probe')

    expect(res.status).toBe(200)
    expect(res.body.userId).toBe(SUB_NEW)
    expect(resolveUserFn).toHaveBeenCalledOnce()
  })

  it('does not run a protected controller when user provisioning fails', async () => {
    let controllerCalled = false
    const app = express()
    app.use(
      createRequireSyncedUser({
        getAuthFn: () => ({ isAuthenticated: true, userId: SUB_NEW }),
        resolveUserFn: async () => {
          const err = new Error('Database unavailable')
          err.status = 503
          err.code = 'DB_UNAVAILABLE'
          throw err
        },
      }),
    )
    app.get('/probe', (_req, res) => {
      controllerCalled = true
      res.json({ ok: true })
    })
    app.use(notFound)
    app.use(errorHandler)

    const res = await request(app).get('/probe')

    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('DB_UNAVAILABLE')
    expect(controllerCalled).toBe(false)
  })
})

describe.skipIf(!HAS_DB)('clerk resolver (db)', () => {
  it('provisions on first sight and maps stably afterwards, isolated per sub', async () => {
    await cleanupSubs()
    const authed = (sub) => () => ({ isAuthenticated: true, userId: sub })

    try {
      const first = await request(probeApp({ getAuthFn: authed(SUB_NEW) })).get('/probe')
      expect(first.status).toBe(200)
      expect(first.body.userId).toBe(SUB_NEW)

      const second = await request(probeApp({ getAuthFn: authed(SUB_NEW) })).get('/probe')
      expect(second.body.userId).toBe(first.body.userId)

      const other = await request(probeApp({ getAuthFn: authed(SUB_OTHER) })).get('/probe')
      expect(other.status).toBe(200)
      expect(other.body.userId).toBe(SUB_OTHER)
    } finally {
      await cleanupSubs()
    }
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)
})
