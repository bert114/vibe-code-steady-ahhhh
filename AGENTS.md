# AGENTS.md — Steady-Ahh

> Write only what an agent could NOT work out by reading the repo. Every line
> here is loaded into context on every session, so keep it to hard-earned facts.
> If you're describing code, delete it; if you're describing something that once
> cost someone an afternoon, keep it.

## Project

- **What this is:** A calm wellness web app that helps users understand emotions, notice draining patterns, and build boundary awareness.
- **Who it is for:** Lonely people, students, overthinkers, and people emotionally drained by relationships or interactions.
- **Current phase:** MVP features implemented (Clerk auth, check-ins, insights, reminders/energy, trends, dashboard, settings, admin RBAC) and heading to a small validation beta. Not greenfield — improve the existing feature modules.

## Commands

- `npm run dev` — root orchestrator (concurrently) runs the Vite client (`:5173`) and Express API (`:5000`). Dev CORS is the exact origin `CLIENT_ORIGIN` (default `http://localhost:5173`) — don't widen it.
- `npm run test` — `client` Vitest+RTL **then** `server` Vitest+Supertest. Does **not** include Playwright.
- Single test: `npx vitest run <path>` from `client/` or `server/` (both use `vitest run`; add `-t "<name>"` to filter).
- `npm run test:e2e` — Playwright journeys (`e2e/`). Spins its own stack (`:5001` API, `:5174` client) and a dedicated E2E user so dev/tester data is untouched; needs `DATABASE_URL` (reads `server/.env`).
- `npm run db:migrate --workspace=server` — applies `server/src/db/migrations/*.sql` (needs `DATABASE_URL`). Render runs it as `preDeployCommand`.
- `npm run lint` — oxlint on both workspaces. `npm run build` — client build + server no-op.
- `npm run typecheck` — intentional no-op. **JavaScript-only: no TypeScript, no class constructors, no ORM; never add `tsc`/TS config.**
- `npx vibeworkflow` / `npx vibeworkflow doctor` — agent-driven vibe workflow; run with `--tools claude,codex` to match this repo's adapters. Treat its output as instructions to follow, not a substitute for reasoning.

## Read first

