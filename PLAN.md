# Implementation Plan - Iterative Layout Engine Building

## REFACTORING PLAN - Layout Engine First Approach

### Phase R1: Preserve & Consolidate Layout Engine ✅
- [x] Remove DeterministicLayout.ts
- [x] Remove EnhancedDeterministicLayout.ts  
- [x] Remove DecorrelatedLayoutEngine.ts
- [x] Remove CorrectedSlotSystem.ts
- [x] Remove LayoutEngine.ts (old version)
- [x] Remove SingleColumnLayout.ts
- [x] Remove DualColumnLayout.ts
- [x] Remove EventClustering.ts
- [x] Remove EventDistribution.ts
- [x] Remove TimelineBounds.ts
- [x] Remove SlotBasedLayout.tsx
- [x] Remove TestSlotLayout.tsx
- [x] Remove TimelineWithSlots.tsx
- [x] Remove useSlotBasedLayout.ts
- [x] Rename DeterministicLayoutV5.ts to LayoutEngine.ts
- [ ] Test current engine with extreme zoom scenarios
- [ ] Verify degradation triggers properly at all zoom levels
- [ ] Ensure temporal positioning remains accurate across zoom range
- [ ] Document zoom behavior in engine interfaces

### Phase R2: Clean Test Suite ✅
- [x] Delete tests/_archive/ folder (47 test files + snapshots)
- [ ] Add zoom robustness test cases
- [ ] Add degradation boundary condition tests
- [ ] Add performance regression tests (100+ events)
- [ ] Document test scenarios for future engine changes

### Phase R3: Extract UI Components
- [ ] Create TimelineContainer.tsx
- [ ] Create LayoutEngineProvider.tsx
- [ ] Create TimelineRenderer.tsx
- [ ] Create TimelineAxis.tsx
- [ ] Create useLayoutEngine.ts hook
- [ ] Create useZoomHandling.ts hook
- [ ] Create CardRenderer.tsx
- [ ] Create CardTypes.tsx
- [ ] Create useCardVariant.ts hook
- [ ] Test Timeline.tsx decomposition at each step
- [ ] Ensure zero positioning regression

### Phase R4: Zoom Robustness Optimization
- [ ] Implement centralized zoom state with smooth transitions
- [ ] Add debounced layout recalculation on zoom
- [ ] Add visual stability during zoom operations
- [ ] Add memory optimization for zoom history
- [ ] Implement efficient re-clustering on zoom level changes
- [ ] Preserve card positions during minor zoom changes
- [ ] Add smart degradation threshold adjustments per zoom
- [ ] Add performance profiling with large datasets
- [ ] Add automated zoom stress testing
- [ ] Add visual regression across zoom levels
- [ ] Add performance benchmarks (zoom + 100+ events)
- [ ] Add edge case validation (min/max zoom)

## ITERATIVE LAYOUT ENGINE - Full Cards First

### Stage 1: Foundation with Full Cards Only ✅
- [x] Create timeline bounds calculation (start_date, end_date)
- [x] Implement basic temporal positioning system
- [x] Create viewport-to-timeline coordinate mapping
- [x] Add padding/margin calculations for display
- [x] Build simple card positioning system (above/below timeline)
- [x] Implement basic full card rendering (fixed size)
- [x] Add timeline axis with date labels and ticks
- [x] Add horizontal line at viewport center
- [x] Test with single events (1-5 events)

### Stage 2: Clustering Logic with Full Cards ✅ (Already Implemented in LayoutEngine)
- [x] Implement temporal event grouping logic (`dispatchEvents()`)
- [x] Create column formation based on temporal proximity (`ColumnGroup` structure)
- [x] Add clustering algorithm for nearby events (`applyLeftToRightClustering()`)
- [x] Implement above/below distribution for clustered events (alternating pattern)
- [x] Add group pitch calculation (minimum spacing between clusters - `MIN_GROUP_PITCH`)
- [x] Add cluster merge rules (merge groups closer than threshold - `PROXIMITY_MERGE_THRESHOLD`)
- [x] Test with moderate datasets (10-20 events) - v5 tests passing
- [x] Verify temporal accuracy of cluster positioning - working in main UI

### Stage 3: Decorrelated Half-Column System ✅ (COMPLETED)
- [x] **3A: Architecture Documentation** ✅
  - [x] Update ARCHITECTURE.md to reflect decorrelated half-column system
  - [x] Document independent above/below processing with 2 slots per half-column
  - [x] Update examples to show half-columns instead of full columns
  - [x] Add section on alternating placement algorithm (odd→above, even→below)
- [x] **3B: Remove Artificial Clustering Limits** ✅
  - [x] Remove TARGET_EVENTS_PER_CLUSTER constraints from layout engine
  - [x] Remove proximity merge threshold limitations 
  - [x] Identify root cause: clustering was limited to 2-3 events instead of spatial overlap
