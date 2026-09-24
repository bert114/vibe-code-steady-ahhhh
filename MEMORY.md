# Memory

Update this after major decisions, completed phases, or bugs that future agents need to know about. Keep it short.

## Current State

- Current task: Phase 8 (Trends & Polish) — added GET /api/check-ins/trends (day-bucketed mood/energy/drain averages + top draining tags over 7/30/90-day windows), a new /trends page and nav link, and cleaned up stray CRLF line-ending diffs left on the `phase8` branch from prior sessions
- Next step: run `npm run test` (client + server) and `npm run test:e2e` for real against Neon — not verified in the sandbox this was built in (native vitest/rolldown bindings were broken there, no network to reinstall); then owner deploys/invites testers as before
- AI provider note: MEMORY previously said "Workers AI unwired, fallback honest" — that's stale. `AI_PROVIDER=groq` is live with a real `GROQ_API_KEY` in `server/.env` (Cloudflare/OpenAI providers remain as swappable adapters, unused by default).
- Current phase: Foundation (Weeks 1–2 per TechDesign: repo, client/server scaffold, Postgres connection, migrations, health endpoint, dev auth bypass, lint/test commands)
- Current phase: Foundation (Weeks 1–2 per TechDesign: repo, client/server scaffold, Postgres connection, migrations, health endpoint, dev auth bypass, lint/test commands)
- Primary coding tool: opencode (Level C, in-between) — reads `AGENTS.md` directly; `vibe.project.json` keeps `claude,codex` adapters as valid pointers (CLI tool list has no `opencode` value; left unchanged to keep `doctor` green)
- Next step: Weeks 9–12 — boundary evidence copy review, dashboard summary, production auth selection, privacy/deletion controls, deploy, Playwright journeys, tester onboarding
- Blocked by: none

## Decisions

- 2026-09-18 Doc contract finalized in `docs/`; repo is specs-only — no application code exists yet. Build to the TechDesign plan.
- 2026-09-18 Renamed `docs/PRD-Steady-Ahh-MVP.md.md` → `docs/PRD-Steady-Ahh-MVP.md` so `npx vibeworkflow` auto-detection works.
- 2026-09-18 Ran `npx vibeworkflow --tools claude,codex` (v0.3.0): installed vibe skills (`.agents/skills/` + `.claude/skills/`), `.claude/agents/`, `.codex/config.toml`, `agent_docs/`, `MEMORY.md`, `REVIEW-CHECKLIST.md`, `vibe.project.json`. Existing `AGENTS.md` was preserved and hard-wired to the repo rules.

## AI / Tooling Decisions

- 2026-09-18 Cloudflare Workers AI (REST, from Express only): deterministic pattern engine gates AI; AI only rephrases evidence; output must pass the server Zod schema; fallback is "Insights are temporarily unavailable" + last successful insight. Free allocation ~10,000 neurons/day — verify before relying on any specific model.

## Known Issues

- Phase 8 trends feature (server + client) was written but NOT run: the build sandbox had broken native bindings for vitest/rolldown (platform mismatch, no network to `npm install` a fix) and no esbuild/babel available to even syntax-check JSX directly. Code was reviewed by hand and against existing module conventions, but run `npm run test --workspace=server`, `npm run test --workspace=client`, and a manual `/trends` browser check before trusting it.

- Database is Neon Postgres (user-held `DATABASE_URL`, session-only, never committed); `001_checkins.sql` applied 2026-09-18. Local `server/.env` still not on disk — export `DATABASE_URL` per session or create the gitignored file locally.
- Check-in scale locked for MVP: mood/energy/drain 1–5, tags free-text, note ≤5000 chars; no boundary-pressure question yet (TechDesign open question, default taken).
- Render free tier sleeps after ~15 min idle (expected cold start; budget is $0).
- Neon free compute also sleeps: DB test suites carry a 30s timeout and each suite owns distinct test user IDs (vitest files run in parallel — sharing IDs cross-polluted suites on 2026-09-18, fixed with per-file IDs + try/finally cleanup).

## Completed

- [x] Initial scaffold (AGENTS.md + agent_docs + vibe skills + vibe.project.json + doc rename)
- [x] Foundation scaffold (root orchestration, client/server, Postgres pool, health endpoint, dev auth bypass, lint/test commands — all verified 2026-09-18)
- [x] Check-In (migration runner + 001, layered API module, React page + Zustand store, 19 tests incl. user-isolation, live round-trip vs Neon — verified 2026-09-18)
- [x] Pattern Engine (burnout/boundary rules + pattern.service, GET /api/insights/signals, dashboard SignalsPanel, 33 tests incl. fixtures + isolation, live 4-signal evidence vs Neon — verified 2026-09-18)
- [x] AI Insights (002 migration, provider adapter + prompt + Zod schema, analyze service with fallback, rate-limited routes, Insights page, 9-case eval fixtures, 43 tests — fallback + 429 verified live 2026-09-18; real model call deferred pending Cloudflare creds)
- [x] Phase 4 Boundary + Dashboard (reminders module GET/PATCH + read_at idempotency, GET /api/dashboard/summary, Observed/Reflection prompt rule + boundary insight cards, dashboard UI with optimistic mark-read, no migration needed; client 9 + server 45 tests green 2026-09-19)
- [x] Phase 5 Validation Readiness (Clerk Hobby auth: 003 auth_identities, injectable verifier, Bearer-per-call client, prod boot guards; DELETE /api/users/me cascade + /settings privacy copy; render.yaml + deploy/tester runbooks; Playwright 5 journeys on scratch ports; feedback-link default external form; client 18 + server 52 + e2e 5 green 2026-09-19; no AI provider — fallback honest)
- [x] Phase 6 Dashboard & UX Refresh (Dashboard layout overhaul, energy battery & 7-capsule energy overview, 3-point check-in scale, toast notification stack & store)
- [x] Phase 7 Experience Polish, Timeline History & Data Sovereignty (Calm hero landing at `/`, interactive check-in timeline with note expander and scoped `DELETE /api/check-ins/:id`, elevated `/insights` with category tabs and dual-callout cards, data sovereignty export `GET /api/users/export` in `/settings`; client 52 tests green 2026-09-24)
- [x] Phase 8 Trends & Polish (day-bucketed `GET /api/check-ins/trends?windowDays=7|30|90` — mood/energy/drain averages + top draining-tag frequency, scoped by user, no new migration; new `/trends` client page with window tabs, TrendChart SVG, draining-tags list, nav link; new server tests `checkins.trends.routes.test.js` + validation cases, new client `trends.test.jsx`; normalized ~39 files of stray CRLF noise on `phase8` branch — not yet run against a live DB/browser, see Known Issues)

