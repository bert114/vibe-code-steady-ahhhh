import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { env } from '../config/env.js'
import { errorHandler } from './error.js'

function probeApp(boom) {
  const app = express()
  app.get('/boom', (_req, _res, next) => next(boom))
  app.use(errorHandler)
  return app
}

// Simulates a raw pg auth failure leaking through the repository layer.
const pgAuthError = Object.assign(new Error('password authentication failed for user "x"'), {
  code: '28P01',
})

describe('errorHandler NODE_ENV branches', () => {
  it('production masks 5xx internals behind the safe contract', async () => {
    const prev = env.NODE_ENV
    env.NODE_ENV = 'production'
    try {
      const res = await request(probeApp(pgAuthError)).get('/boom')
      expect(res.status).toBe(500)
      expect(res.body).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.', details: [] },
      })
    } finally {
      env.NODE_ENV = prev
    }
  })

  it('development exposes the specific code and message', async () => {
    const prev = env.NODE_ENV
    env.NODE_ENV = 'development'
    try {
      const res = await request(probeApp(pgAuthError)).get('/boom')
      expect(res.status).toBe(500)
      expect(res.body).toEqual({
        error: {
          code: '28P01',
          message: 'password authentication failed for user "x"',
          details: [],
        },
      })
    } finally {
      env.NODE_ENV = prev
    }
  })

  it('4xx stays specific in production', async () => {
    const prev = env.NODE_ENV
    env.NODE_ENV = 'production'
    try {
      const bad = Object.assign(new Error('mood_score is required'), {
        status: 400,
        code: 'VALIDATION_ERROR',
      })
      const res = await request(probeApp(bad)).get('/boom')
      expect(res.status).toBe(400)
      expect(res.body.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'mood_score is required',
        details: [],
      })
    } finally {
      env.NODE_ENV = prev
    }
  })
})
