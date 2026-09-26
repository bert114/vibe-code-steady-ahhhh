# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people feeling drained by interactions or relationships — lonely, overthinking, people-pleasing — who open Steady-Ahh after a draining experience to record a quick check-in and see recurring patterns without feeling overwhelmed. Validation cohort: 10–20 users. Students and overthinkers are secondary audiences within the same job.

## Product Purpose

Record emotions and what happened, build personal history, surface deterministic pattern evidence, have AI rephrase that evidence into calm understandable insight plus an optional supportive reminder, then let the user decide what to do. Success means users report better understanding of their emotions or notice recurring patterns they had not clearly recognized before. The product is pattern awareness, never medical or psychological diagnosis.

## Positioning

Deterministic pattern and boundary rules gate AI; AI only explains supplied evidence in understandable, supportive language with stated uncertainty. A neighboring product could not truthfully copy this without the testable evidence layer, the observation-vs-suggestion distinction, and the user-in-control wording.

## Operating Context

Desktop-first web application with responsive mobile support. Routes: `/`, `/dashboard`, `/check-in`, `/insights`, `/boundaries`, `/trends`, `/settings`. Core workflow: feel drained → open Steady-Ahh → complete a check-in → build history → system detects patterns → user receives understandable insight → supportive reminder appears when appropriate → user decides. Solo build, twice-weekly sessions, three-month MVP timeline.

## Capabilities and Constraints

Must ship: Daily Check-In (mood/energy/drain 1–5, emotion and context tags, note up to 5000 chars); burnout/pattern signal detection; Personal Insights; Boundary Awareness phrased as Observed/Reflection. Not in MVP: AI Chat Companion, social/community features, advanced integrations.

Quick Check-In: users should be able to begin a check-in from the app shell without leaving the page they are viewing. The entry point is confirmed; its exact interaction and minimum fields remain open. The full Daily Check-In remains the canonical complete check-in flow.

Constraints: $0 free-tier only (Render sleeps after idle, Neon compute sleeps — accepted for validation); JavaScript only, no TypeScript, no class constructors, no ORM (`pg` + parameterized SQL, migrations tracked in Git); AI called only from Express, never from the client; rate-limit `POST /api/insights/analyze`; single error contract `{ error: { code, message, details } }`, no stack traces to users; never log raw check-in notes, AI prompts, or full AI output — only IDs, statuses, timing, safe error codes; every database query scoped by `req.user.id`; development auth bypass fails closed in production; real authentication (Clerk) required before external beta.

Explicitly undecided: boundary-pressure check-in question (default: not asked); provisional burnout-signal thresholds; whether optional free-text notes always go to AI or only with explicit consent; AI provider standing (Groq live key vs honest-fallback status conflict) — record as open, do not invent.

## Brand Commitments

Name Steady-Ahh is binding. Voice: calm, friendly, trustworthy, simple, not overwhelming; user remains in control; minimal visual clutter. No logos, testimonials, press, benchmarks, pricing claims, or brand assets exist to reuse — future work must not fabricate them.

## Evidence on Hand

Real: `docs/PRD-Steady-Ahh-MVP.md`, `docs/TechDesign-Steady-Ahh-MVP.md`, `agent_docs/` briefs, implemented check-in/pattern/AI-insight/boundary/dashboard/trends/settings flows, Playwright critical journeys under `e2e/`, AI eval fixtures under `e2e/ai-fixtures/`. Absent: testimonials, customers, benchmarks, pricing, licensed imagery — must not be invented; demonstration data is authorable at full fidelity and labeled synthetic where a visitor could mistake it for real.

## Product Principles

1. Calm first, user decides — suggestions, never commands or diagnoses.
2. Evidence before explanation — rules find signals, AI explains them with uncertainty stated.
3. Boring and maintainable over clever — explicit logic, small feature stores, clear layer discipline.
4. Privacy as a feature — minimize data, isolate by user, let users view, export, and erase.
5. Validate with 10–20 real journeys before expanding scope.

## Accessibility & Inclusion

Clear labels, keyboard navigation, visible focus states, good contrast, semantic structure, clear error messages. Honor `prefers-reduced-motion`.
