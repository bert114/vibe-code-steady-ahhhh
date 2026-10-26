import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { requireUser } from './middleware/auth.js'

const app = createApp()

describe('foundation', () => {
  it('GET /api/health returns the status contract', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(['up', 'down', 'unconfigured']).toContain(res.body.db)
  })

  it('GET / returns service descriptor', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      name: 'steady-ahh-api',
      version: '0.1.0',
      status: 'ok',
      message: expect.any(String),
      links: {
        health: '/api/health',
        checkins: '/api/check-ins',
        insights: '/api/insights',
        dashboard: '/api/dashboard',
      },
    })
  })

  it('unknown routes return the error contract (no stack traces)', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String), details: [] },
    })
  })

  it('requireUser rejects requests without an authenticated user', () => {
    const req = {}
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
    requireUser(req, res, () => {
      throw new Error('next() must not be called without a user')
    })
    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  // TEMP-OPEN-ACCESS: verifies the temporary dev default (OPEN_ACCESS=true)
  // allows every request and attributes it server-side. TODO(REVERT) with flag.
  it('TEMP-OPEN-ACCESS: requireUser allows without a session when open', () => {
    const prev = env.OPEN_ACCESS
    env.OPEN_ACCESS = true
    try {
      const req = {}
      let nextCalled = false
      const res = {
        status() {
          throw new Error('must not 401 when open')
        },
      }
      requireUser(req, res, () => {
        nextCalled = true
      })
      expect(nextCalled).toBe(true)
      expect(req.user?.id).toBeTruthy()
    } finally {
      env.OPEN_ACCESS = prev
    }
  })

  it('GET /api/admin/overview returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/admin/overview')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    })
  })
})
