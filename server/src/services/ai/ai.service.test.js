import { afterAll, describe, expect, it } from 'vitest'
import cases from '../../../../e2e/ai-fixtures/cases.json' with { type: 'json' }
import { pool } from '../../db/pool.js'
import { ProviderError } from './cloudflare.provider.js'
import { analyzeRecentCheckins } from './ai.service.js'

const HAS_DB = Boolean(process.env.DATABASE_URL)
// Dedicated identities — every DB suite owns its own pair.
const USER_A = '55555555-5555-4555-8555-555555555555'
const USER_B = '66666666-6666-4666-8666-666666666666'

const goodOutput = cases.cases.find((c) => c.name === 'direct-pattern').providerOutput
const fakeProvider = () => async () => goodOutput

async function seed(userId) {
  await pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId])
  await pool.query(
    `INSERT INTO checkins (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
     VALUES ($1, now(), 1, 1, 5, '{tired}', '{overtime}', ''),
            ($1, now() - interval '1 day', 3, 1, 5, '{tired}', '{overtime}', '')`,
    [userId],
  )
}

async function cleanup(userId) {
  await pool.query('DELETE FROM reminders WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM insights WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM analysis_runs WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM checkins WHERE user_id = $1', [userId])
}

describe.skipIf(!HAS_DB)('ai.service (db)', () => {
  // One shared pool per file: ending it per-test breaks the tests that follow.
  afterAll(() => pool.end())
  it(
    'stores validated insights on the happy path, then skips when nothing is new',
    async () => {
      await seed(USER_A)
      try {
        const first = await analyzeRecentCheckins(USER_A, { provider: fakeProvider() })
        expect(first.fallback).toBe(false)
        expect(first.fresh).toBe(true)
        expect(first.insights).toHaveLength(1)
        expect(first.insights[0]).toMatchObject({ type: 'burnout' })

        const reminders = await pool.query('SELECT * FROM reminders WHERE user_id = $1', [USER_A])
        expect(reminders.rowCount).toBe(1)

        // Second call: no new check-ins → stored answer, no provider hit.
        let providerCalls = 0
        const counting = () => async () => {
          providerCalls += 1
          return goodOutput
        }
        const second = await analyzeRecentCheckins(USER_A, { provider: counting() })
        expect(second.fresh).toBe(false)
        expect(providerCalls).toBe(0)
      } finally {
        await cleanup(USER_A)
      }
    },
    30000,
  )

  it(
    'falls back safely on provider failure and malformed output',
    async () => {
      await seed(USER_B)
      try {
        const timeout = await analyzeRecentCheckins(USER_B, {
          provider: async () => {
            throw new ProviderError('AI_TIMEOUT')
          },
        })
        expect(timeout.fallback).toBe(true)
        expect(timeout.message).toBe('Insights are temporarily unavailable.')
        expect(timeout.insights).toEqual([])

        const malformed = await analyzeRecentCheckins(USER_B, {
          provider: async () => '{"insights": [broken',
        })
        expect(malformed.fallback).toBe(true)
        expect(malformed.errorCode).toBe('AI_MALFORMED_JSON')

        const runs = await pool.query(
          "SELECT error_code FROM analysis_runs WHERE user_id = $1 AND status = 'failed'",
          [USER_B],
        )
        expect(runs.rows.map((r) => r.error_code).sort()).toEqual([
          'AI_MALFORMED_JSON',
          'AI_TIMEOUT',
        ])
      } finally {
        await cleanup(USER_B)
      }
    },
    30000,
  )

  it(
    'reports insufficient data instead of calling the provider',
    async () => {
      await pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT DO NOTHING', [USER_B])
      try {
        let providerCalls = 0
        const result = await analyzeRecentCheckins(USER_B, {
          provider: async () => {
            providerCalls += 1
            return goodOutput
          },
        })
        expect(result.fallback).toBe(true)
        expect(result.message).toMatch(/not enough check-ins/i)
        expect(providerCalls).toBe(0)
      } finally {
        await cleanup(USER_B)
      }
    },
    30000,
  )

  it(
    'stores the reminder with a null insight when the model honestly returns none',
    async () => {
      await seed(USER_B)
      try {
        const result = await analyzeRecentCheckins(USER_B, {
          provider: async () =>
            '{"insights":[],"reminder":{"shouldShow":true,"message":"More check-in data is needed."}}',
        })
        expect(result.fallback).toBe(false)
        expect(result.insights).toEqual([])
        const reminders = await pool.query(
          'SELECT insight_id, message FROM reminders WHERE user_id = $1',
          [USER_B],
        )
        expect(reminders.rowCount).toBe(1)
        expect(reminders.rows[0].insight_id).toBeNull()
        expect(reminders.rows[0].message).toMatch(/more check-in data/i)
      } finally {
        await cleanup(USER_B)
      }
    },
    30000,
  )
})
