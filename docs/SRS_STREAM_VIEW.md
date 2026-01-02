# Stream View Requirements (v1.1)

**Last Updated:** 2026-01-02

This document defines requirements for the Stream View feature - a mobile-friendly, vertical timeline viewer that provides an alternative reading experience to the canvas-based timeline editor.

## Overview

Stream View presents timeline events in a scrollable, git-style vertical layout optimized for:
- Mobile devices (touch-friendly, full-screen)
- Quick event scanning (chronological list)
- Event search and filtering
- Minimap navigation

Stream View is now the primary event browsing interface in the editor, replacing the former Events/Outline panel. The NavRail Stream control opens this overlay; the Alt+E panel shortcut has been removed.

## Requirement Table

### Display & Layout

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-DISPLAY-001 | Stream View displays events in chronological vertical layout | • Events sorted by date (oldest first)<br>• Git-style dots connected by vertical rail<br>• Date on left, content on right<br>• Each event shows title, description (truncated 3 lines), time | `src/components/StreamViewer.tsx` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-DISPLAY-002 | Stream View header shows title and event count | • "Stream View" title with icon<br>• Event count displayed<br>• Existing breadcrumbs lifted above overlay via z-index | `src/components/StreamViewerOverlay.tsx:146-160` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-DISPLAY-003 | Existing minimap/breadcrumbs visible above overlay | • Timeline minimap z-index lifted to 1400 when stream view open<br>• Breadcrumbs z-index lifted to 1400<br>• Both remain interactive above the semi-transparent backdrop | `src/App.tsx:646`, `src/pages/EditorPage.tsx:183` | 82-stream-viewer.spec.ts |

### Overlay & Modal

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-OVERLAY-001 | Desktop: Stream View opens as centered modal | • 85% viewport width, max 900px<br>• 85% viewport height<br>• Rounded corners (border-radius: 8px)<br>• Semi-transparent backdrop (rgba(0,0,0,0.6)) | `src/components/StreamViewerOverlay.tsx:233-241` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-OVERLAY-002 | Mobile: Stream View opens as full-screen overlay | • 100vw × 100vh<br>• No rounded corners<br>• Safe area padding for notch/home indicator | `src/components/StreamViewerOverlay.tsx:227-232` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-OVERLAY-003 | Stream View closes on Escape key | • Escape key listener active when overlay open<br>• Prevents default browser behavior<br>• Removes listener on unmount | `src/components/StreamViewerOverlay.tsx:166-179` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-OVERLAY-004 | Stream View closes on backdrop click | • Click on dark backdrop closes overlay<br>• Click inside modal does NOT close<br>• Close button always functional | `src/components/StreamViewerOverlay.tsx:181-186` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-OVERLAY-005 | Close button visible and accessible | • X button in header with aria-label<br>• Hover state for visual feedback<br>• Keyboard accessible | `src/components/StreamViewerOverlay.tsx:291-306` | 82-stream-viewer.spec.ts |

### Navigation & Scrolling

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-SCROLL-001 | Mouse wheel scrolling works in overlay | • Content scrolls with mouse wheel<br>• Scroll container has overflow-y: auto<br>• Body scroll disabled while overlay open<br>• Scroll works on both desktop and mobile | `src/components/StreamViewerOverlay.tsx:316-329` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-SCROLL-002 | Touch scrolling works on mobile | • WebkitOverflowScrolling: touch enabled<br>• Smooth momentum scrolling on iOS<br>• Native scroll behavior on Android | `src/components/StreamViewerOverlay.tsx:324` | 82-stream-viewer.spec.ts |

### Minimap Integration

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-MINIMAP-001 | Existing timeline minimap visible above overlay | • TimelineMinimap lifted to z-index 1400 when stream view open<br>• Minimap remains functional above the overlay backdrop<br>• Shows full timeline event distribution | `src/App.tsx:646`, `src/components/TimelineMinimap.tsx` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-MINIMAP-002 | Stream event selection syncs with timeline | • Clicking event in stream view selects on main timeline<br>• Timeline zooms to selected event via onEventClick callback | `src/App.tsx:382-398` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-MINIMAP-003 | Stream event hover highlights in minimap | - Hovering over event card in Stream View highlights the corresponding minimap marker and canvas card/anchor<br>- Uses same highlighting as normal canvas card hovers<br>- Highlight clears when mouse leaves event card or when Stream View closes | `src/components/StreamViewer.tsx:248-249`, `src/components/StreamViewerOverlay.tsx:528-529`, `src/App.tsx:1394-1395` | 82-stream-viewer.spec.ts (T82.13) |
| CC-REQ-STREAM-PERF-001 | Hover highlight response time under 100ms | - When user hovers over a Stream View event card, the corresponding minimap marker and canvas card/anchor highlight within 100ms<br>- Response time measured from mouseenter event to visual highlight appearing<br>- Performance must remain under 100ms with 100+ events in timeline<br>- No visible lag or "two-phase" highlighting effect | `src/components/StreamViewer.tsx`, `src/components/TimelineMinimap.tsx`, `src/layout/DeterministicLayoutComponent.tsx` | `tests/stream/100-hover-performance.spec.ts` |

