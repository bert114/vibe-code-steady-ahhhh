# Deploy runbook — Steady-Ahh validation (Render free tier, $0)

Target: API on a free Web Service + client on a free Static Site + existing
Neon Postgres. Code/config is committable; the steps below are console clicks
only the repo owner can do.

## 0. Prereqs (owner)

- GitHub repo pushed with `render.yaml` at root.
- Clerk application created (free Hobby): copy the Publishable Key and Secret Key.
- Neon `DATABASE_URL` at hand (the validation database; Render Postgres not needed).
- Tester feedback form URL (any external form), optional for the first deploy.

## 1. Create the Blueprint

1. Render Dashboard → New → Blueprint → connect the repo (branch with `render.yaml`).
2. Name review: `steady-ahh-api` (web, free) + `steady-ahh-client` (static, free).
3. Fill `sync: false` secrets when prompted (values below); the rest has defaults.

## 2. Environment values

API (`steady-ahh-api`):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` (default in blueprint) |
| `CLIENT_ORIGIN` | `https://<client>.onrender.com` — exact origin, never `*`. Set AFTER step 3 (two-pass). |
| `DATABASE_URL` | Neon connection string |
| `CLERK_SECRET_KEY` | `sk_live_…` from Clerk → API keys |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_…` from Clerk → API keys |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | `gsk_…` from Groq console (free key, no card; server-side only) |
| `GROQ_MODEL` | pinned model id (default in code; set explicitly to pin it) |
| `AI_ANALYSIS_RATE_LIMIT` | `5` (default in blueprint) |

Client (`steady-ahh-client`, baked at build time — changing a value redeploys):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://<api>.onrender.com/api` — set AFTER step 3, then Manual Deploy |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` (same as API) |
| `VITE_FEEDBACK_URL` | feedback form URL; empty hides the dashboard link |

## 3. Two-pass URL wiring (unavoidable on first deploy)

1. Deploy with placeholder `CLIENT_ORIGIN` / `VITE_API_URL` (or the previous values).
2. Copy the two `*.onrender.com` URLs from the dashboard.
3. Set `CLIENT_ORIGIN` on the API and `VITE_API_URL` on the client; both services redeploy.

## 4. Clerk dashboard (same session)

- Allowed origins / redirect URLs: add both `*.onrender.com` URLs.
- Sign-in URL: `https://<client>.onrender.com/sign-in`; after-sign-in: `/dashboard`.
- No other Clerk features needed (no orgs, no MFA on Hobby).

## 5. Verify the beta (owner smoke test)

```text
GET https://<api>.onrender.com/api/health        → {"status":"ok","db":"up"}
```

Then in a browser: sign up → record a check-in → dashboard shows it →
mark a reminder read → `/settings` shows privacy copy. Free web services
sleep after ~15 min idle: the first request can take ~1 min (expected).

## 6. Rollback

- Bad deploy: Render → service → Rollback to the previous deploy.
- Bad migration: migrations are additive (`003_auth_identities` adds one table);
  there is no down-migration — restore Neon from its dashboard backup instead.
- Auth emergency: rotating `CLERK_SECRET_KEY` in Clerk + Render invalidates all sessions.

## 7. Known free-tier limits (verified 2026-09-19)

- Render free web: sleeps after 15 min idle (~1 min wake), 750 instance hrs/mo,
  ephemeral filesystem (no local state — all state is in Neon).
- Render static: free on CDN; counts toward bandwidth/build minutes.
- Clerk Hobby: $0, 50k monthly retained users/app — 10–20 testers are noise.
- Neon free compute sleeps too: first DB contact can take seconds (the API
  tolerates this; tests carry 30s timeouts for the same reason).
- AI runs on Groq's free tier (no card, no spend): analysis uses an
  OpenAI-compatible chat model with structured JSON output. The 5/hour
  **per-user** rate limit keeps usage far under free quotas. The OpenAI and
  Cloudflare provider files stay dormant as alternatives.
- Tester feedback is an external form (`VITE_FEEDBACK_URL`); empty hides the link.
