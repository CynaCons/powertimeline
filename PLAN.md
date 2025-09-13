# ChronoChart Implementation Plan

## Iteration v0.2.0 - Foundation (completed)
- [x] Core layout system (half-columns, overflow badges, minimap, cursor-zoom)
- [x] Adaptive timeline scales; overlap prevention across zoom levels
- [x] View-window filtering; directional anchors; leftover anchor fixes
- [x] Test suite cleanup to 33 tests; leftover detection tests
- [x] Max zoom to 0.1%; card color system (blue/green/yellow/purple/red)
- [x] Visual polish: axis, spacing, overflow badge merging, nav rail, minimap

## Iteration v0.2.1 - Layout Unification & Title-only (completed)
- [x] Unify layout path around DeterministicLayoutComponent + LayoutEngine
- [x] Mark legacy `src/components/Timeline.tsx` and update ARCHITECTURE.md
- [x] Gate debug logs; tidy console output by default
- [x] Title-only degradation (width=260px; capacity=9 per semi-column)
- [x] Telemetry counters added for title-only
- [x] Tests: v5/48 (title-only appears; no overlaps), v5/49 (width/capacity)
- [x] SRS updated (Title-only Verified)
- [x] Final per-side collision resolution pass (Napoleon non-overlap)

## Iteration v0.2.2 - Tests & UTF-8 (completed)
- [x] Fix v5/16 (real viewport) to use existing buttons and pass
- [x] Fix v5/46 (degradation reality check) to use Playwright baseURL and tuned waits
- [x] PLAN arrows cleanup (UTF-8 -> ASCII)

## Iteration v0.2.3 - Plan Doc (completed)
- [x] Rework PLAN to iteration-based format and update status

## Iteration v0.2.5 - Zoom Stability (in progress)
- [x] Container-aware cursor-anchored zoom (reduce drift near edges)
- [ ] Tune margins/tolerance to pass "cursor anchoring" test consistently
- [ ] Add targeted zoom tests for edge anchoring

## Project Analysis - Good, Bad, Ugly Assessment (completed)
- [x] Comprehensive analysis of project structure and quality
- [x] Documentation review and assessment
- [x] Code quality and architecture evaluation
- [x] Test coverage and tooling assessment

## Iteration v0.2.6 - Quality & Technical Debt Cleanup (next priority)

### Code Quality Cleanup
- [x] Fix ESLint errors in Timeline.tsx (replaced `any` types, fixed `let`/`const`, removed unused variables)
- [x] Fix ESLint errors in LayoutEngine.ts (replaced `any` types, proper error handling, fixed unused parameter)
- [x] Fix ESLint errors in critical test files (42, 43, 44, 45, 46-degradation-*.spec.ts)
  - [x] Replaced `any` types with proper TypeScript types (`unknown`, HTMLElement, Playwright types)
  - [x] Changed `let` to `const` where variables are never reassigned
  - [x] Improved error handling with proper typing
  - [x] Maintained test functionality while improving code quality
- [x] Fix remaining Timeline.tsx ESLint errors (unused variables, any types, let/const issues)
- [x] Fix Timeline.tsx TypeScript compilation errors (const to let, window casting, isMultiEvent removal, CardConfig undefined issues)
- [x] Fix remaining ESLint errors in test files
  - [x] Fixed `any` types in multiple test files (32, 33, 36, 37, 38, 39, 47, 48, 49) - replaced with proper TypeScript types
  - [x] Removed unused variables (cardType, viewWindow, e/index parameters)
  - [x] Fixed lexical declaration issues in case blocks (34-adaptive-timeline-scales.spec.ts)
  - [x] Improved type safety by using `unknown` with proper type guards for window access
- [ ] Fix remaining ESLint errors across other files (~230 remaining)
- [ ] Remove empty catch blocks and implement proper error handling
- [ ] Clean up unused variables and dead code in other files
- [ ] Add missing return type annotations

### Test Infrastructure Stabilization
- [ ] Fix test timeout issues (currently 136 of 139 tests failing)
- [ ] Stabilize async operations in test suite
- [ ] Update test selectors for current DOM structure
- [ ] Add retry logic for flaky tests
- [ ] Ensure all v5 foundation tests pass consistently

### Bundle Optimization
- [ ] Implement code splitting for routes and large components
- [ ] Configure manual chunks in Vite for better bundle distribution
- [ ] Lazy load Material-UI components
- [ ] Reduce main bundle size below 400KB
- [ ] Add bundle analyzer to monitor size

### Development Standards
- [ ] Configure stricter ESLint rules (no-any, no-empty)
- [ ] Add pre-commit hooks for linting and type checking
- [ ] Implement consistent error handling patterns
- [ ] Document code style guidelines in CONTRIBUTING.md
- [ ] Add GitHub Actions for CI/CD with quality gates

