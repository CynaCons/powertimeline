# SRS: Event Sources

## Overview

Event Sources allow users to cite references, links, or notes that support timeline events. Sources provide credibility and traceability for historical or factual claims.

**Version:** v0.6.3
**Status:** Planned

---

## 1. Data Model

### 1.1 Event Type Extension

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-001 | Event type shall include optional `sources` field as array of strings | Must |
| CC-REQ-SOURCES-002 | Each source entry shall be a string (text or URL) | Must |
| CC-REQ-SOURCES-003 | Sources array shall have no maximum length limit | Should |
| CC-REQ-SOURCES-004 | Individual source entries shall have max 500 characters | Must |

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

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-010 | Firestore Event documents shall support optional `sources` array field | Must |
| CC-REQ-SOURCES-011 | Existing events without sources shall remain valid (backward compatible) | Must |
| CC-REQ-SOURCES-012 | Sources shall be stored as array of strings in Firestore | Must |

---

## 2. Editor View (AuthoringOverlay)

### 2.1 Sources Section

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-020 | Editor shall display "Sources" section below Description field | Must |
| CC-REQ-SOURCES-021 | Sources section shall be collapsible with expand/collapse toggle | Should |
| CC-REQ-SOURCES-022 | Sources section header shall show count of sources (e.g., "Sources (3)") | Should |
| CC-REQ-SOURCES-023 | Empty sources section shall display placeholder text | Should |

### 2.2 Source List Display

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-030 | Each source shall be displayed as a list item | Must |
| CC-REQ-SOURCES-031 | URLs shall be displayed as clickable links (open in new tab) | Must |
| CC-REQ-SOURCES-032 | Non-URL text shall be displayed as plain text | Must |
| CC-REQ-SOURCES-033 | Each source item shall have delete button (X icon) | Must |
| CC-REQ-SOURCES-034 | Each source item shall be editable inline on click | Should |

### 2.3 Add Source

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-040 | "Add Source" button shall be displayed below source list | Must |
| CC-REQ-SOURCES-041 | Clicking "Add Source" shall add empty input field | Must |
| CC-REQ-SOURCES-042 | Input field shall auto-focus when added | Should |
| CC-REQ-SOURCES-043 | Pressing Enter in input shall save source and add another | Should |
| CC-REQ-SOURCES-044 | Empty sources shall not be saved | Must |

### 2.4 URL Detection

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-050 | System shall auto-detect URLs (http://, https://) | Must |
| CC-REQ-SOURCES-051 | Detected URLs shall display with link icon | Should |
| CC-REQ-SOURCES-052 | Non-URL sources shall display with text/note icon | Should |

### 2.5 Source Reordering

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-055 | Each source item shall have a drag handle (drag_indicator icon) | Must |
| CC-REQ-SOURCES-056 | Sources shall be reorderable via drag-and-drop | Must |
| CC-REQ-SOURCES-057 | Drag preview shall show the source being moved | Should |
| CC-REQ-SOURCES-058 | Drop target shall indicate valid drop position | Should |

---

## 3. Stream View

### 3.1 Sources Indicator

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-060 | Events with sources shall display indicator badge | Must |
| CC-REQ-SOURCES-061 | Indicator shall show source count (e.g., "3") | Should |
| CC-REQ-SOURCES-062 | Indicator shall use "source" material icon | Should |
| CC-REQ-SOURCES-063 | Indicator shall appear next to event title | Must |

### 3.2 Navigation to Editor

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-070 | Clicking sources indicator shall navigate to Editor | Must |
| CC-REQ-SOURCES-071 | Editor shall open with Sources section expanded | Should |
| CC-REQ-SOURCES-072 | Stream View shall close when navigating to Editor | Must |

---

## 4. Timeline Canvas View

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-080 | Sources shall NOT be displayed on timeline canvas | Must |
| CC-REQ-SOURCES-081 | Event cards on canvas shall not show sources indicator | Must |

---

## 5. Read-Only Mode

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-SOURCES-090 | Non-owners shall see sources in read-only mode | Must |
| CC-REQ-SOURCES-091 | Read-only mode shall hide Add/Edit/Delete controls | Must |
| CC-REQ-SOURCES-092 | URLs shall remain clickable in read-only mode | Must |

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
| Stream View | tests/stream/event-sources.spec.ts | ✅ Complete (11 tests) |

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
