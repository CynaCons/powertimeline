# PowerTimeline Implementation Plan

## Quick Summary

**Current Version:** v0.5.36 (Full-Width Layout Trial) ✅
**Next Milestone:** v0.5.37 - User Onboarding Experience

### Key Metrics
- **Total Iterations:** 200+ completed (v0.2.0 → v0.5.21)
- **Requirements:** ~177 total ([SRS Index](docs/SRS_INDEX.md))
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
- ✅ PowerSpawn landing page (powerspawn.com) with GitHub Pages (v0.5.25)
- ✅ New branding: PT logo, hero banner, favicon (v0.5.25)
- ✅ Stream Editor: Mobile Timeline Viewer (v0.5.26)
- ✅ Stream Viewer: Search, sync, focus fixes (v0.5.26.1)
- ✅ Stream Viewer: Minimap, breadcrumbs, scroll fix, E2E tests (v0.5.26.3)
- ✅ Stream Viewer: Expandable cards, search in header, wheel fix (v0.5.26.4)
- ✅ Home Page: Reordered sections (Popular → Stats → Recent) (v0.5.26.4)
- ✅ Stream Viewer: Visual polish, softer edges, backdrop blur (v0.5.26.5)
- ✅ Import/Export: YAML format, ImportTimelineDialog, Export menu (v0.5.27)
- ✅ PowerSpawn Copilot CLI fix with `-p` flag (v0.5.27.1)
- ✅ Test Sweep: Env config, anchor alignment fixes (v0.5.28)
- ✅ Technical Debt: Version sync script, docs drift fixes (v0.5.29)
- ✅ PowerSpawn Test Suite: 22+ pytest tests (v0.5.30)
- ✅ UX Polish: Skeletons, Toasts, Error Recovery, Accessibility (v0.5.31)
- ✅ Navigation Icons: Stream View hover icons, Event Editor navigation (v0.5.34)
- ✅ Bug Fixes + Settings NavRail: Fixed event editor, added Settings to NavRail (v0.5.35)
- ✅ Full-Width Layout Trial: HomePage, SettingsPage, UserProfilePage (v0.5.36)

### Next Up
- **v0.5.37**: User Onboarding Experience
- **v0.6.x**: Social & Sharing (share links, follows, discovery)

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
- [x] Create Firebase Auth test utilities
- [x] Update all admin/home test files with Firebase Auth
- [x] Remove legacy getCurrentUser() calls and UserSwitcherModal
- [x] Migrate dialogs and panels to useAuth hook
- [x] Fix admin tests (82-86) and home tests (T71-T73)

### v0.5.11.1 - UI Polish & Theme Defaults
- [x] Add "PowerTimeline BETA" branding
- [x] Set dark mode as default theme with localStorage persistence

### v0.5.12 - Firestore Schema Cleanup
- [x] Remove unused fields from User type (avatar, bio, name)
- [x] Remove unused fields from Event type (order, priority, category, excerpt)
- [x] Run migration on dev and production databases
- [x] Create SRS_DB.md schema validation tests

### v0.5.13 - Multi-Agent Orchestration Tooling
- [x] Create agents/ module with spawner, logger, context_loader
- [x] Implement MCP server with spawn_claude, spawn_codex tools
- [x] Auto-logging to IAC.md and CONTEXT.md
- [x] Create .mcp.json configuration for Claude Code

### v0.5.14 - Timeline Navigation & URL Fixes
- [x] Remove deprecated fields from types and components
- [x] Implement username-based URLs (/:username/timeline/:id)
- [x] Create UsernameSelectionDialog for first-time users
- [x] Legacy UID-based URLs auto-redirect to username URLs
- [x] Update all test utilities and navigation links

### v0.5.14.1 - MCP Agent Server Improvements
- [x] Add threading locks and concurrency safety
- [x] Redesign IAC.md format with in-place status updates

### v0.5.14.2 - Production Bug Fixes
- [x] Fix timeline navigation fallbacks
- [x] Add visibility filter to discovery feeds

