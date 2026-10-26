// Removes everything the journeys created for the E2E user.
const path = require('node:path')
const { config } = require('dotenv')
const { Pool } = require('pg')

config({ path: path.join(__dirname, '..', 'server', '.env') })

const E2E_USER_ID = 'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2'

async function globalTeardown() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query('DELETE FROM reminders WHERE user_id = $1', [E2E_USER_ID])
    await pool.query('DELETE FROM insights WHERE user_id = $1', [E2E_USER_ID])
    await pool.query('DELETE FROM analysis_runs WHERE user_id = $1', [E2E_USER_ID])
    await pool.query('DELETE FROM checkins WHERE user_id = $1', [E2E_USER_ID])
    await pool.query('DELETE FROM users WHERE id = $1', [E2E_USER_ID])
  } finally {
    await pool.end()
  }
}

module.exports = globalTeardown
