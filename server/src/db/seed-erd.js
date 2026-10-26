import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: resolve(serverDir, '.env') })

const SAMPLE_PREFIX = 'Sample:'
const relationshipTypeNames = ['Work', 'Family']

function dateDaysAgo(daysAgo, now = new Date()) {
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

async function seed(client, userId) {
  await client.query(
    'INSERT INTO users (clerk_id, email) VALUES ($1, NULL) ON CONFLICT (clerk_id) DO NOTHING',
    [userId],
  )

  const relationshipResult = await client.query(
    `INSERT INTO relationship_types (name)
     VALUES ($1), ($2)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    relationshipTypeNames,
  )
  const relationshipIds = new Map(relationshipResult.rows.map((row) => [row.name, row.id]))

  const templates = [
    {
      category: 'work',
      title: `${SAMPLE_PREFIX} Pause before responding`,
      template: 'I need a little time to think before I respond.',
    },
    {
      category: 'personal',
      title: `${SAMPLE_PREFIX} Name what works for me`,
      template: 'I can make time for this when I have more capacity.',
    },
  ]
  const templateIds = []
  for (const template of templates) {
    const result = await client.query(
      `INSERT INTO boundary_templates (category, title, template)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [template.category, template.title, template.template],
    )
    templateIds.push(result.rows[0].id)
  }

  const activities = [
    { name: `${SAMPLE_PREFIX} Take a short walk`, effort: 'low', success: 0.8 },
    { name: `${SAMPLE_PREFIX} Sit quietly for a moment`, effort: 'medium', success: 0.7 },
  ]
  const activityIds = []
  for (const activity of activities) {
    const result = await client.query(
      `INSERT INTO coping_activities
         (user_id, name, effort_level, success_score, usage_count)
       VALUES ($1, $2, $3, $4, 1)
       RETURNING id`,
      [userId, activity.name, activity.effort, activity.success],
    )
    activityIds.push(result.rows[0].id)
  }

  const dailyLogs = []
  for (const [index, daysAgo] of [0, 1, 2].entries()) {
    const result = await client.query(
      `INSERT INTO daily_logs (user_id, log_date, battery_level, mood_score)
       VALUES ($1, $2, 1, $3)
       RETURNING id`,
      [userId, dateDaysAgo(daysAgo), [3, 2, 3][index]],
    )
    dailyLogs.push(result.rows[0].id)
  }

  const interactions = [
    { logIndex: 0, type: 'Work', name: `${SAMPLE_PREFIX} Work meeting`, duration: 90, drain: 5 },
    { logIndex: 1, type: 'Work', name: `${SAMPLE_PREFIX} Work follow-up`, duration: 45, drain: 5 },
    { logIndex: 2, type: 'Family', name: `${SAMPLE_PREFIX} Family dinner`, duration: 60, drain: 3 },
  ]
  const interactionIds = []
  for (const interaction of interactions) {
    const result = await client.query(
      `INSERT INTO social_interactions
         (daily_log_id, relationship_type_id, custom_name, duration_minutes, drain_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        dailyLogs[interaction.logIndex],
        relationshipIds.get(interaction.type),
        interaction.name,
        interaction.duration,
        interaction.drain,
      ],
    )
    interactionIds.push(result.rows[0].id)
  }

  await client.query(
    `INSERT INTO weekly_summaries (user_id, week_start, summary)
     VALUES ($1, date_trunc('week', CURRENT_DATE)::date, $2)`,
    [userId, `${SAMPLE_PREFIX} A few interactions felt draining; this example summary is synthetic.`],
  )

  for (let index = 0; index < interactionIds.length; index += 1) {
    await client.query(
      `INSERT INTO ai_boundary_messages (interaction_id, template_id, generated_message)
       VALUES ($1, $2, $3)`,
      [
        interactionIds[index],
        templateIds[index % templateIds.length],
        `${SAMPLE_PREFIX} ${templates[index % templates.length].template}`,
      ],
    )
  }

  const sessions = [
    { interactionIndex: 0, activityIndex: 0, rating: 4 },
    { interactionIndex: 1, activityIndex: 1, rating: 5 },
  ]
  for (const session of sessions) {
    await client.query(
      `INSERT INTO recovery_sessions (interaction_id, activity_id, rating)
       VALUES ($1, $2, $3)`,
      [
        interactionIds[session.interactionIndex],
        activityIds[session.activityIndex],
        session.rating,
      ],
    )
  }
}

async function main() {
  const userId = process.env.DEV_USER_ID?.trim()
  if (!userId) {
    throw new Error('DEV_USER_ID must be set in server/.env.')
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in the environment or server/.env.')
  }

  const { default: pool } = await import('./pool.js')
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const schema = await client.query("SELECT to_regclass('public.daily_logs') AS daily_logs")
    if (!schema.rows[0]?.daily_logs) {
      throw new Error('ERD_SCHEMA_NOT_APPLIED')
    }

    await seed(client, userId)
    await client.query('COMMIT')
    console.log('[db:seed:erd] Inserted a sample journey across all ERD tables.')
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // Keep the original failure and avoid logging database details.
      }
    }
    throw error
  } finally {
    client?.release()
    await pool.end()
  }
}

main().catch((error) => {
  if (error.message?.startsWith('DEV_USER_ID') || error.message?.startsWith('DATABASE_URL')) {
    console.error(`[db:seed:erd] ${error.message}`)
  } else if (error.message === 'ERD_SCHEMA_NOT_APPLIED') {
    console.error('[db:seed:erd] Apply the ERD migration before running this seed command.')
  } else {
    const code = /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'UNKNOWN_ERROR'
    console.error(`[db:seed:erd] Seeding failed (${code}); all seed inserts were rolled back.`)
  }
  process.exitCode = 1
})