- [x] **3C: Enhanced Telemetry for Half-Column Testing** ✅
  - [x] Add halfColumns.above telemetry (count, totalSlots, usedSlots, utilization, events, eventsPerHalfColumn[])
  - [x] Add halfColumns.below telemetry (count, totalSlots, usedSlots, utilization, events, eventsPerHalfColumn[]) 
  - [x] Add placement.alternatingPattern validation (boolean)
  - [x] Add placement.spatialClustering validation (boolean)
  - [x] Add placement.temporalDistribution measurement (percentage of timeline width used)
  - [x] Extend existing window.__ccTelemetry structure with half-column metrics
- [x] **3D: Half-Column Core Implementation** ✅
  - [x] Create independent above/below half-column systems (no cross-side communication)
  - [x] Implement chronological event processing with alternating placement (Event 1→above, Event 2→below)
  - [x] Replace event count clustering with spatial-based clustering (horizontal overlap detection only)
  - [x] Update temporal anchor positioning to center of half-column events
  - [x] Update slot allocation system for 2 slots per half-column max
  - [x] Fix card positioning overlaps with proper capacity handling
- [x] **3E: Overflow Handling** ✅
  - [x] Implement proper overflow detection when half-columns reach 2-slot capacity
  - [x] Add overflow badges on timeline anchors with "+N more" indicators
  - [x] Prevent overlapping card positioning by using overflow instead
- [x] **3F: Test Suite Integration** ✅
  - [x] Create RFK timeline half-column test (4 above + 3 below half-columns working)
  - [x] Add telemetry-based test assertions using enhanced window.__ccTelemetry
  - [x] Test alternating placement pattern verification (working for simple cases)
  - [x] Test spatial clustering behavior (no artificial event limits)
  - [x] Test temporal distribution across full timeline width
- [x] **3G: Integration & Validation** ✅
  - [x] Verify RFK timeline shows distributed half-columns instead of single cluster
  - [x] Test horizontal space utilization across full viewport width (>70% timeline coverage)
  - [x] Validate alternating pattern working correctly
- [x] **3H: Timeline Range & Visual Fixes** ✅
  - [x] Fix timeline axis calculation to use all events (not just positioned cards)  
  - [x] Enhance overflow badge visibility (larger, red, prominent positioning)
  - [x] Fix vertical space utilization with dynamic card sizing
  - [x] Verify timeline spans full event range (Mar-Jun 1968 for RFK)

### Stage 3i: Adaptive Half-Column Width System ⚠️ (CRITICAL FIX NEEDED)
**Problem Identified**: Fixed 400px half-column width works for dense timelines (RFK) but fails for sparse timelines (Napoleon 90-year span). Events years apart get incorrectly grouped as "overlapping".

- [ ] **3i1: Temporal Density Calculation**
  - [ ] Calculate timeline temporal density: `pixels_per_time_unit = viewport_width / (max_date - min_date)`
  - [ ] Define reasonable temporal grouping window (5-10% of total timeline range)
  - [ ] Convert temporal window to adaptive pixel width: `adaptive_width = temporal_window * pixels_per_time_unit`
  - [ ] Replace fixed HALF_COLUMN_WIDTH with calculated adaptive width
- [ ] **3i2: Multi-Timeline Testing & Validation**
  - [ ] Test RFK timeline (3-month span): Expect narrow half-columns, similar current behavior
  - [ ] Test Napoleon timeline (90-year span): Expect wide half-columns, no false overlap grouping
  - [ ] Test JFK timeline (3-year span): Expect medium half-columns, proper temporal clustering
  - [ ] Verify overflow behavior works consistently across all temporal scales
- [ ] **3i3: Adaptive Algorithm Implementation**
  - [ ] Implement `calculateAdaptiveHalfColumnWidth()` method in LayoutEngine
  - [ ] Update `findOverlappingHalfColumn()` to use adaptive width instead of fixed constant
  - [ ] Add telemetry for adaptive width calculation (temporalDensity, adaptiveWidth values)
  - [ ] Ensure temporal accuracy: events close in time group together, distant events stay separate
- [ ] **3i4: Edge Case Handling**
  - [ ] Handle single-event timelines (avoid division by zero)
  - [ ] Set minimum/maximum adaptive width bounds (e.g., 100px-800px)
  - [ ] Test with extreme temporal densities (very dense vs very sparse)
  - [ ] Validate alternating pattern preservation across all timeline scales

