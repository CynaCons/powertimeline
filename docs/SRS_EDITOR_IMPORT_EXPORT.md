# SRS: Timeline Import/Export
Version: 1.1 | Date: 2025-12-05

## Overview
YAML-based import/export capability inside the Timeline Editor. Allows editors to export timelines as YAML v1 files and import events with merge-by-ID behavior. Available to any signed-in user viewing a timeline.

## Changelog
- **v1.1 (2025-12-05):** Changed visibility from owner-only to signed-in user
- **v1.0 (2025-12-05):** Initial implementation (v0.5.27)

## Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CC-REQ-IMEX-001 | Import/Export overlay opens from NavRail `sync_alt` button or Alt+I shortcut. | Must | Implemented |
| CC-REQ-IMEX-002 | NavRail button visible to any signed-in user (not just timeline owners). | Must | Implemented |
| CC-REQ-IMEX-003 | Overlay uses OverlayShell; only one overlay active at a time; ESC closes. | Must | Implemented |
| CC-REQ-IMEX-004 | Export tab shows timeline title, event count chip, and Download YAML button. | Must | Implemented |
| CC-REQ-IMEX-005 | Export produces YAML v1 file with header comments, sorted events, and preserved IDs. | Must | Implemented |
| CC-REQ-IMEX-006 | Exported filename is sanitized from title (lowercase, hyphens, .yaml extension). | Should | Implemented |
| CC-REQ-IMEX-007 | Import tab shows drag-and-drop zone; accepts .yaml/.yml files only. | Must | Implemented |
| CC-REQ-IMEX-008 | Files > 1MB rejected with size error before parsing. | Should | Implemented |
| CC-REQ-IMEX-009 | YAML validated against v1 schema; errors show field paths; import disabled until fixed. | Must | Implemented |
| CC-REQ-IMEX-010 | Valid YAML shows preview (up to 20 events with "more" indicator) before import. | Must | Implemented |
| CC-REQ-IMEX-011 | Import performs merge-by-ID: matching IDs update, new IDs add. | Must | Implemented |
| CC-REQ-IMEX-012 | Event IDs from YAML preserved exactly; no regeneration or renaming. | Must | Implemented |
| CC-REQ-IMEX-013 | Required fields: `version` (must be 1), `timeline.title`, `events[].id`, `events[].date`, `events[].title`. | Must | Implemented |
| CC-REQ-IMEX-014 | Dates must be YYYY-MM-DD; times (if present) must be 24-hour HH:MM. | Must | Implemented |
| CC-REQ-IMEX-015 | Empty timeline (0 events) shows "0 events" chip; export produces valid YAML with empty events array. | Should | Implemented |

## YAML Format Reference
```yaml
version: 1
timeline:
  title: "Title"              # Required
  description: "..."          # Optional
  visibility: private         # public|unlisted|private (default: private)
events:
  - id: "evt-001"             # Required - unique identifier
    date: "2024-01-15"        # Required - YYYY-MM-DD
    title: "Event Title"      # Required
    description: "..."        # Optional
    endDate: "2024-01-20"     # Optional - for date ranges
    time: "14:30"             # Optional - HH:MM
```

## Test Coverage
| Requirement | Test File | Test Case |
|-------------|-----------|-----------|
| CC-REQ-IMEX-001 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-01: overlay opens from NavRail |
| CC-REQ-IMEX-001 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-01b: opens with Alt+I shortcut |
| CC-REQ-IMEX-002 | tests/editor/83-import-export-overlay.spec.ts | button visible when signed in |
| CC-REQ-IMEX-003 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-01: ESC closes overlay |
| CC-REQ-IMEX-004 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-02: Export tab shows info |
| CC-REQ-IMEX-005 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-02: download contains valid YAML |
| CC-REQ-IMEX-006 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-02: filename is .yaml |
| CC-REQ-IMEX-007 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-03: drop zone validates file type |
| CC-REQ-IMEX-008 | tests/editor/83-import-export-overlay.spec.ts | rejects file larger than 1MB |
| CC-REQ-IMEX-009 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-04: validation catches errors |
| CC-REQ-IMEX-010 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-05: preview shows events |
| CC-REQ-IMEX-011 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-05: imports and merges by ID |
| CC-REQ-IMEX-012 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-05: IDs preserved |
| CC-REQ-IMEX-013 | tests/editor/83-import-export-overlay.spec.ts | T-IMEX-04: missing ID rejected |
| CC-REQ-IMEX-014 | tests/editor/83-import-export-overlay.spec.ts | rejects invalid date format |
| CC-REQ-IMEX-015 | tests/editor/83-import-export-overlay.spec.ts | empty timeline exports correctly |

## Implementation Files
| File | Purpose |
|------|---------|
| src/services/timelineImportExport.ts | YAML parsing, validation, export/import logic |
| src/app/overlays/ImportExportOverlay.tsx | Editor overlay UI component |
| src/App.tsx | NavRail integration, overlay state management |
