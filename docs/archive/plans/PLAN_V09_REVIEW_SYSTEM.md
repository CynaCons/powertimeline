# v0.9.x Plan: Unified Review System

## Vision
Create a **central Review system** that handles all incoming event changes from any source:
- YAML Import
- AI Chat (Gemini)
- Future: Pull Requests / Merge from forked timelines
- Future: Claude Code MCP proposals

All incoming changes flow through the same **"Temporary → Review → Accept/Reject → Persist"** pipeline.

---

## Current State Analysis

### Existing AI Review Workflow (v0.7.x)
| Component | Location | Purpose |
|-----------|----------|---------|
| `useAISession` | `src/hooks/useAISession.ts` | Manages pendingActions state |
| `ChatPanel` | `src/app/panels/ChatPanel.tsx` | UI for approve/reject/apply |
| `aiActionHandlers` | `src/lib/aiActionHandlers.ts` | Executes approved actions |
| `aiService` | `src/services/aiService.ts` | Gemini API integration |

**Current Limitations:**
1. **React state only** - Lost on page refresh
2. **Coupled to ChatPanel** - Can't use from YAML import
3. **No localStorage persistence** - Can't resume review session
4. **Preview events** - Derived on-the-fly, not stored

### Existing YAML Import (v0.5.27)
| Component | Location | Purpose |
|-----------|----------|---------|
| `ImportExportOverlay` | `src/app/overlays/ImportExportOverlay.tsx` | File upload UI |
| `yamlSerializer` | `src/services/yamlSerializer.ts` | Parse/serialize YAML |
| `timelineImportExport` | `src/services/timelineImportExport.ts` | Import/export logic |

**Current Behavior:**
- Import immediately writes to Firestore (no review step!)
- No preview of incoming events
- Merge-by-ID: matching IDs update, new IDs add

---

## Proposed Architecture

### Core Concept: **PendingChanges Store**

```
┌─────────────────────────────────────────────────────────────────┐
│                     PENDING CHANGES STORE                        │
│  (localStorage + React Context)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Source: 'yaml-import' | 'ai-chat' | 'pull-request' | 'mcp'    │
│  Events: PendingEvent[]                                          │
│  Status: 'pending' | 'approved' | 'rejected'                     │
│  UserEdits: Map<eventId, EditedFields>                          │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────────┐      ┌────────────┐
   │  YAML   │         │   AI Chat   │      │    MCP     │
   │ Import  │         │   (Gemini)  │      │ Proposals  │
   └─────────┘         └─────────────┘      └────────────┘
```

### Data Flow

```
1. INGEST (from any source)
   ├─ YAML file parsed → PendingEvent[] created
   ├─ AI response parsed → PendingEvent[] created
   └─ MCP proposal received → PendingEvent[] created

2. STORE (localStorage + Context)
   ├─ pendingEvents persisted to localStorage
   ├─ React Context provides reactive updates
   └─ Survives page refresh

3. REVIEW (unified ReviewPanel)
   ├─ List of pending events with status
   ├─ Approve/Reject buttons per event
   ├─ Click to edit in AuthoringOverlay
   └─ Batch approve/reject all

4. PREVIEW (timeline visualization)
   ├─ Pending events rendered with highlight style
   ├─ Visual indicator (dashed border, badge, opacity)
   └─ Can select and edit like real events

5. APPLY (user action)
   ├─ Approved events → addEvent() to Firestore
   ├─ Status updated to 'applied'
   └─ Removed from pending store

6. UNDO (optional)
   ├─ Applied event → deleteEvent() from Firestore
   ├─ Event moved back to pending store
   └─ Status reset to 'pending'
```

---

## Key Design Decisions

### 1. Storage Strategy
| Data | Storage | Reason |
|------|---------|--------|
| Pending events | localStorage | Survive refresh, resume session |
| Edit history | localStorage | Track user modifications |
| Applied status | localStorage | Know what was applied this session |
| Real events | Firestore | Permanent persistence |

**localStorage Key:** `powertimeline:pending:{timelineId}`

