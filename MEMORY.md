# Memory

Update this after major decisions, completed phases, or bugs that future agents need to know about. Keep it short.

## Current State

- Current task: Foundation scaffold complete — React → Express → local Postgres verified; next is Check-In phase (Weeks 3–4)
- Current phase: Foundation (Weeks 1–2 per TechDesign: repo, client/server scaffold, Postgres connection, migrations, health endpoint, dev auth bypass, lint/test commands)
- Primary coding tool: opencode (Level C, in-between) — reads `AGENTS.md` directly; `vibe.project.json` keeps `claude,codex` adapters as valid pointers (CLI tool list has no `opencode` value; left unchanged to keep `doctor` green)
- Next step: scaffold root orchestration package + `client/` + `server/` per `docs/TechDesign-Steady-Ahh-MVP.md`
- Blocked by: none

## Decisions

- 2026-09-18 Doc contract finalized in `docs/`; repo is specs-only — no application code exists yet. Build to the TechDesign plan.
- 2026-09-18 Renamed `docs/PRD-Steady-Ahh-MVP.md.md` → `docs/PRD-Steady-Ahh-MVP.md` so `npx vibeworkflow` auto-detection works.
- 2026-09-18 Ran `npx vibeworkflow --tools claude,codex` (v0.3.0): installed vibe skills (`.agents/skills/` + `.claude/skills/`), `.claude/agents/`, `.codex/config.toml`, `agent_docs/`, `MEMORY.md`, `REVIEW-CHECKLIST.md`, `vibe.project.json`. Existing `AGENTS.md` was preserved and hard-wired to the repo rules.

## AI / Tooling Decisions

- 2026-09-18 Cloudflare Workers AI (REST, from Express only): deterministic pattern engine gates AI; AI only rephrases evidence; output must pass the server Zod schema; fallback is "Insights are temporarily unavailable" + last successful insight. Free allocation ~10,000 neurons/day — verify before relying on any specific model.

## Known Issues

- No `client/` or `server/` code yet — the structure in the TechDesign is the plan, not existing files.
- Root package/workspace files (`package.json`, `.env.example`, README) are also not created yet.
- Render free tier sleeps after ~15 min idle (expected cold start; budget is $0).

## Completed

- [x] Initial scaffold (AGENTS.md + agent_docs + vibe skills + vibe.project.json + doc rename)
- [ ] Core data model
- [ ] Auth
- [ ] Core MVP flow
- [ ] Launch checks