### Stage 4: Overflow Handling with Full Cards
- [ ] Detect when events exceed displayable capacity
- [ ] Implement "and X more events" indicator at bottom of cards
- [ ] Add hover/click behavior to show overflow events
- [ ] Create overflow event list display
- [ ] Implement deterministic overflow ordering (chronological)
- [ ] Add overflow count badges on timeline anchors
- [ ] Test with very dense datasets (60+ events)
- [ ] Verify overflow behavior maintains temporal accuracy

### Stage 5: Zoom Robustness with Full Cards
- [ ] Test layout behavior across different zoom levels
- [ ] Ensure clustering remains stable during zoom changes
- [ ] Add zoom-aware space optimization
- [ ] Implement smooth transitions during zoom operations
- [ ] Add performance optimization for zoom with large datasets
- [ ] Test extreme zoom scenarios (very wide/narrow time ranges)
- [ ] Verify temporal positioning accuracy at all zoom levels
- [ ] Add zoom-based overflow threshold adjustments

## ADVANCED FEATURES - After Full Cards Foundation

### Stage 6: Card Type Degradation System
- [ ] Define degradation triggers based on space constraints
- [ ] Implement compact cards (smaller height)
- [ ] Add title-only cards (minimal height)
- [ ] Create degradation cascade: Full → Compact → Title-only
- [ ] Add promotion logic when space becomes available
- [ ] Test degradation with various density scenarios
- [ ] Verify visual hierarchy is maintained during degradation

### Stage 7: Multi-Event Aggregation
- [ ] Detect clusters suitable for multi-event cards
- [ ] Implement multi-event card rendering (up to 5 events)
- [ ] Add event separators within multi-event cards
- [ ] Create "5+ more" overflow for multi-event cards
- [ ] Add aggregation telemetry and metrics
- [ ] Test aggregation with clustered scenarios
- [ ] Ensure aggregation preserves temporal relationships

### Stage 8: Infinite Event Cards
- [ ] Implement infinite overflow containers
- [ ] Add preview event display (top K events)
- [ ] Create expandable infinite card interface
- [ ] Add deterministic ordering within infinite cards
- [ ] Implement infinite card positioning and sizing
- [ ] Test infinite cards with extreme density (100+ events)
- [ ] Add accessibility support for infinite card navigation

## TELEMETRY & TESTING

### Stage 9: Comprehensive Telemetry
- [ ] Emit layout telemetry: events, groups, capacity, utilization
- [ ] Add clustering metrics: groupCount, avgEventsPerCluster
- [ ] Implement space utilization tracking
- [ ] Add overflow tracking and statistics
- [ ] Create degradation/promotion counters
- [ ] Add zoom behavior telemetry
- [ ] Test telemetry accuracy across all stages

### Stage 10: Test Suite Development
- [ ] Create tests for Stage 1 (foundation with full cards)
- [ ] Add tests for Stage 2 (clustering logic)
- [ ] Implement tests for Stage 3 (space optimization)
- [ ] Create tests for Stage 4 (overflow handling)
- [ ] Add tests for Stage 5 (zoom robustness)
- [ ] Create degradation system tests (Stage 6)
- [ ] Add multi-event aggregation tests (Stage 7)
- [ ] Implement infinite card tests (Stage 8)
- [ ] Create comprehensive integration tests
- [ ] Add performance benchmarks for each stage

## UI & POLISH

### Stage 11: Visual Polish
- [ ] Add colored left borders for card type differentiation
- [ ] Implement proper typography scales per card type
- [ ] Add subtle shadows and borders for card separation
- [ ] Create consistent spacing and gutters
- [ ] Add anchor markers on timeline with event count badges
- [ ] Implement hover states and interactions
- [ ] Add smooth transitions between layout changes
- [ ] Test visual consistency across all card types

### Stage 12: Developer Experience
- [ ] Add debug mode for layout visualization
- [ ] Create slot occupancy visualization
- [ ] Add layout decision explanations in debug mode
- [ ] Implement clustering decision visualization
- [ ] Add performance profiling tools
- [ ] Create layout algorithm documentation
- [ ] Add configuration interface for layout parameters
- [ ] Test developer tools functionality

## ERROR HANDLING & EDGE CASES

### Stage 13: Robustness
- [ ] Handle empty timeline gracefully
- [ ] Add fallbacks for clustering failures
- [ ] Implement error recovery for invalid states
- [ ] Add bounds checking for all calculations
- [ ] Handle extreme viewport sizes
- [ ] Test with malformed event data
- [ ] Add graceful degradation for performance issues
- [ ] Implement comprehensive error logging

### Stage 14: Accessibility & Performance
- [ ] Add keyboard navigation support
- [ ] Implement screen reader compatibility
- [ ] Test high contrast mode support
- [ ] Add focus management across timeline
- [ ] Optimize rendering performance for large datasets
- [ ] Add virtualization for extreme datasets (1000+ events)
- [ ] Test reduced motion preferences
- [ ] Implement performance monitoring and alerts