// Minimal SQL migration runner: applies server/src/db/migrations/*.sql
// in filename order, tracking completions in schema_migrations.
// Usage: npm run db:migrate --workspace=server   (needs DATABASE_URL)
// Plain SQL over the Neon HTTP driver — no migration framework, no ORM,
// per the no-ORM rule. Files run statement-by-statement (split on `;`);
// every statement here is idempotent DDL (IF NOT EXISTS), so a failed run
// is recovered by simply re-running.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import pool, { dbQuery, dbTransaction } from "./pool.js";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

// Migration files contain only full-line `--` comments and `;`-terminated
// DDL with no dollar-quoted bodies, so this split is safe here. Keep it
// that way: no functions/triggers with embedded semicolons in migrations.
function splitStatements(sqlText) {
  return sqlText
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await dbQuery("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.filename));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip (already applied): ${file}`);
      continue;
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const statements = splitStatements(sql);
    await dbTransaction([
      ...statements.map((text) => ({ text })),
      {
        text: "INSERT INTO schema_migrations (filename) VALUES ($1)",
        params: [file],
      },
    ]);
    console.log(`[migrate] applied: ${file}`);
  }

  console.log("[migrate] done.");
}

main()
  .catch((error) => {
    if (error.message === "DATABASE_URL is not set.") {
      console.error(`[migrate] FATAL: ${error.message}`);
    } else {
      const code = /^[A-Z0-9_]+$/.test(error.code ?? "")
        ? error.code
        : "UNKNOWN_ERROR";
      console.error(
        `[migrate] FATAL: migration failed (${code}); the current migration was rolled back.`,
      );
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
