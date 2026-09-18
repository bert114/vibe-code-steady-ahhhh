# Testing

## Required Before Completion

- [ ] Relevant tests pass.
- [ ] Typecheck/build passes.
- [ ] User-visible changes are checked in a browser or device when applicable.
- [ ] No tests were skipped or weakened without human approval.
- [ ] Evidence is reported in the final response.

## Commands

- All tests: `npm run test`
- Single test: `npm run test` (run from `client/` or `server/` once those packages and their per-package Vitest scripts exist; the root script runs the full suite).
- Typecheck: `node -e "console.log('JavaScript project: no TypeScript typecheck configured')"`
- Lint/format: `npm run lint`
- Build: `npm run build`
- Browser/device check: `npm run dev` → `http://localhost:5173`; Playwright critical journey lives under `e2e/`.

## What To Test

| Change type | Minimum check |
|-------------|---------------|
| Pure logic | Unit test — pattern rules (`server/src/services/patterns/`), scoring, helpers |
| API/data flow | Supertest integration: route validation, repository queries, ownership checks, rate limiting, dev auth bypass + production guard |
| UI behavior | RTL + browser/device check: check-in form validation, Zustand store updates, insight load/error states |
| Auth, billing, migrations, deployment | Human review plus focused test |
| AI/tool behavior | AI eval fixtures (`e2e/ai-fixtures/`) + data-boundary check |

Cover user-isolation explicitly: a user must never read or mutate another user's records (`req.user.id` scoping).

## AI Checks

- Direct prompt: obvious-pattern fixture → structured insight with evidence; correct shape per the server's Zod schema.
- Bad/indirect prompt: AI must stay observational — no diagnosis, no commands, no third-party labeling; returns structured output only.
- Auth-required prompt: extraction normalized to the authenticated user; `/api/insights/analyze` is rate-limited; no cross-user data.
- Failure case: provider timeout/quota/malformed JSON → Z-schema rejection → neutral 'Insights are temporarily unavailable' plus last successful insight; check-ins unaffected.
- Tool/action check: AI has no tools and triggers no external actions; only the analysis endpoint calls the provider.
- Data check: logs must not contain raw check-in notes, prompts, or full AI output; AI sends only the user's own in-window compact data.