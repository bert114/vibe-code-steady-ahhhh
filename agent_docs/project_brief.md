# Project Brief

## Product

- One-line vision: A calm wellness web app that helps users understand emotions, notice draining patterns, and build boundary awareness.
- Target users: Lonely people, students, overthinkers, and people emotionally drained by relationships or interactions.
- Primary user outcome: Record a daily check-in and receive understandable, evidence-based insight into recurring emotional and draining patterns without feeling overwhelmed.

## Scope

- Must ship:
  - Daily Check-In
  - Burnout/pattern detection and supportive reminders (deterministic rules first)
  - Personal Insights (AI explains pattern evidence, never decides for the user)
  - Boundary Awareness
- Not in v1:
  - AI Chat Companion
  - Social/community features
  - Advanced integrations

## Principles

- Solve the user story before adding polish.
- Prefer boring, maintainable choices — JavaScript, no ORM, deterministic logic over cleverness.
- Keep generated docs short and current.
- Verify user-visible work in the real product surface (desktop + mobile).

## AI Position

- AI is used for: turning deterministic pattern signals into user-facing insight text and supportive reminders.
- AI is not used for: medical or psychological diagnosis, judging or labeling third parties, deciding user actions, or burnout classification on its own.
- Human approval required for: none in MVP — AI output is read-only explanation of the user's own data (no send/delete/deploy/email surface).