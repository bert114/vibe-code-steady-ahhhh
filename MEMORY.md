# Memory

Update this after major decisions, completed phases, or bugs that future agents need to know about. Keep it short.

## Current State

- Current task: Check-In phase complete — migration + API + page verified live against Neon Postgres; next is Pattern Engine (Weeks 5–6)
- Current phase: Foundation (Weeks 1–2 per TechDesign: repo, client/server scaffold, Postgres connection, migrations, health endpoint, dev auth bypass, lint/test commands)
- Primary coding tool: opencode (Level C, in-between) — reads `AGENTS.md` directly; `vibe.project.json` keeps `claude,codex` adapters as valid pointers (CLI tool list has no `opencode` value; left unchanged to keep `doctor` green)
- Next step: Check-In phase (Weeks 3–4) — checkins migration + API module + React page + store + tests per TechDesign Feature 1
- Blocked by: none

## Decisions

- 2026-09-18 Doc contract finalized in `docs/`; repo is specs-only — no application code exists yet. Build to the TechDesign plan.
- 2026-09-18 Renamed `docs/PRD-Steady-Ahh-MVP.md.md` → `docs/PRD-Steady-Ahh-MVP.md` so `npx vibeworkflow` auto-detection works.
- 2026-09-18 Ran `npx vibeworkflow --tools claude,codex` (v0.3.0): installed vibe skills (`.agents/skills/` + `.claude/skills/`), `.claude/agents/`, `.codex/config.toml`, `agent_docs/`, `MEMORY.md`, `REVIEW-CHECKLIST.md`, `vibe.project.json`. Existing `AGENTS.md` was preserved and hard-wired to the repo rules.

## AI / Tooling Decisions

- 2026-09-18 Cloudflare Workers AI (REST, from Express only): deterministic pattern engine gates AI; AI only rephrases evidence; output must pass the server Zod schema; fallback is "Insights are temporarily unavailable" + last successful insight. Free allocation ~10,000 neurons/day — verify before relying on any specific model.

## Known Issues

- Database is Neon Postgres (user-held `DATABASE_URL`, session-only, never committed); `001_checkins.sql` applied 2026-09-18. Local `server/.env` still not on disk — export `DATABASE_URL` per session or create the gitignored file locally.
- Check-in scale locked for MVP: mood/energy/drain 1–5, tags free-text, note ≤5000 chars; no boundary-pressure question yet (TechDesign open question, default taken).
- Render free tier sleeps after ~15 min idle (expected cold start; budget is $0).

## Completed

- [x] Initial scaffold (AGENTS.md + agent_docs + vibe skills + vibe.project.json + doc rename)
- [x] Foundation scaffold (root orchestration, client/server, Postgres pool, health endpoint, dev auth bypass, lint/test commands — all verified 2026-09-18)
- [x] Check-In (migration runner + 001, layered API module, React page + Zustand store, 19 tests incl. user-isolation, live round-trip vs Neon — verified 2026-09-18)
- [ ] Core data model
- [ ] Auth
- [ ] Core MVP flow
- [ ] Launch checks
