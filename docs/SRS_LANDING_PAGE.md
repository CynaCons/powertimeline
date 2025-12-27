# SRS: Landing Page
Version: 1.1 | Date: 2025-12-27

## Overview
Public landing experience for PowerTimeline showcasing hero messaging, search, discovery CTAs, and simplified navigation for unauthenticated visitors.

## Changelog
- **v1.1 (2025-11-30):** Simplified landing page per v0.5.18 requirements
  - Changed "Explore Examples" → "Explore Public Timelines"
  - Changed "Go to My Timelines" → "Create Timeline"
  - Removed example timelines gallery section
  - Moved "View All Timelines" to final CTA section
  - Removed "Documentation" footer link

## Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-LAND-001 | Landing shows hero headline "Where events become understanding" on /. | H1 text matches, visible on page load | LandingPage.tsx | tests/home/71-home-page-basic.spec.ts, tests/production/01-smoke.spec.ts |
| CC-REQ-LAND-002 | TopNavBar shows logo+browse+sign-in and logo navigates home. | Logo, Browse, Sign In buttons visible; logo links to / | LandingPage.tsx | tests/home/71-home-page-basic.spec.ts, tests/e2e/01-full-user-journey.spec.ts |
| CC-REQ-LAND-003 | Browse CTAs (Explore Public Timelines, View All) go to /browse. | Buttons navigate to /browse route | LandingPage.tsx | — |
| CC-REQ-LAND-004 | Create Timeline CTA routes authed users to /browse, unauthed to /login. | Navigate("/browse") if user, else navigate("/login") | LandingPage.tsx | — |
| CC-REQ-LAND-005 | Search input under hero submits Enter to /browse?search={query}. | onSubmit navigates to /browse?search={input.value} | LandingPage.tsx | — |
| CC-REQ-LAND-006 | "/" key focuses search when not in form fields. | Keyboard listener focuses search input on "/" press | LandingPage.tsx | — |
| CC-REQ-LAND-007 | ~~Example timelines gallery removed (v0.5.18)~~ | Gallery section no longer in DOM | LandingPage.tsx | — |
| CC-REQ-LAND-008 | ~~Gallery skeleton cards removed (v0.5.18)~~ | No skeleton components in gallery | LandingPage.tsx | — |
| CC-REQ-LAND-009 | ~~Example cards removed (v0.5.18)~~ | No example cards rendered | LandingPage.tsx | tests/production/01-smoke.spec.ts |
| CC-REQ-LAND-010 | ~~Example card tooltips removed (v0.5.18)~~ | No tooltip components attached to cards | LandingPage.tsx | — |
| CC-REQ-LAND-011 | ~~Example card navigation removed (v0.5.18)~~ | Cards not clickable, no navigation handlers | LandingPage.tsx | tests/e2e/01-full-user-journey.spec.ts |
| CC-REQ-LAND-012 | Hero contains demo placeholder card with timeline icon and coming-soon text. | Card visible with icon + "coming soon" text | LandingPage.tsx | — |
| CC-REQ-LAND-013 | Audience grid lists six personas with hover lift styling. | 6 persona cards, hover:scale-105 applied | LandingPage.tsx | — |
| CC-REQ-LAND-014 | Feature trio cards present Infinite Zoom, Fork & Improve, Share & Verify. | 3 feature cards with correct titles and descriptions | LandingPage.tsx | — |
| CC-REQ-LAND-015 | Footer shows tagline plus mailto and GitHub links (no Documentation). | Footer contains tagline, mailto, GitHub link; no docs link | LandingPage.tsx | — |
| CC-REQ-LAND-016 | Primary hero CTA text is "Explore Public Timelines". | Button text matches exactly | LandingPage.tsx | — |
| CC-REQ-LAND-017 | Secondary hero CTA text is "Create Timeline" when authenticated. | Button text = "Create Timeline" when user !== null | LandingPage.tsx | — |
| CC-REQ-LAND-018 | Secondary hero CTA text is "Sign In" when not authenticated. | Button text = "Sign In" when user === null | LandingPage.tsx | — |
| CC-REQ-LAND-019 | Final CTA section contains single "View All Timelines" button. | Button visible, links to /browse | LandingPage.tsx | — |

## Test Coverage
| Requirement | Test File | Test Case |
|-------------|-----------|-----------|
| CC-REQ-LAND-001 | tests/home/71-home-page-basic.spec.ts | T71.1 Landing page loads |
| CC-REQ-LAND-001 | tests/production/01-smoke.spec.ts | landing hero renders without errors |
| CC-REQ-LAND-002 | tests/home/71-home-page-basic.spec.ts | T71.5 Logo is visible |
| CC-REQ-LAND-002 | tests/e2e/01-full-user-journey.spec.ts | PHASE1: Verify TopNavBar components |
| CC-REQ-LAND-003 | — | — |
| CC-REQ-LAND-004 | — | — |
| CC-REQ-LAND-005 | — | — |
| CC-REQ-LAND-006 | — | — |
| CC-REQ-LAND-007 | — | — |
| CC-REQ-LAND-008 | — | — |
| CC-REQ-LAND-009 | tests/production/01-smoke.spec.ts | landing shows example timeline cards |
| CC-REQ-LAND-010 | — | — |
| CC-REQ-LAND-011 | tests/e2e/01-full-user-journey.spec.ts | PHASE2: Navigate to French Revolution timeline |
| CC-REQ-LAND-012 | — | — |
| CC-REQ-LAND-013 | — | — |
| CC-REQ-LAND-014 | — | — |
| CC-REQ-LAND-015 | — | — |
