import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'
import { requireUser } from './middleware/auth.js'

const app = createApp()

describe('foundation', () => {
  it('GET /api/health returns the status contract', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(['up', 'down', 'unconfigured']).toContain(res.body.db)
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
})
