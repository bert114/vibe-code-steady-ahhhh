// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Maps external Clerk subject IDs to internal UUID users. Every data query
// downstream still scopes by the internal userId.
import { randomUUID } from "node:crypto";
import { dbQuery, dbTransaction } from "../../db/pool.js";

export async function findUserIdByClerkSub(clerkSub) {
  const user = await findUserByClerkSub(clerkSub);
  return user?.userId ?? null;
}

export async function findUserByClerkSub(clerkSub) {
  const { rows } = await dbQuery(
    `SELECT a.user_id, u.role
     FROM auth_identities a
     JOIN users u ON u.id = a.user_id
     WHERE a.clerk_sub = $1`,
    [clerkSub],
  );
  if (!rows[0]) return null;
  return { userId: rows[0].user_id, role: rows[0].role };
}

export async function createUserForClerkSub(clerkSub, role = "user") {
  // HTTP transactions are non-interactive (no result chaining inside), so
  // the UUID is generated here and both inserts run atomically.
  const userId = randomUUID();
  const safeRole = role === "admin" ? "admin" : "user";
  await dbTransaction([
    {
      text: "INSERT INTO users (id, role) VALUES ($1, $2)",
      params: [userId, safeRole],
    },
    {
      text: "INSERT INTO auth_identities (clerk_sub, user_id) VALUES ($1, $2)",
      params: [clerkSub, userId],
    },
  ]);
  return { userId, role: safeRole };
}

export async function findUserById(userId) {
  const { rows } = await dbQuery(
    "SELECT id, role, created_at FROM users WHERE id = $1",
    [userId],
  );
  return rows[0] ?? null;
}

export async function updateUserRole(userId, role) {
  const safeRole = role === "admin" ? "admin" : "user";
  const { rows } = await dbQuery(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role",
    [safeRole, userId],
  );
  return rows[0] ?? null;
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

