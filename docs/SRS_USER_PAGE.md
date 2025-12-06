# SRS: User Profile Page
Version: 1.0 | Date: 2025-12-06

## Overview
Public user profile pages displaying user information and their timeline collections. Accessible via `/:username` URL pattern, supporting both authenticated and non-authenticated visitors with appropriate visibility controls.

## Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CC-REQ-USER-001 | Profile page accessible at /:username URL pattern | Must | Implemented |
| CC-REQ-USER-002 | Non-authenticated users can view any public profile | Must | Implemented |
| CC-REQ-USER-003 | Profile displays username with @ prefix | Must | Implemented |
| CC-REQ-USER-004 | Profile displays member since date (user.createdAt) | Must | Implemented |
| CC-REQ-USER-005 | Profile displays user avatar | Must | Implemented |
| CC-REQ-USER-006 | Profile displays timeline count, total events, and total views | Should | Implemented |
| CC-REQ-USER-007 | Non-owners see only PUBLIC timelines (visibility=public) | Must | Implemented |
| CC-REQ-USER-008 | Private timelines NOT shown to non-owners | Must | Implemented |
| CC-REQ-USER-009 | Profile owners see all their timelines (public + private + unlisted) | Must | Implemented |
| CC-REQ-USER-010 | Profile owners see "Create Timeline" button | Should | Implemented |
| CC-REQ-USER-011 | Profile owners see "Import" button for timeline import | Should | Implemented |
| CC-REQ-USER-012 | Profile owners see edit/delete menu on their timeline cards | Should | Implemented |
| CC-REQ-USER-013 | Timeline cards display title, description, event count, updated date | Must | Implemented |
| CC-REQ-USER-014 | Timeline cards display visibility badge (Public/Private/Unlisted) | Should | Implemented |
| CC-REQ-USER-015 | Timeline cards display owner username badge | Should | Implemented |
| CC-REQ-USER-016 | Timeline cards link to /:username/timeline/:id on click | Must | Implemented |
| CC-REQ-USER-017 | Timelines sortable by: Last Updated, Title, Event Count, Views | Should | Implemented |
| CC-REQ-USER-018 | Sort dropdown only shown when 2+ timelines exist | Could | Implemented |
| CC-REQ-USER-019 | 404/redirect to home if username doesn't exist | Must | Implemented |
| CC-REQ-USER-020 | Empty state shown if user has no public timelines (non-owner view) | Must | Implemented |
| CC-REQ-USER-021 | Empty state shown if user has no timelines at all (owner view) | Must | Implemented |
| CC-REQ-USER-022 | Error state with retry button on load failure | Should | Implemented |
| CC-REQ-USER-023 | Loading state shows skeleton cards during data fetch | Should | Implemented |
| CC-REQ-USER-024 | Legacy /user/:userId URLs redirect to /:username | Should | Implemented |
| CC-REQ-USER-025 | Navigation rail shows PowerTimeline logo linking to /browse | Must | Implemented |
| CC-REQ-USER-026 | Header shows PowerTimeline logo linking to landing page (/) | Must | Implemented |
| CC-REQ-USER-027 | Authenticated users see UserProfileMenu in header | Should | Implemented |
| CC-REQ-USER-028 | Theme toggle button available in nav rail (desktop) and header (mobile) | Should | Implemented |
| CC-REQ-USER-029 | Timeline grid scrollable with max-height of 600px | Could | Implemented |
| CC-REQ-USER-030 | Responsive layout: 1 column (mobile), 2 columns (md), 3 columns (lg+) | Should | Implemented |

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

### v0.5.32 Public Access Implementation
The following requirements are planned for v0.5.32 to enable public profile access:
- **CC-REQ-USER-002**: Remove authentication requirement from /:username route
- **CC-REQ-USER-007**: Filter timelines to show only `visibility=public` for non-owners
- **CC-REQ-USER-008**: Ensure private/unlisted timelines are never exposed to non-owners
- **CC-REQ-USER-020**: Show appropriate empty state when user has no public timelines

### Implementation Details
- **URL Pattern**: React Router pattern is `/:username` (no @ prefix due to React Router v7 limitation)
- **Display Format**: Username displayed as `@username` in UI
- **Legacy Support**: Old `/user/:userId` URLs automatically redirect to new username-based URLs
- **Visibility Logic**: Currently all timelines shown to all viewers (auth-gated); v0.5.32 will add visibility filtering
- **Timeline Stats**: Aggregated counts (events, views) calculated client-side from timeline metadata
- **Owner Detection**: Compares `firebaseUser.uid === user.id` to determine owner status
- **Responsive Behavior**: Navigation rail hidden on mobile (`md:flex`), theme toggle duplicated in header for mobile access
