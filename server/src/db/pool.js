import { Pool } from 'pg'
import { env } from '../config/env.js'

// Lazy pool: no connection is opened until the first query runs, so the
// server can boot (and serve /api/health) even when Postgres isn't up yet.
// Health reports the real connection state instead.
export const pool = new Pool(
  env.DATABASE_URL ? { connectionString: env.DATABASE_URL } : {},
)

export async function checkDatabase() {
  if (!env.DATABASE_URL) return 'unconfigured'
  try {
    await pool.query('SELECT 1')
    return 'up'
  } catch {
    return 'down'
  }
}