1. `docs/PRD-Steady-Ahh-MVP.md` (what we're building — source of truth)
2. `docs/TechDesign-Steady-Ahh-MVP.md` (structure, env vars, API, auth, AI contract)
3. `agent_docs/project_brief.md`, `tech_stack.md`, `testing.md`
4. `README.md`, `.env.example` (env var names), `CLAUDE.md` (Claude Code specifics)

## Architecture

- Root is npm **workspaces** (`client`, `server`) + orchestration only; app code lives in those two packages. `client` = React 19 + Vite + Zustand + react-router; `server` = Express 4 + Zod + `pg`/Neon.
- **Server layering:** `routes → controller → service → repository → SQL`, files named `<name>.<layer>.js` per module under `server/src/modules/`. Cross-domain capabilities (AI, pattern analysis) live in `server/src/services/`, not inside a module.
- **Client features:** `client/src/features/<feature>/` with a public `api.js` — the ONLY path another feature may import. Data fetching goes through the shared `client/src/lib/api/request.js` (the only place that knows the base URL/headers/error parsing; every failure also fires an error toast).
- App shell/entrypoints: `server/src/app.js` (`createApp()` wiring) and `client/src/app/router.jsx`.

## Gotchas

- **TEMP-OPEN-ACCESS bypass is ON by default.** `env.OPEN_ACCESS` defaults `true` (`server/src/config/env.js`), so `requireUser()` allows every request with no session, attributed to `DEV_USER_ID` (falls back to a fixed UUID). Auth is effectively disabled in dev. Set `OPEN_ACCESS=false` to restore 401s. It refuses to boot when `NODE_ENV=production`; delete the open branch before beta (there's a `TODO(REVERT)` in `server/src/middleware/auth.js`). Don't assume protected routes are actually enforcing identity.
- **Clerk is optional and env-gated.** Client enables Clerk only when `VITE_CLERK_PUBLISHABLE_KEY` is set (`client/src/app/auth.jsx`); server mounts `clerkMiddleware()` only when `CLERK_SECRET_KEY` is set (`app.js`). Production **requires** `CLERK_SECRET_KEY` or the server exits 1. The client's `AuthProvider`/`RequireAuth` are pure passthroughs without Clerk keys, and `client/src/lib/api/authToken.js` registers the fresh-token getter.
- **Dev-auth guards are load-bearing** (`config/env.js`): `DEV_AUTH_BYPASS=true` fails startup if `NODE_ENV=production` or `DEV_USER_ID` is unset. Never hardcode the dev user ID in source; never ship the bypass to a real beta.
- **Deterministic pattern engine first, AI second.** The server always gates AI on rule-produced evidence (`server/src/services/patterns/`); the provider only rephrases that evidence into structured language. No autonomous background analysis. AI is called **only** from Express — the client never holds or sends AI credentials.
- **AI provider default is `cloudflare` in code but `groq` in `.env.example`.** Providers: `cloudflare` | `groq` | `openai`, selected by `AI_PROVIDER` (`server/src/services/ai/`). Tests inject a fake with the `async ({ system, user }) => string` signature.
- **Migration runner splits SQL on `;`.** Keep migrations to full-line `--` comments and `;`-terminated DDL — no dollar-quoted bodies, functions, or triggers with embedded semicolons (`server/src/db/migrate.js`).
- **DB driver is auto-selected by URL.** `server/src/db/pool.js` uses the Neon serverless Pool when `DATABASE_URL` contains `neon.tech`, else `pg`. Unset `DATABASE_URL` yields `db: "unconfigured"` and a 503 `DB_UNCONFIGURED` on queries.
- **Docs are load-bearing for tooling.** `vibeworkflow` parses the fenced JSON meta blocks at the end of the PRD and TechDesign. Keep them valid; don't rename those files without approval.
- **E2E API interception:** match the exact origin (`**/localhost:5001/api/**`). A bare `**/api/**` also aborts Vite's `/src/lib/api/*.js` modules.
- **Layer discipline:** controllers never write SQL; repositories do data access only and never build user-facing messages; business rules never live in React components.
- **Every DB query is scoped by `req.user.id`; never trust a client-supplied `user_id`.**
- **Single error contract:** `{ error: { code, message, details } }`. No stack traces to users. Never log raw check-in notes, AI prompts, or full AI output — only IDs, statuses, timing, and safe error codes (`server/src/middleware/audit.js` enforces safe metadata).
- **Budget is $0.** Free-tier limits apply (Render sleeps after idle; Workers AI daily neuron allocation); verify limits before any paid/dependency choice.

## Protected areas — ask before changing

- `.env*`, secrets, credentials, private logs
- `.github/workflows/`, deployment, infrastructure
- existing database migrations
- auth, payments, billing, production email/send flows
- AI provider credentials, MCP servers, tool permissions

**Never print, commit, or transmit secrets, tokens, private logs, or production
data.** Never delete files, rewrite large areas, or change
infrastructure/auth/billing/migrations without approval.

## AI features

- **Model can see:** the user's own recent check-ins for the analysis window; deterministic pattern candidate signals; compact aggregate metrics; optional user notes needed for context.
- **Never send:** secrets, API tokens, database connection strings, other users' data, unrelated account info, or records outside the analysis window.
- **AI can do:** read only, within the user's own data — structured text output only; no tools, no external actions.
- **Needs approval:** none in MVP (analysis-only output; no send/delete/deploy/email surface).
- **How to verify behavior:** `e2e/ai-fixtures/cases.json` eval set — direct pattern, indirect, insufficient data, conflicting signals, repeated boundary-pressure, no-signal, malformed AI JSON, provider timeout/failure, and user-isolation cases.
- **Fallback:** neutral "Insights are temporarily unavailable" plus the last successful insight; user check-ins are never blocked by an AI failure.

## Done means

Report: files changed · commands run · test/build/device results · AI eval
evidence if applicable · remaining risks · rollback notes if relevant.

---

**When this file gets long, that is the signal to split it.** Move task-specific
procedures (deploy steps, release checklists, API references) into
`.agents/skills/<name>/SKILL.md` (opencode/Codex) or `.claude/skills/<name>/SKILL.md`
(Claude Code), where only the one-line description stays in context and the body
loads when it is actually needed. Move directory-specific conventions into
`<subdir>/CLAUDE.md`, which loads only when work touches that directory. Keep
universal constraints and safety prohibitions here — never move a "never do X"
rule somewhere it might not be loaded.