### v0.5.14.3 - URL Structure & Test Fixes
- [x] Change route pattern from /@:username to /:username
- [x] Update test files with correct URL patterns

### v0.5.14.4 - Navigation Bug Fix
- [x] Fix 11 navigate() calls to use /:username pattern

---

### v0.5.15 - Test & Bug Fix Backlog
- [x] MCP agent server improvements (threading, logging, cost tracking)
- [x] Fix admin tests (T82-T86) and Codex write access
- [x] Filter private timelines from discovery feeds
- [x] Create strict smoke tests requiring event loading

### v0.5.15.1 - Stabilization & Test Health
- [x] Fix admin test suite (T82-T86 selectors and testids)
- [x] Add E2E tests for search, feeds, and visibility filtering
- [x] Fix multi-event layout bug in DegradationEngine
- [x] Create .env.test.example and update CONTRIBUTING.md

### v0.5.15.2 - MCP Server Optimization & Test Fixes
- [x] Implement compact list() and wait_for_agents() tools
- [x] Fix test selectors and optimize seeding with Firestore Admin SDK

### v0.5.16 - Firestore Data Refinement
- [x] Clean up deprecated User field references
- [x] Seed French Revolution and Napoleon timelines
- [x] Pass SRS_DB.md compliance tests

### v0.5.17 - Platform Statistics Aggregation
- [x] Create stats/platform Firestore document with caching
- [x] Add cache invalidation on timeline create/delete

### v0.5.18 - Timeline Card Menu Implementation
- [x] Add Open, Edit, Delete, Go to Owner menu options
- [x] Enhance DeleteTimelineDialog with name confirmation
- [x] Landing page and user page improvements

### v0.5.19 - Landing Page Roadmap Section
- [x] Create git-style roadmap visualization with vertical line
- [x] Show completed and upcoming phases with responsive design

### v0.5.20 - Editor Dark Theme Contrast Fixes
- [x] Fix Timeline Axis and Breadcrumb dark theme contrast
- [x] Use CSS variables for theme-aware colors

### v0.5.21 - Event Editor Dark Mode Fix
- [x] Fix AuthoringOverlay dark theme (container, panels, inputs, text)
- [x] Fix EventPreviewList theme colors

### v0.5.19.1 - Timeline Axis Date Alignment & Labels Fix
- [x] Fix time range calculation to match LayoutEngine logic
- [x] Fix axis label colors for dark theme

### v0.5.21.1 - Modern Rectangle Scrollbar Styling
- [x] Add scrollbar CSS variables for dark/light themes
- [x] Implement Webkit and Firefox scrollbar styling

### v0.5.22 - Cloud Functions for Platform Statistics
- [x] Set up Firebase Cloud Functions with Blaze plan
- [x] Implement user/timeline/event triggers for atomic counter updates
- [x] Simplify client getPlatformStats() with caching

### v0.5.23 - Event Editor & Viewer Rework
- [x] Add isOwner prop for read-only viewing
- [x] Enhanced visual design and EventPreviewList UX

### v0.5.24 - Dev Panel Removal
- [x] Migrate 17 test files from Dev Panel to loadTestTimeline()
- [x] Remove DevPanel.tsx and all 96 references
- [x] Deprecate CC-REQ-PANELS-DEV-001

### v0.5.25 - PowerSpawn: Universal Multi-Agent MCP Server
- [x] Create standalone PowerSpawn repository with git submodule
- [x] Implement spawn_claude, spawn_codex, spawn_copilot tools
- [x] Create landing page with GitHub Pages deployment
- [x] New branding: PT logo, hero banner, favicon

### v0.5.26 - Stream Editor: Mobile Timeline Viewer
- [x] Create StreamViewer with git-style vertical layout
- [x] StreamViewerOverlay for desktop/mobile
- [x] Update MobileNotice with Stream View option
- [x] Add design tokens for stream viewer

### v0.5.26.1 - Stream Viewer Enhancements
- [x] Fix overlay focus, escape key, and mouse interaction
- [x] Add search bar, event click zoom, hover sync with minimap
- [x] Move Stream View button to NavRail with slide-up transition