### Technical Debt Reduction
- [ ] Refactor App.tsx to reduce complexity (split into smaller components)
- [ ] Extract complex state logic into custom hooks
- [ ] Remove legacy SVG architecture references
- [ ] Consolidate TypeScript configurations
- [ ] Clean up debug code and console.log statements

### Performance Monitoring
- [ ] Add performance metrics collection
- [ ] Implement render performance tracking
- [ ] Add memory usage monitoring
- [ ] Create performance dashboard for development
- [ ] Document performance benchmarks and targets

## Iteration v0.3.0 - Event Browser & Authoring Overlay (in progress)
- [x] Implement Events panel component (lists events; selection hooks to authoring)
- [x] Dev/Admin panel always enabled (not always visible)
  - [x] Remove dev toggle and persistence; keep panel accessible
  - [ ] Ensure DevPanel mounts fast (lazy content where needed)
- [x] Navigation rail updates
  - [x] Remove "Editor" entry (event editing moves to Authoring overlay)
  - [x] Replace current "View" entry with Event Browser
- [x] Event Browser (navigation rail panel)
  - [x] Show scrollable list of all events (virtualize if needed)
  - [x] Single-click to select (sync highlight on timeline)
  - [ ] Inline "+" affordances (between items, before first, after last)
  - [x] "+" opens Authoring overlay in create mode
  - [x] Group/sort by date (allow extension for filters)
- [x] Authoring overlay (right-side over main canvas)
  - [x] Opens on Event Browser selection (single click)
  - [x] Opens on timeline double-click (edit mode)
  - [x] Edit fields: date, title, description
  - [x] Save/Cancel; close overlay returns to previous view
  - [x] Keyboard: Esc to close; proper focus trap and order
- [x] Timeline double-click integration (Node)
  - [x] Preserve single-click for selection; no conflict with drag
- [ ] Tests for new flows
  - [ ] Event Browser: list render, scroll, select -> open overlay
  - [ ] Inline "+" -> open overlay in create mode
  - [ ] Timeline double-click -> open overlay in edit mode
  - [ ] Dev/Admin opens without pre-toggle
- [ ] Acceptance
  - [x] Admin/Dev panel discoverable (not visible by default)
  - [x] Editor rail entry removed; Event Browser replaces it
  - [x] Authoring overlay works for edit/create from both entry points
  - [ ] Clean visuals; basic a11y; no regressions

## Iteration v0.3.1 - Polish, A11y, and Telemetry
- [ ] Event Browser polish (empty states, skeletons, "N events" summary)
- [ ] Better highlight/selection sync with timeline
- [ ] Authoring overlay polish (validation, date-picker affordances)
- [ ] A11y: ARIA roles/labels; describe inline "+"; screen-reader announcements
- [ ] Telemetry for browser/overlay usage
- [ ] Playwright specs for a11y basics (labels, focus)
- [ ] Virtualize long lists for performance

## Iteration v0.3.2 - Cleanup & Docs
- [ ] Remove obsolete Editor rail entry & code paths
- [ ] Update docs (README/ARCH/SRS) for Event Browser/Authoring overlay
- [ ] Update keyboard shortcuts (if any)
- [ ] Contributor notes on adding fields and tests

## Upcoming v0.3.0 (performance & robustness)
- [ ] Performance optimization for large datasets
- [ ] Finish degradation system work items
- [ ] Advanced telemetry collection
- [ ] Memory usage optimization
- [ ] Enhanced error handling

## Upcoming v0.4.0 (features)
- [ ] Multi-event aggregation cards
- [ ] Advanced clustering algorithms
- [ ] Interactive anchor behaviors
- [ ] Mobile/touch support
- [ ] Accessibility compliance

## v1.0.0 Goals
- [ ] Production-ready performance
- [ ] Complete test coverage
- [ ] Full accessibility support
- [ ] Comprehensive documentation
- [ ] Stable API for external use

## R5 - Card sizing & Semi-columns (polish)
- [ ] Update card configs: full=260x169, compact=260x78
- [ ] Compact 1-2 body lines; full uses multi-line body
- [ ] Reduce margins and inter-card spacing
- [ ] One anchor per semi-column; no anchors without cards
- [ ] Strengthen half-column spacing; ensure no overlaps at any zoom
- [ ] Update tests (non-overlap Fit-All, minimap/anchors)

## Backlog
- [ ] Performance & robustness: benchmarks, virtualization, zoom stress tests
- [ ] Encoding cleanup (COMPLETED.md/UI strings); CI encoding check
- [ ] Extract repeated magic numbers and spacing thresholds to config
- [ ] Advanced features: infinite cards, smart clustering, overflow strategies, hover/click behaviors
- [ ] Developer experience: slot visualization, layout explanations, profiling, config UI
- [ ] Architecture: component extraction, `useLayoutEngine` hook, error recovery, visual regression tests
