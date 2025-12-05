# PowerTimeline Implementation Plan

## Quick Summary

**Current Version:** v0.5.31 (UX Polish & Resilience) ✅
**Next Milestone:** v0.5.32 - User Onboarding Experience

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

### Next Up
- **v0.5.32**: User Onboarding Experience

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

### v0.5.32 - User Onboarding Experience
**Goal:** Guide new users from "blank slate" to their first successful timeline
**Status:** Planned

- [ ] **Empty States:** Create actionable empty states for "My Timelines" with "Create" or "Fork" prompts
- [ ] **Starter Templates:** Add "Use Template" option (Biography, Project Plan, Historical Era) to creation flow
- [ ] **Guided Tour:** Implement interactive walkthrough for the Editor (explaining Zoom, Layout, Events)
- [ ] **Contextual Help:** Add tooltips to complex features (Layout Engine, Visibility settings)

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

### v0.7.0 - Enhanced Discovery & Advanced Search
- [ ] **Global Search:** Unified search for Users and Timelines with type filtering
- [ ] **Content Search:** Deep search within timeline events (titles, descriptions)
- [ ] **Advanced Filters:** Filter by date range, tags, category, and popularity
- [ ] **Timeline Trending:** Algorithm based on views, forks, and recent activity
- [ ] **Featured Curation:** Admin-curated lists of high-quality timelines
- [ ] **Recommendations:** "More like this" suggestions based on timeline content

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
