// Data access ONLY: parameterized SQL, raw rows, no user-facing messages.
// Clerk subjects are the canonical users.clerk_id primary key. auth_identities
// keeps the lookup extensible for future linked identities.
import { dbQuery, dbTransaction } from "../../db/pool.js";

export async function findUserIdByClerkSub(clerkSub) {
  const user = await findUserByClerkSub(clerkSub);
  return user?.userId ?? null;
}

export async function findUserByClerkSub(clerkSub) {
  const { rows } = await dbQuery(
    `SELECT u.clerk_id AS user_id, u.role, u.email
     FROM auth_identities a
     JOIN users u ON u.clerk_id = a.user_id
     WHERE a.clerk_sub = $1`,
    [clerkSub],
  );
  if (!rows[0]) return null;
  return { userId: rows[0].user_id, role: rows[0].role, email: rows[0].email ?? null };
}

export async function createUserForClerkSub(clerkSub, role = "user") {
  const userId = clerkSub;
  const safeRole = role === "admin" ? "admin" : "user";
  await dbTransaction([
    {
      text: "INSERT INTO users (clerk_id, role) VALUES ($1, $2)",
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
    "SELECT clerk_id AS id, role, email, created_at FROM users WHERE clerk_id = $1",
    [userId],
  );
  return rows[0] ?? null;
}

export async function updateUserEmail(userId, email) {
  const { rows } = await dbQuery(
    "UPDATE users SET email = $1 WHERE clerk_id = $2 RETURNING clerk_id AS id, role, email",
    [email, userId],
  );
  return rows[0] ?? null;
}

export async function updateUserRole(userId, role) {
  const safeRole = role === "admin" ? "admin" : "user";
  const { rows } = await dbQuery(
    "UPDATE users SET role = $1 WHERE clerk_id = $2 RETURNING clerk_id AS id, role",
    [safeRole, userId],
  );
  return rows[0] ?? null;
}

export async function deleteUser(userId) {
  // Cascades to checkins, insights, reminders, analysis_runs, auth_identities.
  const { rowCount } = await dbQuery('DELETE FROM users WHERE clerk_id = $1', [userId])
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

