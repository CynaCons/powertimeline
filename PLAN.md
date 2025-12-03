# PowerTimeline Implementation Plan

## Quick Summary

**Current Version:** v0.5.25 (PowerSpawn standalone extraction complete)
**Next Milestone:** v0.5.28 - Test Sweep Fixes, v0.5.29 - PowerSpawn Tests, v0.5.26 - Import/Export

### Key Metrics
- **Total Iterations:** 200+ completed (v0.2.0 → v0.5.21)
- **Requirements:** ~155 total ([SRS Index](docs/SRS_INDEX.md))
- **Implementation:** ~150 requirements (97%)
- **Test Coverage:** ~113 requirements verified (73%)
- **Test Suite:** 320 Playwright tests ([Test Status](#test-status))
- **Production Tests:** 22/22 passing (v0.5.15)

### Recent Achievements (v0.5.x)
- ✅ Firebase Authentication & public browsing (v0.5.1-v0.5.7)
- ✅ Documentation, test organization, vision update (v0.5.8-v0.5.10)
- ✅ Test stabilization & legacy code cleanup (v0.5.11)
- ✅ Firestore schema cleanup (v0.5.12)
- ✅ Multi-agent orchestration MCP server (v0.5.13)
- ✅ Username-based URLs & navigation fixes (v0.5.14)
- ✅ MCP server hardening & Codex write access (v0.5.15)
- ✅ Stats caching & visibility fixes (v0.5.17)
- ✅ Timeline Card Menu & Landing Page (v0.5.18)
- ✅ Landing Page Roadmap section (v0.5.19)
- ✅ Editor Dark Theme fixes (v0.5.20-v0.5.21)
- ✅ Cloud Functions for platform stats (v0.5.22)
- ✅ Event Editor read-only mode & visual rework (v0.5.23)
- ✅ Dev Panel removal & test migration (v0.5.24)
- ✅ PowerSpawn standalone extraction & submodule (v0.5.25)

### Next Up
- **v0.5.28**: Test Sweep Corrective Actions (env config, anchor alignment)
- **v0.5.29**: PowerSpawn Test Suite (unit, integration, E2E)
- **v0.5.26**: Import/Export with AI-ready YAML format
- **v0.5.27**: Stream Editor (mobile-first, git-style notepad editor)

### Test Status
- **Suite:** 320 tests in 92 files
- **Production Tests:** 22/22 passing
- **Dev Tests:** Running (requires .env.test credentials)

### Quick Links
- [Implementation History](docs/PLAN_HISTORY.md) - Completed iterations (v0.0.x - v0.4.x)
- [Requirements Dashboard](docs/SRS_INDEX.md) - Complete requirements overview
- [Product Requirements](PRD.md) - Product vision and user stories
- [Architecture](ARCHITECTURE.md) - Technical design decisions
- [README](README.md) - Getting started guide

---

## 📝 Format Rules

**Format Rules:**
- Iterations: Version number + brief title
- Goal: One-line objective statement (optional)
- Status: Complete/In Progress (only if in progress)
- Tasks: Simple checkbox items only (no sub-bullets, no implementation details)
- NO "Files Modified" sections (use git for that)
- NO "Impact" sections (tasks describe the work)
- NO "Key Accomplishments" or verbose summaries
- Known Issues: Brief bullet points only
- Close iterations chronologically - don't skip ahead
- Move incomplete tasks to future iterations, don't leave them in closed ones

---


# Phase 2: Backend & Authentication (v0.5.x)

### v0.5.0 - Firebase Backend Setup
**Goal:** Set up Firebase Firestore as the persistence layer

- [x] Set up Firebase Firestore database (powertimeline-860f1)
- [x] Install Firebase SDK and create configuration
- [x] Design Firestore collections schema
- [x] Create Firestore service layer (CRUD, real-time subscriptions)
- [x] Create data migration utilities (localStorage to Firestore)
- [x] Migrate to nested timeline structure
- [x] Fix collection group query permissions and indexes

### v0.5.0.1 - Event Persistence Optimization
**Goal:** Separate events from timeline metadata for better performance

- [x] Update Timeline type to separate metadata from events
- [x] Create EventDocument type for event subcollection
- [x] Update Firestore service to handle events subcollection
- [x] Update security rules for events subcollection
- [x] Create migration script (371 events migrated)
- [x] Update pages to use getTimelineMetadata for lists
- [x] Create smoke tests for HomePage and UserProfilePage

### v0.5.0.2 - Home & User Page Enhancements
**Goal:** Improve user experience and functionality on HomePage and UserProfilePage

- [x] Fix view counting (skip owner views)
- [x] Add user profile editing (EditUserProfileDialog)
- [x] Create initials avatar system (UserAvatar component)
- [x] Add user statistics display to UserProfilePage
- [x] Add "Create Timeline" button on profile page
- [x] Add timeline sorting dropdown (4 options)
- [x] Add admin reset statistics feature
- [x] Fix Firestore permission errors
- [x] Create tests for profile editing and admin stats

### v0.5.0.3 - Test Suite Modernization & Data Cleanup
**Goal:** Update test suite to work with new routing architecture

- [x] Create user-agnostic test utilities (loginAsTestUser, loadTestTimeline)
- [x] Update all 66 test files to use new utilities
- [x] Fix timeline ID references for Firestore
- [x] Migrate to `domcontentloaded` instead of `networkidle`
- [x] Move tests to organized directories (home/, admin/, editor/)
- [x] Fix React duplicate key bugs in HomePage/UserProfilePage
- [x] Clean up duplicate Firestore data

### v0.5.0.4 - Development Environment & Production Infrastructure
- [x] Create separate Firebase project for development
- [x] Configure environment-specific Firebase credentials
- [x] Install Firebase Admin SDK
- [x] Create production database cleanup script
- [x] Clean production Firestore database
- [x] Create production smoke tests

### v0.5.1 - Firebase Authentication Foundation
- [x] Install Firebase Authentication SDK
- [x] Create auth service layer and LoginPage
- [x] Create validation utilities
- [x] Create AuthContext and ProtectedRoute
- [x] Add VITE_ENFORCE_AUTH feature flag
- [x] Integrate Firebase Auth with UserProfileMenu

### v0.5.2 - Landing Page Redesign
- [x] Apply dark theme color palette
- [x] Redesign hero with gradient headline effect
- [x] Add Sign In button and search bar to hero
- [x] Create timeline examples gallery
- [x] Verify WCAG AA contrast compliance

### v0.5.3 - Public Timeline Access & Navigation Redesign
- [x] Create TopNavBar for unauthenticated users
- [x] Redesign NavigationRail with dark theme
- [x] Enable public timeline viewing without auth
- [x] Add read-only mode to EditorPage
- [x] Keep ProtectedRoute for /admin and profile routes

### v0.5.4 - Authentication Security & Demo User Removal
**Goal:** Secure Firestore rules and remove localStorage demo system

- [x] Fix Firestore security rules for events subcollection
- [x] Move test user password to environment variable
- [x] Remove localStorage demo user system
- [x] Enable public timeline browsing without authentication
- [x] Complete E2E journey test coverage

### v0.5.5 - Public Browsing & Dark Theme
**Goal:** Unified dark theme and public browsing experience

- [x] Fix public browsing on HomePage (/browse)
- [x] Apply unified dark theme to all pages
- [x] Update TopNavBar with Microsoft-style auth pattern

### v0.5.6 - Landing Page & Public Browsing Polish
**Goal:** Improve landing page messaging, navigation, and public browsing experience

- [x] Remove legacy getCurrentUser() calls (use AuthContext)
- [x] Fix breadcrumb and nav rail navigation
- [x] Add BETA indicator badge
- [x] Redesign navigation rail (global + contextual items)
- [x] Add light/dark theme support with CSS variables
- [x] Fix LandingPage timeline navigation (Firestore)
- [x] Improve hero section messaging
- [x] Add mobile responsiveness and loading skeletons

### v0.5.7 - Authentication Production Deployment
**Goal:** Enable authentication enforcement in production

- [x] Enable VITE_ENFORCE_AUTH=true in production
- [x] Re-enable Firestore security rules requiring authentication
- [x] Deploy auth-enabled Firestore rules
- [x] Add auth migration documentation

### v0.5.8 - Documentation Improvements
**Goal:** Improve documentation navigation and developer experience

- [x] Update PLAN.md Quick Summary and SRS_INDEX.md
- [x] Update TESTS.md with production test results
- [x] Document naming conventions in CONTRIBUTING.md

### v0.5.9 - Test Organization
**Goal:** Clean up test suite organization

- [x] Rename tests/v5/ to tests/editor/ for clarity
- [x] Update all test imports and playwright.config.ts
- [x] Create manual test workflow (.github/workflows/tests.yml)
- [x] Verify tests pass locally

### v0.5.10 - Vision & Positioning Update
**Goal:** Communicate product vision and improve SEO/discoverability

- [x] Rewrite landing page messaging with "connect the dots" vision
- [x] Add "The Problem" and "Who It's For" sections
- [x] Update features section
- [x] Add Open Graph meta tags and Twitter cards
- [x] Create custom 404 page

### v0.5.11 - Test Stabilization & Legacy Code Cleanup
**Goal:** Fix broken tests and remove legacy localStorage code
**Status:** Complete

- [x] Create Firebase Auth test utilities (authTestUtils.ts)
- [x] Update all admin/home test files with Firebase Auth
- [x] Remove legacy getCurrentUser() calls from application
- [x] Remove UserSwitcherModal (demo user feature)
- [x] Migrate CreateTimelineDialog to useAuth hook
- [x] Migrate UserManagementPanel to useAuth hook
- [x] Update activityLog to accept user params
- [x] Reset test user credentials

**Codex Tasks (Delegated) - COMPLETED:**
- [x] Fix admin tests (82-86) selector/role issues
- [x] Fix home tests (T71-T73) selector issues
- [x] Expand production tests (browse, auth, security, a11y) - 22/22 passing

### v0.5.11.1 - UI Polish & Theme Defaults
**Goal:** Consistent branding and dark theme as default

- [x] Add "PowerTimeline BETA" branding to HomePage, UserProfilePage, AdminPage headers
- [x] Set dark mode as default theme (was 'system')
- [x] Theme preference persists in localStorage
- [x] Theme toggle remembers user choice

### v0.5.12 - Firestore Schema Cleanup
**Goal:** Simplify database schema by removing unused fields and making Firestore compliant with SRS_DB.md
**Status:** Complete

**Database Requirements (SRS_DB.md) - COMPLETED:**
- [x] Remove `avatar` field from User type (unused)
- [x] Remove `bio` field from User type (unused)
- [x] Remove `name` field from User type (unused, username is sufficient)
- [x] Remove `order` field from Event type (date/time used for ordering)
- [x] Remove `priority` field from Event type (unused)
- [x] Remove `category` field from Event type (unused)
- [x] Remove `excerpt` field from Event type (unused)
- [x] Remove Migration Notes section from SRS_DB.md

**Claude Tasks (Firestore Migration Scripts) - COMPLETED:**
- [x] Create script to clean User documents (remove avatar, bio, name fields)
- [x] Create script to clean Event documents (remove order, priority, category, excerpt)
- [x] Run migration on DEVELOPMENT database (6 users updated)
- [x] Run migration on PRODUCTION database (3 users updated)
- [x] Verify data integrity after migration (dry-run shows 0 updates needed)

**Codex Tasks - COMPLETED:**
- [x] Clean up IAC.md (remove verbose/corrupted entries)
- [x] Create test suite for SRS_DB.md schema validation (tests/db/)

### v0.5.13 - Multi-Agent Orchestration Tooling
**Goal:** Enable Claude to spawn, supervise, and coordinate sub-agents programmatically
**Status:** Complete

- [x] Investigate Codex CLI and Claude CLI invocation options
- [x] Design deterministic orchestration architecture (Python handles all bookkeeping)
- [x] Create agents/ module with spawner.py, logger.py, context_loader.py
- [x] Implement auto-context injection (PRD, PLAN, CLAUDE.md)
- [x] Implement auto-logging to IAC.md and CONTEXT.md
- [x] Create agents/DESIGN.md with architecture rationale
- [x] Update CLAUDE.md and AGENTS.md with orchestration documentation
- [x] Test spawning sub-agents for simple tasks
- [x] Repository cleanup (deleted stale debug/temp files)
- [x] Verify Firebase service account keys never in git history
- [x] Design MCP server for deterministic agent spawning (agents/MCP_DESIGN.md)
- [x] Implement MCP server exposing 5 tools (spawn_claude, spawn_codex, list_running, get_result, get_context)
- [x] Create .mcp.json configuration for Claude Code integration
- [x] Update documentation for MCP-first usage pattern
- [x] Fix broken imports in workflow files (run_tests.py, code_review.py)
- [x] Consolidate logging config (IAC.md as primary log)

### v0.5.14 - Timeline Navigation & URL Fixes
**Goal:** Fix critical production issues with timeline navigation, URL structure, and schema compliance
**Status:** Complete

**Phase 1: Schema Compliance (Claude)** - COMPLETE
- [x] Remove deprecated fields from src/types.ts (User: name, avatar, bio; Event: priority, category, excerpt; EventDocument: order)
- [x] Update avatarUtils.ts to work with username
- [x] Update UserAvatar to use username instead of name
- [x] Update remaining UI components to use username (UserManagementPanel now uses userProfile.username)
- [x] Remove EditUserProfileDialog (already removed - file doesn't exist)
- [x] Fix remaining deprecated field references (Timeline.tsx, CardRenderer.tsx, cardIcons.ts, firestore.ts, TimelineMarkers.tsx, yamlSerializer.ts)
- [x] Run SRS_DB compliance tests (found legacy data issues - code is compliant)

**Phase 2: Username System (Claude)** - COMPLETE (already implemented)
- [x] Create UsernameSelectionDialog component for first-time users
- [x] Implement username uniqueness check in Firestore (isUsernameAvailable)
- [x] Add username format validation (3-20 chars, lowercase alphanumeric + hyphen)
- [x] Block reserved usernames (admin, api, browse, etc.)
- [x] Integrate username prompt into auth flow (shows after Google sign-in for auto-generated usernames)
- [x] Dialog is mandatory (no onClose prop)

**Phase 3: URL Structure Refactor (Claude)** - COMPLETE
- [x] Change URL pattern from `/user/{uid}/timeline/{id}` to `/{username}/timeline/{id}`
- [x] getUserByUsername() Firestore query already exists
- [x] Update React Router routes in main.tsx (added `/:username/timeline/:timelineId`)
- [x] Update EditorPage to handle both username and userId params with redirect
- [x] Update TimelineCardMenu with ownerUsername prop
- [x] Update all navigation links (LandingPage, HomePage, UserProfilePage)
- [x] Legacy UID-based URLs auto-redirect to username URLs

**Note:** Originally planned `/@:username` pattern but React Router v7 has a bug with `@` in paths (GitHub #9779, #12460). Using clean `/:username/timeline/:id` URLs instead - no prefix needed since React Router's route ranking ensures `/browse`, `/login`, `/admin` match before dynamic `/:username`.

**Phase 4: Timeline Navigation Fixes (Claude)** - COMPLETE
- [x] Update timeline card click handlers for username-based URLs
- [x] Firestore security rules verified correct for public/unlisted read access
- [x] Navigation handlers updated in all pages

**Phase 5: Test Updates** - COMPLETE
- [x] Update test utilities to use `/@{username}` URL pattern (timelineTestUtils.ts, timelineTestHelper.ts)
- [x] Update test constants: cynacons -> cynako (username, not legacy ID)
- [x] Fix T72.6 URL pattern regex
- [x] Update hardcoded URLs in smoke tests (home, user)
- [x] Production tests: 22/22 passing
- [x] Home tests: 20/40 passing (6 auth-dependent tests need .env.test credentials)

**Known Test Environment Issues:**
- Authentication tests require valid credentials in `.env.test`
- Some timeline content tests require "cynako" user with timelines seeded in dev Firestore

### v0.5.14.1 - MCP Agent Server Improvements
**Goal:** Fix logging truncation and add concurrency safety to agent spawner

- [x] Increase task/result summary truncation limits in CONTEXT.md
- [x] Redesign IAC.md format with unified entries and in-place status updates
- [x] Add threading locks for concurrent file writes
- [x] Add collapsible details blocks for prompts and results

### v0.5.14.2 - Production Bug Fixes
**Goal:** Fix timeline navigation fallbacks and test data pollution

- [x] Fix handleTimelineClick fallback to legacy URL when owner not cached
- [x] Add visibility filter to discovery feeds (public timelines only)

### v0.5.14.3 - URL Structure & Test Fixes
**Goal:** Fix React Router v7 @ symbol bug and update tests

- [x] Change route pattern from `/@:username` to `/:username` (React Router v7 bug)
- [x] Update test files with correct URL patterns
- [x] Add legacy timeline ID mapping in timelineTestUtils.ts
- [x] Run full test campaign (DB 8/8, Home 23/0/14, User 3/0/1, Editor foundation 1/1)

### v0.5.14.4 - Navigation Bug Fix
**Goal:** Fix navigate() calls still using `/@username` pattern

- [x] Fix 11 navigate() calls across 6 files to use `/:username` pattern
- [x] Verify manual testing confirms fix works

**Known Issues:**
- Admin tests: 2 failures (breadcrumb selector issues)
- Editor zoom/minimap tests: Pre-existing failures
- Test quality: Permissive tests silently pass when events don't load

---

### v0.5.15 - Test & Bug Fix Backlog
**Goal:** Fix test infrastructure issues and production bugs

**Completed:**
- [x] Increase agent history from 10 to 100 runs
- [x] Add cost tracking for Codex agents
- [x] Document Codex limitations (not suitable for shell command execution)
- [x] Test Claude agent spawn and result retrieval (SUCCESS - $0.024, 30s)
- [x] Fix double logging bug (removed duplicate log_spawn_start from MCP server)
- [x] Fix task summary (set context_level="none", CLIs auto-load their own context)
- [x] Fix Codex prompt passing (use stdin with "-" argument)
- [x] Retest Codex subagent (SUCCESS - test counting, admin tests, MCP review)

**Admin Tests:**
- [x] Ensure test user has admin role in dev Firestore (ensureAdminRoleForTestUser works with credentials file)
- [x] Fix T82.4 test - updated to check NavRail instead of breadcrumb

**MCP Agent Server Improvements (from Codex review):**
- [x] Add threading.Lock around running_agents/completed_agents dict access (prevent RuntimeError on iteration)
- [x] Clean up background_threads dict after completion (memory leak)
- [x] Fix Codex success detection (now detects command-only runs as success)
- [x] Read stderr in _spawn_codex_stream_internal (merged stderr→stdout to avoid deadlock)
- [x] Fix timestamps to use UTC (now using datetime.utcnow() and timezone.utc)
- [x] Mark Codex cost as estimate (added comment)
- [x] Align version numbers (v1.3.0 using SERVER_VERSION constant)
- [x] Update MCP_DESIGN.md to reflect CLI auto-loading context
- [x] Sanitize newlines in CONTEXT.md task summaries (added sanitize_for_table helper)
- [x] Remove .recent_runs.json - CONTEXT.md now shows active agents only (IAC.md is authoritative)
- [x] Fix IAC.md markdown escaping (use 4 backticks when prompt contains triple backticks)

**Test Infrastructure:**
- [x] Create strict smoke test requiring event loading (waitForEvents helper)
- [x] Fix permissive tests to fail when events don't render

**Private Timeline Visibility Bug:**
- [x] Filter out private timelines from HomePage discovery feeds (Recently Edited, Popular)
- [x] Filter out private timelines from LandingPage example timelines
- [x] Ensure "My Timelines" section still shows owner's private timelines (unchanged - no filter)
- [x] Add E2E test verifying private timelines are hidden from public feeds (moved to v0.5.15.1, 81-private-timeline-filtering.spec.ts)

**Codex Write Access Fix:**
- [x] Investigate Codex `--sandbox workspace-write` bug (confirmed broken)
- [x] Update spawner.py to use `--dangerously-bypass-approvals-and-sandbox`
- [x] Update mcp_server.py to pass `bypass_sandbox=True`
- [x] Document in MCP_DESIGN.md

---

### v0.5.15.1 - Stabilization & Test Health
**Goal:** Address documentation drift, fix failing test suites, and close critical test coverage gaps

**Documentation Sync:**
- [x] Update SRS_INDEX.md version from v0.5.7 to v0.5.15
- [x] Update AGENTS.md version reference from v0.5.14 to v0.5.15
- [ ] Audit and sync requirement counts across all SRS documents
- [x] Remove stale "multi-event" and "infinite card" references from ARCHITECTURE.md
- [x] Update SRS_INDEX.md "Known Issues" section with current test status

**Admin Test Suite Repair:**
- [x] Diagnose admin test failures (authentication/routing changes)
- [x] Fix T82 admin access control test (added admin-heading test ID)
- [x] Fix T83 user management panel test (added 10+ data-testid hooks to UserManagementPanel)
- [x] Fix T84 statistics dashboard test (added testids + updated selectors)
- [x] Fix T85 bulk operations test (fixed dialog selector)
- [x] Fix T86 activity log test (added search/filter testids to ActivityLogPanel)
- [x] Update admin test selectors for v0.5.x routing structure

**Home Test Suite Completion:**
- [x] Add E2E test for search functionality (CC-REQ-SEARCH-001) - 77-search-functionality.spec.ts (14 tests)
- [x] Add E2E test for Recently Edited feed (CC-REQ-RECENT-001) - 78-recently-edited-feed.spec.ts
- [x] Add E2E test for Popular timelines feed (CC-REQ-POPULAR-001) - 79-popular-timelines-feed.spec.ts
- [x] Add E2E test for private timeline visibility filtering - 81-private-timeline-filtering.spec.ts (security tests)
- [x] Fix permissive tests to fail when events don't render - strict assertions in 02-navigation, 08-readonly-security

**Critical Bug Fixes:**
- [x] Investigate multi-event layout visibility bug (3 events persist, 1 visible)
  - Root cause: DegradationEngine mixed-card-type capacity math too restrictive
  - For 3 events, mixed types [full,compact,compact] but capacity only fits 1 full card
  - Fix: Skip mixed types for 3-event clusters, use uniform compact cards
- [x] Fix multi-event layout bug in DegradationEngine.ts (Codex agent, DegradationEngine.ts:391-409)
- [x] Add strict event loading assertion to smoke tests (02-navigation.spec.ts, 08-readonly-security.spec.ts)
- [ ] Document or fix single-event zoom positioning edge case

**Test Infrastructure:**
- [x] Create .env.test.example template for contributors
- [x] Document test environment setup in CONTRIBUTING.md
- [ ] Add CI check for test credential availability

---

### v0.5.15.2 - MCP Server Optimization & Test Fixes
**Goal:** Reduce context window usage during agent orchestration and fix new test failures
**Status:** Complete

**MCP Server v1.4 Improvements:**
- [x] Implement compact `list()` output (~100 bytes vs ~2KB)
- [x] Add blocking `wait_for_agents(timeout?)` tool - eliminates polling loops
- [x] Returns all agent results in single response after completion

**Test Fixes:**
- [x] **Fix Visibility selector** in tests 79, 81
  - Changed `getByLabel('Visibility')` to `getByRole('combobox', { name: /public - visible to everyone/i })`
  - Files: `tests/home/79-popular-timelines-feed.spec.ts`, `tests/home/81-private-timeline-filtering.spec.ts`

- [x] **Optimize test seeding** in tests 78, 79
  - Replaced UI-based timeline creation with direct Firestore Admin SDK writes
  - Using `seedTimelinesForTestUser()` from `tests/utils/timelineSeedUtils.ts`
  - Reduces beforeAll from ~45s to <1s

- [x] **Fix search dropdown tests** in test 77
  - Added `data-testid="browse-search-dropdown"` to HomePage.tsx search results container
  - File: `src/pages/HomePage.tsx:452`

- [x] **Fix isFocused API call** in test 77
  - Replaced `input.isFocused()` with `expect(input).toBeFocused()` assertion
  - File: `tests/home/77-search-functionality.spec.ts:159`

- [x] **Fix strict mode violation** in test 77
  - Added `.first()` qualifier to avoid multiple element matches
  - File: `tests/home/77-search-functionality.spec.ts:211`

**Known Test Data Dependencies (moved to v0.5.16):**
- T77.9, T77.11 require seeded test data (`French Revolution`, `Napoleon Bonaparte` timelines)

---

### v0.5.16 - Firestore Data Refinement
**Goal:** Complete Firestore compliance and fix remaining data issues
**Status:** Complete

- [x] Clean up deprecated User field references in scripts directory (8 files updated)
- [x] Fix T77 seed script to use existing cynacons user by username query
- [x] Prevent duplicate user creation (skip if exists by email/username)
- [x] Assign French Revolution and Napoleon timelines to real cynacons user (UID=HL3gR4MbXKe4gPc4vUwksaoKEn93)
- [x] Run seed script: 244 French Revolution events + 63 Napoleon events seeded successfully
- [x] Pass SRS_DB.md compliance tests (4/4 passing: users, timelines, events, activity logs)

**Key Changes:**
- Modified `scripts/seed-test-77-data.ts` to query existing user by username instead of creating duplicate
- Timelines now properly assigned to real cynacons Firebase Auth user
- No more duplicate 'cynacons' user issues in dev database

### v0.5.17 - Platform Statistics Aggregation
**Goal:** Move stats calculation from client-side scans to server-side aggregation
**Status:** Complete

- [x] Create `stats/platform` document in Firestore
  - Added STATS collection and PlatformStats interface
- [x] Update getPlatformStats() with caching strategy
  - Memory cache (5min TTL) → Firestore doc → Full scan fallback
  - Auto-saves stats to Firestore when recalculated
- [x] Add client-side caching with TTL (5 minutes)
- [x] Add cache invalidation on timeline create/delete
- [x] Add Firestore security rules for stats collection
- [x] Add refreshPlatformStats() and invalidateStatsCache() helpers

**Note:** Cloud Functions deferred - client-side aggregation approach scales well

### v0.5.18 - Timeline Card Menu Implementation
**Goal:** Enhance timeline card menus with ownership-based actions and improved delete confirmation
**Status:** Complete

**Timeline Card Menu Enhancements:**
- [x] Add "Open" menu option (renamed from "View")
- [x] Add "Go to Owner" menu option for non-owner users (navigates to owner's profile)
- [x] Add "Edit" menu option for timeline owner
- [x] Add "Delete" menu option for timeline owner
- [x] Enhance DeleteTimelineDialog with name confirmation requirement
- [x] Require exact timeline name match to enable delete button
- [x] Verify menu integration on HomePage (My Timelines, Recently Edited, Popular sections)
- [x] Verify menu integration on UserProfilePage
- [x] Fix unused imports in LandingPage.tsx
- [x] Build verification successful

**Files Changed:**
- src/components/TimelineCardMenu.tsx (menu options updated, "Go to Owner" added)
- src/components/DeleteTimelineDialog.tsx (name confirmation field added)
- src/pages/LandingPage.tsx (cleanup unused imports)

**Previous v0.5.18 Work (Landing Page & User Page):**
- [x] Landing page rework (Explore Public Timelines, Create Timeline button)
- [x] User page layout improvements (theme-aware CSS, responsive design)

**Deferred to Future Iterations:**
- [ ] Fix Home page dark mode: scrollbar styling
- [x] Fix Editor dark mode: wrong colors and bad contrasts (DONE in v0.5.20-v0.5.21)
- [ ] Home page: My Timelines display on 2 rows instead of 1, vertical scroll

**Incomplete Tasks from Earlier Iterations (for discussion):**
- v0.4.0: Responsive layout, timeline card redesign, user avatars, empty states
- v0.4.1: 6 Playwright CRUD tests (v5/74-79)
- v0.5.15.1: SRS audit, single-event zoom edge case, CI credential check

### v0.5.19 - Landing Page Roadmap Section
**Goal:** Add visual roadmap section to landing page
**Status:** Complete

- [x] Create git-style roadmap visualization with vertical line
- [x] Add completed phases (v0.2.x - v0.5.x) with checkmarks
- [x] Highlight current phase (v0.5.18)
- [x] Show upcoming phases (v0.6.x - v1.0.0)
- [x] Match dark theme aesthetic
- [x] Ensure responsive design

**Implementation:**
- Added roadmap section after features section, before final CTA
- Git-style vertical line with commit dots (green checkmarks for completed)
- Current phase highlighted with orange color and pulsing dot
- Future phases shown with reduced opacity and empty circle icons
- Fully responsive with single-column layout
- Uses existing dark theme CSS variables

### v0.5.20 - Editor Dark Theme Contrast Fixes
**Goal:** Fix dark theme contrast issues in editor components
**Status:** Complete

- [x] Fix Timeline Axis dark theme contrast (axis bar, ticks, labels)
- [x] Fix Breadcrumb dark theme contrast (text visibility)
- [x] Verify both light and dark themes have proper contrast
- [x] Run production build to verify no errors

**Files Modified:**
- `src/components/EnhancedTimelineAxis.tsx` - Changed hardcoded #000000 to var(--page-text-primary) for axis bar, tick marks, and labels
- `src/pages/EditorPage.tsx` - Changed breadcrumb wrapper from bg-white/90 to theme-aware CSS variables (--page-bg-elevated, --page-border)

### v0.5.21 - Event Editor (AuthoringOverlay) Dark Mode Fix
**Goal:** Fix dark theme contrast in the Event Editor overlay
**Status:** Complete

- [x] Fix main overlay container background (line 292: currently white, should use theme variables)
- [x] Fix left/right navigation panel backgrounds (lines 300, 598)
- [x] Fix form inputs to use theme-aware colors (TextField components)
- [x] Fix header/footer backgrounds
- [x] Fix text colors for dark theme contrast
- [x] Fix border colors to use theme variables
- [x] Fix EventPreviewList component theme colors
- [x] Run build verification
- [x] Test both light and dark modes

**Files Modified:**
- `src/app/overlays/AuthoringOverlay.tsx` - Replaced all hardcoded Tailwind classes with CSS variable inline styles
- `src/app/components/EventPreviewList.tsx` - Updated to use theme-aware colors for text, backgrounds, and borders

### v0.5.19 - Timeline Axis Date Alignment Fix
**Goal:** Fix timeline axis labels misalignment with event anchor positions
**Status:** Complete

- [x] Fix time range calculation in DeterministicLayoutComponent.tsx (lines 94-104)
- [x] Match LayoutEngine.ts logic: center single-event, natural range for multi-event
- [x] Update viewTimeWindow calculation (lines 269-283) for consistency
- [x] Build verification successful
- [x] Axis labels now align with event anchor positions

**Root Cause:**
Time range was ALWAYS centered (subtracting rawDateRange/2), but LayoutEngine only centers for single-event timelines, creating a mismatch.

**Files Modified:**
- `src/layout/DeterministicLayoutComponent.tsx` - Fixed fullMinDate/fullMaxDate calculations (lines 94-104, 269-283)

### v0.5.19.1 - Timeline Axis Labels Dark Theme Fix
**Goal:** Fix axis labels invisible in dark theme
**Status:** Complete

- [x] Fix axis label text colors (lines 404, 430)
- [x] Use var(--page-text-primary) for primary labels (years)
- [x] Use var(--page-text-secondary) for secondary/tertiary labels (months, days, hours)
- [x] Build verification successful

**Files Modified:**
- `src/components/EnhancedTimelineAxis.tsx` - Updated labelColor to use CSS variables for theme-aware text colors

### v0.5.21.1 - Modern Rectangle Scrollbar Styling
**Goal:** Implement modern rectangular scrollbar styling with dark red accent for dark theme
**Status:** Complete

- [x] Add scrollbar CSS variables to tokens.css (dark theme: burgundy #8b2635, light theme: medium gray)
- [x] Implement Webkit scrollbar styling (Chrome, Safari, Edge)
- [x] Implement Firefox scrollbar styling
- [x] 14px width for wider, modern appearance
- [x] Rectangle shape with 2px border (no rounded corners)
- [x] Theme-aware colors matching page backgrounds
- [x] Build verification successful

**Files Modified:**
- `src/styles/tokens.css` - Added --scrollbar-track, --scrollbar-thumb, --scrollbar-thumb-hover CSS variables for both dark and light themes
- `src/index.css` - Added ::-webkit-scrollbar styles and Firefox scrollbar-color/scrollbar-width rules

### v0.5.22 - Cloud Functions for Platform Statistics
**Goal:** Replace client-side stats aggregation with server-side Cloud Functions for atomic, real-time counters
**Status:** Complete

**Infrastructure:**
- [x] Set up Firebase Cloud Functions in project (functions/ directory)
- [x] Configure functions deployment pipeline (firebase.json updated)
- [x] Blaze plan active

**Cloud Functions (functions/src/index.ts):**
- [x] `onUserCreate` - Increment `stats/platform.totalUsers`
- [x] `onUserDelete` - Decrement `stats/platform.totalUsers`
- [x] `onTimelineCreate` - Increment timeline counts (total + visibility type)
- [x] `onTimelineDelete` - Decrement timeline counts
- [x] `onTimelineUpdate` - Handle visibility changes (adjust public/unlisted/private counts)
- [x] `onEventCreate` - Increment `totalEvents` count
- [x] `onEventDelete` - Decrement `totalEvents` count
- [x] `initializeStats` - HTTP callable for admin bootstrap

**Database Changes:**
- [x] Stats doc uses `FieldValue.increment()` for atomic updates
- [x] Client falls back to full scan only for initial bootstrap

**Client Updates (src/services/firestore.ts):**
- [x] Simplified `getPlatformStats()` - reads from Firestore stats doc
- [x] Kept `saveStatsToFirestore()` for bootstrap only
- [x] Memory cache with 5-min TTL for performance

**Tests:**
- [ ] Unit tests for Cloud Functions (firebase-functions-test) - deferred
- [ ] E2E stats tests - deferred to v0.6.x

### v0.5.23 - Event Editor & Viewer Rework
**Goal:** Modernize Event Editor panel and enable read-only viewing
**Status:** Complete

- [x] Add `isOwner` prop to AuthoringOverlay for ownership control
- [x] Show ReadOnlyEventView for non-owners (no edit/delete buttons)
- [x] Enhanced visual design (larger titles, accent colors, better spacing)
- [x] EventPreviewList UX improvements (hover borders, icons, cleaner layout)
- [x] Update App.tsx to pass isOwner based on timeline ownership

### v0.5.24 - Dev Panel Removal
**Goal:** Remove Dev Panel from codebase and migrate dependent tests
**Status:** Complete

**Audit Results (before migration):**
- 17 test files with 96 `openDevPanel`/`closeDevPanel` references
- 1 SRS requirement (CC-REQ-PANELS-DEV-001)

**Test Migration (completed via multi-agent orchestration):**
- [x] Updated all 17 test files to use direct Firestore timeline navigation
- [x] Replaced Dev Panel seeding with `loadTestTimeline()` utility
- [x] Removed all 96 `openDevPanel`/`closeDevPanel` references (down to 0)
- [x] Tests use existing timelines: french-revolution, napoleon-bonaparte

**Code Removal:**
- [x] Remove `src/app/panels/DevPanel.tsx`
- [x] Remove Dev Panel lazy import from `src/App.tsx:22`
- [x] Remove command palette entry from `src/App.tsx:522-530`
- [x] Remove overlay state management from `src/App.tsx` (removed 'dev' from overlay type)
- [x] Remove Alt+D keyboard shortcut handler from `src/hooks/useKeyboardShortcuts.ts`
- [x] Keep `src/lib/devSeed.ts` (still used by `src/lib/homePageStorage.ts` for seed timelines)

**Documentation Updates:**
- [x] Deprecate CC-REQ-PANELS-DEV-001 in `docs/SRS.md`
- [x] Update `docs/SRS_UI_AUDIT.md` status to "REMOVED"

**High-Priority Test Files (16 total):**
1. `tests/editor/09-seeding-scenarios.spec.ts` - 12 refs
2. `tests/editor/18-zoom-stability.spec.ts` - 12 refs
3. `tests/editor/19-zoom-edge-cases.spec.ts` - Multiple refs
4. `tests/editor/20-timeline-cursor-zoom.spec.ts` - Multiple refs
5. `tests/editor/21-timeline-minimap.spec.ts` - Multiple refs
6. Remaining 11 files with simpler migrations

### v0.5.25 - PowerSpawn: Universal Multi-Agent MCP Server
**Goal:** Extract and productize our MCP agent orchestration into a standalone project compatible with Claude Code AND GitHub Copilot
**Status:** Complete

**Phase 1: Repository Creation (Complete):**
- [x] Create PowerSpawn repository (https://github.com/CynaCons/PowerSpawn)
- [x] Extract standalone package with all core modules
- [x] Copy spawner.py, logger.py, context_loader.py, parser.py, mcp_server.py
- [x] Copy schemas/ directory (JSON output schemas)
- [x] Copy examples/basic_spawn.py
- [x] Fix imports for standalone operation (absolute imports)
- [x] Fix GitHub URL reference (cynako → CynaCons)
- [x] Add .gitignore (exclude pycache, auto-generated files)
- [x] Set up git submodule in main PowerTimeline repo
- [x] Add "Built with PowerSpawn" footer to LandingPage
- [x] Remove dead code: config.yaml (not used), workflows/ (project-specific)

**Phase 2: Documentation & Distribution:**
- [x] Fix README.md path references (`agents/` → root paths)
- [x] Add Installation section with git submodule instructions
- [x] Update Architecture section to reflect actual file structure
- [x] Make IAC.md/CONTEXT.md output directory configurable (env var: POWERSPAWN_OUTPUT_DIR)
- [x] Decision: Use git submodule distribution (not pip) - simpler, project-scoped, MCP-native pattern

**Novelty Research (via Opus agent):**
- IAC.md pattern is novel - no equivalent found in 900+ MCP repos
- Cross-model orchestration (Claude + Codex) is rare - only 19 repos mention both
- MCP for agent spawning is uncommon - most MCP servers are for external tools
- Closest competitor: claude-flow (1k stars) - Claude-only, no cross-model support

**Repository Structure:**
```
powerspawn/
├── mcp_server.py      # MCP server (main entry point)
├── spawner.py         # Core spawn logic
├── logger.py          # IAC.md logging
├── context_loader.py  # Context injection
├── parser.py          # Response parsing
├── __init__.py        # Package exports
├── requirements.txt   # Dependencies
├── schemas/           # JSON output schemas
├── examples/          # Usage examples
├── README.md          # Documentation
├── DESIGN.md          # Architecture rationale
└── MCP_DESIGN.md      # MCP architecture
```

**Remaining Tasks (moved to v0.5.29):**

**Project Vision:**
"PowerSpawn" - A universal MCP server for spawning AI sub-agents across different models. Users say "can you powerspawn a Codex to handle this?" and it just works, regardless of whether they're using Claude Code or GitHub Copilot.

**Key Features to Productize:**
1. **Cross-model agent spawning** - Claude spawns Codex, Codex spawns Claude
2. **CONTEXT.md injection** - Auto-inject project context into sub-agents
3. **IAC.md pattern** - Inter-Agent Communication via shared markdown file
4. **Universal MCP compatibility** - Works with Claude Code, GitHub Copilot, JetBrains, etc.

**Repository Structure (new repo: `powerspawn`):**
```
powerspawn/
├── README.md              # Showcase, installation, usage
├── powerspawn/
│   ├── __init__.py
│   ├── server.py          # MCP server (refactored from mcp_server.py)
│   ├── agents/
│   │   ├── claude.py      # Claude agent spawner
│   │   ├── codex.py       # Codex/GPT agent spawner
│   │   └── base.py        # Base agent interface
│   └── context/
│       ├── injector.py    # CONTEXT.md/AGENTS.md injection
│       └── iac.py         # Inter-Agent Communication handler
├── examples/
│   ├── claude-code/       # Example .mcp.json for Claude Code
│   ├── copilot/           # Example for GitHub Copilot
│   └── jetbrains/         # Example for JetBrains
├── docs/
│   ├── IAC_PATTERN.md     # Document the IAC.md pattern
│   └── CONTEXT_INJECTION.md
└── tests/
```

**Implementation Tasks:**

*Phase 1: GitHub Copilot Compatibility*
- [ ] Test current mcp_server.py with VS Code Copilot MCP settings
- [ ] Document any compatibility issues
- [ ] Fix protocol differences if any
- [ ] Create VS Code `.vscode/mcp.json` example config
- [ ] Test with Copilot Chat in VS Code

*Phase 2: Extract to Standalone Package*
- [ ] Create new `powerspawn` repository
- [ ] Refactor mcp_server.py into clean module structure
- [ ] Add proper Python packaging (pyproject.toml, setup.py)
- [ ] Make it pip-installable: `pip install powerspawn`
- [ ] CLI entry point: `powerspawn serve`

*Phase 3: Documentation & Showcase*
- [ ] Write comprehensive README with examples
- [ ] Document the IAC.md pattern (potential blog post)
- [ ] Create demo GIFs/videos
- [ ] Landing page (GitHub Pages or simple site)
- [ ] Submit to MCP Registry

*Phase 4: Advanced Features*
- [ ] Agent result caching
- [ ] Parallel agent execution improvements
- [ ] Support for more models (Gemini, local LLMs)
- [ ] Web UI for monitoring spawned agents
- [ ] Rate limiting and cost tracking

**Novelty Research:** (pending agent research results)
- IAC.md pattern originality
- Comparison with AutoGen, CrewAI, LangGraph
- Market positioning

### v0.5.26 - Timeline Import/Export & AI-Ready Format
**Goal:** Enable import/export of timelines in a simple format that AI models can generate
**Status:** Planned

**Design Principles:**
- Simple, human-readable format (YAML primary, JSON secondary)
- AI-friendly: any LLM can generate valid timeline files from prompts
- Validation layer to catch errors before import
- Round-trip fidelity: export → import produces identical timeline

**YAML Format Specification:**
```yaml
# PowerTimeline Export Format v1
version: 1
timeline:
  title: "French Revolution"
  description: "Key events from 1789-1799"
  visibility: public  # public | unlisted | private

events:
  - id: evt-001  # optional, auto-generated if missing
    date: "1789-07-14"
    title: "Storming of the Bastille"
    description: "Parisian revolutionaries storm the Bastille fortress..."
    color: "#e53935"  # optional, hex color

  - date: "1789-08-26"
    title: "Declaration of Rights of Man"
    description: "The National Assembly adopts..."
```

**Implementation Tasks:**
- [ ] Define TypeScript schema for import/export format
- [ ] Create YAML parser with validation (use `yaml` or `js-yaml` library)
- [ ] Build JSON schema for format validation
- [ ] Implement `exportTimeline(timelineId)` → YAML string
- [ ] Implement `importTimeline(yaml, ownerId)` → Timeline
- [ ] Add Export button to timeline menu (download .yaml file)
- [ ] Add Import button to "Create Timeline" flow
- [ ] Create import preview screen (show parsed events before saving)
- [ ] Validation error display with line numbers
- [ ] Handle edge cases: duplicate IDs, invalid dates, missing required fields

**AI Integration (Prompt Engineering):**
- [ ] Create example prompts for generating timelines
- [ ] Document format in README for AI users
- [ ] Consider: API endpoint for direct AI-generated timeline creation

**Tests:**
- [ ] Unit tests for YAML parsing and validation
- [ ] Round-trip tests (export → import → export = identical)
- [ ] Invalid format rejection tests
- [ ] E2E: Import timeline via UI

### v0.5.27 - Stream Editor (Mobile-First Timeline Editor)
**Goal:** New editing paradigm: git-style vertical timeline with inline editing, optimized for mobile
**Status:** Planned

**Concept Overview:**
A notepad-like editor with git-style visual language. Events are displayed vertically with commit-style dots and connecting lines. Dates on the left, content on the right. Fully editable inline.

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│  DATE        │ ●─── EVENT CARD                  │
│              │ │    [Title - editable]          │
│  1789-07-14  │ │    [Description - editable]    │
│              │ │                                │
│              │ │                                │
│  DATE        │ ●─── EVENT CARD                  │
│              │ │    [Title]                     │
│  1789-08-26  │ │    [Description]               │
│              │ │                                │
│              │ │                                │
│  DATE        │ ●─── EVENT CARD                  │
│              │      [Title]                     │
│  1792-09-21  │      [Description]               │
└─────────────────────────────────────────────────┘
```

**Three Viewing Modes (Total):**
1. **Graph Viewer** - Current canvas-based timeline visualization (read-only, pan/zoom)
2. **Classic Editor** - Current editor with central edit panel + left/right event columns
3. **Stream Editor** - NEW: Git-style vertical list, inline editing, mobile-optimized

**Two Editing Modes (Total):**
1. **Classic Editor** - Modal editing (select event → edit in panel)
2. **Stream Editor** - Inline editing (click to edit in place, notepad-style)

**Mobile Strategy:**
- Stream Editor is the PRIMARY mobile experience
- Simple vertical scroll, no complex pan/zoom gestures
- Touch-friendly inline editing
- Responsive: full-width cards on mobile, side-by-side on tablet

**Implementation Tasks:**

*Phase 1: Core Component*
- [ ] Create `StreamEditor.tsx` component
- [ ] Implement git-style vertical timeline rail (SVG dots + lines)
- [ ] Event card component with date/title/description layout
- [ ] Scroll virtualization for large timelines (react-window or similar)
- [ ] Date formatting and grouping (by year/month/day)

*Phase 2: Inline Editing*
- [ ] Click-to-edit event titles (contenteditable or input)
- [ ] Click-to-edit event descriptions (textarea, auto-expand)
- [ ] Date picker for event date editing
- [ ] Color picker for event color
- [ ] Auto-save on blur (debounced)
- [ ] Keyboard navigation (Tab between events, Enter to confirm)

*Phase 3: Event Management*
- [ ] Add new event button (+ at bottom or between events)
- [ ] Delete event with confirmation
- [ ] Drag-to-reorder events (optional, may conflict with date ordering)
- [ ] Undo/redo support

*Phase 4: Mobile Optimization*
- [ ] Touch-friendly tap targets (44px minimum)
- [ ] Swipe gestures (swipe left to delete?)
- [ ] Mobile keyboard handling (viewport resize)
- [ ] Responsive breakpoints (mobile/tablet/desktop)

*Phase 5: Integration*
- [ ] Add Stream Editor tab/toggle to Editor page
- [ ] Route: `/editor/:timelineId/stream` or toggle within existing route
- [ ] Sync state between Classic and Stream editors
- [ ] Mobile detection → default to Stream Editor

**Design Tokens (extend tokens.css):**
- `--stream-rail-color`: Color of the vertical line
- `--stream-dot-size`: Size of event dots (12px)
- `--stream-dot-color`: Dot fill color
- `--stream-date-width`: Width of date column (100px)
- `--stream-card-gap`: Vertical gap between cards

**Tests:**
- [ ] Unit tests for StreamEditor component
- [ ] E2E: Create event via Stream Editor
- [ ] E2E: Edit event inline
- [ ] E2E: Delete event
- [ ] Visual regression tests for git-style rail
- [ ] Mobile viewport tests

### v0.5.28 - Test Sweep Corrective Actions
**Goal:** Address test failures discovered during Dev Panel removal sweep
**Status:** Planned

**Test Sweep Results (2025-12-02):**
- Total: 20 tests | Passed: 9 | Failed: 6 | Skipped: 5

**Environment Issues (4 failures):**
- [ ] Fix `.env.test` credentials configuration
  - Tests failing: Necker Compte Rendu date alignment, Anchor alignment, Anchor coordinate system, Hover date accuracy
  - Root cause: "Login failed - check credentials in .env.test"
  - Action: Document required env vars in CONTRIBUTING.md
  - Action: Create `.env.test.example` with all required keys

**Anchor Alignment Issues (2 failures):**
- [ ] Investigate anchor alignment tests returning 0
  - Tests failing: "Anchors align with corresponding timeline dates at default zoom"
  - Tests failing: "Anchors align precisely with event dates across multiple timelines"
  - Root cause: `expect(...).toBeGreaterThan(expected) Expected: > 0, Received: 0`
  - Action: Check if anchors are rendering at all
  - Action: Verify coordinate calculation in test vs production

**Test Infrastructure:**
- [ ] Add CI check for test credential availability
- [ ] Update CONTRIBUTING.md with test setup instructions
- [ ] Create smoke test that validates .env.test is properly configured

### v0.5.29 - PowerSpawn Test Suite
**Goal:** Create comprehensive tests to verify PowerSpawn MCP server functionality
**Status:** Planned

**Unit Tests (powerspawn/tests/):**
- [ ] `test_imports.py` - Verify all modules import correctly
  - Test: `from spawner import spawn_claude, spawn_codex`
  - Test: `from logger import log_spawn_start, log_spawn_complete`
  - Test: `from parser import parse_claude_response, parse_codex_event`
  - Test: `from context_loader import format_prompt_with_context`

- [ ] `test_parser.py` - Response parsing tests
  - Test: Parse valid Claude JSON response
  - Test: Parse invalid JSON (returns error AgentResult)
  - Test: Parse Codex JSONL events
  - Test: Extract final message from Codex events

- [ ] `test_logger.py` - IAC.md logging tests
  - Test: `generate_spawn_id()` returns 8-char hex
  - Test: `log_spawn_start()` creates IAC.md entry
  - Test: `log_spawn_complete()` updates entry in-place
  - Test: Thread safety with concurrent writes

- [ ] `test_context_loader.py` - Context injection tests
  - Test: Load minimal context
  - Test: Load full context
  - Test: Format prompt with context prepended
  - Test: Handle missing project files gracefully

**Integration Tests:**
- [ ] `test_mcp_server.py` - MCP protocol tests
  - Test: Server initializes without error
  - Test: `list_tools()` returns 5 tools
  - Test: Tool schemas are valid JSON
  - Test: `list()` returns running/completed agents structure
  - Test: `wait_for_agents()` with timeout returns correct structure

**E2E Tests (require Claude/Codex CLI):**
- [ ] `test_spawn_claude.py` - Claude agent spawning
  - Test: Spawn haiku agent with simple prompt
  - Test: Verify result contains text and cost
  - Test: IAC.md entry created correctly

- [ ] `test_spawn_codex.py` - Codex agent spawning (optional, skip if no API key)
  - Test: Spawn Codex with simple prompt
  - Test: Verify JSONL parsing works

**Test Configuration:**
```python
# powerspawn/tests/conftest.py
import pytest
import os

@pytest.fixture
def temp_agents_dir(tmp_path):
    """Create temp directory for IAC.md/CONTEXT.md"""
    return tmp_path

@pytest.fixture
def skip_e2e():
    """Skip E2E tests if CLI tools not available"""
    return not (
        os.system("claude --version") == 0 or
        os.system("codex --version") == 0
    )
```

**CI Integration:**
- [ ] Add GitHub Actions workflow for PowerSpawn tests
- [ ] Run unit tests on every push
- [ ] Run E2E tests only on main branch (requires API keys)

## Phase 3: Collaboration Features (v0.6.x)

### v0.6.0 - Git-Based Timeline Storage
- [ ] Set up internal Git repository management system
- [ ] Convert timeline format to JSON (optimized for Git diffs)
- [ ] Implement Git commit workflow for saves
- [ ] Create version history browser
- [ ] Add diff viewer for comparing versions
- [ ] Implement revert functionality

### v0.6.1 - Forking System
- [ ] Fork button and confirmation flow
- [ ] Git clone operation for forking
- [ ] Fork relationship tracking and display
- [ ] Attribution system for original authors
- [ ] Fork network graph visualization
- [ ] Fork statistics and analytics

### v0.6.2 - Merge Request System
- [ ] Create merge request workflow
- [ ] Side-by-side diff viewer for changes
- [ ] Comment system for review
- [ ] Approve/reject/request changes workflow
- [ ] Merge conflict detection and resolution UI
- [ ] Notification system for merge requests

## Phase 4: Discovery & Social (v0.7.x)

### v0.7.0 - Enhanced Discovery
- [ ] Advanced search with filters (date range, tags, category)
- [ ] Timeline trending algorithm
- [ ] Featured timeline curation
- [ ] Category-based browsing
- [ ] Timeline recommendations

### v0.7.1 - Social Features
- [ ] Follow users and timelines
- [ ] Activity feed showing updates
- [ ] View counts and engagement metrics
- [ ] Timeline collections/playlists
- [ ] User notifications

## Phase 5: Rich Media (v0.8.x)

### v0.8.0 - Media Attachments
- [ ] Image and video uploads for events
- [ ] Firebase Storage integration
- [ ] Link previews with automatic metadata
- [ ] Media gallery view for timelines
- [ ] Media organization and tagging

### v0.8.1 - Content Archival
- [ ] Automatic web page snapshots
- [ ] Social media post archival
- [ ] PDF and document storage
- [ ] Link rot prevention and backup

## Phase 6: AI Integration (v0.9.x)

### v0.9.0 - AI Chat Interface
- [ ] Sidebar chatbot for timeline Q&A
- [ ] Natural language event creation
- [ ] Timeline summarization and insights
- [ ] Event date/time assistance

### v0.9.1 - AI-Powered Automation
- [ ] Auto-suggest related events from news feeds
- [ ] Timeline gap detection and suggestions
- [ ] Fact-checking assistance and source verification
- [ ] Automated timeline generation from text sources

## Milestone: v1.0.0 - Full Platform Launch

- [ ] All core platform features implemented and tested
- [ ] Scalable infrastructure supporting thousands of users
- [ ] Comprehensive documentation and API
- [ ] Mobile-responsive design
- [ ] Enterprise features and security
- [ ] Community moderation tools
- [ ] Analytics and reporting dashboard
- [ ] Monetization system implementation
