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

## Notes

### Implementation Details
- **URL Pattern**: React Router pattern is `/:username` (no @ prefix due to React Router v7 limitation)
- **Display Format**: Username displayed as `@username` in UI
- **Legacy Support**: Old `/user/:userId` URLs automatically redirect to new username-based URLs
- **Visibility Logic**: Public profiles support visibility filtering (public/private/unlisted)
- **Timeline Stats**: Aggregated counts (events, views) calculated client-side from timeline metadata
- **Owner Detection**: Compares `firebaseUser.uid === user.id` to determine owner status
- **Responsive Behavior**: Navigation rail hidden on mobile (`md:flex`), theme toggle duplicated in header for mobile access
