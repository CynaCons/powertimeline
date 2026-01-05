# SRS: User Profile Page
Version: 1.0 | Date: 2025-12-27

## Overview
Public user profile pages displaying user information and their timeline collections. Accessible via `/:username` URL pattern, supporting both authenticated and non-authenticated visitors with appropriate visibility controls.

## Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-USER-001 | Profile page accessible at /:username URL pattern | Route configured, username param parsed correctly | UserProfilePage.tsx | — |
| CC-REQ-USER-002 | Non-authenticated users can view any public profile | No auth check, visibility filter applied | UserProfilePage.tsx:27-29 | — |
| CC-REQ-USER-003 | Profile displays username with @ prefix | @{username} visible in profile header | UserProfilePage.tsx | — |
| CC-REQ-USER-004 | Profile displays member since date (user.createdAt) | "Member since {date}" shown in profile | UserProfilePage.tsx | — |
| CC-REQ-USER-005 | Profile displays user avatar | Avatar component rendered with user image | UserProfilePage.tsx | — |
| CC-REQ-USER-006 | Profile displays timeline count, total events, and total views | Stats aggregated and displayed correctly | UserProfilePage.tsx | — |
| CC-REQ-USER-007 | Non-owners see only PUBLIC timelines (visibility=public) | Timelines filtered by visibility=public for non-owners | UserProfilePage.tsx | — |
| CC-REQ-USER-008 | Private timelines NOT shown to non-owners | Private/unlisted timelines excluded from non-owner view | UserProfilePage.tsx | — |
| CC-REQ-USER-009 | Profile owners see all their timelines (public + private + unlisted) | All timelines shown when user.id matches firebaseUser.uid | UserProfilePage.tsx | — |
| CC-REQ-USER-010 | Profile owners see "Create Timeline" button | Button visible only when isOwner=true | UserProfilePage.tsx | — |
| CC-REQ-USER-011 | Profile owners see "Import" button for timeline import | Import button visible only when isOwner=true | UserProfilePage.tsx | — |
| CC-REQ-USER-012 | Profile owners see edit/delete menu on their timeline cards | Menu (3-dot) visible on cards when isOwner=true | UserProfilePage.tsx | — |
| CC-REQ-USER-013 | Timeline cards display title, description, event count, updated date | All metadata fields rendered on TimelineCard | UserProfilePage.tsx | — |
| CC-REQ-USER-014 | Timeline cards display visibility badge (Public/Private/Unlisted) | Badge component shows correct visibility status | UserProfilePage.tsx | — |
| CC-REQ-USER-015 | Timeline cards display owner username badge | Owner badge shows @{username} | UserProfilePage.tsx | — |
| CC-REQ-USER-016 | Timeline cards link to /:username/timeline/:id on click | Card click navigates to correct timeline route | UserProfilePage.tsx | — |
| CC-REQ-USER-017 | Timelines sortable by: Last Updated, Title, Event Count, Views | Sort dropdown with 4 options, timelines re-sorted on change | UserProfilePage.tsx | — |
| CC-REQ-USER-018 | Sort dropdown only shown when 2+ timelines exist | Dropdown hidden when timelines.length < 2 | UserProfilePage.tsx | — |
| CC-REQ-USER-019 | 404/redirect to home if username doesn't exist | User fetch failure triggers redirect or 404 page | UserProfilePage.tsx | — |
| CC-REQ-USER-020 | Empty state shown if user has no public timelines (non-owner view) | Empty state component shown when filtered timelines empty | UserProfilePage.tsx | — |
| CC-REQ-USER-021 | Empty state shown if user has no timelines at all (owner view) | Empty state component shown when timelines.length = 0 | UserProfilePage.tsx | — |
| CC-REQ-USER-022 | Error state with retry button on load failure | Error component with retry callback shown on fetch error | UserProfilePage.tsx | — |
| CC-REQ-USER-023 | Loading state shows skeleton cards during data fetch | Skeleton components shown while loading=true | UserProfilePage.tsx | — |
| CC-REQ-USER-024 | Legacy /user/:userId URLs redirect to /:username | Route redirect configured in router | UserProfilePage.tsx | — |
| CC-REQ-USER-025 | Navigation rail shows PowerTimeline logo linking to /browse | Nav rail logo links to /browse route | UserProfilePage.tsx | — |
| CC-REQ-USER-026 | Header shows PowerTimeline logo linking to landing page (/) | Header logo links to / route | UserProfilePage.tsx | — |
| CC-REQ-USER-027 | Authenticated users see UserProfileMenu in header | UserProfileMenu rendered when user authenticated | UserProfilePage.tsx | — |
| CC-REQ-USER-028 | Theme toggle button available in nav rail (desktop) and header (mobile) | Toggle button visible, persists theme preference | UserProfilePage.tsx | — |
| CC-REQ-USER-029 | Timeline grid scrollable with max-height of 600px | Grid container max-h-[600px] with overflow-y-auto | UserProfilePage.tsx | — |
| CC-REQ-USER-030 | Responsive layout: 1 column (mobile), 2 columns (md), 3 columns (lg+) | Grid cols change with breakpoints: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 | UserProfilePage.tsx | — |