### Search & Filter

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-SEARCH-001 | Search bar filters events by title, description, date | • Case-insensitive matching<br>• Filters as user types<br>• Clear button resets search<br>• Shows filtered count | `src/components/StreamViewer.tsx:243-252` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-SEARCH-002 | Search bar sticky at top of event list | • Remains visible while scrolling events<br>• Background matches theme<br>• z-index above event cards | `src/components/StreamViewer.tsx:281-293` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-SEARCH-003 | Empty search results show message | • "No events match" message displayed<br>• Search query echoed in message<br>• Centered in content area | `src/components/StreamViewer.tsx:353-358` | 82-stream-viewer.spec.ts |

### Event Selection & Interaction

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-SELECT-001 | Clicking event card selects it | • Selected event has highlighted border<br>• Selected event has background color<br>• Selected event dot larger with glow | `src/components/StreamViewer.tsx:86, 144-154, 172-173` | 82-stream-viewer.spec.ts |
| CC-REQ-STREAM-SELECT-002 | Event click or view-on-canvas action triggers canvas sync | - onEventClick called with event object<br>- Desktop: Stream View closes after the click/action and recenters canvas on the event<br>- Mobile: overlay stays open and scrolls to the selected event | `src/components/StreamViewerOverlay.tsx:153-155` | 82-stream-viewer.spec.ts |

### Theme & Styling

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-THEME-001 | Stream View uses CSS custom properties | • All colors use --stream-* variables<br>• Dark/light theme compatible<br>• Consistent with app theme | `src/styles/tokens.css` | - |
| CC-REQ-STREAM-THEME-002 | Event cards have visual hierarchy | • Title: 1.05rem, bold, primary color<br>• Description: 0.9rem, secondary color<br>• Time: 0.8rem, muted color | `src/components/StreamViewer.tsx:179-218` | - |

### Event Editing (v0.5.33)

**Status:** Planned (not yet implemented)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-EDIT-001 | Slide-up edit panel opens on event tap | • Tap event card opens bottom sheet panel<br>• Panel slides up from bottom<br>• Shows edit form with Title, Date, Time, Description<br>• Cancel and Save buttons | Planned | Planned |
| CC-REQ-STREAM-EDIT-002 | Edit form validates input | • Title required, max 100 chars<br>• Date required, valid format<br>• Time optional, HH:MM format<br>• Description optional, max 500 chars<br>• Validation errors shown inline | Planned | Planned |
| CC-REQ-STREAM-EDIT-003 | Save updates event in Firestore | • Save button disabled until valid<br>• Shows loading state during save<br>• Panel closes on success<br>• Event list updates immediately | Planned | Planned |
| CC-REQ-STREAM-EDIT-004 | Cancel discards changes | • Cancel button closes panel<br>• No changes saved<br>• Confirmation if unsaved changes | Planned | Planned |

### Quick Add Event (v0.5.33)

**Status:** Planned (not yet implemented)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-ADD-001 | Add button in header | • [+] button visible in Stream View header<br>• Only visible if user is timeline owner<br>• Tapping opens empty edit panel | Planned | Planned |
| CC-REQ-STREAM-ADD-002 | New event defaults | • Date defaults to today<br>• Title and description empty<br>• Time empty (optional) | Planned | Planned |
| CC-REQ-STREAM-ADD-003 | New event appears in list | • After save, event appears in correct chronological position<br>• Event selected/highlighted<br>• Scroll to new event | Planned | Planned |

### Swipe Actions (v0.5.33)

**Status:** Planned (not yet implemented)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-SWIPE-001 | Swipe left reveals delete | • Swipe left on event card reveals red delete button<br>• Only for timeline owner<br>• Swipe threshold: 80px | Planned | Planned |
| CC-REQ-STREAM-SWIPE-002 | Swipe right reveals edit | • Swipe right reveals blue edit button<br>• Tapping opens edit panel<br>• Same as tap-to-edit | Planned | Planned |
| CC-REQ-STREAM-SWIPE-003 | Delete confirmation | • Delete button shows confirmation dialog<br>• "Delete [event title]?" message<br>• Cancel and Delete buttons<br>• Event removed from list on confirm | Planned | Planned |
| CC-REQ-STREAM-SWIPE-004 | Swipe auto-closes | • If no action taken, card snaps back after 3s<br>• Swiping another card closes previous | Planned | Planned |

