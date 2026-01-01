# SRS: Timeline Editor Page

**Last Updated:** 2026-01-02

## Overview

The Timeline Editor is the main workspace for viewing, creating, and editing timelines. This document covers the editor page UI controls, interactions, and behaviors.

**Page Route:** `/:username/timeline/:timelineId`

---

## 1. Editor Action Buttons

The editor has floating action buttons in the top-right corner for quick actions.

### 1.1 Share Button

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-SHARE-001 | Share button shall be displayed as a circular icon button (36×36px) | Button is circular; dimensions are 36×36px | `src/App.tsx:1229-1252` | TBD |
| CC-REQ-EDITOR-SHARE-002 | Share button shall be positioned in the top-right corner (top-20, right-4) | Button positioned at top-20 and right-4 | `src/App.tsx:1229-1252` | TBD |
| CC-REQ-EDITOR-SHARE-003 | Share button shall copy the timeline URL to clipboard on click | URL copied to clipboard on click | `src/App.tsx:1229-1252` | TBD |
| CC-REQ-EDITOR-SHARE-004 | Share button shall display a toast notification "Link copied to clipboard!" on success | Toast appears with exact message | `src/App.tsx:1229-1252` | TBD |
| CC-REQ-EDITOR-SHARE-005 | Share button shall only appear when a timeline is loaded | Button visible only when timeline loaded | `src/App.tsx:1229-1252` | TBD |
| CC-REQ-EDITOR-SHARE-006 | Share button clicks shall not trigger timeline canvas interactions (blue cursor) | No blue cursor appears on button click | `src/App.tsx:1229-1252` | TBD |
| CC-REQ-EDITOR-SHARE-007 | Share button shall have tooltip "Copy link to share" on hover | Tooltip displays exact text on hover | `src/App.tsx:1229-1252` | TBD |

### 1.2 User Profile Button

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-PROFILE-001 | Profile button shall only appear when user is logged in | Button visible only when authenticated | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-002 | Profile button shall be positioned below the share button | Button appears below share button | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-003 | Profile button default state shall be a circular icon (36×36px) with account icon | Default state is circular 36×36px with icon | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-004 | Profile button hover state shall expand horizontally to pill shape showing username and chevron | Hover expands to pill; shows username and chevron | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-005 | Profile button expansion shall animate smoothly (0.2s ease-in-out transition) | Animation duration is 0.2s with ease-in-out | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-006 | Profile button click shall open the user profile dropdown menu | Dropdown opens on click | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-007 | Profile dropdown shall contain: My Timelines, Settings, Sign Out options | All three menu items present | `src/App.tsx:1254-1262` | TBD |
| CC-REQ-EDITOR-PROFILE-008 | Profile button clicks shall not trigger timeline canvas interactions (blue cursor) | No blue cursor appears on button click | `src/App.tsx:1254-1262` | TBD |

### 1.3 Button Container

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-BUTTONS-001 | Button container shall use flex column layout with right alignment (items-end) | Container uses flex-col and items-end | `src/App.tsx:1229-1262` | TBD |
| CC-REQ-EDITOR-BUTTONS-002 | Button container shall have 8px gap between buttons | Gap between buttons is 8px | `src/App.tsx:1229-1262` | TBD |
| CC-REQ-EDITOR-BUTTONS-003 | Button container shall block all mouse events from propagating to timeline canvas | Mouse events don't propagate to canvas | `src/App.tsx:1229-1262` | TBD |

---

## 2. Event Browsing (Stream View)

**Note:** The Events/Outline panel has been removed. Event browsing now happens through Stream View (see `docs/SRS_STREAM_VIEW.md`). The Alt+E shortcut is retired; use the NavRail Stream control instead.

### 2.1 Stream View Access & Behavior

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-EVENTS-001 | Event browsing shall open Stream View from the NavRail; the legacy Events/Outline panel and Alt+E shortcut are removed | Stream View overlay opens from NavRail; no Alt+E binding exists; no Outline panel UI is rendered | `src/App.tsx` | `tests/editor/82-stream-viewer.spec.ts` |
| CC-REQ-EDITOR-EVENTS-002 | Stream View shall provide a chronological, filterable list of all timeline events (replacing the panel list) | Events sorted chronologically; search filters list and updates counts; all events visible when search is cleared | `src/components/StreamViewerOverlay.tsx`, `src/components/StreamViewer.tsx` | `tests/editor/82-stream-viewer.spec.ts` |
| CC-REQ-EDITOR-EVENTS-003 | Stream View shall close via Escape key or backdrop click when opened from the editor | Escape and backdrop click close the overlay; focus returns to the editor surface | `src/components/StreamViewerOverlay.tsx` | `tests/editor/82-stream-viewer.spec.ts` |