### v0.5.26.3 - Stream Viewer Polish
- [x] Add minimap, breadcrumbs, fix mouse wheel scrolling
- [x] Create SRS_STREAM_VIEW.md and comprehensive E2E tests

### v0.5.26.4 - Stream Viewer UX & Home Reorder
- [x] Move search to header, add expandable cards, keyboard navigation
- [x] Reorder Home: Popular → Statistics → Recently Edited

### v0.5.26.5 - Stream Viewer Visual Polish
- [x] Softer edges, backdrop blur, refined shadows

### v0.5.27 - Timeline Import/Export
- [x] YAML v1 format with merge-by-ID import
- [x] ImportExportOverlay in NavRail with validation
- [x] E2E tests (T-IMEX-01 through T-IMEX-05)

### v0.5.27.1 - PowerSpawn Copilot CLI Fix
- [x] Fixed Copilot CLI invocation with `-p` flag

### v0.5.28 - Test Sweep Corrective Actions
- [x] Fix .env.test and CONTRIBUTING.md documentation
- [x] Fix anchor alignment tests with waitForSelector
- [x] Add auth-tests CI job

### v0.5.29 - Technical Debt & Codebase Hygiene
- [x] Create sync-version.cjs script
- [x] Root directory cleanup and README updates
- [x] Code cleanup (console checks, dead code, skipped tests)

### v0.5.30 - PowerSpawn Test Suite
- [x] Copilot CLI permissions work correctly (investigation complete)
- [x] Unit tests: test_imports.py, test_parser.py, test_logger.py
- [x] Integration tests: test_mcp_server.py (11 tests)

### v0.5.31 - UX Polish & Resilience
- [x] Dark mode scrollbar styling
- [x] My Timelines 2-row layout
- [x] Code cleanup (console checks, dead code)
- [x] Test infrastructure (skipIfNoCredentials helper)
- [x] Loading Skeletons (SkeletonCard component)
- [x] Micro-interactions: Hover states, transitions, card animations
- [x] Error Recovery: ErrorState component with retry
- [x] Toast Notifications: ToastContext, ToastContainer, useToast hook
- [x] Accessibility: Focus states, ARIA labels, reduced-motion support

### v0.5.32 - User Settings & Public Profiles
**Goal:** Fix profile access and add user account management
**Status:** In Progress

**Documentation:**
- [x] Create `SRS_USER_PAGE.md` - User profile page requirements (30 reqs)
- [x] Create `SRS_USER_SETTINGS_PAGE.md` - Settings page requirements (23 reqs)

**Implementation:**
- [x] **Public Profile Access:** Remove ProtectedRoute from `/:username`, allow public viewing
- [x] **User Settings Page:** Create `/settings` route with profile info, password, preferences
- [x] **Password Management:** Firebase Auth password reset/change flow
- [x] **Nav Icon Fix:** Replace nav-rail user icon with standard person icon
- [ ] **Account Deletion:** Allow users to delete their account (GDPR compliance)

**Testing:**
- [ ] E2E tests for public profile access (dev + prod)
- [ ] E2E tests for settings page functionality

### v0.5.33 - Stream Editor Mobile Editing
**Goal:** Make Stream Editor a full mobile editing experience
**Status:** In Progress

**Documentation:**
- [x] Update `SRS_STREAM_VIEW.md` with editing requirements (13 new reqs)

**Implementation:**
- [x] **Slide-up Edit Panel:** StreamEditPanel component for mobile inline editing
- [x] **Quick Add Button:** [+] button in header to create new event
- [x] **Swipe Actions:** Swipe left/right to reveal edit/delete actions
- [x] **Mobile Event Form:** Simplified form optimized for touch
- [x] **Mobile Auto-open:** Stream View auto-opens on mobile viewport
- [x] **Desktop Edit UX:** Click event closes Stream View, navigates to editor

**Testing:**
- [ ] E2E tests for stream view editing
- [ ] Mobile viewport tests

