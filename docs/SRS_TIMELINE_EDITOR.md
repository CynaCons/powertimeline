# SRS: Timeline Editor Page

## Overview

The Timeline Editor is the main workspace for viewing, creating, and editing timelines. This document covers the editor page UI controls, interactions, and behaviors.

**Page Route:** `/:username/timeline/:timelineId`

---

## 1. Editor Action Buttons

The editor has floating action buttons in the top-right corner for quick actions.

### 1.1 Share Button

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-SHARE-001 | Share button shall be displayed as a circular icon button (36×36px) | Implemented |
| CC-REQ-EDITOR-SHARE-002 | Share button shall be positioned in the top-right corner (top-20, right-4) | Implemented |
| CC-REQ-EDITOR-SHARE-003 | Share button shall copy the timeline URL to clipboard on click | Implemented |
| CC-REQ-EDITOR-SHARE-004 | Share button shall display a toast notification "Link copied to clipboard!" on success | Implemented |
| CC-REQ-EDITOR-SHARE-005 | Share button shall only appear when a timeline is loaded | Implemented |
| CC-REQ-EDITOR-SHARE-006 | Share button clicks shall not trigger timeline canvas interactions (blue cursor) | Implemented |
| CC-REQ-EDITOR-SHARE-007 | Share button shall have tooltip "Copy link to share" on hover | Implemented |

### 1.2 User Profile Button

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-PROFILE-001 | Profile button shall only appear when user is logged in | Implemented |
| CC-REQ-EDITOR-PROFILE-002 | Profile button shall be positioned below the share button | Implemented |
| CC-REQ-EDITOR-PROFILE-003 | Profile button default state shall be a circular icon (36×36px) with account icon | Implemented |
| CC-REQ-EDITOR-PROFILE-004 | Profile button hover state shall expand horizontally to pill shape showing username and chevron | Implemented |
| CC-REQ-EDITOR-PROFILE-005 | Profile button expansion shall animate smoothly (0.2s ease-in-out transition) | Implemented |
| CC-REQ-EDITOR-PROFILE-006 | Profile button click shall open the user profile dropdown menu | Implemented |
| CC-REQ-EDITOR-PROFILE-007 | Profile dropdown shall contain: My Timelines, Settings, Sign Out options | Implemented |
| CC-REQ-EDITOR-PROFILE-008 | Profile button clicks shall not trigger timeline canvas interactions (blue cursor) | Implemented |

### 1.3 Button Container

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-BUTTONS-001 | Button container shall use flex column layout with right alignment (items-end) | Implemented |
| CC-REQ-EDITOR-BUTTONS-002 | Button container shall have 8px gap between buttons | Implemented |
| CC-REQ-EDITOR-BUTTONS-003 | Button container shall block all mouse events from propagating to timeline canvas | Implemented |

---

## 2. Events Panel (Outline Panel)

### 2.1 Panel Behavior

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-EVENTS-001 | Events panel shall be accessible via NavRail "Events" button or Alt+E shortcut | Implemented |
| CC-REQ-EDITOR-EVENTS-002 | Events panel shall display a filterable list of all timeline events | Implemented |
| CC-REQ-EDITOR-EVENTS-003 | Events panel shall close when clicking outside on the timeline canvas | Implemented |
| CC-REQ-EDITOR-EVENTS-004 | Events panel shall close when pressing Escape key | Implemented |

### 2.2 Event List Items

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-EVENTS-010 | Each event item shall display title and date | Implemented |
| CC-REQ-EDITOR-EVENTS-011 | Event items shall show edit and view action buttons on hover | Implemented |
| CC-REQ-EDITOR-EVENTS-012 | Edit button (pencil icon) shall open the event in the editor panel | Implemented |
| CC-REQ-EDITOR-EVENTS-013 | View button (eye icon) shall zoom/navigate to the event on canvas and close the panel | Implemented |
| CC-REQ-EDITOR-EVENTS-014 | Hovering an event item shall highlight the corresponding event card, anchor, and minimap marker | Implemented |

---

## 3. Zoom Controls

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-ZOOM-001 | Zoom control bar shall be positioned at bottom-center of the canvas | Implemented |
| CC-REQ-EDITOR-ZOOM-002 | Zoom controls shall include: pan left, pan right, zoom in, zoom out, fit all | Implemented |
| CC-REQ-EDITOR-ZOOM-003 | Zoom controls shall have reduced opacity (20%) when not hovered | Implemented |
| CC-REQ-EDITOR-ZOOM-004 | Zoom controls shall increase opacity (95%) on hover | Implemented |

---

## 4. Breadcrumb Navigation

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-BREAD-001 | Breadcrumb shall show: Home > @username > Timeline Title | Implemented |
| CC-REQ-EDITOR-BREAD-002 | Clicking username in breadcrumb shall navigate to user profile page (/:username) | Implemented |
| CC-REQ-EDITOR-BREAD-003 | Clicking Home in breadcrumb shall navigate to /browse | Implemented |

---

## 5. Visual Styling

| ID | Requirement | Status |
|----|-------------|--------|
| CC-REQ-EDITOR-STYLE-001 | Floating buttons shall use theme-aware surface colors (--color-surface) | Implemented |
| CC-REQ-EDITOR-STYLE-002 | Floating buttons shall have backdrop blur effect | Implemented |
| CC-REQ-EDITOR-STYLE-003 | Floating buttons shall have subtle border (--color-border-primary) | Implemented |

---

## Test Coverage

| Requirement Group | Test File | Coverage |
|-------------------|-----------|----------|
| Share Button | - | Pending |
| Profile Button | - | Pending |
| Events Panel | tests/editor/50-panels-visibility.spec.ts | Partial |
| Events Panel Hover | tests/editor/66-panel-hover-highlighting.spec.ts | Implemented |
| Zoom Controls | tests/editor/55-navigation-enhancements.spec.ts | Partial |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-07 | Initial version - Share button, profile button, events panel requirements |