| CC-REQ-USER-031 | Timeline cards keyboard accessible | Cards focusable via Tab with Enter/Space activation | UserProfilePage.tsx | — |
| CC-REQ-USER-032 | Timeline cards show visible focus styling | Focus ring visible with page accent color | UserProfilePage.tsx | — |

## Visual Design & Accessibility

### Visual Design Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-USER-VIS-001 | Timeline cards SHALL use consistent styling with depth | • Cards use `.timeline-card` CSS class or equivalent<br>• Resting state: `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`<br>• Border: 1px solid with theme-aware color<br>• Border radius: 12px (`rounded-xl`)<br>• Padding: 20-24px (`p-5` or `p-6`) | UserProfilePage.tsx | — |
| CC-REQ-USER-VIS-002 | Timeline cards SHALL provide satisfying hover feedback | • Hover: `transform: translateY(-2px)`<br>• Hover shadow: `0 10px 30px -10px rgba(0,0,0,0.15)`<br>• Transition: 200ms ease<br>• Cursor: pointer | UserProfilePage.tsx | — |
| CC-REQ-USER-VIS-003 | Profile header SHALL stack vertically on mobile | • Profile avatar, username, stats stack in single column<br>• Mobile breakpoint: < 768px (`md:flex-row`)<br>• Desktop: horizontal layout with avatar left-aligned | UserProfilePage.tsx | — |
| CC-REQ-USER-VIS-004 | Profile form SHALL have maximum width constraint | • Form container: `max-w-2xl` (672px)<br>• Prevents form from stretching too wide<br>• Centered on page (`mx-auto`) | UserProfilePage.tsx | — |

### Accessibility Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-USER-ACC-001 | Timeline cards SHALL be keyboard accessible (duplicate of USER-031) | • Cards focusable via Tab (`tabIndex={0}`)<br>• Enter/Space keys activate navigation (`onKeyDown`)<br>• Role announced as link (`role="link"`)<br>• No keyboard trap inside card | UserProfilePage.tsx | — |
| CC-REQ-USER-ACC-002 | Timeline cards SHALL show visible focus styling (duplicate of USER-032) | • Focus ring visible against card background<br>• Uses page accent color (`var(--page-accent)`)<br>• Ring offset prevents clipping (`outline-offset: 2px`)<br>• Meets WCAG 2.1 AA contrast requirements | UserProfilePage.tsx | — |
| CC-REQ-USER-ACC-003 | Icon buttons SHALL have ARIA labels | • All icon-only buttons include `aria-label`<br>• Labels describe action (e.g., "Edit timeline", "Delete timeline")<br>• Apply to kebab menus and toolbar buttons | UserProfilePage.tsx | — |
| CC-REQ-USER-ACC-004 | Skip-to-content link SHALL be available | • Tab key on page load focuses skip link<br>• Enter key navigates to main content (`#main-content`)<br>• Link visually hidden until focused<br>• Positioned at top of page DOM | UserProfilePage.tsx | — |

