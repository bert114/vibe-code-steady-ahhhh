import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { dbQuery } from '../../db/pool.js'
import { errorHandler, notFound } from '../../middleware/error.js'
import { recoveryRouter } from './recovery.routes.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities — vitest runs files in parallel, so sharing ids with
// other suites would pollute both.
const USER_A = 'test_recovery_user_a'
const USER_B = 'test_recovery_user_b'
const UNKNOWN_ID = '9a9a9a9a-9a9a-4a9a-8a9a-9a9a9a9a9a9a'

function authedApp(userId) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = { id: userId }
    next()
  })
  app.use('/api/recovery', recoveryRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

// --- No database needed: auth + validation boundaries ---

describe('recovery boundaries (no db)', () => {
  it('rejects unauthenticated requests with the error contract', async () => {
    const app = createApp()
    for (const [method, path] of [
      ['get', '/api/recovery/state'],
      ['post', '/api/recovery/breaks'],
      ['patch', `/api/recovery/breaks/${UNKNOWN_ID}/outcome`],
    ]) {
      const res = await request(app)[method](path)
      expect(res.status, `${method} ${path}`).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('rejects unknown activities, durations, outcomes, and ids before touching the db', async () => {
    const app = authedApp(USER_A)
    const bad = [
      ['post', '/api/recovery/breaks', { activity: 'nap', durationMinutes: 5, trigger: 'latest_checkin' }],
      ['post', '/api/recovery/breaks', { activity: 'walk', durationMinutes: 7, trigger: 'latest_checkin' }],
      ['post', '/api/recovery/breaks', { activity: 'walk', durationMinutes: 5, trigger: 'ai' }],
      ['post', '/api/recovery/breaks', { activity: 'walk', durationMinutes: 5, trigger: 'latest_checkin', checkinId: 'x' }],
      ['patch', `/api/recovery/breaks/${UNKNOWN_ID}/outcome`, { outcome: 'amazing' }],
      ['patch', '/api/recovery/breaks/not-a-uuid/outcome', { outcome: 'helped' }],
    ]
    for (const [method, path, body] of bad) {
      const res = await request(app)[method](path).send(body)
      expect(res.status, `${method} ${path} ${JSON.stringify(body)}`).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })
})

// --- Database-backed ---

async function reset() {
  await dbQuery('INSERT INTO users (clerk_id) VALUES ($1), ($2) ON CONFLICT DO NOTHING', [USER_A, USER_B])
  await dbQuery('DELETE FROM user_recovery_activities WHERE user_id IN ($1, $2)', [USER_A, USER_B])
  await dbQuery('DELETE FROM recovery_breaks WHERE user_id IN ($1, $2)', [USER_A, USER_B])
  await dbQuery('DELETE FROM checkins WHERE user_id IN ($1, $2)', [USER_A, USER_B])
}

async function insertCheckin(userId, drain) {
  const { rows } = await dbQuery(
    `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score)
     VALUES ($1, now() - interval '10 minutes', 3, 3, $2) RETURNING id`,
    [userId, drain],
  )
  return rows[0].id
}

describe.skipIf(!HAS_DB)('recovery api (db)', () => {
  it('suggests, starts, completes, and records whether a break helped', async () => {
    await reset()
    try {
      const checkinId = await insertCheckin(USER_A, 5)

      const before = await request(authedApp(USER_A)).get('/api/recovery/state')
      expect(before.status).toBe(200)
      expect(before.body).toMatchObject({
        activeBreak: null,
        dueBreak: null,
        suggestBreak: { reason: 'latest_checkin', checkinId },
        activityStats: [],
      })

      const started = await request(authedApp(USER_A))
        .post('/api/recovery/breaks')
        .send({ activity: 'walk', durationMinutes: 5, trigger: 'latest_checkin', checkinId })
      expect(started.status).toBe(201)
      expect(started.body).toMatchObject({ activity: 'walk', durationMinutes: 5, outcome: null, checkinId })
      const lengthMs = new Date(started.body.endsAt) - new Date(started.body.startedAt)
      expect(lengthMs).toBe(5 * 60 * 1000)

      // A second start while one is running returns the same break.
      const again = await request(authedApp(USER_A))
        .post('/api/recovery/breaks')
        .send({ activity: 'stretch', durationMinutes: 10, trigger: 'latest_checkin' })
      expect(again.status).toBe(200)
      expect(again.body.id).toBe(started.body.id)

      const active = await request(authedApp(USER_A)).get('/api/recovery/state')
      expect(active.body.activeBreak.id).toBe(started.body.id)
      expect(active.body.dueBreak).toBeNull()
      expect(active.body.suggestBreak).toBeNull()

      // Fast-forward: the timer ended, so Steady Mind should ask.
      await dbQuery(
        `UPDATE recovery_breaks SET started_at = now() - interval '6 minutes',
                                    ends_at = now() - interval '1 minute'
         WHERE id = $1`,
        [started.body.id],
      )
      const due = await request(authedApp(USER_A)).get('/api/recovery/state')
      expect(due.body.activeBreak).toBeNull()
      expect(due.body.dueBreak.id).toBe(started.body.id)

      // User B can neither see nor answer A's break.
      const otherState = await request(authedApp(USER_B)).get('/api/recovery/state')
      expect(otherState.body.dueBreak).toBeNull()
      const cross = await request(authedApp(USER_B))
        .patch(`/api/recovery/breaks/${started.body.id}/outcome`)
        .send({ outcome: 'not_really' })
      expect(cross.status).toBe(404)
      expect(cross.body.error.code).toBe('BREAK_NOT_FOUND')

      const answered = await request(authedApp(USER_A))
        .patch(`/api/recovery/breaks/${started.body.id}/outcome`)
        .send({ outcome: 'helped' })
      expect(answered.status).toBe(200)
      expect(answered.body.outcome).toBe('helped')
      expect(answered.body.answeredAt).toBeTruthy()

      // First answer wins.
      const second = await request(authedApp(USER_A))
        .patch(`/api/recovery/breaks/${started.body.id}/outcome`)
        .send({ outcome: 'not_really' })
      expect(second.body.outcome).toBe('helped')
      expect(second.body.answeredAt).toBe(answered.body.answeredAt)

      const after = await request(authedApp(USER_A)).get('/api/recovery/state')
      expect(after.body.dueBreak).toBeNull()
      // A break already started after the drained check-in: no repeat nudge.
      expect(after.body.suggestBreak).toBeNull()
      expect(after.body.activityStats).toEqual([{ activity: 'walk', total: 1, helped: 1 }])
    } finally {
      await reset()
    }
  },
  // 30s: Neon free compute sleeps and can take seconds to wake on first contact.
  30000)

  it('rejects another user\'s check-in, ignores stale breaks, and 404s unknown ids', async () => {
    await reset()
    try {
      const bCheckin = await insertCheckin(USER_B, 5)
      const cross = await request(authedApp(USER_A))
        .post('/api/recovery/breaks')
        .send({ activity: 'water', durationMinutes: 5, trigger: 'latest_checkin', checkinId: bCheckin })
      expect(cross.status).toBe(404)
      expect(cross.body.error.code).toBe('CHECKIN_NOT_FOUND')

      await dbQuery(
        `INSERT INTO recovery_breaks (user_id, trigger_reason, activity, duration_minutes, started_at, ends_at)
         VALUES ($1, 'drain_pattern', 'quiet', 5, now() - interval '30 hours', now() - interval '29 hours')`,
        [USER_A],
      )
      const state = await request(authedApp(USER_A)).get('/api/recovery/state')
      expect(state.body.dueBreak).toBeNull()

      const missing = await request(authedApp(USER_A))
        .patch(`/api/recovery/breaks/${UNKNOWN_ID}/outcome`)
        .send({ outcome: 'skipped' })
      expect(missing.status).toBe(404)
      expect(missing.body.error.code).toBe('BREAK_NOT_FOUND')
    } finally {
      await reset()
    }
  },
  30000)

  it('allows users to create and use custom recovery activities for future reference', async () => {
    await reset()
    try {
      const created = await request(authedApp(USER_A))
        .post('/api/recovery/activities')
        .send({ name: 'Pet my cat', hint: 'Spend five minutes cuddling' })
      expect(created.status).toBe(201)
      expect(created.body).toMatchObject({ name: 'Pet my cat', hint: 'Spend five minutes cuddling' })

      const listed = await request(authedApp(USER_A)).get('/api/recovery/activities')
      expect(listed.status).toBe(200)
      expect(listed.body).toHaveLength(1)
      expect(listed.body[0].name).toBe('Pet my cat')

      // Custom activity shows up in recovery state
      const state = await request(authedApp(USER_A)).get('/api/recovery/state')
      expect(state.body.customActivities).toHaveLength(1)
      expect(state.body.customActivities[0].name).toBe('Pet my cat')

      // User A can start a break with custom activity
      const started = await request(authedApp(USER_A))
        .post('/api/recovery/breaks')
        .send({ activity: `custom:${created.body.id}`, durationMinutes: 5, trigger: 'latest_checkin' })
      expect(started.status).toBe(201)
      expect(started.body.activity).toBe(`custom:${created.body.id}`)

      // User B cannot use User A's custom activity
      const cross = await request(authedApp(USER_B))
        .post('/api/recovery/breaks')
        .send({ activity: `custom:${created.body.id}`, durationMinutes: 5, trigger: 'latest_checkin' })
      expect(cross.status).toBe(404)
    } finally {
      await reset()
    }
  },
  30000)
})

