// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Maps external Clerk subject IDs to internal UUID users. Every data query
// downstream still scopes by the internal userId.
import { randomUUID } from "node:crypto";
import { dbQuery, dbTransaction } from "../../db/pool.js";

export async function findUserIdByClerkSub(clerkSub) {
  const { rows } = await dbQuery('SELECT user_id FROM auth_identities WHERE clerk_sub = $1', [
    clerkSub,
  ])
  return rows[0]?.user_id ?? null
}

export async function createUserForClerkSub(clerkSub) {
  // HTTP transactions are non-interactive (no result chaining inside), so
  // the UUID is generated here and both inserts run atomically.
  const userId = randomUUID();
  await dbTransaction([
    { text: "INSERT INTO users (id) VALUES ($1)", params: [userId] },
    {
      text: "INSERT INTO auth_identities (clerk_sub, user_id) VALUES ($1, $2)",
      params: [clerkSub, userId],
    },
  ]);
  return userId;
}

export async function deleteUser(userId) {
  // Cascades to checkins, insights, reminders, analysis_runs, auth_identities.
  const { rowCount } = await dbQuery('DELETE FROM users WHERE id = $1', [userId])
  return rowCount > 0
}

export async function exportUserData(userId) {
  const [checkinsRes, insightsRes, remindersRes] = await Promise.all([
    dbQuery(
      `SELECT id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note, created_at
       FROM checkins WHERE user_id = $1 ORDER BY occurred_at DESC`,
      [userId],
    ),
    dbQuery(
      `SELECT id, insight_type, title, summary, evidence, confidence, suggestions, created_at
       FROM insights WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    ),
    dbQuery(
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

