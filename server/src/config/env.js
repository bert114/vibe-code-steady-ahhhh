// Central env loading + startup guards. Import this FIRST in server.js.
// Fails fast on unsafe dev-bypass configuration — never trust defaults here.
import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS === "true",
  DEV_USER_ID: process.env.DEV_USER_ID ?? "",
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",

  // TEMP-OPEN-ACCESS (revert before beta): when true, requireUser() allows
  // every request without a session and attributes it to DEV_USER_ID.
  // Default open for now; set OPEN_ACCESS=false to restore 401 enforcement.
  // Never enable in production (startup guard below exits 1).
  OPEN_ACCESS: process.env.OPEN_ACCESS !== "false",
  // Per-request audit to console JSON (safe metadata only, never raw notes).
  // Set AUDIT_ENABLED=false to silence (tests do this).
  AUDIT_ENABLED: process.env.AUDIT_ENABLED !== "false",

  // AI provider
  AI_PROVIDER: process.env.AI_PROVIDER ?? "cloudflare",
  AI_PROVIDER_TIMEOUT_MS: Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 20000),
  AI_ANALYSIS_RATE_LIMIT: Number(process.env.AI_ANALYSIS_RATE_LIMIT ?? 5),
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN ?? "",
  CLOUDFLARE_AI_MODEL: process.env.CLOUDFLARE_AI_MODEL ?? "",
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  GROQ_MODEL: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  // Pattern engine thresholds
  BURNOUT_SIGNAL_WINDOW_DAYS: Number(process.env.BURNOUT_SIGNAL_WINDOW_DAYS ?? 7),
  BURNOUT_SIGNAL_MIN_CHECKINS: Number(process.env.BURNOUT_SIGNAL_MIN_CHECKINS ?? 3),
  LOW_ENERGY_MAX: Number(process.env.LOW_ENERGY_MAX ?? 2),
  HIGH_DRAIN_MIN: Number(process.env.HIGH_DRAIN_MIN ?? 4),
};

// --- Mandatory dev-bypass safety rules (TechDesign) ---
if (env.DEV_AUTH_BYPASS && env.NODE_ENV === "production") {
  console.error(
    "[env] FATAL: DEV_AUTH_BYPASS=true is forbidden when NODE_ENV=production.",
  );
  process.exit(1);
}

if (env.DEV_AUTH_BYPASS && !env.DEV_USER_ID) {
  console.error(
    "[env] FATAL: DEV_AUTH_BYPASS=true requires a valid DEV_USER_ID.",
  );
  process.exit(1);
}

if (env.NODE_ENV === "production" && !env.CLERK_SECRET_KEY) {
  console.error(
    "[env] FATAL: NODE_ENV=production requires CLERK_SECRET_KEY (real auth for beta).",
  );
  process.exit(1);
}

// --- TEMP-OPEN-ACCESS guards (remove together with the flag) ---
if (env.OPEN_ACCESS && env.NODE_ENV === "production") {
  console.error(
    "[env] FATAL: OPEN_ACCESS=true is forbidden when NODE_ENV=production.",
  );
  process.exit(1);
}

