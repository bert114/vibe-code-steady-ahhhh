import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { env } from '../config/env.js'
import { errorHandler } from './error.js'
import { withController } from './withController.js'

function probeApp(
  boom,
  { userId = 'test-user', controller = 'test.probe' } = {},
) {
  const app = express()
  app.get(
    '/boom',
    (req, _res, next) => {
      if (userId !== null) req.user = { id: userId }
      next()
    },
    controller === null
      ? (_req, _res, next) => next(boom)
      : withController(controller, (_req, _res, next) => next(boom)),
  )
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
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong.',
          details: [],
          path: '/boom',
          request_id: expect.stringMatching(/^req_[0-9a-f-]{36}$/),
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      })
      expect(res.headers['x-request-id']).toBe(res.body.error.request_id)
      expect(res.body.error.debug).toBeUndefined()
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
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: '28P01',
          message: 'password authentication failed for user "x"',
          details: [],
          path: '/boom',
          debug: {
            requester_id: 'test-user',
            trigger: {
              controller: 'test.probe',
              file: 'server/src/middleware/error.test.js',
              line: expect.any(Number),
              column: expect.any(Number),
            },
            cause: {
              name: 'Error',
              code: '28P01',
              message: 'password authentication failed for user "x"',
            },
          },
        },
      })
    } finally {
      env.NODE_ENV = prev
    }
  })

  it('development uses null when no requester or controller has been identified', async () => {
    const prev = env.NODE_ENV
    env.NODE_ENV = 'development'
    try {
      const res = await request(
        probeApp(pgAuthError, { userId: null, controller: null }),
      ).get('/boom')
      expect(res.body.error.debug).toMatchObject({
        requester_id: null,
        trigger: { controller: null, file: 'server/src/middleware/error.test.js' },
        cause: { name: 'Error', code: '28P01' },
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
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'mood_score is required',
          details: [],
          path: '/boom',
          request_id: expect.stringMatching(/^req_/),
          timestamp: expect.any(String),
        },
      })
    } finally {
      env.NODE_ENV = prev
    }
  })
})
