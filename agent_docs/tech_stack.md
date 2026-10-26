# Tech Stack

Last verified: 2026-09

## Stack

| Area | Choice | Notes |
|------|--------|-------|
| Frontend | React + Vite + Zustand + CSS | Stays close to the user's PERN skills; features own their UI (`client/src/features/<feature>/{api.js,components,hooks,pages,store.js}`). |
| Backend | Node.js 24 LTS + Express + REST + Zod | Modules by responsibility (`server/src/modules/<domain>/{routes,controller,service,repository,validation}`); cross-domain capabilities in `server/src/services/`. |
| Database | PostgreSQL via Neon (live); Supabase was the TechDesign pick | Access via `pg` + parameterized SQL; no ORM, no Supabase JS client for core access. Migrations are SQL files tracked in Git (`server/src/db/migrations/`, applied by `npm run db:migrate --workspace=server`). Test suites own distinct user IDs (parallel vitest) with 30s timeouts for sleepy free compute. |
| Auth | Development env bypass + Clerk free Hobby for beta | Bypass is server-side env-gated (`NODE_ENV=development` + `DEV_AUTH_BYPASS=true` + `DEV_USER_ID`). With `CLERK_SECRET_KEY` set, `clerkMiddleware()` verifies sessions and `auth_identities` (003) maps Clerk subs to internal UUIDs — no existing table changed. Production boot fails with bypass on or without the Clerk secret. Client sends a fresh Bearer token per call; no Clerk keys in tests. |
| Styling | CSS Modules/plain CSS + design tokens | Design tokens in `client/src/styles/tokens.css`; no Tailwind, no component library. |
| Deployment | Render Web Service (API) + Render Static Site (client) | No Cloudflare account exists, so Pages/Workers AI are out: static blueprint is `type: web` + `runtime: static` in `render.yaml`, SPA rewrite `/* → /index.html`. Two-pass URL wiring (`CLIENT_ORIGIN`, `VITE_API_URL`); runbook in `docs/deploy-render.md`. Free tier sleeps after idle; no AI provider configured, so analysis returns its honest fallback. |

## Commands

- Setup: `npm install`
- Dev: `npm run dev`
- Test: `npm run test`
- Typecheck: `node -e "console.log('JavaScript project: no TypeScript typecheck configured')"`
- Lint/format: `npm run lint`
- Build: `npm run build`
- E2E: `npm run test:e2e` (Playwright journeys on scratch ports :5001/:5174 with a dedicated E2E user; needs `DATABASE_URL`; NOT part of `npm run test`)
- Browser/device check: `npm run dev`, then open `http://localhost:5173`; check desktop + responsive mobile. Playwright journeys live under `e2e/`.

## AI Runtime

- Provider/runtime: Groq free tier (OpenAI-compatible chat completions, structured JSON), called only from the Express server (`AI_PROVIDER=groq`, `GROQ_MODEL` env-pinned; no card, $0). No training on API data; prompts not retained. OpenAI + Cloudflare adapters dormant.
- Model can see:
  - Public: none.
  - User-owned: the user's own recent check-ins for the analysis window, deterministic pattern candidate signals, compact aggregate metrics, optional user notes needed for context.
  - Never send: secrets, API tokens, DB connection strings, other users' data, unrelated account info, records outside the analysis window.
- Tools/actions: read only — structured JSON text output; no tools, no external actions.
- Approval gates: none in MVP; rate-limit `POST /api/insights/analyze`. No client access to AI credentials.
- Retention/training setting to verify: Workers AI data-usage policy (free allocation is ~10,000 neurons/day; model availability changes — verify before relying on a model).
- Fallback: neutral "Insights are temporarily unavailable" plus the last successful insight; user check-ins are never blocked.

## Important Patterns

- Data fetching: shared request helper under `client/src/lib/api/`; feature modules call it via their public `api.js` — do not duplicate request configuration.
- State management: Zustand, small feature-scoped stores only (check-in draft, insight/reminder UI state, dev user context, dashboard data). No giant global server-state store.
- Forms/validation: client validation for UX; Zod on the server for every write request and for AI structured output.
- Error handling: single contract `{ error: { code, message, details } }`; no stack traces to users.
- Logging/monitoring: only IDs, status codes, timing, and safe error codes — never raw notes, prompts, or full AI output.