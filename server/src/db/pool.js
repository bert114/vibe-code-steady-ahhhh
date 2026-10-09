import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

dotenv.config();
if (!process.env.DATABASE_URL) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: resolve(__dirname, "../../.env") });
}

import pkg from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";

const { Pool: PgPool } = pkg;

const isNeon = Boolean(process.env.DATABASE_URL?.includes("neon.tech"));

// Neon serverless WebSocket configuration for environments without raw TCP 5432
if (isNeon && typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

const Pool = isNeon ? NeonPool : PgPool;

// The pool will automatically use the DATABASE_URL from your environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isNeon ? {} : { ssl: { rejectUnauthorized: false } }),
});

// Log when a new client connects to the database
pool.on("connect", () => {
  console.log("🔄 New DB client connected to pool");
});

let lastDbError = null;

/**
 * Tests the database connection by running a simple query
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const testConnection = async () => {
  try {
    // We request a single client from the pool to test the connection
    const client = await pool.connect();

    // Execute a simple query to ensure the DB is responsive
    const res = await client.query("SELECT NOW()");

    console.log("✅ DB Connection successful! Server time:", res.rows[0].now);

    // Crucial: Release the client back to the pool
    client.release();
    lastDbError = null;
    return true;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    lastDbError = {
      code: err?.code ?? "DB_ERROR",
      message: err.message,
    };
    return false;
  }
};

/**
 * Reusable query helper function
 * @param {string} text - The SQL query string (e.g., 'SELECT * FROM users WHERE id = $1')
 * @param {Array} params - The array of parameters to safely inject into the query
 */
export const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Database query helper returning standard { rows, rowCount } shape
 * for repository backwards-compatibility.
 */
export async function dbQuery(text, params = []) {
  if (!process.env.DATABASE_URL) {
    const err = new Error("DATABASE_URL is not set.");
    err.code = "DB_UNCONFIGURED";
    err.status = 503;
    throw err;
  }

  try {
    const result = await pool.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows?.length ?? 0,
    };
  } catch (err) {
    err.status = err?.status ?? 503;
    err.code = err?.code ?? "DB_UNAVAILABLE";
    throw err;
  }
}

/**
 * Database transaction helper executing an array of queries atomically.
 */
export async function dbTransaction(queries) {
  if (!process.env.DATABASE_URL) {
    const err = new Error("DATABASE_URL is not set.");
    err.code = "DB_UNCONFIGURED";
    err.status = 503;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const results = [];
    for (const q of queries) {
      const res = await client.query(q.text, q.params ?? []);
      results.push(res);
    }
    await client.query("COMMIT");
    return results;
  } catch (err) {
    await client.query("ROLLBACK");
    err.status = err?.status ?? 503;
    err.code = err?.code ?? "DB_UNAVAILABLE";
    throw err;
  } finally {
    client.release();
  }
}

export function getLastDbError() {
  return lastDbError;
}

export async function checkDatabase() {
  if (!process.env.DATABASE_URL) return "unconfigured";
  const ok = await testConnection();
  return ok ? "up" : "down";
}

export default pool;
