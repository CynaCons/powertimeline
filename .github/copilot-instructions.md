# Copilot Instructions for Chronochart

## Project Overview

Chronochart is a timeline visualization component with SVG rendering and HTML content integration. The project emphasizes accessibility, theming, and modular architecture.

## Project Conventions
  - The user communicates you requests and feedback. You incorporate them in PLAN.md in the form of checklist items, categorized by features. 
  - You then implement the features and checklist elements as per user request.
  - Do not stop, until the user request is complete
  - Only request user approval when initiating a new major development phaseor a new top-level PLAN section not yet approved. Within an already approved phase, proceed autonomously through minor PLAN checklist steps without interim confirmations.
  - Update `PLAN.md` in realtime whenever something is ongoing or completed.
  - Do not ask the user to choose among technical implementation options; make engineering decisions yourself and surface them as completed or in-progress checklist items in `PLAN.md`.
  - If instructions are not clear, then say so and start a discussion to clarify

- Tests
  - `tests/*.spec.ts` — Playwright suite (layout, axis, a11y, density, performance).

