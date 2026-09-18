// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Every query is scoped by userId — never trust a client-supplied user_id.
import { pool } from '../../db/pool.js'

const COLUMNS = `
  id, user_id, occurred_at,
  mood_score, energy_score, drain_score,
  emotions, context_tags, note, created_at
`

export async function insertCheckin(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO checkins
       (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [
      userId,
      data.occurred_at,
      data.mood_score,
      data.energy_score,
      data.drain_score,
      data.emotions,
      data.context_tags,
      data.note,
    ],
  )
  return rows[0]
}

export async function listCheckins(userId, { limit, offset }) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM checkins
     WHERE user_id = $1
     ORDER BY occurred_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  )
  return rows
}

export async function findCheckinById(userId, id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM checkins WHERE id = $1 AND user_id = $2`,
    [id, userId],
  )
  return rows[0] ?? null
}