### 2. Event Status Lifecycle
```
                    ┌──────────────┐
                    │   PENDING    │ ← Initial state from any source
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              │              ▼
     ┌──────────┐          │       ┌──────────┐
     │ APPROVED │          │       │ REJECTED │
     └────┬─────┘          │       └────┬─────┘
          │                │            │
          ▼                │            │ (restore)
     ┌──────────┐          │            │
     │ APPLIED  │──────────┴────────────┘
     └────┬─────┘          (un-apply)
          │
          ▼
     [In Firestore]
```

### 3. Unified Review Panel
Replace ChatPanel's action list with a **standalone ReviewPanel** that:
- Can be opened from NavRail (like Stream View)
- Shows pending events from ALL sources
- Groups by source (YAML Import, AI Chat, etc.)
- Provides approve/reject/edit controls
- Shows diff for UPDATE actions

### 4. Preview Event Visualization
Pending events rendered on timeline with:
- **Dashed border** (vs solid for real events)
- **Badge** showing source (YAML, AI, PR)
- **Opacity 0.8** to indicate temporary
- **Click to edit** in AuthoringOverlay
- **Status indicator** (pending/approved/rejected)

---

## Implementation Phases

### Phase 1: PendingChanges Infrastructure (v0.9.0)
**Goal:** Create the core pending changes store and hooks

**Tasks:**
- [ ] Create `src/types/pendingChanges.ts` with types
- [ ] Create `src/hooks/usePendingChanges.ts` hook
- [ ] Create `src/contexts/PendingChangesContext.tsx`
- [ ] Implement localStorage persistence
- [ ] Add clear/reset functionality
- [ ] Write unit tests

**Types:**
```typescript
interface PendingEvent {
  id: string;                    // Temporary ID (uuid)
  source: 'yaml-import' | 'ai-chat' | 'pull-request' | 'mcp';
  sourceId?: string;             // Original action ID from AI, PR ID, etc.
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  action: 'create' | 'update' | 'delete';
  event: Partial<TimelineEvent>; // The event data
  originalEvent?: TimelineEvent; // For updates: the original
  userEdits?: Partial<TimelineEvent>; // User modifications
  timestamp: number;             // When added
}

interface PendingChangesState {
  timelineId: string;
  events: PendingEvent[];
  lastModified: number;
}
```

### Phase 2: Review Panel UI (v0.9.1)
**Goal:** Create unified ReviewPanel component

**Tasks:**
- [ ] Create `src/app/panels/ReviewPanel.tsx`
- [ ] Event list with status badges
- [ ] Approve/Reject buttons per event
- [ ] Approve All / Reject All batch actions
- [ ] Apply button (writes to Firestore)
- [ ] Filter by source, status
- [ ] Group by source with collapsible sections
- [ ] Add to NavRail with badge showing count

**UI Layout:**
```
┌─────────────────────────────────────┐
│ Review Pending Changes         [X]  │
│ ─────────────────────────────────── │
│ 📥 YAML Import (3 events)      [▼]  │
│   ┌─────────────────────────────┐   │
│   │ ○ Battle of Waterloo        │   │
│   │   1815-06-18 • CREATE       │   │
│   │   [✓ Approve] [✗ Reject]    │   │
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │ ✓ Congress of Vienna        │   │
│   │   1814-09-18 • CREATE       │   │
│   │   [Approved] [Undo]         │   │
│   └─────────────────────────────┘   │
│ ─────────────────────────────────── │
│ 🤖 AI Chat (2 events)          [▼]  │
│   ...                               │
│ ─────────────────────────────────── │
│ [Approve All (3)] [Apply (2)]       │
└─────────────────────────────────────┘
```

### Phase 3: Timeline Preview Integration (v0.9.2)
**Goal:** Render pending events on timeline with visual distinction

**Tasks:**
- [ ] Merge pending events into timeline visualization
- [ ] Add visual styles for pending events (dashed border, badge)
- [ ] Handle click on pending event → open editor
- [ ] Save edits to pending store (not Firestore)
- [ ] Show/hide pending events toggle
- [ ] Minimap indication for pending events

