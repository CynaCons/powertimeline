# SRS: Landing Page
Version: 1.1 | Date: 2025-11-30

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

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CC-REQ-LAND-001 | Landing shows hero headline "Where events become understanding" on /. | Must | Implemented |
| CC-REQ-LAND-002 | TopNavBar shows logo+browse+sign-in and logo navigates home. | Must | Implemented |
| CC-REQ-LAND-003 | Browse CTAs (Explore Public Timelines, View All) go to /browse. | Must | Implemented |
| CC-REQ-LAND-004 | Create Timeline CTA routes authed users to /browse, unauthed to /login. | Must | Implemented |
| CC-REQ-LAND-005 | Search input under hero submits Enter to /browse?search={query}. | Must | Implemented |
| CC-REQ-LAND-006 | "/" key focuses search when not in form fields. | Should | Implemented |
| CC-REQ-LAND-007 | ~~Example timelines gallery removed (v0.5.18)~~ | ~~Must~~ | Removed |
| CC-REQ-LAND-008 | ~~Gallery skeleton cards removed (v0.5.18)~~ | ~~Could~~ | Removed |
| CC-REQ-LAND-009 | ~~Example cards removed (v0.5.18)~~ | ~~Must~~ | Removed |
| CC-REQ-LAND-010 | ~~Example card tooltips removed (v0.5.18)~~ | ~~Could~~ | Removed |
| CC-REQ-LAND-011 | ~~Example card navigation removed (v0.5.18)~~ | ~~Must~~ | Removed |
| CC-REQ-LAND-012 | Hero contains demo placeholder card with timeline icon and coming-soon text. | Could | Implemented |
| CC-REQ-LAND-013 | Audience grid lists six personas with hover lift styling. | Could | Implemented |
| CC-REQ-LAND-014 | Feature trio cards present Infinite Zoom, Fork & Improve, Share & Verify. | Should | Implemented |
| CC-REQ-LAND-015 | Footer shows tagline plus mailto and GitHub links (no Documentation). | Should | Implemented |
| CC-REQ-LAND-016 | Primary hero CTA text is "Explore Public Timelines". | Must | Implemented |
| CC-REQ-LAND-017 | Secondary hero CTA text is "Create Timeline" when authenticated. | Must | Implemented |
| CC-REQ-LAND-018 | Secondary hero CTA text is "Sign In" when not authenticated. | Must | Implemented |
| CC-REQ-LAND-019 | Final CTA section contains single "View All Timelines" button. | Must | Implemented |

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
