// Minimal SQL migration runner: applies server/src/db/migrations/*.sql
// in filename order, tracking completions in schema_migrations.
// Usage: npm run db:migrate --workspace=server   (needs DATABASE_URL)
// Plain SQL over the Neon HTTP driver — no migration framework, no ORM,
// per the no-ORM rule. Files run statement-by-statement (split on `;`);
// every statement here is idempotent DDL (IF NOT EXISTS), so a failed run
// is recovered by simply re-running.
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dbQuery } from './pool.js'
import { env } from '../config/env.js'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

if (!env.DATABASE_URL) {
  console.error('[migrate] FATAL: DATABASE_URL is not set.')
  process.exit(1)
}

// Migration files contain only full-line `--` comments and `;`-terminated
// DDL with no dollar-quoted bodies, so this split is safe here. Keep it
// that way: no functions/triggers with embedded semicolons in migrations.
function splitStatements(sqlText) {
  return sqlText
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

await dbQuery(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`)
const { rows } = await dbQuery('SELECT filename FROM schema_migrations')
const applied = new Set(rows.map((r) => r.filename))

const files = (await readdir(MIGRATIONS_DIR))
  .filter((f) => f.endsWith('.sql'))
  .sort()

for (const file of files) {
  if (applied.has(file)) {
    console.log(`[migrate] skip (already applied): ${file}`)
    continue
  }
  const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
  for (const statement of splitStatements(sql)) {
    await dbQuery(statement)
  }
  await dbQuery('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
  console.log(`[migrate] applied: ${file}`)
}
console.log('[migrate] done.')
