    # AGENTS.md — Steady-Ahh

> **How to fill this in:** write only what an agent could NOT work out by
> reading the repo. Skip the directory tree (`ls` shows it), the dependency list
> (the manifest shows it), and generic advice like "write clean code" or "handle
> errors" — a capable model already does those, and every line here is loaded
> into context on every single session. If you find yourself describing the
> code, delete it. If you find yourself describing something that once cost
> someone an afternoon, keep it.

## Project

- **What this is:** A calm wellness web app that helps users understand emotions, notice draining patterns, and build boundary awareness.
- **Who it is for:** Lonely people, students, overthinkers, and people emotionally drained by relationships or interactions.
- **Current phase:** Foundation

## Commands

Only the ones that are **not** guessable from the manifest — non-standard
scripts, required flags, environment setup. Delete this section if `npm run dev`
is genuinely all there is.

- `npm run typecheck` — intentional no-op. **JavaScript-only project (no TypeScript, no class constructors); never add a `tsc` step or TS config.**
- `npx vibeworkflow` / `npx vibeworkflow doctor` — agent-driven vibe workflow. Run with `--tools claude,codex` to match this repo's adapters. It scaffolds/preserves setup files and `doctor` validates against the golden-path checklist; treat its output as instructions to follow, not a substitute for reasoning.
- `npm run dev` — root orchestrator (concurrently) runs the Vite client (port 5173) and the Express server (port 5000). CORS is limited to `http://localhost:5173` in dev — don't widen it.
- `npm run test` — intended to run client Vitest + RTL, server Vitest + Supertest, and Playwright under `e2e/`. Exact scripts are defined only once `client/` and `server/` packages exist (see Gotchas).

## Read first

1. `docs/PRD-Steady-Ahh-MVP.md` (what we're building — the source of truth)
2. `docs/TechDesign-Steady-Ahh-MVP.md` (how we're building it — exact structure, env vars, API, auth, AI contract)
3. `agent_docs/project_brief.md`
4. `agent_docs/tech_stack.md`
5. `agent_docs/testing.md`

## Gotchas

**The highest-value section in this file.** Things that look safe and aren't;
conventions that differ from the framework default, so the surrounding code
would teach the wrong pattern; failures that took real time to diagnose.

- **Foundation scaffold exists.** `client/`, `server/`, root orchestration, and `.env.example` are implemented and verified; feature code follows the `client/` + `server/` tree in the TechDesign. `docs/` and `agent_docs/` remain the contract — implement to the plan.
- **Docs are load-bearing for tooling.** The `vibeworkflow` CLI parses the fenced JSON meta blocks at the end of both the PRD and TechDesign docs. Keep those blocks valid; don't rename or rename-format the files without approval.
- **Deterministic pattern engine first, AI second.** The server always gates AI on rule-produced evidence (`server/src/services/patterns/`); AI only rephrases that evidence into user-facing language. No autonomous background analysis agents.
- **AI is called only from Express, never from the client.** The client never holds or sends AI credentials.
- **JavaScript only: no TypeScript, no class constructors, no ORM.** Database access is `pg` + parameterized SQL migrations tracked in Git.
- **Layer discipline:** controllers never write SQL; repositories do data access only and never build user-facing messages; business rules never live in React components; a client feature must not import another feature's private files — go through that feature's public `api.js`.
- **Every database query is scoped by `req.user.id`; never trust a client-supplied `user_id`.**
- **Dev auth bypass:** server must fail startup if `DEV_AUTH_BYPASS=true` while `NODE_ENV=production`, or if the bypass is enabled without a valid `DEV_USER_ID`. Never hardcode the dev user ID in source; never ship the bypass to a real beta.
- **Single error contract:** `{ error: { code, message, details } }`. No stack traces to users. Never log raw check-in notes, AI prompts, or full AI output — only IDs, statuses, timing, and safe error codes.
- **Budget is $0.** Free-tier limits apply (Render sleeps after idle; Workers AI has a daily neuron allocation); verify current limits before any paid/dependency choice.

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
- **How to verify behavior:** `e2e/ai-fixtures/` eval set run via `npm run test` — direct pattern, indirect, insufficient data, conflicting signals, repeated boundary-pressure, no-signal, malformed AI JSON, provider timeout/failure, and user-isolation cases.
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
