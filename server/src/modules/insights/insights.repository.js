// Data access ONLY for analysis artifacts. Parameterized SQL, user-scoped,
// no user-facing messages — same discipline as every other repository.
import { pool } from '../../db/pool.js'

export async function startRun(userId, { inputCheckinCount, latestCheckinAt, provider, model }) {
  const { rows } = await pool.query(
    `INSERT INTO analysis_runs
       (user_id, status, input_checkin_count, latest_checkin_at, provider, model)
     VALUES ($1, 'running', $2, $3, $4, $5)
     RETURNING id, started_at`,
    [userId, inputCheckinCount, latestCheckinAt, provider, model],
  )
  return rows[0]
}

export async function completeRun(runId, errorCode = null) {
  await pool.query(
    `UPDATE analysis_runs
     SET status = $2, completed_at = now(), error_code = $3
     WHERE id = $1`,
    [runId, errorCode ? 'failed' : 'completed', errorCode],
  )
}

export async function getLastCompletedRun(userId) {
  const { rows } = await pool.query(
    `SELECT id, latest_checkin_at, completed_at FROM analysis_runs
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY started_at DESC LIMIT 1`,
    [userId],
  )
  return rows[0] ?? null
}

export async function insertInsight(userId, runId, insight) {
  const { rows } = await pool.query(
    `INSERT INTO insights
       (user_id, analysis_run_id, insight_type, title, summary, evidence, confidence, suggestions)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb)
     RETURNING id, insight_type, title, summary, evidence, confidence, suggestions, created_at`,
    [
      userId,
      runId,
      insight.type,
      insight.title,
      insight.summary,
      JSON.stringify(insight.evidence),
      insight.confidence,
      JSON.stringify(insight.suggestions),
    ],
  )
  return toApi(rows[0])
}

export async function insertReminder(userId, insightId, kind, message) {
  const { rows } = await pool.query(
    `INSERT INTO reminders (user_id, insight_id, kind, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, kind, message, created_at`,
    [userId, insightId, kind, message],
  )
  return rows[0]
}

export async function listInsights(userId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT id, insight_type, title, summary, evidence, confidence, suggestions, created_at
     FROM insights WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  )
  return rows.map(toApi)
}

export async function findInsightById(userId, id) {
  const { rows } = await pool.query(
    `SELECT id, insight_type, title, summary, evidence, confidence, suggestions, created_at
     FROM insights WHERE id = $1 AND user_id = $2`,
    [id, userId],
  )
  return rows[0] ? toApi(rows[0]) : null
}

function toApi(row) {
  return {
    id: row.id,
    type: row.insight_type,
    title: row.title,
    summary: row.summary,
    evidence: row.evidence,
    confidence: row.confidence,
    suggestions: row.suggestions,
    createdAt: row.created_at,
  }
}