### v0.5.34 - Navigation Icons (Stream ↔ Editor ↔ Canvas)
**Goal:** Add explicit navigation icons for quick switching between views

**Stream View (hover on event card):**
- [x] Show icons only on hovered event card (upper-right boundary)
- [x] Eye icon: Close stream view, zoom to event on canvas
- [x] Edit icon: Close stream view, open event editor panel

**Event Editor Panel (header icons):**
- [x] Add Eye icon: Close editor, zoom to event on canvas
- [x] Add Stream icon: Switch to stream view
- [x] Group 4 icons with modern UI (drawer/menu if space-constrained)

**Error Handling:**
- [x] Add GitHub Issues link to ErrorBoundary component

### v0.5.35 - Bug Fixes + Settings NavRail
**Goal:** Fix event editor bug and improve NavRail layout

- [x] BUG FIX: "Add new event" in existing timeline doesn't load existing events in Event Editor navigation panels
- [x] Change "My Timelines" icon from `person` to `collections` (distinct from Sign In)
- [x] Move Settings to bottom utilities section (above theme toggle)
- [x] Create utilities section type in NavigationRail for bottom-positioned items
- [x] BUG FIX: Settings icon position - pin to bottom instead of floating mid-way

### v0.5.36 - Full-Width Layout Trial
**Goal:** Experiment with full-width page layouts

- [x] Expand Home, Settings, User pages to full horizontal width
- [x] Remove max-width constraints from HomePage (header + main content)
- [x] Remove max-width constraints from SettingsPage (header + main content, keep max-w-5xl for readability)
- [x] Remove max-width constraints from UserProfilePage (header + profile + timelines)
- [x] Remove max-width constraints from AdminPage (header + tabs + content)
- [x] BUG FIX: Dark mode timeline axis "halo" effect - made container transparent
- [x] FIX: Keep original card sizes but fit more cards per row on wide screens
- [x] FIX: Statistics section cards now use fixed widths (flex-wrap) instead of stretching
- [x] BUG FIX: "My Timelines" card size mismatch - now matches Popular/Recent sections
- [ ] Evaluate UX: Compare current centered layout vs full-width expansion (User to decide)

**Known Issues / Feedback:**
- [x] BUG: Admin page dark mode not actually dark - FIXED
- [x] Admin page wide layout applied
- [x] My Timelines card sizing fixed to match other sections
- [x] BUG: Card menu (sandwich) poor contrast in dark mode - FIXED
- [ ] DESIGN: Timeline axis & event anchors - consider git-style commits/lines (on standby)
- [x] TRIAL: Landing page - use PowerTimeline banner as full-width background

### v0.5.37 - User Onboarding Experience
**Goal:** Guide new users from "blank slate" to their first successful timeline

- [ ] **Empty States:** Actionable empty states for "My Timelines" with prompts
- [ ] **Starter Templates:** "Use Template" option (Biography, Project Plan, Historical Era)
- [ ] **Guided Tour:** Interactive walkthrough for the Editor
- [ ] **Contextual Help:** Tooltips for complex features

---

## Phase 3: Social & Sharing (v0.6.x)
> **Priority:** Get to a shareable, usable product first

### v0.6.0 - Sharing Infrastructure
- [ ] **Share Links:** Generate shareable URLs for timelines
- [ ] **Embed Code:** iframe embed for blogs/websites
- [ ] **Social Meta Tags:** Open Graph, Twitter Cards for link previews
- [ ] **QR Codes:** Generate QR codes for timeline sharing

### v0.6.1 - Social Features
- [ ] **Follow System:** Follow users and timelines
- [ ] **Activity Feed:** Show updates from followed users
- [ ] **Notifications:** In-app and email notifications
- [ ] **Comments:** Comment on timelines (optional)
- [ ] **Likes/Stars:** Simple appreciation mechanic

