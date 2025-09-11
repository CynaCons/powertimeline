# ChronoChart Implementation Plan

## Completed (v0.2.0)

### Core Layout System
- [x] Implement LayoutEngine with half-column system
- [x] Add overflow indicator system with red badges  
- [x] Create timeline minimap with view window navigation
- [x] Implement cursor-anchored zoom (Google Maps style)
- [x] Add adaptive timeline scales (hours to decades)
- [x] Fix card overlap prevention across all zoom levels
- [x] Implement view window filtering for overflow events
- [x] Add directional anchor connectors (up/down based on card position)
- [x] Fix leftover anchor connector bug with proper filtering
- [x] Style anchors as grey squares with light borders
- [x] Clean up test suite to 33 official numbered tests
- [x] Add comprehensive leftover detection tests
- [x] Increase maximum zoom to 0.1% for day-level granularity
- [x] Implement card color coding system (Blue=Full, Green=Compact, Yellow=Title-only, Purple=Multi-event, Red=Infinite)

### Visual Polish
- [x] Timeline axis with dynamic scale labels
- [x] Event cards with proper spacing and positioning
- [x] Overflow badges with smart merging to prevent overlaps
- [x] Navigation rail with developer panel
- [x] Minimap with transparent view window indicator

## Current Priorities

### FIXED: Degradation System Working
- [x] **Fix degradation system - groups were artificially limited to 2 events max**
- [x] Validate degradation with Napoleon timeline and real zoom scenarios  
- [x] Ensure green (compact) cards appear when density increases
- [x] Fix disconnect between overflow badges and card degradation
- [x] Removed artificial 2-event limit that prevented degradation triggers
- [x] Groups can now accumulate up to 4 events and properly degrade to compact cards
- [ ] Test anchor indicators and overflow coherency during zoom (partial)
- [ ] Eliminate leftover indicators when zooming at random locations (partial)

### Card Type System
- [x] Complete first-level degradation system (Full ��' Compact)
- [x] Add color coding for all card types (Blue/Green/Yellow/Purple/Red)
- [x] Fix degradation telemetry to reflect actual behavior
- [ ] Add title-only cards for dense regions
- [ ] Create multi-event aggregation cards
- [ ] Add promotion/demotion logic based on available space
- [ ] Test degradation cascade: Full ��' Compact ��' Title-only

### Performance & Robustness
- [ ] Test engine with extreme zoom scenarios (1000+ events)
- [ ] Add performance benchmarks for layout calculations
- [ ] Implement virtualization for very large datasets
- [ ] Add memory optimization for zoom history
- [ ] Test degradation triggers at all zoom levels

### Advanced Features
- [ ] Infinite event cards for extreme density
- [ ] Smart event clustering based on temporal proximity
- [ ] Enhanced telemetry and metrics collection
- [ ] Advanced overflow handling strategies
- [ ] Interactive anchor hover/click behaviors

## Future Enhancements

### User Experience
- [ ] Keyboard navigation support
- [ ] Accessibility improvements (screen readers, focus management)
- [ ] Touch/mobile interaction support
- [ ] High contrast mode support
- [ ] Reduced motion preferences

### Developer Experience
- [ ] Debug mode for layout visualization
- [ ] Slot occupancy visualization
- [ ] Layout decision explanations
- [ ] Performance profiling tools
- [ ] Configuration interface for layout parameters

### Architecture
- [ ] Extract UI components (TimelineContainer, CardRenderer, etc.)
- [ ] Create useLayoutEngine hook
- [ ] Add error recovery and fallback systems
- [ ] Implement comprehensive error logging
- [ ] Add automated visual regression testing

## Next Release Planning

### v0.3.0 Goals
- [ ] Performance optimization for large datasets
- [ ] Card degradation system implementation
- [ ] Advanced telemetry collection
- [ ] Memory usage optimization
- [ ] Enhanced error handling

### v0.4.0 Goals  
- [ ] Multi-event aggregation cards
- [ ] Advanced clustering algorithms
- [ ] Interactive anchor behaviors
- [ ] Mobile/touch support
- [ ] Accessibility compliance

### v1.0.0 Goals
- [ ] Production-ready performance
- [ ] Complete test coverage
- [ ] Full accessibility support
- [ ] Comprehensive documentation
- [ ] Stable API for external use

## R5: Card sizing & semi-columns (layout polish)
- [ ] Update card configs: full=260x169, compact=260x78
- [ ] Compact renders 1-2 body lines; full uses full height for multi-line body
- [ ] Reduce vertical margins (top/bottom/timeline) and inter-card spacing
- [ ] Ensure one anchor per semi-column; no anchors with no visible cards
- [ ] Strengthen half-column horizontal spacing; no overlaps at any zoom
- [ ] Update tests: non-overlap (Napoleon Fit-All), minimap/anchors already aligned
- [ ] Verify v5/10 space utilization improves (higher verticalSpread)

## Iteration: Layout Unification & Title-only (v0.2.1)
- [ ] Normalize repository encoding to UTF-8; fix mojibake in docs and source
  - [x] Fix non-ASCII artifacts in PLAN.md
  - [x] Fix key references and wording in ARCHITECTURE.md
  - [ ] Fix residuals in COMPLETED.md and any UI strings
  - [ ] Add/prep a simple encoding check in CI (lint-only)
- [x] Gate verbose console logging behind a debug flag; reduce noisy logs
  - [x] Wrap LayoutEngine/DeterministicLayoutComponent logs behind a debug gate
  - [ ] Extract repeated magic numbers to constants
- [ ] Extract key magic numbers (margins, thresholds) into config/constants
  - [ ] Timeline margins, half-column spacing, merge thresholds
- [x] Confirm app uses DeterministicLayoutComponent + LayoutEngine exclusively
  - [x] Verify `App.tsx` renders DeterministicLayoutComponent path
- [x] Archive/mark src/components/Timeline.tsx as legacy (not used)
  - [x] Add header comment indicating legacy and not wired in app
- [x] Update ARCHITECTURE.md with single layout path and correct filenames
  - [x] Replace outdated references (DeterministicLayout.ts ? LayoutEngine.ts)

- [x] Implement title-only selection in LayoutEngine.determineCardType with threshold
  - [x] Choose threshold: degrade when eventCount > compact capacity
  - [x] Ensure combined pool logic still applies
- [x] Ensure capacity accounting + getMaxCardsPerHalfColumn reflect title-only limits
  - [x] Set title-only capacity to 9 per half-column
- [x] Verify render path supports title-only cards
  - [x] Align title-only width with full/compact (260px); minimal content styling
- [x] Expose telemetry counters for title-only in degradation metrics
  - [x] Include counts in telemetry

- [x] Add Playwright specs for title-only
  - [x] Seed dense cluster; assert presence (v5/48)
  - [x] Validate width and per-cluster capacity; assert no overlaps (v5/49)
- [ ] (Optional) Add unit test for determineCardType thresholds
- [x] Update SRS.md Title-only requirement to Implemented/Verified
- [x] Remove outdated references and fix encoding in ARCHITECTURE.md/PLAN.md

- [x] Acceptance criteria
  - [x] Title-only cards render under dense conditions without overlaps
  - [x] Playwright title-only specs pass
  - [x] Encoding/logging improved for touched files; default console is succinct
  - [x] Docs reflect current architecture and iteration status
