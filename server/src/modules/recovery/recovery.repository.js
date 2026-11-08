// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Every query is scoped by userId — never trust a client-supplied user_id.
import { dbQuery } from '../../db/pool.js'

const COLUMNS = `
  id, user_id, checkin_id, trigger_reason, activity, duration_minutes,
  started_at, ends_at, outcome, answered_at
`

const COLUMNS_WITH_CHECKIN = `
  rb.id, rb.user_id, rb.checkin_id, rb.trigger_reason, rb.activity, rb.duration_minutes,
  rb.started_at, rb.ends_at, rb.outcome, rb.answered_at,
  c.context_tags, c.drain_score
`

export async function insertBreak(userId, { checkinId, trigger, activity, durationMinutes, now = new Date() }) {
  const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000)
  const { rows } = await dbQuery(
    `INSERT INTO recovery_breaks
       (user_id, checkin_id, trigger_reason, activity, duration_minutes, started_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUMNS}`,
    [userId, checkinId ?? null, trigger, activity, durationMinutes, now, endsAt],
  )
  return rows[0]
}

// Most recent unanswered break started on/after sinceDate.
export async function findOpenBreak(userId, sinceDate) {
  const { rows } = await dbQuery(
    `SELECT ${COLUMNS_WITH_CHECKIN} FROM recovery_breaks rb
     LEFT JOIN checkins c ON c.id = rb.checkin_id AND c.user_id = rb.user_id
     WHERE rb.user_id = $1 AND rb.outcome IS NULL AND rb.started_at >= $2
     ORDER BY rb.started_at DESC
     LIMIT 1`,
    [userId, sinceDate],
  )
  return rows[0] ?? null
}

export async function findLatestBreak(userId) {
  const { rows } = await dbQuery(
    `SELECT ${COLUMNS_WITH_CHECKIN} FROM recovery_breaks rb
     LEFT JOIN checkins c ON c.id = rb.checkin_id AND c.user_id = rb.user_id
     WHERE rb.user_id = $1
     ORDER BY rb.started_at DESC
     LIMIT 1`,
    [userId],
  )
  return rows[0] ?? null
}

// COALESCE keeps answers idempotent: the first answer wins.
export async function answerBreak(userId, id, outcome) {
  const { rows } = await dbQuery(
    `UPDATE recovery_breaks
     SET outcome = COALESCE(outcome, $3),
         answered_at = COALESCE(answered_at, now())
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUMNS}`,
    [id, userId, outcome],
  )
  return rows[0] ?? null
}

export async function checkinBelongsToUser(userId, checkinId) {
  const { rows } = await dbQuery(
    'SELECT 1 FROM checkins WHERE id = $1 AND user_id = $2',
    [checkinId, userId],
  )
  return rows.length > 0
}

export async function getActivityStats(userId, sinceDate) {
  const { rows } = await dbQuery(
    `SELECT activity,
            COUNT(*) FILTER (WHERE outcome IN ('helped', 'a_little', 'not_really'))::int AS total,
            COUNT(*) FILTER (WHERE outcome IN ('helped', 'a_little'))::int AS helped
     FROM recovery_breaks
     WHERE user_id = $1 AND started_at >= $2
     GROUP BY activity
     ORDER BY activity`,
    [userId, sinceDate],
  )
  return rows
}

export async function insertCustomActivity(userId, { name, hint = '' }) {
  const { rows } = await dbQuery(
    `INSERT INTO user_recovery_activities (user_id, name, hint)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, hint, created_at`,
    [userId, name.trim(), hint.trim()],
  )
  return rows[0]
}

export async function listCustomActivities(userId) {
  const { rows } = await dbQuery(
    `SELECT id, user_id, name, hint, created_at
     FROM user_recovery_activities
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  )
  return rows
}

export async function findCustomActivityById(userId, id) {
  const { rows } = await dbQuery(
    `SELECT id, user_id, name, hint, created_at
     FROM user_recovery_activities
     WHERE user_id = $1 AND id = $2`,
    [userId, id],
  )
  return rows[0] ?? null
}


