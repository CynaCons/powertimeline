# SRS: Event Sources

## Overview

Event Sources allow users to cite references, links, or notes that support timeline events. Sources provide credibility and traceability for historical or factual claims.

**Version:** v0.6.3
**Status:** Partially Implemented
**Last Updated:** 2025-12-27

---

## 1. Data Model

### 1.1 Event Type Extension

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-001 | Event type shall include optional `sources` field as array of strings | • Field is optional<br>• Type is string[]<br>• Backward compatible with existing events | `src/types.ts:12` | - |
| CC-REQ-SOURCES-002 | Each source entry shall be a string (text or URL) | • Array elements are strings<br>• Both URLs and text accepted | `src/types.ts:12` | - |
| CC-REQ-SOURCES-003 | Sources array shall have no maximum length limit | • No artificial array size limit<br>• Limited only by Firestore document size | `src/types.ts:12` | - |
| CC-REQ-SOURCES-004 | Individual source entries shall have max 500 characters | • Validation in editor enforces limit<br>• Error shown if exceeded | `src/app/components/SourcesEditor.tsx` | - |

**Type Definition:**
```typescript
export interface Event {
  id: string;
  date: string;
  title: string;
  description?: string;
  endDate?: string;
  time?: string;
  sources?: string[];  // NEW: Array of source references
  flags?: { ... };
}
```

### 1.2 Firestore Schema

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-010 | Firestore Event documents shall support optional `sources` array field | • Field stored in Firestore documents<br>• Firestore schema supports array type | `src/services/firestore.ts` | - |
| CC-REQ-SOURCES-011 | Existing events without sources shall remain valid (backward compatible) | • Events without sources load correctly<br>• No migration required | `src/services/firestore.ts` | - |
| CC-REQ-SOURCES-012 | Sources shall be stored as array of strings in Firestore | • Firestore field type is array<br>• Elements are strings | `src/services/firestore.ts` | - |

---

## 2. Editor View (AuthoringOverlay)

### 2.1 Sources Section

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-020 | Editor shall display "Sources" section below Description field | • Section visible in AuthoringOverlay<br>• Positioned after description field<br>• Clear visual separation | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-021 | Sources section shall be collapsible with expand/collapse toggle | • Expand/collapse button present<br>• State persists during edit session<br>• Smooth animation | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-022 | Sources section header shall show count of sources (e.g., "Sources (3)") | • Count updates dynamically<br>• Format: "Sources (N)"<br>• Shows 0 when empty | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-023 | Empty sources section shall display placeholder text | • Placeholder shown when no sources<br>• Helpful text guides user | `src/app/components/SourcesEditor.tsx` | - |

### 2.2 Source List Display

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-030 | Each source shall be displayed as a list item | • List layout with clear separation<br>• Each item has consistent styling | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-031 | URLs shall be displayed as clickable links (open in new tab) | • URLs are clickable<br>• Opens in new tab (target="_blank")<br>• Security: rel="noopener noreferrer" | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-032 | Non-URL text shall be displayed as plain text | • Non-URL sources shown as text<br>• Not clickable | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-033 | Each source item shall have delete button (X icon) | • Delete button visible on each item<br>• Icon clearly indicates delete action | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-034 | Each source item shall be editable inline on click | • Click activates inline edit mode<br>• Changes saved on blur or Enter | `src/app/components/SourcesEditor.tsx` | - |

### 2.3 Add Source

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-040 | "Add Source" button shall be displayed below source list | • Button visible below list<br>• Clear label and icon | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-041 | Clicking "Add Source" shall add empty input field | • Click adds new input<br>• Input appears in list | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-042 | Input field shall auto-focus when added | • New input receives focus<br>• Cursor ready for typing | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-043 | Pressing Enter in input shall save source and add another | • Enter saves current source<br>• New empty input appears<br>• Focus moves to new input | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-044 | Empty sources shall not be saved | • Validation prevents empty strings<br>• Empty inputs removed on blur | `src/app/components/SourcesEditor.tsx` | - |