### Owner-Only Features (v0.5.33)

**Status:** Planned (not yet implemented)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STREAM-OWNER-001 | Editing only for owners | • Add button hidden for non-owners<br>• Swipe actions disabled for non-owners<br>• Tap-to-edit disabled for non-owners<br>• View-only mode for visitors | Planned | Planned |

## Implementation Notes

### Component Structure

```
StreamViewerOverlay
├── Header (breadcrumbs, add button, close button)
├── StreamMinimap (event distribution)
└── Scroll Container
    └── StreamViewer
        ├── Search Bar (sticky)
        ├── Event List
        │   └── StreamEventCard (×N, with swipe actions)
        └── EditPanel (slide-up bottom sheet)
            ├── Edit Form (title, date, time, description)
            └── Actions (cancel, save)
```

### CSS Custom Properties (tokens.css)

```css
--stream-bg: Background color
--stream-card-bg: Card background
--stream-card-border: Card border color
--stream-text-primary: Primary text
--stream-text-secondary: Secondary text
--stream-text-muted: Muted/tertiary text
--stream-rail-color: Vertical rail/separator
--stream-dot-color: Default event dot color
--stream-date-width: Width of date column
--stream-card-gap: Gap between event cards
```

### Responsive Breakpoints

- **Desktop**: > 900px - Centered modal (85vw, max 900px)
- **Mobile**: < 900px - Full-screen overlay (100vw × 100vh)

### Scroll Architecture

The scroll implementation uses native browser scrolling:
1. Body scroll disabled via `document.body.style.overflow = 'hidden'`
2. Scroll container has `overflowY: 'auto'`
3. iOS smooth scrolling via `-webkit-overflow-scrolling: touch`
4. No JavaScript scroll interception

## Test Coverage

### E2E Tests (tests/editor/82-stream-viewer.spec.ts)

| Test ID | Description | Requirements Covered |
|---|---|---|
| T82.1 | Stream View button visible in NavRail | CC-REQ-STREAM-OVERLAY-001 |
| T82.2 | Stream View opens as modal | CC-REQ-STREAM-OVERLAY-001, 002 |
| T82.3 | Events load and display | CC-REQ-STREAM-DISPLAY-001 |
| T82.4 | Breadcrumbs visible | CC-REQ-STREAM-DISPLAY-002 |
| T82.5 | Minimap visible | CC-REQ-STREAM-MINIMAP-001 |
| T82.6 | Mouse wheel scroll works | CC-REQ-STREAM-SCROLL-001 |
| T82.7 | Click event highlights it | CC-REQ-STREAM-SELECT-001 |
| T82.8 | Minimap shows selection | CC-REQ-STREAM-MINIMAP-002 |
| T82.9 | Close button works | CC-REQ-STREAM-OVERLAY-005 |
| T82.10 | Escape key closes | CC-REQ-STREAM-OVERLAY-003 |
| T82.11 | Backdrop click closes | CC-REQ-STREAM-OVERLAY-004 |
| T82.12 | Search filters events | CC-REQ-STREAM-SEARCH-001 |
| T82.13 | Hover event highlights in minimap | CC-REQ-STREAM-MINIMAP-003 |

### Mobile-Specific Tests

| Test ID | Description | Requirements Covered |
|---|---|---|
| T82.M1 | Full-screen on mobile | CC-REQ-STREAM-OVERLAY-002 |
| T82.M2 | Touch scroll works | CC-REQ-STREAM-SCROLL-002 |

## Dependencies

- **MUI Theme**: Uses useMediaQuery for responsive breakpoints
- **Event Data**: Requires Event[] with id, date, title, description
- **Timeline Context**: Optional onEventClick for canvas sync

## Known Limitations

1. No keyboard navigation within event list (tab through events)
2. No drag-to-scroll on minimap (click only)
3. No infinite scroll / virtualization for large event lists
4. Swipe gestures may conflict with horizontal scroll on some devices

## Change History

- 2026-01-02 - Stream View promoted to primary event browsing surface (replaces Events/Outline panel); documented view-on-canvas closure and hover highlighting.
- 2025-12-04 - Initial version (v0.5.26.3)
- 2025-12-04 — Added minimap, breadcrumbs, fixed scrolling
- 2025-12-04 — Removed hover effects for performance
- 2025-12-04 — Created SRS document with 17 requirements
- 2025-12-04 — v0.5.26.4: Removed internal minimap/breadcrumbs, lifted existing ones above overlay via z-index
- 2025-12-04 — Fixed Escape key handling with capture phase, simplified header
- 2025-12-06 — v0.5.33 (v1.1): Added editing requirements - edit panel, quick add, swipe actions, owner-only features (13 new requirements)
