# State Management Requirements

This document describes the state architecture for the Timeline Editor, including custom hooks that manage form state, UI state, and event selection.

## Overview

The Timeline Editor (`src/App.tsx`) uses a hook-based architecture to organize state management. Complex state logic is extracted into focused custom hooks that:

1. Separate concerns for better maintainability
2. Enable unit testing of state logic in isolation
3. Reduce the cognitive load when working with App.tsx
4. Provide reusable patterns for future features

## Architecture

```
App.tsx
├── useEventEditForm     # Form state for event editing
├── useTimelineUI        # Overlay and panel visibility
├── useEventSelection    # Selection and navigation
└── [Future: useTimelineEvents]  # Core events data layer
```

## Requirement Table

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STATE-FORM-001 | Event edit form state management | • Form fields (date, time, title, description) sync when selection changes<br>• Form only resets when selectedId changes, not when selectedEvent reference changes<br>• isDirty flag tracks unsaved changes<br>• getFormValues() returns current form state | `src/app/hooks/useEventEditForm.ts` | useEventEditForm.test.ts (18 tests) |
| CC-REQ-STATE-UI-001 | UI overlay and panel state | • Overlay state (editor, import-export, null) managed centrally<br>• Stream viewer, command palette, chat panel visibility<br>• Escape key closes active overlay<br>• Parent notification when stream view changes | `src/app/hooks/useTimelineUI.ts` | useTimelineUI.test.ts (18 tests) |
| CC-REQ-STATE-SELECT-001 | Event selection and hover state | • selectedId and hoveredEventId managed centrally<br>• selectedEvent derived from events array<br>• selectEvent, clearSelection actions available<br>• Hover state independent of selection | `src/app/hooks/useEventSelection.ts` | useEventSelection.test.ts (15 tests) |
| CC-REQ-STATE-NAV-001 | Chronological event navigation | • navigateToPreviousEvent moves to earlier event<br>• navigateToNextEvent moves to later event<br>• Navigation respects chronological order (date+time)<br>• No-op at first/last event | `src/app/hooks/useEventSelection.ts` | useEventSelection.test.ts |

## Hook Specifications

### useEventEditForm

**Purpose:** Manages form state for the event authoring overlay.

**Interface:**
```typescript
interface UseEventEditFormOptions {
  selectedEvent: Event | undefined;
  selectedId: string | undefined;
}

interface UseEventEditFormReturn {
  editDate: string;
  editTime: string;
  editTitle: string;
  editDescription: string;
  setEditDate: (value: string) => void;
  setEditTime: (value: string) => void;
  setEditTitle: (value: string) => void;
  setEditDescription: (value: string) => void;
  resetForm: () => void;
  isDirty: boolean;
  getFormValues: () => { date, time, title, description };
}
```

**Key Behavior:**
- Form syncs when `selectedId` changes (not when `selectedEvent` reference changes)
- This prevents form reset when the events array updates but selection stays the same
- `isDirty` returns true if any field differs from the original event values

**Location:** `src/app/hooks/useEventEditForm.ts`

---

### useTimelineUI

**Purpose:** Manages overlay and panel visibility state.

**Interface:**
```typescript
interface UseTimelineUIOptions {
  initialStreamViewOpen?: boolean;
  onStreamViewChange?: (isOpen: boolean) => void;
}

interface UseTimelineUIReturn {
  overlay: 'editor' | 'import-export' | null;
  setOverlay: Dispatch<SetStateAction<OverlayType>>;
  closeOverlay: () => void;
  streamViewerOpen: boolean;
  setStreamViewerOpen: Dispatch<SetStateAction<boolean>>;
  openStreamView: () => void;
  closeStreamView: () => void;
  toggleStreamView: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
  chatPanelOpen: boolean;
  setChatPanelOpen: Dispatch<SetStateAction<boolean>>;
  toggleChatPanel: () => void;
  showInfoPanels: boolean;
  setShowInfoPanels: Dispatch<SetStateAction<boolean>>;
  toggleInfoPanels: () => void;
  openEditor: () => void;
  openImportExport: () => void;
  toggleImportExport: () => void;
}
```

**Key Behavior:**
- Escape key automatically closes the active overlay
- `onStreamViewChange` callback notifies parent when stream view state changes
- `initialStreamViewOpen` prop syncs on mount

**Location:** `src/app/hooks/useTimelineUI.ts`

---

### useEventSelection

**Purpose:** Manages event selection, hover state, and navigation.

**Interface:**
```typescript
interface UseEventSelectionOptions {
  events: Event[];
}

interface UseEventSelectionReturn {
  selectedId: string | undefined;
  setSelectedId: Dispatch<SetStateAction<string | undefined>>;
  hoveredEventId: string | undefined;
  setHoveredEventId: Dispatch<SetStateAction<string | undefined>>;
  selectedEvent: Event | undefined;
  selectEvent: (eventId: string) => void;
  clearSelection: () => void;
  navigateToPreviousEvent: () => void;
  navigateToNextEvent: () => void;
}
```

**Key Behavior:**
- `selectedEvent` is derived (memoized) from `events` and `selectedId`
- Navigation sorts events chronologically by date+time
- Navigation is no-op when at first/last event or when no event is selected

**Location:** `src/app/hooks/useEventSelection.ts`

---

## Future Work: useTimelineEvents

Phase 4 of the state refactoring (deferred) would extract the core events data layer:

```typescript
interface UseTimelineEventsReturn {
  events: Event[];
  currentTimeline: Timeline | null;
  loadError: Error | null;
  isLoading: boolean;
  eventsRef: React.MutableRefObject<Event[]>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  eventsWithPreviews: Event[];
}
```

**Complexity factors (why deferred):**
- Optimistic updates with rollback on error
- Dual mode: Firestore vs EventStorage (based on `timelineId`)
- `eventsRef` pattern for closure-safe callbacks
- Preview events from AI actions integration

---

## Test Coverage

### Unit Tests (Vitest)

| File | Tests | Coverage |
|------|-------|----------|
| `src/app/hooks/useEventEditForm.test.ts` | 18 | Form sync, setters, isDirty, resetForm, getFormValues |
| `src/app/hooks/useTimelineUI.test.ts` | 18 | Overlay state, panels, escape key, callbacks |
| `src/app/hooks/useEventSelection.test.ts` | 15 | Selection, hover, navigation, edge cases |

### E2E Integration

The hooks are integration-tested through:
- `tests/editor/51-authoring-overlay.spec.ts` - Tests form state via authoring overlay
- `tests/editor/82-stream-viewer.spec.ts` - Tests UI state via stream viewer modal
- `tests/editor/55-navigation-enhancements.spec.ts` - Tests keyboard navigation

---

## Change History

- **2026-01-04** — Created as part of v0.8.10 State Architecture Refactor
  - Phase 1: useEventEditForm hook extracted from App.tsx
  - Phase 2: useTimelineUI hook extracted from App.tsx
  - Phase 3: useEventSelection hook extracted from App.tsx
  - Phase 4: useTimelineEvents deferred (complex Firestore integration)
