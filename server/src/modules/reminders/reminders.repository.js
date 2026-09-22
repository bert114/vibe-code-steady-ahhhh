// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Every query is scoped by userId — never trust a client-supplied user_id.
import { pool } from '../../db/pool.js'

const COLUMNS = `
  id, user_id, insight_id, kind, message, read_at, created_at
`

export async function listReminders(userId, { limit, offset }) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM reminders
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  )
  return rows
}

export async function markReminderRead(userId, id) {  // COALESCE keeps re-reads idempotent: the first read timestamp wins.
  const { rows } = await pool.query(
    `UPDATE reminders
     SET read_at = COALESCE(read_at, now())
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUMNS}`,
    [id, userId],
  )
  return rows[0] ?? null
}

export async function countUnreadReminders(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM reminders
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  )
  return rows[0].count
}
