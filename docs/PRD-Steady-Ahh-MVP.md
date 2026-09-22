# Product Requirements Document: Steady-Ahh MVP

## Overview

**Product Name:** Steady-Ahh
**Problem Statement:** Steady-Ahh helps people understand and accept their emotions, recognize patterns that may leave them emotionally drained, and become more aware of personal boundaries.
**MVP Goal:** Validate whether people find the app useful for understanding their emotions and noticing recurring patterns in their experiences.
**Target Launch:** 3 months

## Target Users

**Primary users:** Lonely people, students, overthinkers, and people who feel emotionally drained by relationships or interactions and may struggle with people-pleasing.

### Their Problems

- Keeping feelings to themselves
- Overthinking
- Ignoring emotions
- Feeling drained by interactions or relationships
- Difficulty recognizing recurring emotional triggers
- Overextending themselves for other people

### Current Alternatives

Users may currently:

- Journal
- Talk to someone
- Use another wellness app
- Distract themselves
- Ignore the feeling
- Keep everything to themselves

## Core User Journey

**Feel drained → Open Steady-Ahh → Complete a check-in → Build personal history → AI detects patterns → User receives understandable insight → Supportive reminder appears when appropriate → User decides what to do**

## MVP Features

### 1. Daily Check-In

Users record their emotions and what happened.

**Success criteria**

- User can submit a check-in.
- Emotion and experience data are stored.
- Previous check-ins can be viewed.

### 2. Burnout Detection & Supportive Reminders

The system analyzes accumulated check-in data for possible patterns associated with emotional exhaustion or burnout.

Examples of the output:

- “You've had several draining interactions this week.”
- “You may be taking on more than you have energy for.”
- “Consider taking a break or reconsidering this plan for your own well-being.”

These are **suggestions, not commands or diagnoses**.

### 3. Personal Insights

AI transforms the user's own collected data into simple explanations.

Examples:

- Recurring emotional trends
- Repeated situations associated with negative feelings
- Changes in emotional state over time
- Possible triggers

The app should distinguish observations from suggestions and avoid pretending uncertain observations are facts.

### 4. Boundary Awareness

The system highlights recurring situations where the user may be overextending themselves or experiencing repeatedly draining interactions.

The user remains responsible for deciding whether a boundary should actually be changed.

## Out of Scope for MVP

| Feature                   | Reason                                                                    |
| ------------------------- | ------------------------------------------------------------------------- |
| AI Chat Companion         | Larger product surface; validate the core check-in and insight loop first |
| Social/community features | Not required to validate the personal wellness experience                 |
| Advanced integrations     | Can be considered after initial validation                                |

## Success Metrics

### First Month

**Validation cohort:** 10–20 users.

The main validation question is:

> Do users feel that Steady-Ahh helps them understand their emotions or notice patterns they had not clearly recognized before?

Measure through:

- Short user feedback surveys
- Completed check-ins
- Repeat check-ins
- Feedback on insight usefulness and clarity

## UI/UX Direction

**Design:** Calm, friendly, trustworthy, simple, and not overwhelming.

**Platform:** Desktop-first web application with responsive mobile support.

### Key Screens

1. **Landing Page** — Explain the product and establish trust.
2. **Dashboard** — Recent check-ins, insights, patterns, and reminders.
3. **Check-In** — Record emotions and experiences.
4. **Insights** — Understand personal patterns and trends.
5. **Settings/Profile** — Account and privacy controls.

### Design Principles

- Calm first
- Clear and understandable
- User remains in control
- Minimal visual clutter
- Accessible interactions
- Trustworthy presentation

## Technical Requirements

**Stack:** PERN
**Language:** JavaScript
**TypeScript:** Not used
**Class constructors:** Not used
**Platform:** Web
**Responsive:** Desktop + mobile

### Performance

- Fast loading
- Responsive interactions
- Avoid unnecessary API calls and client-side work

### Accessibility

- Clear labels
- Keyboard navigation
- Visible focus states
- Good contrast
- Semantic structure
- Clear error messages

### Maintainability

- Simple architecture
- Avoid unnecessary abstractions
- Keep frontend/backend responsibilities clear
- Test critical paths

## AI Requirements

### AI Purpose

AI analyzes the user's own wellness data and turns it into understandable information.

### Data Access

AI should receive only the minimum user-owned check-in and related wellness data required for analysis.

### AI Output

Prefer structured output containing information such as:

- Observed pattern
- Supporting data
- Uncertainty/confidence
- Suggested reflection
- Reminder type

### Important Safety Boundary

**Burnout detection is pattern awareness, not medical diagnosis.**

The app should not present AI output as professional medical or psychological diagnosis.

AI should also avoid making consequential decisions for users. Suggestions remain optional.

### AI Verification

Before launch, test:

- Clear pattern cases
- Ambiguous cases
- Insufficient-data cases
- AI failure cases
- Data-isolation/authentication cases
- Changing patterns over time

## Constraints

**Budget:** Free only
**Timeline:** 3 months
**Team:** Solo project

Free-tier hosting and AI services should be used during validation, with current provider limits and privacy policies verified before implementation.

## Major Risks

| Risk                                           | Mitigation                                                   |
| ---------------------------------------------- | ------------------------------------------------------------ |
| AI gives misleading insights                   | Structured outputs, uncertainty language, evaluation cases   |
| Users interpret burnout detection as diagnosis | Explicit product wording and UI boundaries                   |
| Emotional data is mishandled                   | Data minimization, secure storage, strict AI data boundaries |
| MVP becomes too large                          | Keep focus on four core features                             |
| Users don't find insights useful               | Early testing with 10–20 users                               |
| UI feels overwhelming                          | Simple hierarchy and responsive/accessibility testing        |

## MVP Definition of Done

- [ ] Daily Check-In works
- [ ] Burnout-pattern detection works
- [ ] Supportive reminders work
- [ ] Personal Insights work
- [ ] Boundary Awareness works
- [ ] AI output is structured and validated
- [ ] AI failure/insufficient-data states are handled
- [ ] Burnout messaging is not presented as diagnosis
- [ ] Responsive desktop/mobile experience works
- [ ] Basic privacy and account controls are implemented
- [ ] 10–20 users can test the complete journey
- [ ] User feedback can be collected
- [ ] No critical bugs remain

## Next Steps

1. Create the Technical Design Document.
2. Define the PostgreSQL data model.
3. Define Express API routes.
4. Define React screens and state flow.
5. Select and verify an AI provider that fits the free-only constraint.
6. Build the MVP.
7. Test with 10–20 users.
8. Use the validation results to determine the next version.

---

## Handoff Context

- Stage: prd
- App name: Steady-Ahh
- User level: C
- Target platform: web
- Budget: free only
- Timeline: 3 months
- Source files: research-Steady-Ahh.md → PRD-Steady-Ahh-MVP.md

```json
{
  "schemaVersion": 1,
  "documentType": "prd",
  "appName": "Steady-Ahh",
  "oneLiner": "A calm wellness web app that helps users understand emotions, notice draining patterns, and build boundary awareness.",
  "targetUsers": "Lonely people, students, overthinkers, and people emotionally drained by relationships or interactions.",
  "phase": "Foundation",
  "mustHave": [
    "Daily Check-In",
    "Burnout Detection & Supportive Reminders",
    "Personal Insights",
    "Boundary Awareness"
  ],
  "niceToHave": ["Advanced trend views"],
  "notInMvp": ["AI Chat Companion", "Social/community features"],
  "successMetrics": [
    "10–20 user validation cohort in month 1",
    "Users report better understanding of emotions or recurring patterns"
  ]
}
```