### v0.6.2 - Enhanced Discovery
- [ ] **Global Search:** Unified search for Users and Timelines
- [ ] **Content Search:** Search within event titles/descriptions
- [ ] **Advanced Filters:** Date range, tags, popularity
- [ ] **Trending:** Algorithm based on views and activity
- [ ] **Recommendations:** "More like this" suggestions

## Phase 4: AI Integration (v0.7.x)
> **Priority:** AI assistance makes the product more powerful

### v0.7.0 - AI Chat Interface
- [ ] **Sidebar Chatbot:** Q&A about the timeline content
- [ ] **Natural Language Creation:** "Add an event for when X happened"
- [ ] **Timeline Summarization:** Auto-generate summaries
- [ ] **Date Assistance:** Help with historical date formatting

### v0.7.1 - AI-Powered Automation
- [ ] **Event Suggestions:** Auto-suggest related events
- [ ] **Gap Detection:** Identify missing periods in timeline
- [ ] **Fact Checking:** Source verification assistance
- [ ] **Auto-generation:** Create timeline from text/Wikipedia

## Phase 5: Rich Media (v0.8.x)

### v0.8.0 - Media Attachments
- [ ] Image and video uploads for events
- [ ] Firebase Storage integration
- [ ] Link previews with automatic metadata
- [ ] Media gallery view for timelines

### v0.8.1 - Content Archival
- [ ] Automatic web page snapshots
- [ ] Social media post archival
- [ ] Link rot prevention and backup

## Phase 6: Collaboration & Versioning (v0.9.x)
> **Moved later:** Complex feature, build audience first

### v0.9.0 - Version History
- [ ] Timeline version snapshots on save
- [ ] Version history browser
- [ ] Diff viewer for comparing versions
- [ ] Revert to previous version

### v0.9.1 - Forking System
- [ ] Fork button and confirmation flow
- [ ] Fork relationship tracking
- [ ] Attribution for original authors
- [ ] Fork network visualization

### v0.9.2 - Merge Requests (Optional)
- [ ] Merge request workflow
- [ ] Side-by-side diff viewer
- [ ] Comment system for review
- [ ] Merge conflict resolution

## Milestone: v1.0.0 - Full Platform Launch

- [ ] All core platform features implemented and tested
- [ ] Scalable infrastructure supporting thousands of users
- [ ] Comprehensive documentation and API
- [ ] Mobile-responsive design
- [ ] Enterprise features and security
- [ ] Community moderation tools
- [ ] Analytics and reporting dashboard
- [ ] Monetization system implementation

---

## Backlog (Deferred)

### Requirements Standardization & Traceability
**Goal:** Standardize SRS format and create automated traceability tooling

**Analysis:**
- [ ] Audit current SRS formats (compare SRS_STREAM_VIEW vs SRS_USER_SETTINGS_PAGE)
- [ ] Document pros/cons of each format
- [ ] Decide on unified format and apply consistently

**Tooling:**
- [ ] Create `// @req SRS_XXX::CC-REQ-XXX-NNN` comment tag convention
- [ ] Build npm script to extract requirement tags from code
- [ ] Auto-generate traceability matrix and append to SRS files
- [ ] Integrate with CI to ensure requirements are linked

**Migration:**
- [ ] Update all SRS files to unified format
- [ ] Add requirement tags to existing implementations

### Test Gap Analysis & E2E Coverage
**Goal:** Identify and fill testing gaps from recent features

**Analysis:**
- [ ] Inventory all v0.5.31-33 features lacking tests
- [ ] Map features to SRS requirements
- [ ] Prioritize critical paths for testing

**Implementation:**
- [ ] E2E tests for Settings page (login, display, password reset)
- [ ] E2E tests for public profile access (non-auth viewing)
- [ ] E2E tests for Stream View editing (mobile viewport)
- [ ] E2E tests for Stream View swipe actions
- [ ] Update test coverage tables in SRS files

### Admin Panel Statistics
**Goal:** Implement proper statistics dashboard in Admin page

- [ ] Display platform-wide metrics (total users, timelines, events)
- [ ] Activity charts (signups over time, timeline creation trends)
- [ ] User engagement metrics
- [ ] System health indicators