### 2.4 URL Detection

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-050 | System shall auto-detect URLs (http://, https://) | • Regex or validation detects URL format<br>• Both http and https recognized | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-051 | Detected URLs shall display with link icon | • Link icon shown for URLs<br>• Visual distinction from text | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-052 | Non-URL sources shall display with text/note icon | • Text icon for non-URLs<br>• Clear visual difference | `src/app/components/SourcesEditor.tsx` | - |

### 2.5 Source Reordering

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-055 | Each source item shall have a drag handle (drag_indicator icon) | • Drag handle visible on each item<br>• Icon indicates draggable | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-056 | Sources shall be reorderable via drag-and-drop | • Drag and drop functionality works<br>• Order persists after save | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-057 | Drag preview shall show the source being moved | • Visual feedback during drag<br>• Preview shows source content | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-058 | Drop target shall indicate valid drop position | • Visual indicator for drop zone<br>• Clear insertion point | `src/app/components/SourcesEditor.tsx` | - |

---

## 3. Stream View

### 3.1 Sources Indicator

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-060 | Events with sources shall display indicator badge | • Badge visible on events with sources<br>• Not shown for events without sources | `src/components/StreamViewer.tsx` | `tests/stream/event-sources.spec.ts` |
| CC-REQ-SOURCES-061 | Indicator shall show source count (e.g., "3") | • Count displayed accurately<br>• Updates when sources change | `src/components/StreamViewer.tsx` | `tests/stream/event-sources.spec.ts` |
| CC-REQ-SOURCES-062 | Indicator shall use "source" material icon | • Uses Material UI source icon<br>• Clear visual representation | `src/components/StreamViewer.tsx` | `tests/stream/event-sources.spec.ts` |
| CC-REQ-SOURCES-063 | Indicator shall appear next to event title | • Positioned near title<br>• Does not obscure title text | `src/components/StreamViewer.tsx` | `tests/stream/event-sources.spec.ts` |

### 3.2 Navigation to Editor

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-070 | Clicking sources indicator shall navigate to Editor | • Click opens AuthoringOverlay<br>• Correct event selected for editing | `src/components/StreamViewer.tsx` | `tests/stream/event-sources.spec.ts` |
| CC-REQ-SOURCES-071 | Editor shall open with Sources section expanded | • Sources section visible by default<br>• User can immediately edit sources | `src/app/overlays/AuthoringOverlay.tsx` | `tests/stream/event-sources.spec.ts` |
| CC-REQ-SOURCES-072 | Stream View shall close when navigating to Editor | • Stream View overlay closes<br>• Editor becomes active view | `src/components/StreamViewerOverlay.tsx` | `tests/stream/event-sources.spec.ts` |

---

## 4. Timeline Canvas View

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-080 | Sources shall NOT be displayed on timeline canvas | • Canvas view shows events without sources<br>• Clean visual presentation | `src/timeline/DeterministicLayoutComponent.tsx` | - |
| CC-REQ-SOURCES-081 | Event cards on canvas shall not show sources indicator | • No indicator badge on canvas cards<br>• Sources only visible in Editor/Stream | `src/timeline/DeterministicLayoutComponent.tsx` | - |

---

## 5. Read-Only Mode

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-SOURCES-090 | Non-owners shall see sources in read-only mode | • Sources visible to viewers<br>• No edit capability | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-091 | Read-only mode shall hide Add/Edit/Delete controls | • Add button hidden<br>• Delete button hidden<br>• Inline edit disabled | `src/app/components/SourcesEditor.tsx` | - |
| CC-REQ-SOURCES-092 | URLs shall remain clickable in read-only mode | • URL links functional<br>• Can open in new tab | `src/app/components/SourcesEditor.tsx` | - |

---

## 6. NOT in Scope

The following features are explicitly excluded from v0.6.3:

- Link preview / metadata fetching
- Source validation or verification
- Source categorization or tagging
- Rich text formatting in sources
- Image or file attachments as sources

---

## Requirements Summary

| Category | Count |
|----------|-------|
| Data Model | 6 |
| Editor View | 20 |
| Stream View | 6 |
| Canvas View | 2 |
| Read-Only | 3 |
| **Total** | **37** |

---

## Test Coverage

| Requirement Group | Test File | Coverage |
|-------------------|-----------|----------|
| Data Model | tests/editor/event-sources.spec.ts | Planned |
| Editor View | tests/editor/event-sources.spec.ts | Planned |
| Stream View | tests/stream/event-sources.spec.ts | ✅ Implemented (11 tests) |

---

## Implementation Files

| Component | File | Changes |
|-----------|------|---------|
| Event Type | `src/types.ts` | Add `sources?: string[]` |
| Firestore | `src/services/firestore.ts` | Handle sources in save/load |
| Schema Docs | `docs/SRS_DB.md` | Document sources field |
| Sources Editor | `src/app/components/SourcesEditor.tsx` | NEW component |
| AuthoringOverlay | `src/app/overlays/AuthoringOverlay.tsx` | Integrate SourcesEditor |
| StreamViewer | `src/components/StreamViewer.tsx` | Add sources indicator |
| App State | `src/App.tsx` | Add editSources state |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-07 | Initial specification |
| 1.1 | 2025-12-07 | Added source reordering (drag-and-drop) |
