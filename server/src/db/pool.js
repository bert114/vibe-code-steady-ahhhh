import { neon } from "@neondatabase/serverless";
import { env } from "../config/env.js";

// Data access transport: Neon serverless HTTP driver, NOT `pg` TCP.
// Why: this environment cannot open outbound Postgres TCP (5432/6543) —
// verified live: `pg` connects time out while the SAME DATABASE_URL answers
// over HTTPS. `dbQuery()` keeps the exact `pool.query(text, params)` ->
// `{ rows, rowCount }` contract with numbered `$1` placeholders, so every
// repository stays unchanged and every query stays parameterized (no SQL
// string building anywhere).
//
// Timeouts are load-bearing: Neon free compute sleeps, so a hung database
// must become a thrown error (status 503) that reaches Express
// `errorHandler` and the client's `{ error: { code, message } }` contract
// instead of a stuck "Saving…" with no fallback error.
export const DB_QUERY_TIMEOUT_MS = Number(
  process.env.DB_QUERY_TIMEOUT_MS ?? 15000,
);

const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

function unconfiguredError() {
  const err = new Error("DATABASE_URL is not set.");
  err.code = "DB_UNCONFIGURED";
  err.status = 503;
  return err;
}

export async function dbQuery(text, params = []) {
  if (!sql) throw unconfiguredError();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        `Database query timed out after ${DB_QUERY_TIMEOUT_MS}ms`,
      );
      err.code = "DB_TIMEOUT";
      err.status = 503;
      reject(err);
    }, DB_QUERY_TIMEOUT_MS);
    timer.unref?.();
  });
  try {
    // fullResults gives the pg-identical { rows, rowCount } shape.
    const result = await Promise.race([
      sql.query(text, params, { fullResults: true }),
      timeout,
    ]);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows?.length ?? 0,
    };
  } catch (err) {
    if (err?.code !== "DB_TIMEOUT") {
      // Normalize failures so errorHandler returns 503 (not bare 500)
      // with a safe code. Never attach connection strings or raw notes.
      err.status = err?.status ?? 503;
      err.code = err?.code ?? "DB_UNAVAILABLE";
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Non-interactive transaction over HTTP: [{ text, params }, ...] run
// atomically. No result chaining inside (driver limitation) — generate any
// needed ids (e.g. UUIDs) in JS before calling.
export async function dbTransaction(queries) {
  if (!sql) throw unconfiguredError();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        `Database transaction timed out after ${DB_QUERY_TIMEOUT_MS}ms`,
      );
      err.code = "DB_TIMEOUT";
      err.status = 503;
      reject(err);
    }, DB_QUERY_TIMEOUT_MS);
    timer.unref?.();
  });
  try {
    return await Promise.race([
      sql.transaction(queries.map((q) => sql.query(q.text, q.params ?? []))),
      timeout,
    ]);
  } catch (err) {
    if (err?.code !== "DB_TIMEOUT") {
      err.status = err?.status ?? 503;
      err.code = err?.code ?? "DB_UNAVAILABLE";
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Last DB failure, safe fields only (code + message, never the connection
// string or credentials). Lets /api/health report a SPECIFIC error in
// non-production so you can debug without digging through server logs.
let lastDbError = null;
export function getLastDbError() {
  return lastDbError;
}

export async function checkDatabase() {
  if (!env.DATABASE_URL) return "unconfigured";
  try {
    await dbQuery("SELECT 1");
    lastDbError = null;
    return "up";
  } catch (err) {
    // Specific code + message for debugging. pg/Neon messages carry
    // host/user but never the password, so this is safe to log and
    // (in dev) return.
    lastDbError = {
      code: err?.code ?? "UNKNOWN",
      message: err?.message ?? String(err),
    };
    console.error(
      `[db] health check failed code=${lastDbError.code} message=${lastDbError.message}`,
    );
    return "down";
  }
}
