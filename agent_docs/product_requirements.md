# Product Requirements

Use this as the short build-facing version of the PRD. Do not paste the entire PRD unless the project is complex.

## Users

- Primary user: anyone who feels emotionally drained by relationships or interactions — including lonely people, students, and overthinkers.
- Main problem: they keep feelings to themselves, struggle to notice recurring emotional triggers, and overextend themselves for others without recognizing the pattern.

## Must-Have Features

- Daily Check-In — User submits mood/energy/drain scores, emotion and context tags, optional note; the record is stored and previous check-ins are viewable.
- Burnout/Pattern Detection + Supportive Reminders — Deterministic rules over recent check-ins (energy/drain trends, repeated contexts/tags) surface candidate signals; supportive, non-commanding reminders appear when a rule matches.
- Personal Insights — AI turns the user's own check-in data and pattern evidence into structured, understandable explanations (observations, confidence, suggestions), validated by a server-side Zod schema.
- Boundary Awareness — The system highlights recurring situations where the user may be overextending or repeatedly drained; phrasing stays observational and the user decides what to do.

## Nice-To-Have Features

- Advanced trend views

## Out Of Scope

- AI Chat Companion
- Social/community features
- Advanced integrations

## Success Signals

- 10–20 user validation cohort completes the check-in → insight journey in month 1.
- Users report better understanding of their emotions or recurring patterns they had not noticed before (surveys, insight-usefulness feedback, repeat check-ins).