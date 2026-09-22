// Minimal SQL migration runner: applies server/src/db/migrations/*.sql
// in filename order, tracking completions in schema_migrations.
// Usage: npm run db:migrate --workspace=server   (needs DATABASE_URL)
// Plain node + pg — no migration framework, per the no-ORM rule.
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'
import { env } from '../config/env.js'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

if (!env.DATABASE_URL) {
  console.error('[migrate] FATAL: DATABASE_URL is not set.')
  process.exit(1)
}

const files = (await readdir(MIGRATIONS_DIR))
  .filter((f) => f.endsWith('.sql'))
  .sort()

const client = await pool.connect()
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  const { rows } = await client.query('SELECT filename FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.filename))

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip (already applied): ${file}`)
      continue
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`[migrate] applied: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }
  console.log('[migrate] done.')
} finally {
  client.release()
  await pool.end()
}
