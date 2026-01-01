# PowerTimeline Requirements Index & Dashboard

**Last Updated:** 2025-12-31
**Version:** v0.8.3.1

---

## 📊 Requirements Dashboard

### Overall Status

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Requirements** | ~352 | 100% |
| **Implemented** | ~200 | 57% |
| **Verified (with tests)** | ~119 | 34% |
| **In Progress** | ~10 | 3% |
| **Planned (TBD)** | ~152 | 43% |

### By Feature Area

| Feature Area | Requirements | File | Implemented | Verified |
|--------------|--------------|------|-------------|----------|
| Foundation & Core Rendering | 2 | [SRS_FOUNDATION.md](SRS_FOUNDATION.md) | 2 (100%) | 2 (100%) |
| Layout & Positioning | 18 | [SRS_LAYOUT.md](SRS_LAYOUT.md) | 18 (100%) | 18 (100%) |
| Card System & Degradation | 15 | [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) | 15 (100%) | 15 (100%) |
| Zoom & Navigation | 8 | [SRS_ZOOM.md](SRS_ZOOM.md) | 8 (100%) | 8 (100%) |
| Minimap | 12 | [SRS_MINIMAP.md](SRS_MINIMAP.md) | 10 (83%) | 8 (67%) |
| Timeline Axis & Scales | 5 | [SRS.md](SRS.md#8-timeline-axis--scales) | 5 (100%) | 5 (100%) |
| User Interface & Panels | 8 | [SRS.md](SRS.md#9-user-interface--panels) | 8 (100%) | 6 (75%) |
| Data Management & Export | 15 | [SRS_EDITOR_IMPORT_EXPORT.md](SRS_EDITOR_IMPORT_EXPORT.md) | 15 (100%) | 15 (100%) |
| Visual Design & Theming | 3 | [SRS.md](SRS.md#11-visual-design--theming) | 3 (100%) | 2 (67%) |
| Event Interaction | 5 | [SRS.md](SRS.md#15-event-interaction) | 5 (100%) | 3 (60%) |
| Home Page & Discovery | 35+ | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) | 30 (86%) | 15 (43%) |
| Timeline Creation & Management | 18 | [SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md) | 18 (100%) | 16 (89%) |
| Admin Panel | 25+ | [SRS_ADMIN_PANEL.md](SRS_ADMIN_PANEL.md) | 25 (100%) | 13 (52%) |
| Timeline Editor Page | 28 | [SRS_TIMELINE_EDITOR.md](SRS_TIMELINE_EDITOR.md) | 28 (100%) | 6 (21%) |
| User Profile Page | 30 | [SRS_USER_PAGE.md](SRS_USER_PAGE.md) | 30 (100%) | 10 (33%) |
| User Settings Page | 23 | [SRS_USER_SETTINGS_PAGE.md](SRS_USER_SETTINGS_PAGE.md) | 23 (100%) | 8 (35%) |
| Stream View | 45 | [SRS_STREAM_VIEW.md](SRS_STREAM_VIEW.md) | 45 (100%) | 12 (27%) |
| Landing Page | 15 | [SRS_LANDING_PAGE.md](SRS_LANDING_PAGE.md) | 15 (100%) | 5 (33%) |
| Event Sources | 37 | [SRS_EVENT_SOURCES.md](SRS_EVENT_SOURCES.md) | 37 (100%) | 10 (27%) |
| AI Integration | 98 | [SRS_AI_INTEGRATION.md](SRS_AI_INTEGRATION.md) | 50 (51%) | 15 (15%) |
| API Key Storage | 12 | [SRS_API_KEY_STORAGE.md](SRS_API_KEY_STORAGE.md) | 0 (0%) | 0 (0%) |
| Onboarding & Tours | 25 | [SRS_ONBOARDING.md](SRS_ONBOARDING.md) | 25 (100%) | 8 (32%) |
| **TOTAL** | **~352** | Multiple files | **~200 (57%)** | **~119 (34%)** |

Note: Stream View now replaces the deprecated Events/Outline panel for event browsing (Alt+E shortcut removed); see `docs/SRS_TIMELINE_EDITOR.md` and `docs/SRS_STREAM_VIEW.md`.

---

## 🗂️ Requirements by Feature Area

### 1. Foundation & Core Rendering
**Status:** ✅ Complete
**Documentation:** [SRS_FOUNDATION.md](SRS_FOUNDATION.md)

Core rendering guarantees for timeline startup and initial display:
- CC-REQ-FOUND-001: Timeline axis rendering (v5/01)
- CC-REQ-CARDS-001: Default seed card placement (v5/02)

---

### 2. Layout & Positioning
**Status:** ✅ Complete
**Documentation:** [SRS_LAYOUT.md](SRS_LAYOUT.md)

Deterministic half-column layout engine with spatial clustering:
- 18 detailed requirements covering collision detection, half-column placement, spatial clustering
- Tests: v5/03, v5/10-16, v5/66-70

**Key Requirements:**
- CC-REQ-LAYOUT-001: Half-column system
- CC-REQ-LAYOUT-COLLISION-001: Collision detection
- CC-REQ-LAYOUT-XALIGN-001: X-alignment within half-columns

---

### 3. Card System & Degradation
**Status:** ✅ Complete
**Documentation:** [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) | [SDS_CARDS_SYSTEM.md](SDS_CARDS_SYSTEM.md)

Multi-level card degradation system (full → compact → title-only):
- 15 requirements covering card types, degradation logic, cluster coordination, overflow management
- Tests: v5/03, v5/36-49, v5/56, v5/67-70

**Key Requirements:**
- CC-REQ-CARD-FULL-001: Full cards (169px height)
- CC-REQ-CARD-COMPACT-001: Compact cards (92px height)
- CC-REQ-CARD-TITLE-ONLY-001: Title-only cards (32px height)
- CC-REQ-DEGRADATION-001: Automatic degradation cascade
- CC-REQ-CLUSTER-COORD-001: Spatial cluster coordination
- CC-REQ-MIXED-TYPES-001: Mixed card type rules

---

### 4. Zoom & Navigation
**Status:** ✅ Complete
**Documentation:** [SRS_ZOOM.md](SRS_ZOOM.md)

Cursor-anchored zoom and drag-to-zoom selection:
- 8 requirements covering zoom stability, edge cases, view window filtering
- Tests: v5/17-20, v5/23-25, v5/28-29

**Key Requirements:**
- CC-REQ-ZOOM-001: Cursor-anchored zoom
- CC-REQ-ZOOM-002: Edge case handling
- CC-REQ-ZOOM-003: Minute-level precision

---

### 5. Minimap
**Status:** 🟡 Mostly Complete (83%)
**Documentation:** [SRS_MINIMAP.md](SRS_MINIMAP.md)

Timeline overview minimap with navigation and event highlighting:
- 12 requirements covering display, navigation, highlighting, overlay integration
- Tests: v5/21-22, v5/26-27, v5/63

**Key Requirements:**
- CC-REQ-MINIMAP-DISPLAY-001: Range display with labels
- CC-REQ-MINIMAP-NAV-001: Click navigation
- CC-REQ-MINIMAP-NAV-002: Drag view window
- CC-REQ-MINIMAP-HIGHLIGHT-001: Selected event highlighting

**In Progress:**
- CC-REQ-MINIMAP-OVERLAY-001: Overlay integration (partially tested)
- CC-REQ-MINIMAP-INTERACTION-002: Touch gesture support (planned)

---

### 6. Timeline Axis & Scales
**Status:** ✅ Complete
**Documentation:** [SRS.md Section 8](SRS.md#8-timeline-axis--scales)

Adaptive timeline scales with multi-level labels:
- 5 requirements covering scale adaptation, date alignment, visual styling
- Tests: v5/34-35, v5/62, v5/64

**Key Requirements:**
- CC-REQ-AXIS-001: Adaptive scale labels (decades → years → months → days → hours)
- CC-REQ-AXIS-002: Scale-date alignment accuracy
- CC-REQ-AXIS-003: Solid black styling (no gradients)

---

### 7. User Interface & Panels
**Status:** 🟡 Mostly Complete (75%)
**Documentation:** [SRS.md Section 9](SRS.md#9-user-interface--panels)

Navigation rail, panels, and overlay system:
- 8 requirements covering panel visibility, authoring overlay, keyboard shortcuts
- Tests: v5/50-53, v5/55

**Key Requirements:**
- CC-REQ-UI-001: Panel toggle and visibility
- CC-REQ-UI-002: Event creation/editing interface
- CC-REQ-UI-003: Keyboard navigation support

---

### 8. Home Page & Discovery
**Status:** 🟡 In Progress (86% implemented, 43% verified)
**Documentation:** [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md)

Landing page, user directory, timeline browsing:
- 35+ requirements covering search, user workspace, statistics, activity feeds, routing
- Tests: v5/71-73, tests/home/01-smoke.spec.ts

**Feature Areas:**
- **Search & Discovery** (4 requirements): CC-REQ-SEARCH-001 to 004
- **My Timelines Section** (5 requirements): CC-REQ-MYTIMELINES-001 to 005
- **Platform Statistics** (6 requirements): CC-REQ-STATS-001 to 006
- **Recently Edited Feed** (3 requirements): CC-REQ-RECENT-001 to 003
- **Popular Timelines** (3 requirements): CC-REQ-POPULAR-001 to 003
- **Featured Timelines** (3 requirements): CC-REQ-FEATURED-001 to 003
- **User Profiles** (5 requirements): CC-REQ-PROFILE-001 to 005
- **URL Routing** (6 requirements): CC-REQ-ROUTING-001 to 006

**In Progress:**
- Many requirements have "TBD" for test coverage
- Admin tests failing (tests/admin/*.spec.ts)
- Authentication integration incomplete

---

### 9. Timeline Creation & Management
**Status:** ✅ Complete (89% verified)
**Documentation:** [SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md)

Full CRUD operations for timeline management:
- 18 requirements covering create, edit, delete, ID generation, validation, persistence
- Tests: v5/74-77, v5/80

**Feature Areas:**
- **Timeline Creation** (6 requirements): CC-REQ-CREATE-001 to 006
- **ID Generation** (3 requirements): CC-REQ-CREATE-ID-001 to 003
- **Timeline Editing** (4 requirements): CC-REQ-EDIT-001 to 004
- **Timeline Deletion** (3 requirements): CC-REQ-DELETE-001 to 003
- **Visibility Controls** (7 requirements): CC-REQ-VISIBILITY-001 to 007

---

### 10. Admin Panel
**Status:** 🟡 Implemented but Tests Failing (52% verified)
**Documentation:** [SRS_ADMIN_PANEL.md](SRS_ADMIN_PANEL.md)

Platform administration interface:
- 25+ requirements covering user management, statistics, bulk operations, activity logging
- Tests: tests/admin/82-86.spec.ts, tests/admin/01-reset-statistics.spec.ts

**Feature Areas:**
- **Access Control** (3 requirements): CC-REQ-ADMIN-ACCESS-001 to 003
- **User Management** (8 requirements): CC-REQ-ADMIN-USER-001 to 008
- **Statistics Dashboard** (6 requirements): CC-REQ-ADMIN-STATS-001 to 006
- **Bulk Operations** (4 requirements): CC-REQ-ADMIN-BULK-001 to 004
- **Activity Logging** (5 requirements): CC-REQ-ADMIN-LOG-001 to 005

**Known Issues:**
- All admin panel tests currently failing (0/23 failing)
- Likely due to authentication/routing changes in v0.5.x
- Needs investigation and fixes in v0.5.6

---

## 🔍 Quick Requirement Lookup

### By Requirement ID Prefix

| Prefix | Feature Area | Document |
|--------|--------------|----------|
| CC-REQ-FOUND-* | Foundation & Core | [SRS_FOUNDATION.md](SRS_FOUNDATION.md) |
| CC-REQ-LAYOUT-* | Layout & Positioning | [SRS_LAYOUT.md](SRS_LAYOUT.md) |
| CC-REQ-CARD-* | Card System | [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) |
| CC-REQ-DEGRADATION-* | Degradation Logic | [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) |
| CC-REQ-CLUSTER-* | Cluster Coordination | [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) |
| CC-REQ-OVERFLOW-* | Overflow Management | [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) |
| CC-REQ-CAPACITY-* | Capacity Management | [SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md) |
| CC-REQ-ZOOM-* | Zoom & Navigation | [SRS_ZOOM.md](SRS_ZOOM.md) |
| CC-REQ-MINIMAP-* | Minimap | [SRS_MINIMAP.md](SRS_MINIMAP.md) |
| CC-REQ-AXIS-* | Timeline Axis | [SRS.md](SRS.md) |
| CC-REQ-ANCHOR-* | Anchors & Alignment | [SRS.md](SRS.md) |
| CC-REQ-UI-* | User Interface | [SRS.md](SRS.md) |
| CC-REQ-DATA-* | Data Management | [SRS.md](SRS.md) |
| CC-REQ-VISUAL-* | Visual Design | [SRS.md](SRS.md) |
| CC-REQ-SEARCH-* | Search & Discovery | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-MYTIMELINES-* | My Timelines | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-STATS-* | Platform Statistics | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-RECENT-* | Recently Edited | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-POPULAR-* | Popular Timelines | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-FEATURED-* | Featured Timelines | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-PROFILE-* | User Profiles | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-ROUTING-* | URL Routing | [SRS_HOME_PAGE.md](SRS_HOME_PAGE.md) |
| CC-REQ-CREATE-* | Timeline Creation | [SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md) |
| CC-REQ-EDIT-* | Timeline Editing | [SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md) |
| CC-REQ-DELETE-* | Timeline Deletion | [SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md) |
| CC-REQ-VISIBILITY-* | Visibility Controls | [SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md) |
| CC-REQ-ONBOARD-* | Empty State CTA | [SRS_ONBOARDING.md](SRS_ONBOARDING.md) |
| CC-REQ-TOUR-* | Guided Tour System | [SRS_ONBOARDING.md](SRS_ONBOARDING.md) |
| CC-REQ-TOUR-EDIT-* | Editor Tour | [SRS_ONBOARDING.md](SRS_ONBOARDING.md) |
| CC-REQ-TOUR-HOME-* | Home Page Tour | [SRS_ONBOARDING.md](SRS_ONBOARDING.md) |
| CC-REQ-HELP-* | NavRail Help | [SRS_ONBOARDING.md](SRS_ONBOARDING.md) |
| CC-REQ-ADMIN-* | Admin Panel | [SRS_ADMIN_PANEL.md](SRS_ADMIN_PANEL.md) |
| CC-REQ-SOURCES-* | Event Sources | [SRS_EVENT_SOURCES.md](SRS_EVENT_SOURCES.md) |
| CC-REQ-APIKEY-* | API Key Storage | [SRS_API_KEY_STORAGE.md](SRS_API_KEY_STORAGE.md) |

---

## 📝 Documentation Hierarchy

### Primary Documents
1. **[SRS.md](SRS.md)** - Main requirements specification (index and core requirements)
2. **[PRD.md](../PRD.md)** - Product requirements and vision
3. **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Technical architecture and design decisions
4. **[PLAN.md](../PLAN.md)** - Implementation plan and iteration history

### Detailed SRS Documents
- **[SRS_FOUNDATION.md](SRS_FOUNDATION.md)** - Foundation & core rendering (2 requirements)
- **[SRS_LAYOUT.md](SRS_LAYOUT.md)** - Layout & positioning system (18 requirements)
- **[SRS_CARDS_SYSTEM.md](SRS_CARDS_SYSTEM.md)** - Card degradation & overflow (15 requirements)
- **[SDS_CARDS_SYSTEM.md](SDS_CARDS_SYSTEM.md)** - Card system design specification (technical)
- **[SRS_ZOOM.md](SRS_ZOOM.md)** - Zoom & navigation (8 requirements)
- **[SRS_MINIMAP.md](SRS_MINIMAP.md)** - Minimap system (12 requirements)
- **[SRS_HOME_PAGE.md](SRS_HOME_PAGE.md)** - Home page & discovery (35+ requirements)
- **[SRS_TIMELINE_CREATION.md](SRS_TIMELINE_CREATION.md)** - Timeline CRUD (18 requirements)
- **[SRS_ADMIN_PANEL.md](SRS_ADMIN_PANEL.md)** - Admin interface (25+ requirements)
- **[SRS_ONBOARDING.md](SRS_ONBOARDING.md)** - Onboarding & guided tours (25 requirements)
- **[SRS_EVENT_SOURCES.md](SRS_EVENT_SOURCES.md)** - Event sources & citations (37 requirements)
- **[SRS_API_KEY_STORAGE.md](SRS_API_KEY_STORAGE.md)** - API key storage for AI features (12 requirements)
- **[SRS_UI_AUDIT.md](SRS_UI_AUDIT.md)** - UI requirements audit and fixes

### Design Documents
- **[SDS_CARDS_SYSTEM.md](SDS_CARDS_SYSTEM.md)** - Software Design Specification for card system
- **[TESTS.md](TESTS.md)** - Test status and organization

---

### 11. Onboarding & Guided Tours
**Status:** 🔵 Proposed (0% implemented, 0% verified)
**Documentation:** [SRS_ONBOARDING.md](SRS_ONBOARDING.md)

User onboarding system with empty state CTAs and interactive guided tours:
- 25 requirements covering empty state CTAs, tour system, editor/home tours, help integration
- Tests: Planned (TBD)

**Feature Areas:**
- **Empty State CTA** (4 requirements): CC-REQ-ONBOARD-001 to 004
- **Guided Tour System** (5 requirements): CC-REQ-TOUR-001 to 005
- **Editor Tour** (8 requirements): CC-REQ-TOUR-EDIT-001 to 008
- **Home Page Tour** (5 requirements): CC-REQ-TOUR-HOME-001 to 005
- **NavRail Help Integration** (3 requirements): CC-REQ-HELP-001 to 003

**Technology:**
- React Joyride for tour implementation
- localStorage for tour completion tracking
- CSS variables for dark mode theming

**In Progress:**
- All 25 requirements pending implementation
- Test coverage needed for all areas

---

### 12. Event Sources
**Status:** 🔵 Planned (0% implemented, 0% verified)
**Documentation:** [SRS_EVENT_SOURCES.md](SRS_EVENT_SOURCES.md)

Event sources allow users to cite references, links, or notes that support timeline events:
- 37 requirements covering data model, editor view (with drag-and-drop reordering), stream view, canvas view, read-only mode
- Tests: Planned (tests/editor/event-sources.spec.ts, tests/stream/event-sources.spec.ts)

**Feature Areas:**
- **Data Model** (6 requirements): CC-REQ-SOURCES-001 to 012
- **Editor View** (16 requirements): CC-REQ-SOURCES-020 to 052
- **Stream View** (6 requirements): CC-REQ-SOURCES-060 to 072
- **Canvas View** (2 requirements): CC-REQ-SOURCES-080 to 081
- **Read-Only Mode** (3 requirements): CC-REQ-SOURCES-090 to 092

**In Progress:**
- All 33 requirements pending implementation
- Test coverage needed for all areas

---

### 13. API Key Storage
**Status:** 🔵 Proposed (0% implemented, 0% verified)
**Documentation:** [SRS_API_KEY_STORAGE.md](SRS_API_KEY_STORAGE.md)

Secure API key handling for AI features with multiple storage modes:
- 12 requirements covering storage modes (localStorage, user-provided, server-side), security/trust guarantees, ChatPanel integration, Settings UI
- Tests: Planned (TBD)

**Feature Areas:**
- **Storage Modes** (4 requirements): CC-REQ-APIKEY-001 to 004
- **Security & Trust** (3 requirements): CC-REQ-APIKEY-010 to 012
- **ChatPanel Integration** (3 requirements): CC-REQ-APIKEY-020 to 022
- **Settings UI** (2 requirements): CC-REQ-APIKEY-030 to 031

**In Progress:**
- All 12 requirements pending implementation
- Test coverage needed for all areas

---

## ⚠️ Known Issues & Gaps

### High Priority
1. **Admin Panel Tests** (0/23 passing → partial fix in v0.5.15.1)
   - Root cause: Missing `data-testid="admin-heading"` in AdminPage.tsx
   - Fix applied: Added test ID and fixed dialog selector
   - Remaining: T83, T84, T86 may need additional selector updates
   - Related: tests/admin/82-86.spec.ts

2. **Home Page Test Coverage** (43% verified)
   - Search functionality: 0% tested
   - Recently Edited feed: 0% tested
   - Popular feed: 0% tested
   - Private timeline filtering: 0% tested
   - Need 4 new test files: 77-search, 78-recent, 79-popular, 81-private

### Resolved (v0.5.7)
- ✅ **Authentication System Complete** - Firebase Auth deployed to production
- ✅ **Firestore Security Rules** - Visibility-based access control enabled
- ✅ **Backwards Compatibility** - Rules handle timelines without visibility field

### Medium Priority
3. **Minimap Hover Highlighting** (CC-REQ-MINIMAP-HIGHLIGHT-002)
   - Implemented but no test coverage

4. **Touch Gesture Support** (CC-REQ-MINIMAP-INTERACTION-002)
   - Planned but not yet implemented
   - Deferred to v0.6.x

---

## 🎯 Maintenance Notes

### Single Source of Truth
- **SRS Documents** = Single source of truth for requirement status
- **PLAN.md** = Historical record of when work was completed
- When marking requirements as "Implemented" or "Verified", update the SRS document, not PLAN.md

### Preventing Drift
To prevent inconsistencies between PLAN.md and SRS documents:
1. Always reference requirement IDs in PLAN.md tasks
2. Update SRS status fields when closing PLAN.md tasks
3. Use CI checks to validate requirement ID references (planned in v0.5.5 Phase 5)

### Adding New Requirements
When adding new requirements:
1. Choose appropriate SRS document based on feature area
2. Assign stable requirement ID following naming convention (CC-REQ-AREA-NNN)
3. Include: Requirement statement, Acceptance Criteria, Code references, Test references
4. Set initial status: "Proposed" → "Approved" → "Implemented" → "Verified"
5. Update this index with new requirement counts

### Document Updates
This index should be updated when:
- New SRS documents are created
- Requirements are added, modified, or removed
- Implementation status changes significantly
- Test coverage improves

**Last audit:** 2025-12-31 (v0.8.3.1)
**Next audit:** After v0.9.0 completion

---

## 📚 Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [README.md](../README.md) - Project overview and quick start
- [PLAN.md](../PLAN.md) - Implementation history
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture

---

**Generated as part of v0.5.5 - Documentation & Navigation Improvements**