### Phase 4: YAML Import Integration (v0.9.3)
**Goal:** Route YAML import through pending changes system

**Tasks:**
- [ ] Modify ImportExportOverlay to create PendingEvents
- [ ] Remove direct Firestore write from import
- [ ] Show import preview before adding to pending
- [ ] Detect duplicates (same ID exists in timeline)
- [ ] Handle update vs create logic
- [ ] Add "Import & Review" vs "Import & Apply" options

### Phase 5: AI Chat Migration (v0.9.4)
**Goal:** Migrate AI chat to use unified pending system

**Tasks:**
- [ ] Refactor useAISession to use usePendingChanges
- [ ] Remove duplicate pending state management
- [ ] Keep ChatPanel for chat UI only
- [ ] Actions flow to ReviewPanel automatically
- [ ] Maintain backward compatibility

### Phase 6: Un-Apply Feature (v0.9.5)
**Goal:** Allow reverting applied events back to pending

**Tasks:**
- [ ] Add "Un-apply" button to recently applied events
- [ ] Delete from Firestore on un-apply
- [ ] Move back to pending store
- [ ] Time limit on un-apply (e.g., 5 minutes)
- [ ] Confirmation dialog for un-apply

---

## UI Integration Points

### NavRail Updates
```
Current:
├─ Home
├─ Stream View
├─ Import/Export
├─ AI Chat
└─ Settings

Proposed:
├─ Home
├─ Stream View
├─ Import/Export
├─ AI Chat
├─ Review (NEW) ← Badge with pending count
└─ Settings
```

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Alt+R | Open Review Panel |
| Alt+I | Open Import/Export |
| Alt+A | Approve selected pending event |
| Alt+X | Reject selected pending event |

### Visual Language
| State | Border | Background | Badge |
|-------|--------|------------|-------|
| Pending | Dashed orange | Transparent | "PENDING" |
| Approved | Dashed green | Green/10% | "APPROVED" |
| Rejected | Dashed red | Red/10% | "REJECTED" |
| Applied | Solid (normal) | Normal | None |

---

## Migration Strategy

### Phase 1-2: Parallel Systems
- New pending system runs alongside existing AI workflow
- YAML import updated to use new system
- AI chat still uses old pendingActions

### Phase 3-4: Integration
- AI chat migrated to new system
- Old pendingActions code deprecated
- Both sources flow to ReviewPanel

### Phase 5+: Cleanup
- Remove old AI action management code
- Simplify ChatPanel to chat-only
- Document new architecture

---

## Testing Strategy

### Unit Tests
- `usePendingChanges` hook: CRUD operations, localStorage sync
- Status transitions: pending → approved → applied
- Edge cases: duplicate IDs, invalid data

### E2E Tests
- Import YAML → Review → Apply → Verify in Firestore
- AI suggest → Review → Edit → Apply → Verify
- Apply → Un-apply → Verify deleted from Firestore
- Page refresh → Pending events restored

### Integration Tests
- Multiple sources adding pending events
- Concurrent editing of pending events
- Large batch operations (50+ events)

---

## Open Questions

1. **Merge vs Replace**: When importing events with same ID, should we:
   - Show diff and let user choose?
   - Always create UPDATE action?
   - Warn and skip duplicates?

2. **Session vs Timeline scope**: Should pending changes be:
   - Per-timeline (current design)?
   - Global (all timelines)?
   - Per-session (lost on logout)?

3. **Collaboration**: If multiple users import to same timeline:
   - First-come-first-served?
   - Conflict detection?
   - (Defer to v1.0 PR system?)

4. **Undo depth**: How many applied events can be un-applied?
   - Last N events?
   - Time-based (5 min window)?
   - All from current session?

---

## Success Criteria

- [ ] YAML import flows through review before persisting
- [ ] AI chat uses same review system
- [ ] Pending events visible on timeline with distinct style
- [ ] User can edit pending events before applying
- [ ] Page refresh preserves pending events
- [ ] Applied events can be un-applied within time window
- [ ] ReviewPanel shows all sources in unified view
