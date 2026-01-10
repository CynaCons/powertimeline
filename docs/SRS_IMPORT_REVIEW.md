# Import Review System Software Requirements Specification

**Last Updated:** 2025-01-06

## Overview
The unified import review system creates a session-based workflow for reviewing YAML-imported events before they are committed to a timeline. A session tracks imported events, decisions, and progress, while the Review Panel and navigation integration expose review controls and status.

## 1. Session Management
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-SESSION-001 | Session data is restored from localStorage | • Session data stored under key prefix `powertimeline:session:`<br>• Only sessions with status `active` are restored<br>• When no `timelineId` is supplied, the first active session is loaded | `src/hooks/useImportSession.ts:12`<br>`src/hooks/useImportSession.ts:17` | TBD |
| CC-REQ-REVIEW-SESSION-002 | Session updates persist to localStorage | • Session writes to `powertimeline:session:{timelineId}` whenever state changes<br>• No write occurs when session is `null` | `src/hooks/useImportSession.ts:53` | TBD |
| CC-REQ-REVIEW-SESSION-003 | Session events initialize for review | • Each imported event receives a temporary UUID<br>• Events are marked `pending` on start<br>• Events are marked `update` when matching existing IDs AND content differs, otherwise `create` | `src/hooks/useImportSession.ts:112` | `src/hooks/useImportSession.test.ts` |
| CC-REQ-REVIEW-SESSION-003a | Identical events are skipped during import | • Events with matching ID AND identical content are not added to session<br>• Comparison includes: title, date, endDate, time, description, sources<br>• Only events with actual changes appear in review panel | `src/hooks/useImportSession.ts:20` | `src/hooks/useImportSession.test.ts` |
| CC-REQ-REVIEW-SESSION-003b | Skipped event count is tracked and displayed | • Session stores `skippedCount` for identical events filtered out<br>• ReviewPanel displays "X skipped (no changes)" when count > 0<br>• Provides user feedback that import processed correctly | `src/hooks/useImportSession.ts:101`<br>`src/app/panels/ReviewPanel.tsx:197` | `src/hooks/useImportSession.test.ts` |
| CC-REQ-REVIEW-SESSION-004 | New sessions capture lifecycle metadata | • Sessions are created with status `active` and timestamp from `Date.now()`<br>• Sessions store `timelineId`, `ownerId`, `source`, and `existingEventIds` | `src/hooks/useImportSession.ts:85` | TBD |
| CC-REQ-REVIEW-SESSION-005 | Sessions can be committed or discarded | • Commit removes the localStorage entry and marks session `committed`<br>• Discard removes the localStorage entry and marks session `discarded`<br>• Commit throws an error if no session is active | `src/hooks/useImportSession.ts:127` | TBD |

## 2. ReviewPanel UI
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-PANEL-001 | Panel shows an empty state without a session | • Panel renders "No active import session" messaging<br>• Empty state uses centered layout with surface styling | `src/app/panels/ReviewPanel.tsx:38` | TBD |
| CC-REQ-REVIEW-PANEL-002 | Panel container is accessible and identifiable | • Container exposes `data-testid="review-panel"`<br>• Uses `role="region"` with `aria-label="Import Session Review Panel"` | `src/app/panels/ReviewPanel.tsx:157` | TBD |
| CC-REQ-REVIEW-PANEL-003 | Header displays title and close control | • Header shows "Review Import Session" with icon<br>• Close control uses `aria-label="Close review panel"` | `src/app/panels/ReviewPanel.tsx:168` | TBD |
| CC-REQ-REVIEW-PANEL-004 | Session info shows source label and count | • Source label maps `yaml` to "YAML Import", `ai-chat` to "AI Chat", `pr` to "Pull Request"<br>• Session info row shows total event count | `src/app/panels/ReviewPanel.tsx:107`<br>`src/app/panels/ReviewPanel.tsx:184` | TBD |
| CC-REQ-REVIEW-PANEL-005 | Progress section summarizes review status | • Reviewed count equals accepted + rejected events<br>• Progress bar uses a determinate percentage of reviewed events | `src/app/panels/ReviewPanel.tsx:52`<br>`src/app/panels/ReviewPanel.tsx:191` | TBD |
| CC-REQ-REVIEW-PANEL-006 | Event list renders decision-styled cards | • Each session event renders as a bordered card within the scroll region<br>• Card border and title color reflect the decision state<br>• Rejected cards appear with reduced opacity | `src/app/panels/ReviewPanel.tsx:213` | TBD |
| CC-REQ-REVIEW-PANEL-007 | Event details show metadata and updates | • Event date uses `formatDate` with fallbacks for invalid dates<br>• Action is shown in uppercase with an update indicator when needed<br>• Update actions show a disabled "View Diff (Coming Soon)" button | `src/app/panels/ReviewPanel.tsx:142`<br>`src/app/panels/ReviewPanel.tsx:319` | TBD |
| CC-REQ-REVIEW-PANEL-008 | Footer actions support bulk controls | • "Accept All Remaining" is disabled when no pending events remain<br>• Commit button shows accepted count and disables when zero or committing<br>• Discard action opens a confirmation dialog with cancel/confirm actions | `src/app/panels/ReviewPanel.tsx:368`<br>`src/app/panels/ReviewPanel.tsx:416` | TBD |

