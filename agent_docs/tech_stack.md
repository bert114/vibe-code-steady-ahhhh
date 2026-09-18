# Tech Stack

Last verified: 2026-09

## Stack

| Area | Choice | Notes |
|------|--------|-------|
| Frontend | React + Vite + Zustand + CSS | Stays close to the user's PERN skills; features own their UI (`client/src/features/<feature>/{api.js,components,hooks,pages,store.js}`). |
| Backend | Node.js 24 LTS + Express + REST + Zod | Modules by responsibility (`server/src/modules/<domain>/{routes,controller,service,repository,validation}`); cross-domain capabilities in `server/src/services/`. |
| Database | PostgreSQL via Supabase Free | Access via `pg` + parameterized SQL; no ORM, no Supabase JS client for core access. Migrations are SQL files tracked in Git. |
| Auth | Development env bypass; real auth required before external beta | Bypass is server-side env-gated: `NODE_ENV=development` + `DEV_AUTH_BYPASS=true` + `DEV_USER_ID`. Server fails startup if bypass is enabled in production or without a valid `DEV_USER_ID`. |
| Styling | CSS Modules/plain CSS + design tokens | Design tokens in `client/src/styles/tokens.css`; no Tailwind, no component library. |
| Deployment | Cloudflare Pages + Render Web Service | Frontend: static Vite build on Cloudflare Pages. Backend: Express on Render Free (expect ~1 min cold start after idle). Free tier budgets are $0. |

## Commands

- Setup: `npm install`
- Dev: `npm run dev`
- Test: `npm run test`
- Typecheck: `node -e "console.log('JavaScript project: no TypeScript typecheck configured')"`
- Lint/format: `npm run lint`
- Build: `npm run build`
- Browser/device check: `npm run dev`, then open `http://localhost:5173`; check desktop + responsive mobile. Playwright journeys live under `e2e/`.

## AI Runtime

- Provider/runtime: Cloudflare Workers AI via REST, called only from the Express server.
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