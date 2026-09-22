# Tester onboarding — Steady-Ahh validation (10–20 users)

## What to tell testers

Steady-Ahh is a calm self-reflection prototype: record a daily check-in, notice
recurring patterns on your dashboard, and manage everything from Settings.
It is **not a medical tool** — insights are observations, never diagnoses.

## Tester path (5 minutes)

1. Open the app URL → sign up (email via Clerk).
2. Record a check-in: mood, energy, drain, a few tags, optional note.
3. Open the Dashboard: recent check-ins, patterns, reminders.
4. After 3+ check-ins across a few days, revisit the Dashboard for pattern signals.
5. Settings shows the privacy notice and the delete-my-account control.
6. Share feedback through the dashboard feedback link.

## Known beta limits (say these upfront)

- The server sleeps when idle: the first load can take ~1 minute. Reload once.
- Personal AI insights are **not live yet** — analysis shows an honest
  "temporarily unavailable" notice instead of invented content. Validate the
  check-in → patterns → dashboard loop; AI wording comes in a follow-up.
- 10–20 testers on free tiers: report slowness, don't retry in loops.

## Validation questions (from the PRD)

1. Did Steady-Ahh help you understand your emotions or notice a pattern you
   had not clearly recognized before?
2. Was any wording alarming, confusing, or prescriptive? Quote it.
3. Did check-ins feel quick and calm, or like a chore?
4. Do you trust what happens to your data? What would increase trust?

## Owner checklist before inviting

- [ ] Blueprint deployed, two-pass URLs wired (`CLIENT_ORIGIN`, `VITE_API_URL`).
- [ ] Clerk origins/redirects set; test sign-up works in an incognito window.
- [ ] `/api/health` returns `{"status":"ok","db":"up"}`.
- [ ] Feedback form URL set as `VITE_FEEDBACK_URL` (client redeploys on change).
- [ ] Privacy copy on `/settings` re-read and approved.
- [ ] Deletion verified once end-to-end (create → delete → data gone).
