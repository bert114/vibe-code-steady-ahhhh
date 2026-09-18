// Central env loading + startup guards. Import this FIRST in server.js.
// Fails fast on unsafe dev-bypass configuration — never trust defaults here.
import dotenv from 'dotenv'

dotenv.config()

function required(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`[env] Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS === 'true',
  DEV_USER_ID: process.env.DEV_USER_ID ?? '',
}

// --- Mandatory dev-bypass safety rules (TechDesign) ---
if (env.DEV_AUTH_BYPASS && env.NODE_ENV === 'production') {
  console.error('[env] FATAL: DEV_AUTH_BYPASS=true is forbidden when NODE_ENV=production.')
  process.exit(1)
}

if (env.DEV_AUTH_BYPASS && !env.DEV_USER_ID) {
  console.error('[env] FATAL: DEV_AUTH_BYPASS=true requires a valid DEV_USER_ID.')
  process.exit(1)
}

export { required }
