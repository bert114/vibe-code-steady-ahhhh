import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { errorHandler, notFound } from './error.js'
import { requireRole, requireUser } from './auth.js'

function makeTestApp({ user, allowedRoles = [] } = {}) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    if (user) req.user = user
    next()
  })
  app.get('/admin', requireUser, requireRole(...allowedRoles), (req, res) => {
    res.json({ ok: true, user: req.user })
  })
  app.use(notFound)
  app.use(errorHandler)
  return app
}

describe('RBAC requireRole middleware', () => {
  it('returns 401 UNAUTHORIZED when no user is authenticated', async () => {
    const app = makeTestApp({ user: null, allowedRoles: ['admin'] })
    const res = await request(app).get('/admin')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    })
  })

  it('returns 403 FORBIDDEN when user has user role but admin is required', async () => {
    const app = makeTestApp({
      user: { id: '00000000-0000-0000-0000-000000000001', role: 'user' },
      allowedRoles: ['admin'],
    })
    const res = await request(app).get('/admin')
    expect(res.status).toBe(403)
    expect(res.body.error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource.',
    })
  })

  it('allows access when user has the required admin role', async () => {
    const app = makeTestApp({
      user: { id: '00000000-0000-0000-0000-000000000002', role: 'admin' },
      allowedRoles: ['admin'],
    })
    const res = await request(app).get('/admin')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.role).toBe('admin')
  })

  it('supports multiple allowed roles (e.g., user, admin)', async () => {
    const app = makeTestApp({
      user: { id: '00000000-0000-0000-0000-000000000003', role: 'user' },
      allowedRoles: ['user', 'admin'],
    })
    const res = await request(app).get('/admin')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
