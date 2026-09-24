// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Maps external Clerk subject IDs to internal UUID users. Every data query
// downstream still scopes by the internal userId.
import { pool } from '../../db/pool.js'

export async function findUserIdByClerkSub(clerkSub) {
  const { rows } = await pool.query('SELECT user_id FROM auth_identities WHERE clerk_sub = $1', [
    clerkSub,
  ])
  return rows[0]?.user_id ?? null
}

export async function createUserForClerkSub(clerkSub) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: users } = await client.query(
      'INSERT INTO users (id) VALUES (gen_random_uuid()) RETURNING id',
    )
    const userId = users[0].id
    await client.query('INSERT INTO auth_identities (clerk_sub, user_id) VALUES ($1, $2)', [
      clerkSub,
      userId,
    ])
    await client.query('COMMIT')
    return userId
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteUser(userId) {
  // Cascades to checkins, insights, reminders, analysis_runs, auth_identities.
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId])
  return rowCount > 0
}

export async function exportUserData(userId) {
  const [checkinsRes, insightsRes, remindersRes] = await Promise.all([
    pool.query(
      `SELECT id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note, created_at
       FROM checkins WHERE user_id = $1 ORDER BY occurred_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT id, insight_type, title, summary, evidence, confidence, suggestions, created_at
       FROM insights WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT id, kind, message, read_at, created_at
       FROM reminders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    ),
  ])

  return {
    checkins: checkinsRes.rows,
    insights: insightsRes.rows,
    reminders: remindersRes.rows,
  }
}

