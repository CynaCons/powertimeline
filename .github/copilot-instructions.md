# Copilot Instructions for Chronochart

## Project Overview

Chronochart is a React timeline visualization component with SVG rendering and HTML content integration. The project emphasizes accessibility, theming, and modular architecture.

## Project Conventions
  - The user communicates you requests and feedback. You incorporate them in PLAN.md in the form of checklist items, categorized by features. 
  - You then implement the features and checklist elements as per user request.
  - Do not stop, until the user request is complete
  - Only request user approval when initiating a new major development phaseor a new top-level PLAN section not yet approved. Within an already approved phase, proceed autonomously through minor PLAN checklist steps without interim confirmations.
  - Update `PLAN.md` in realtime whenever something is ongoing or completed.

## Architecture Principles

### Component Architecture
- **Timeline.tsx**: Main orchestrator component handling events, interactions, and accessibility
- **Node.tsx**: Individual event cards with HTML content via SVG foreignObject
- **Axis.tsx**: Timeline axis with intelligent tick generation
- **RangeBar.tsx**: Visual range indicators for events
- **Hooks Pattern**: Custom hooks for lanes (`useLanes`), ticks (`useAxisTicks`), focus traps, announcements