## 3. Event Decisions
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-DECISION-001 | Accept, reject, and undo update event decisions | • Accept sets decision to `accepted`<br>• Reject sets decision to `rejected`<br>• Undo resets decision to `pending` | `src/app/panels/ReviewPanel.tsx:56`<br>`src/hooks/useImportSession.ts:101` | TBD |
| CC-REQ-REVIEW-DECISION-002 | Edit action opens the event editor | • Edit action invokes `onEventClick` when provided<br>• Edit is only shown for pending events | `src/app/panels/ReviewPanel.tsx:64` | TBD |
| CC-REQ-REVIEW-DECISION-003 | Bulk accept applies to remaining pending events | • Iterates all session events marked `pending`<br>• Sets remaining events to `accepted` | `src/app/panels/ReviewPanel.tsx:74` | TBD |
| CC-REQ-REVIEW-DECISION-004 | Commit applies only accepted create events | • Commit filters events to `accepted` only<br>• Final payload merges `eventData` with `userEdits`<br>• Only `create` actions call `addEvent` | `src/hooks/useImportSession.ts:133` | TBD |
| CC-REQ-REVIEW-DECISION-005 | Edit button opens event in AuthoringOverlay | • Edit button click invokes `onEventClick` with session event ID<br>• AuthoringOverlay opens with the event data pre-populated<br>• User can modify event fields while in review state | `src/App.tsx:TBD`<br>`src/app/panels/ReviewPanel.tsx:64` | TBD |
| CC-REQ-REVIEW-DECISION-006 | Focus button scrolls timeline to event | • Focus button (eye icon) appears for all events in review panel<br>• Click invokes `onFocusEvent` with event ID<br>• Timeline animates to center event in view window<br>• Event becomes selected for visual highlighting | `src/app/panels/ReviewPanel.tsx:306`<br>`src/App.tsx:handleFocusEvent` | TBD |

## 4. Visual Styling
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-VISUAL-001 | Cards apply session decision classes | • Cards append `session-event-{decision}` when a session decision is provided<br>• No session class is applied when decision is undefined | `src/layout/CardRenderer.tsx:30` | TBD |
| CC-REQ-REVIEW-VISUAL-002 | Session event classes define status styling | • Pending events use dashed orange borders with light orange background<br>• Accepted events use dashed green borders with light green background<br>• Rejected events reduce card opacity | `src/styles/tokens.css:325` | TBD |
| CC-REQ-REVIEW-VISUAL-003 | Session badges highlight pending and accepted events | • Pending badge displays "Pending" with orange border styling<br>• Accepted badge displays "Accepted" with green border styling<br>• Rejected events show no badge | `src/layout/CardRenderer.tsx:224` | TBD |
| CC-REQ-REVIEW-VISUAL-004 | Session events render on timeline during review | • Pending and accepted session events appear in timeline canvas<br>• Session events merge with existing events for layout<br>• Rejected session events are hidden from timeline | `src/App.tsx:MergedEventsProvider` | TBD |
| CC-REQ-REVIEW-VISUAL-005 | Session events appear in minimap | • Minimap shows session events with appropriate colors<br>• Pending events use orange indicator<br>• Accepted events use green indicator | `src/components/TimelineMinimap.tsx:34`<br>`src/styles/index.css:1116` | TBD |
| CC-REQ-REVIEW-VISUAL-006 | Session event anchors use decision colors | • Anchor pill for pending session events uses orange gradient and border<br>• Anchor pill for accepted session events uses green gradient and border<br>• Colors match card styling for visual consistency | `src/layout/DeterministicLayoutComponent.tsx:866` | TBD |

