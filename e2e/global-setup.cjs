// Ensures the dedicated E2E user row exists (the dev bypass resolves the
// id but never creates the row; check-in inserts would violate the FK).
const path = require('node:path')
const { config } = require('dotenv')
const { Pool } = require('pg')

config({ path: path.join(__dirname, '..', 'server', '.env') })

const E2E_USER_ID = 'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2'

async function globalSetup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT DO NOTHING', [E2E_USER_ID])
  } finally {
    await pool.end()
  }
}

module.exports = globalSetup
