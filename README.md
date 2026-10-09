# Steady-Ahh

A calm wellness web app that helps users understand emotions, notice draining
patterns, and build boundary awareness. Currently in **Foundation** phase
(Weeks 1–2): repo scaffold with React → Express → PostgreSQL wired locally.

## Prereqs

- Node.js 24 LTS, npm
- PostgreSQL locally (a `DATABASE_URL` for your database)

## Local setup

```bash
npm install
cp .env.example server/.env   # then fill in DATABASE_URL + DEV_USER_ID
cp .env.example client/.env   # client reads only VITE_* values
```

Beta deploys to Render via `render.yaml` — runbook: `docs/deploy-render.md`,
tester onboarding: `docs/tester-onboarding.md`. Production needs
`CLERK_SECRET_KEY` (+ publishable keys); without them the server refuses to
boot with `NODE_ENV=production`.

Never commit real `.env` files — only names live in `.env.example`.

## Commands

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Vite client (:5173) + Express API (:5000) via concurrently |
| `npm run test`    | Client Vitest + RTL, then server Vitest + Supertest        |
| `npm run test:e2e`| Playwright journeys (own stack :5001/:5174, needs DB)      |
| `npm run lint`    | oxlint on both workspaces                                  |
| `npm run build`   | Client production build (+ server no-op)                   |
| `npm run typecheck` | Intentional no-op — JavaScript-only, no `tsc`            |

Health check: `GET http://localhost:5000/api/health` →
`{ "status": "ok", "db": "up" | "down" | "unconfigured" }`.

## Rules for agents

Read `AGENTS.md` first, then `docs/PRD-Steady-Ahh-MVP.md`,
`docs/TechDesign-Steady-Ahh-MVP.md`, and `agent_docs/`.
