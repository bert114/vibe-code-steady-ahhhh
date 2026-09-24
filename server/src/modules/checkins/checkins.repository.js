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

export async function deleteCheckinById(userId, id) {
  const { rowCount } = await pool.query(
    `DELETE FROM checkins WHERE id = $1 AND user_id = $2`,
    [id, userId],
  )
  return (rowCount ?? 0) > 0
}

// One row per calendar day with at least one check-in, oldest first —
// day-bucketed so a window covering many check-ins still renders as a
// legible trend rather than one point per row.
export async function getDailyAverages(userId, sinceDate) {
  const { rows } = await pool.query(
    `SELECT
       date_trunc('day', occurred_at) AS day,
       AVG(mood_score)::float AS avg_mood,
       AVG(energy_score)::float AS avg_energy,
       AVG(drain_score)::float AS avg_drain,
       COUNT(*)::int AS checkins
     FROM checkins
     WHERE user_id = $1 AND occurred_at >= $2
     GROUP BY day
     ORDER BY day ASC`,
    [userId, sinceDate],
  )
  return rows
}

// Most frequent context tags on high-drain check-ins (drain_score = 5) in
// the window — a lightweight signal for "what tends to be draining lately",
// separate from the deterministic pattern engine's own rules.
export async function getTopDrainingTags(userId, sinceDate, limit) {
  const { rows } = await pool.query(
    `SELECT tag, COUNT(*)::int AS count
     FROM checkins, unnest(context_tags) AS tag
     WHERE user_id = $1 AND occurred_at >= $2 AND drain_score = 5
     GROUP BY tag
     ORDER BY count DESC, tag ASC
     LIMIT $3`,
    [userId, sinceDate, limit],
  )
  return rows
}