### Responsive Design Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-USER-RESP-001 | Timeline grid SHALL NOT have nested scroll container | • Remove `max-h-[600px] overflow-y-auto` from grid<br>• Allow natural page scrolling<br>• Prevents nested scroll UX issue | UserProfilePage.tsx:492 | — |
| CC-REQ-USER-RESP-002 | Timeline grid SHALL use responsive columns | • Mobile: 1 column (`grid-cols-1`)<br>• Tablet: 2 columns (`md:grid-cols-2`)<br>• Desktop: 3 columns (`lg:grid-cols-3`)<br>• Grid gap: 24px (`gap-6`) | UserProfilePage.tsx | — |

## Test Coverage
| Requirement | Test File | Test Case |
|-------------|-----------|-----------|
| CC-REQ-USER-001 | — | — |
| CC-REQ-USER-002 | — | — |
| CC-REQ-USER-003 | — | — |
| CC-REQ-USER-004 | — | — |
| CC-REQ-USER-005 | — | — |
| CC-REQ-USER-006 | — | — |
| CC-REQ-USER-007 | — | — |
| CC-REQ-USER-008 | — | — |
| CC-REQ-USER-009 | — | — |
| CC-REQ-USER-010 | — | — |
| CC-REQ-USER-011 | — | — |
| CC-REQ-USER-012 | — | — |
| CC-REQ-USER-013 | — | — |
| CC-REQ-USER-014 | — | — |
| CC-REQ-USER-015 | — | — |
| CC-REQ-USER-016 | — | — |
| CC-REQ-USER-017 | — | — |
| CC-REQ-USER-018 | — | — |
| CC-REQ-USER-019 | — | — |
| CC-REQ-USER-020 | — | — |
| CC-REQ-USER-021 | — | — |
| CC-REQ-USER-022 | — | — |
| CC-REQ-USER-023 | — | — |
| CC-REQ-USER-024 | — | — |
| CC-REQ-USER-025 | — | — |
| CC-REQ-USER-026 | — | — |
| CC-REQ-USER-027 | — | — |
| CC-REQ-USER-028 | — | — |
| CC-REQ-USER-029 | — | — |
| CC-REQ-USER-030 | — | — |

## Change History

- **2026-01-05** - Added visual design and accessibility requirements from visual audit
  - Added CC-REQ-USER-VIS-001 to 004: Card styling, hover effects, profile header stacking, form width
  - Added CC-REQ-USER-ACC-001 to 004: Keyboard accessibility, focus states, ARIA labels, skip link
  - Added CC-REQ-USER-RESP-001 to 002: Remove nested scroll, responsive grid columns
  - References VISUAL_AUDIT_REPORT.md findings
  - Note: USER-ACC-001 and USER-ACC-002 are duplicates of USER-031 and USER-032 (consolidated for clarity)

## Notes

### Implementation Details
- **URL Pattern**: React Router pattern is `/:username` (no @ prefix due to React Router v7 limitation)
- **Display Format**: Username displayed as `@username` in UI
- **Legacy Support**: Old `/user/:userId` URLs automatically redirect to new username-based URLs
- **Visibility Logic**: Public profiles support visibility filtering (public/private/unlisted)
- **Timeline Stats**: Aggregated counts (events, views) calculated client-side from timeline metadata
- **Owner Detection**: Compares `firebaseUser.uid === user.id` to determine owner status
- **Responsive Behavior**: Navigation rail hidden on mobile (`md:flex`), theme toggle duplicated in header for mobile access
