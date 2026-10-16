import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: resolve(serverDir, '.env') })

const UUID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i
const DAY_MS = 24 * 60 * 60 * 1000
const SAMPLE_NOTE = 'Sample dashboard rule seed data.'

function buildCheckins(now = new Date()) {
  return [0, 1, 2].map((daysAgo) => ({
    occurredAt: new Date(now.getTime() - daysAgo * DAY_MS).toISOString(),
    moodScore: 3,
    energyScore: 1,
    drainScore: 5,
    emotions: ['tired'],
    contextTags: ['work'],
    note: SAMPLE_NOTE,
  }))
}

async function main() {
  const userId = process.env.DEV_USER_ID?.trim()
  if (!userId || !UUID_PATTERN.test(userId)) {
    throw new Error('DEV_USER_ID must be set to a valid UUID in server/.env.')
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in the environment or server/.env.')
  }

  const poolModule = await import('./pool.js')
  const { dbTransaction, default: pool } = poolModule

  try {
    const queries = [
      {
        text: 'INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING',
        params: [userId],
      },
      ...buildCheckins().map((checkin) => ({
        text: `INSERT INTO checkins
          (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        params: [
          userId,
          checkin.occurredAt,
          checkin.moodScore,
          checkin.energyScore,
          checkin.drainScore,
          checkin.emotions,
          checkin.contextTags,
          checkin.note,
        ],
      })),
    ]

    await dbTransaction(queries)
    console.log(
      '[db:seed:dashboard] Inserted 3 sample check-ins. The four dashboard pattern rules should now produce signals.',
    )
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  if (error.message?.startsWith('DEV_USER_ID') || error.message?.startsWith('DATABASE_URL')) {
    console.error(`[db:seed:dashboard] ${error.message}`)
  } else {
    const code = /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'UNKNOWN_ERROR'
    console.error(
      `[db:seed:dashboard] Seeding failed (${code}). Check the database connection and migrations; the transaction was rolled back.`,
    )
  }
  process.exitCode = 1
})