### 2.2 Stream Event Cards & Canvas Sync

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-EVENTS-010 | Each stream event card shall display title, two-line date, and a truncated description | Title and date visible; description truncated with expand control where needed | `src/components/StreamViewer.tsx` | `tests/editor/82-stream-viewer.spec.ts` |
| CC-REQ-EDITOR-EVENTS-011 | Desktop hover shall reveal "view on canvas" and "edit in editor" actions for stream event cards | Hover icons appear; view action recenters timeline and closes Stream View; edit action opens the editor panel | `src/components/StreamViewer.tsx`, `src/components/StreamViewerOverlay.tsx` | `tests/editor/82-stream-viewer.spec.ts` |
| CC-REQ-EDITOR-EVENTS-012 | Clicking a stream event card shall center/zoom to that event on the canvas and close Stream View on desktop | onEventClick is fired; canvas centers/zooms to the event; desktop overlay closes after navigation | `src/components/StreamViewerOverlay.tsx` | `tests/editor/82-stream-viewer.spec.ts` |
| CC-REQ-EDITOR-EVENTS-013 | Hovering a stream event card shall highlight the corresponding canvas event card, anchor, and minimap marker | Hover highlight propagates to canvas card/anchor and minimap marker; highlight clears on mouse leave | `src/components/StreamViewer.tsx`, `src/components/StreamViewerOverlay.tsx`, `src/App.tsx` | `tests/editor/82-stream-viewer.spec.ts (T82.13)` |
| CC-REQ-EDITOR-EVENTS-014 | All event scanning for the editor shall be performed within Stream View (no separate panel) | No separate Events/Outline panel appears; NavRail routes event browsing to Stream View on desktop and mobile | `src/App.tsx`, `src/components/StreamViewerOverlay.tsx` | `tests/editor/82-stream-viewer.spec.ts` |

---

## 3. Zoom Controls

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-ZOOM-001 | Zoom control bar shall be positioned at bottom-center of the canvas | Control bar at bottom-center | `src/App.tsx:1267-1277` | `tests/editor/55-navigation-enhancements.spec.ts` |
| CC-REQ-EDITOR-ZOOM-002 | Zoom controls shall include: pan left, pan right, zoom in, zoom out, fit all | All 5 controls present | `src/App.tsx:1267-1277` | `tests/editor/55-navigation-enhancements.spec.ts` |
| CC-REQ-EDITOR-ZOOM-003 | Zoom controls shall have reduced opacity (20%) when not hovered | Opacity is 20% when not hovered | `src/App.tsx:1267-1277` | TBD |
| CC-REQ-EDITOR-ZOOM-004 | Zoom controls shall increase opacity (95%) on hover | Opacity is 95% on hover | `src/App.tsx:1267-1277` | TBD |

---

## 4. Breadcrumb Navigation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-BREAD-001 | Breadcrumb shall show: Home > @username > Timeline Title | Breadcrumb displays all three parts | TBD | TBD |
| CC-REQ-EDITOR-BREAD-002 | Clicking username in breadcrumb shall navigate to user profile page (/:username) | Click navigates to /:username | TBD | TBD |
| CC-REQ-EDITOR-BREAD-003 | Clicking Home in breadcrumb shall navigate to /browse | Click navigates to /browse | TBD | TBD |

---

## 5. Visual Styling

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-EDITOR-STYLE-001 | Floating buttons shall use theme-aware surface colors (--color-surface) | Buttons use --color-surface variable | `src/App.tsx:1229-1262` | TBD |
| CC-REQ-EDITOR-STYLE-002 | Floating buttons shall have backdrop blur effect | Backdrop blur effect visible | `src/App.tsx:1229-1262` | TBD |
| CC-REQ-EDITOR-STYLE-003 | Floating buttons shall have subtle border (--color-border-primary) | Border uses --color-border-primary | `src/App.tsx:1229-1262` | TBD |

---

## Notes & Change History

- 2026-01-02 - Events/Outline panel removed; Stream View documented as the event browsing surface; Alt+E shortcut retired.
- 2025-12-27 - Converted to standardized 5-column format (ID | Requirement | Acceptance Criteria | Code | Tests); added code references and acceptance criteria.
- 2025-12-07 — Initial version - Share button, profile button, events panel requirements.
