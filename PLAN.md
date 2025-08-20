# Implementation Plan - Iterative Layout Engine Building

## REFACTORING PLAN - Layout Engine First Approach

### Phase R1: Preserve & Consolidate Layout Engine
- [ ] Remove DeterministicLayout.ts
- [ ] Remove EnhancedDeterministicLayout.ts  
- [ ] Remove DecorrelatedLayoutEngine.ts
- [ ] Remove CorrectedSlotSystem.ts
- [ ] Remove LayoutEngine.ts (old version)
- [ ] Remove SingleColumnLayout.ts
- [ ] Remove DualColumnLayout.ts
- [ ] Remove EventClustering.ts
- [ ] Remove EventDistribution.ts
- [ ] Remove TimelineBounds.ts
- [ ] Remove SlotBasedLayout.tsx
- [ ] Remove TestSlotLayout.tsx
- [ ] Remove TimelineWithSlots.tsx
- [ ] Remove useSlotBasedLayout.ts
- [ ] Rename DeterministicLayoutV5.ts to LayoutEngine.ts
- [ ] Test current engine with extreme zoom scenarios
- [ ] Verify degradation triggers properly at all zoom levels
- [ ] Ensure temporal positioning remains accurate across zoom range
- [ ] Document zoom behavior in engine interfaces

### Phase R2: Clean Test Suite
- [ ] Delete tests/_archive/ folder (47 test files + snapshots)
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

### Stage 1: Foundation with Full Cards Only
- [ ] Create timeline bounds calculation (start_date, end_date)
- [ ] Implement basic temporal positioning system
- [ ] Create viewport-to-timeline coordinate mapping
- [ ] Add padding/margin calculations for display
- [ ] Build simple card positioning system (above/below timeline)
- [ ] Implement basic full card rendering (fixed size)
- [ ] Add timeline axis with date labels and ticks
- [ ] Add horizontal line at viewport center
- [ ] Test with single events (1-5 events)

### Stage 2: Clustering Logic with Full Cards
- [ ] Implement temporal event grouping logic
- [ ] Create column formation based on temporal proximity
- [ ] Add clustering algorithm for nearby events
- [ ] Implement above/below distribution for clustered events
- [ ] Add group pitch calculation (minimum spacing between clusters)
- [ ] Add cluster merge rules (merge groups closer than threshold)
- [ ] Test with moderate datasets (10-20 events)
- [ ] Verify temporal accuracy of cluster positioning

### Stage 3: Viewport Space Optimization with Full Cards
- [ ] Maximize horizontal space usage across full viewport width
- [ ] Implement optimal event dispatch across timeline
- [ ] Add dynamic column width based on available space
- [ ] Optimize vertical space usage (above/below timeline)
- [ ] Add anti-clustering logic when space is available
- [ ] Implement proper above/below card distribution
- [ ] Test with dense datasets (30-50 events)
- [ ] Measure and optimize horizontal space utilization

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