## 5. Navigation Integration
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-NAV-001 | Navigation rail defines a review item | • Review item uses label "Review" with the review icon<br>• Review click uses `onReviewClick` when provided | `src/components/NavigationRail.tsx:328` | TBD |
| CC-REQ-REVIEW-NAV-002 | Review button reflects session status | • Badge displays pending count when an active session exists<br>• Review item is disabled when there is no active session | `src/components/NavigationRail.tsx:325` | TBD |
| CC-REQ-REVIEW-NAV-003 | Review item is inserted after import-export | • Review item is inserted after `import-export` in context sections<br>• Review item only renders when `onReviewClick` prop is supplied | `src/components/NavigationRail.tsx:340`<br>`src/components/NavigationRail.tsx:366` | TBD |

## 6. YAML Import Integration
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-YAML-001 | YAML imports validate file type and size | • Only `.yaml` or `.yml` file extensions are accepted<br>• Files larger than 1MB surface a size error | `src/app/overlays/ImportExportOverlay.tsx:99` | TBD |
| CC-REQ-REVIEW-YAML-002 | Successful YAML parse starts a review session | • Parsed YAML events start a session with source `yaml`<br>• `onSessionStarted` is triggered when provided<br>• Import overlay closes after session creation and resets file input | `src/app/overlays/ImportExportOverlay.tsx:112`<br>`src/app/overlays/ImportExportOverlay.tsx:128` | `tests/home/82-yaml-import-export.spec.ts:161` |
| CC-REQ-REVIEW-YAML-003 | Import tab guides users into review mode | • Drop zone exposes `data-testid="import-dropzone"` and supports click-to-browse<br>• File input accepts `.yaml,.yml` and is hidden behind the drop zone<br>• Helper text clarifies that import starts a review session | `src/app/overlays/ImportExportOverlay.tsx:275`<br>`src/app/overlays/ImportExportOverlay.tsx:316` | `tests/home/82-yaml-import-export.spec.ts:161` |
| CC-REQ-REVIEW-YAML-004 | Paste YAML content for import | • TextField exposes `data-testid="yaml-paste-input"` with monospace font<br>• Import button exposes `data-testid="yaml-paste-import"` and is disabled when empty<br>• Pasted content validates size (max 1MB) and parses same as file import<br>• Successful parse starts review session identical to file import | `src/app/overlays/ImportExportOverlay.tsx:137`<br>`src/app/overlays/ImportExportOverlay.tsx:362` | TBD |

## 7. Import Modes
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-MODE-001 | Import mode selection UI | • Toggle button group exposes `data-testid="import-mode-merge"` and `data-testid="import-mode-overwrite"`<br>• Merge mode is selected by default<br>• User can switch between modes before import | `src/app/overlays/ImportExportOverlay.tsx:40`<br>`src/app/overlays/ImportExportOverlay.tsx:294` | `tests/review/100-import-modes.spec.ts` |
| CC-REQ-REVIEW-MODE-002 | Merge mode behavior | • Events with matching IDs are marked as `update`<br>• Events without matching IDs are marked as `create`<br>• Existing events are preserved unless explicitly updated<br>• `eventsToDelete` is undefined in merge mode | `src/hooks/useImportSession.ts:84` | `src/hooks/useImportSession.test.ts:435` |
| CC-REQ-REVIEW-MODE-003 | Overwrite mode behavior | • All imported events are marked as `create`<br>• Existing event IDs are tracked in `eventsToDelete`<br>• `existingEvent` references are cleared<br>• `importMode` is set to `overwrite` in session | `src/hooks/useImportSession.ts:74` | `src/hooks/useImportSession.test.ts:492` |
| CC-REQ-REVIEW-MODE-004 | Overwrite warning display | • Warning alert exposes `data-testid="overwrite-warning"`<br>• Warning appears when overwrite mode selected and existing events exist<br>• Warning shows count of events that will be deleted | `src/app/overlays/ImportExportOverlay.tsx:315` | `tests/review/100-import-modes.spec.ts:44` |
| CC-REQ-REVIEW-MODE-005 | Overwrite confirmation dialog | • Dialog exposes `data-testid="overwrite-confirm-dialog"`<br>• Dialog appears before starting overwrite import<br>• Dialog shows event counts and deletion warning<br>• Cancel button closes dialog without importing<br>• Proceed button starts the import session | `src/app/overlays/ImportExportOverlay.tsx:440` | `tests/review/100-import-modes.spec.ts:74` |
| CC-REQ-REVIEW-MODE-006 | Overwrite commit deletes existing events | • All events in `eventsToDelete` are deleted via `deleteEvent`<br>• Deletions occur before new events are created<br>• No deletions occur if `eventsToDelete` is empty or undefined | `src/hooks/useImportSession.ts:156` | `src/hooks/useImportSession.test.ts:571` |
| CC-REQ-REVIEW-MODE-007 | Review panel mode indicator | • "Overwrite Mode" chip exposes `data-testid="overwrite-mode-indicator"`<br>• Chip only appears when `session.importMode === 'overwrite'`<br>• Deletion warning exposes `data-testid="overwrite-delete-warning"`<br>• Warning shows count of events to be deleted | `src/app/panels/ReviewPanel.tsx:195`<br>`src/app/panels/ReviewPanel.tsx:208` | `tests/review/100-import-modes.spec.ts:137` |

