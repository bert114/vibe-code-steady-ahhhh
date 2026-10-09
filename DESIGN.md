---
name: Steady-Ahh
description: A calm place to notice emotions, draining patterns, and boundaries.
colors:
  homepage-blue: "#47718a"
  homepage-blue-deep: "#3c6379"
  homepage-blue-light: "#e5f0f3"
  homepage-paper: "#edf3f3"
  record-paper: "#fbfaf5"
  deep-ink: "#253b46"
  muted-ink: "#50636b"
  rule: "#cbd7d8"
  button-ink: "#243d4a"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Steady Sans, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 4.6vw, 4.35rem)"
    fontWeight: 300
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Steady Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  title:
    fontFamily: "Steady Sans, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.5rem)"
    fontWeight: 500
rounded:
  button: "12px"
  record: "14px"
  frame: "18px"
  small-control: "999px"
spacing:
  compact: "0.75rem"
  base: "1rem"
  section: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.button}"
    padding: "0.7rem 1rem"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "0.7rem 1rem"
    height: "48px"
  hero-image-placeholder:
    backgroundColor: "{colors.homepage-blue-deep}"
    textColor: "{colors.homepage-blue-light}"
    rounded: "{rounded.record}"
    minimumHeight: "19rem"
  record-sheet:
    backgroundColor: "{colors.record-paper}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.record}"
    padding: "1.5rem clamp(1.2rem, 2.8vw, 2rem) 1.35rem"
---

# Design System: Steady-Ahh

## Overview

**Creative North Star: “A Quiet Moment”**

The homepage follows the reference’s human-centered composition: an open blue frame, restrained navigation, and a large portrait area balanced by spacious editorial copy. The person-led image gives the first screen a warm, human focus. A clearly synthetic paper record appears below the hero to show how a check-in can lead to evidence and an optional reflection.

This direction applies to the public landing page. The check-in, dashboard, insights, and settings screens retain their existing application styling. The product-wide commitments remain calm first, evidence before explanation, user choice, and privacy.

**Key Characteristics:**

- A thin, rounded blue frame around the opening scene.
- A portrait-led hero with open space for readable copy.
- Check-in evidence presented after the hero, separate from the welcome.
- Plain language and visible user choice.

## Colors

The landing palette pairs a muted blue field with pale paper surfaces and dark, readable ink.

### Primary
- **Open Blue**: The large homepage hero surface and navigation background.
- **Deep Blue**: Interactive states and emphasized links on blue.
- **Pale Blue**: Secondary text and controls on the hero.

### Neutral
- **Cool Paper**: The page background around the hero and lower sections.
- **Record Paper**: The synthetic check-in sheet.
- **Deep Ink**: Primary text on paper surfaces.
- **Muted Ink**: Supporting text on paper surfaces.
- **Fine Rule**: Dividers between evidence, reflection, and process rows.
- **Soft White**: Hero text, primary hero button, and the thin frame line.
- **Button Ink**: Text on the white primary button.

**The Evidence Contrast Rule.** Keep the record sheet light against the blue hero so the sample remains easy to scan and its labels remain legible.

## Typography

**Display Font:** Steady Sans (self-hosted Supreme Light, with system sans-serif fallback)  
**Body Font:** Steady Sans (self-hosted Supreme Regular / Medium / Bold, with system sans-serif fallback)

**Character:** Clean, open sans-serif lettering carries the calm editorial direction. Use light display weight for the promise and stronger weights only for navigation, labels, and actions.

### Hierarchy
- **Display** (300, responsive 2.8–4.35rem, 0.98 line height): The homepage promise.
- **Title** (500, responsive 1.8–2.5rem): Homepage section headings.
- **Body** (400, 1rem, 1.7 line height): Introductory and explanatory copy.
- **Label** (700, 0.72rem, 0.055em, uppercase): Evidence and record section labels.

**The Plain Voice Rule.** Let concise, direct wording carry warmth; avoid clinical certainty and performative intimacy.

## Layout

The desktop hero and navigation span the available viewport width with consistent outer gutters instead of a narrow max-width cap. The headline sits at left and the portrait area at right inside the framed blue hero; supporting copy and the check-in action sit beneath the portrait. The current portrait area is an intentional labeled placeholder for the future image. At tablet and mobile widths, hero elements stack in reading order and actions become full width on mobile. Sections below the hero retain a comfortable reading width capped at 1120px. The synthetic field record follows the hero in its own spacious example section. Explanatory steps remain a ruled list rather than a grid of cards.

## Elevation & Depth

The landing page is flat. Contrast between the blue hero, pale page, and paper record establishes hierarchy; fine borders separate content. No shadows are used.

## Shapes

The hero frame has softly rounded outer corners, the evidence sheet has a modest rounded edge, and action buttons use a restrained radius. The compact navigation action may use a pill shape. Keep large content surfaces calm and simple.

## Components

### Buttons
- **Shape:** Gently rounded (12px); the compact navigation action is pill-shaped.
- **Primary:** White fill with dark text, 48px minimum height, and balanced horizontal padding.
- **Secondary:** Transparent fill with a pale outline and white text on the blue hero.
- **Hover / Focus:** Subtle fill change; preserve a clearly visible keyboard outline.

### Cards / Containers
- **Corner Style:** 14px for the record sheet; 18px for the outer hero frame.
- **Background:** Paper surface against the blue hero.
- **Shadow Strategy:** Flat; borders and contrast define the surface.
- **Internal Padding:** Responsive horizontal padding, with compact padding on mobile.

### Navigation
- **Style:** Brand at left and two relevant actions at right on desktop. On mobile, the two actions remain clearly separated and comfortably tappable.
- **States:** Light text on blue, underlined section link, outlined check-in action, and visible focus.

### Hero Image Placeholder
Reserve a generous image area on the right side of the desktop hero. Until the original portrait is available, show a restrained outlined placeholder with a clear accessible label. Do not let the temporary placeholder look like a finished illustration or fabricated user photo.

### Field Record
Place the synthetic check-in, rule observations, and reflection below the hero in one readable sheet. Label the example synthetic, and never make sample data resemble a testimonial or a real user claim.

## Do's and Don'ts

### Do:
- **Do** keep the check-in route and “See how it works” action easy to find.
- **Do** distinguish recorded feelings, repeated evidence, and optional reflection.
- **Do** keep privacy controls and the non-diagnostic boundary visible in plain language.
- **Do** preserve comfortable reading widths, keyboard focus, and reduced-motion support.

### Don't:
- **Don't** present a pattern as a diagnosis or a certainty.
- **Don't** use urgency, streaks, guilt, or pressure to drive check-ins.
- **Don't** invent social proof, expert endorsement, or unsupported product claims.
- **Don't** crowd the hero with decorative wellness imagery or competing calls to action.