## 8. Event Diff View (v0.9.4)
| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-REVIEW-DIFF-001 | View Diff button opens modal for UPDATE events | • Button exposes `data-testid="view-diff-button"`<br>• Only shown for events with `action === 'update'` and `existingEvent` present<br>• Clicking opens EventDiffView modal | `src/app/panels/ReviewPanel.tsx:492` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-002 | Modal shows only changed fields | • Only fields with differences between existing and imported are displayed<br>• Unchanged fields are not rendered in diff view<br>• Title, date, endDate, time, description, and sources are compared | `src/app/panels/EventDiffView.tsx:31` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-003 | Word-level diff with green/red highlighting | • Text fields (title, description) use ReactDiffViewer with `DiffMethod.WORDS`<br>• Added text highlighted in green background<br>• Removed text highlighted in red background<br>• Inline unified view (not split view) | `src/app/panels/EventDiffView.tsx:253` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-004 | Simple arrow format for date/time fields | • Date and time fields show `oldValue → newValue` format<br>• Old value has red strikethrough styling<br>• New value has green highlight styling | `src/app/panels/EventDiffView.tsx:138` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-005 | Array diff with +/- prefixes for sources | • Sources use `diffArrays` from diff package<br>• Added sources show `+ ` prefix with green color<br>• Removed sources show `- ` prefix with red color<br>• Unchanged sources show no prefix | `src/app/panels/EventDiffView.tsx:101` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-006 | Keep Existing sets decision to 'rejected' | • Button exposes `data-testid="diff-keep-existing-button"`<br>• Clicking calls `handleReject` with event ID<br>• Modal closes after action | `src/app/panels/ReviewPanel.tsx:600` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-007 | Take Imported sets decision to 'accepted' | • Button exposes `data-testid="diff-take-imported-button"`<br>• Clicking calls `handleAccept` with event ID<br>• Modal closes after action | `src/app/panels/ReviewPanel.tsx:604` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-008 | Close button and Escape key dismiss modal | • Close button exposes `data-testid="diff-close-button"`<br>• Clicking closes modal without changing decision<br>• Escape key triggers onClose | `src/app/panels/EventDiffView.tsx:242` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-009 | Theme-aware diff styling | • Uses `useTheme()` hook to get `isDarkMode`<br>• Passes `useDarkTheme` prop to ReactDiffViewer<br>• Custom styles for both light and dark themes | `src/app/panels/EventDiffView.tsx:33` | Manual verification |
| CC-REQ-REVIEW-DIFF-010 | No changes state display | • If UPDATE event has no actual content changes, display "No differences detected" message<br>• Message centered with secondary text styling<br>• Element exposes `data-testid="diff-no-changes"` | `src/app/panels/EventDiffView.tsx:373` | `tests/review/102-event-diff-view.spec.ts` |
| CC-REQ-REVIEW-DIFF-011 | Accessible diff markup | • Uses semantic `<del>` and `<ins>` HTML elements<br>• Screen reader text via `sr-only` class for non-visual context<br>• Decorative icons marked with `aria-hidden="true"` | `src/app/panels/EventDiffView.tsx:172` | Manual verification |
