# Implementation Plan - Enhanced Deterministic Layout v5

## Overview

Implementation of the corrected and enhanced deterministic layout algorithm based on updated user specifications:
- **Corrected slot allocation**: Full(4), Compact(8), Title-only(8), Multi-event(4)
- **Independent above/below layouts** with decorrelated clustering
- **Horizontal space optimization** across full timeline width
- **Timeline-driven process**: bounds → dispatch → cluster → fit → degrade

## Phase 1: Core Infrastructure & Timeline Bounds

### 1.1 Timeline Display Range Calculation
- [x] Implement timeline bounds calculation (start_date, end_date)
- [x] Add zoom level consideration for display range
- [x] Create viewport-to-timeline coordinate mapping
- [x] Add padding/margin calculations for optimal display
- [ ] Test timeline bounds with various datasets

### 1.2 Event Distribution System  
- [x] Create optimal event dispatch algorithm across timeline width
- [x] Implement horizontal space utilization maximization
- [x] Add event density analysis for distribution strategy
- [x] Create viewport space allocation logic
- [ ] Test event distribution with sparse and dense datasets

### 1.3 Corrected Slot System
- [ ] Update slot allocation: Full(4), Compact(8), Title-only(8), Multi-event(4)
- [ ] Implement card size relationships (compact = half of full, title < compact)
- [ ] Create multi-event card content layout (5 events max per card)
- [ ] Add slot occupancy tracking for new allocations
- [ ] Test slot system with corrected numbers

## Phase 2: Independent Above/Below Layout Engine

### 2.1 Decorrelated Layout System
- [ ] Create separate layout managers for above and below timeline
- [ ] Implement independent clustering logic per vertical section
- [ ] Add cross-section coordination for anchor positioning
- [ ] Create separate slot grids for above/below sections
- [ ] Test decorrelated layout with mixed card types

### 2.2 Enhanced Left-to-Right Clustering
- [ ] Implement horizontal space optimization clustering
- [ ] Add column width calculation based on screen utilization
- [ ] Create smart grouping logic to avoid over-clustering
- [ ] Implement temporal anchor centering per section
- [ ] Test clustering with optimized horizontal distribution

### 2.3 Independent Degradation Engines
- [ ] Create separate degradation logic for above and below
- [ ] Implement section-specific slot availability checking
- [ ] Add cross-section degradation coordination when needed
- [ ] Create degradation statistics per section
- [ ] Test independent degradation with various scenarios

## Phase 3: Card Type Implementation & Sizing

### 3.1 Corrected Card Specifications
- [ ] Implement full cards (4 slots: 2 above + 2 below)
- [ ] Create compact cards (8 slots: 4 above + 4 below, half height)
- [ ] Design title-only cards (8 slots: 4 above + 4 below, smaller than compact)
- [ ] Build multi-event cards (4 slots: 2 above + 2 below, full size with multi content)
- [ ] Test all card types with correct sizing relationships

### 3.2 Multi-Event Card Content System
- [ ] Implement 5-event max per multi-event card
- [ ] Create event separators within cards
- [ ] Add title + date display for each event within card
- [ ] Implement 10 above + 10 below effective capacity (2 cards × 5 events each)
- [ ] Test multi-event cards with various event counts

### 3.3 Dynamic Card Sizing
- [ ] Implement responsive card height based on content
- [ ] Add size relationships enforcement (full > compact > title-only)
- [ ] Create consistent card width across types
- [ ] Add visual consistency checks
- [ ] Test card sizing across different viewport sizes

## Phase 4: Optimized Clustering Algorithm

### 4.1 Timeline-Driven Process Implementation
- [ ] Implement Process Order: bounds → dispatch → cluster → fit → degrade
- [ ] Create timeline bounds calculator
- [ ] Add optimal event dispatcher
- [ ] Implement space-aware clustering
- [ ] Add degradation as last resort
- [ ] Test complete process flow

### 4.2 Horizontal Space Optimization
- [ ] Create screen real estate maximization algorithm
- [ ] Implement anti-clustering logic when space is available
- [ ] Add dynamic column width based on available space
- [ ] Create horizontal utilization metrics
- [ ] Test horizontal optimization with various zoom levels

### 4.3 Smart Column Formation
- [ ] Implement intelligent column width calculation
- [ ] Add horizontal overlap detection with optimization
- [ ] Create column merging/splitting logic based on space
- [ ] Add minimum and maximum column constraints
- [ ] Test column formation with optimized spacing

## Phase 5: Advanced Layout Features

### 5.1 Zoom-Aware Layout
- [ ] Implement zoom level impact on clustering decisions
- [ ] Add dynamic column width based on zoom
- [ ] Create zoom-responsive card sizing
- [ ] Add automatic re-clustering on zoom changes
- [ ] Test layout behavior across zoom levels

### 5.2 Cross-Section Coordination
- [ ] Implement anchor synchronization between above/below sections
- [ ] Create shared temporal anchor positioning
- [ ] Add visual connection lines between sections
- [ ] Implement coordinated hover/selection across sections
- [ ] Test cross-section interaction and coordination

### 5.3 Performance Optimization
- [ ] Implement efficient slot grid operations
- [ ] Add memoization for clustering calculations
- [ ] Create incremental layout updates
- [ ] Add virtualization for large datasets
- [ ] Test performance with 100+ events

## Phase 6: Testing & Validation

### 6.1 Slot System Validation
- [ ] Test corrected slot allocations (4/8/8/4)
- [ ] Verify zero overlaps with new slot system
- [ ] Test slot occupancy tracking independence
- [ ] Validate degradation mathematics with corrected numbers
- [ ] Create slot utilization visualization

### 6.2 Layout Algorithm Testing
- [ ] Test timeline-driven process order
- [ ] Verify horizontal space optimization
- [ ] Test independent above/below layouts
- [ ] Validate temporal anchor centering
- [ ] Test decorrelated clustering scenarios

### 6.3 Visual Regression Testing
- [ ] Create test cases for all card type combinations
- [ ] Test mixed above/below card type scenarios
- [ ] Verify card sizing relationships
- [ ] Test multi-event card content layout
- [ ] Create comprehensive screenshot test suite

## Phase 7: Integration & Polish

### 7.1 UI Integration
- [ ] Update layout component with new system
- [ ] Integrate corrected slot information display
- [ ] Add above/below section statistics
- [ ] Update debug information panels
- [ ] Test complete UI integration

### 7.2 Developer Experience
- [ ] Add slot occupancy visualization (above/below)
- [ ] Create layout algorithm debug mode
- [ ] Add horizontal utilization metrics display
- [ ] Implement clustering decision explanations
- [ ] Test developer tools functionality

### 7.3 Documentation Updates
- [ ] Update ARCHITECTURE.md with implementation details
- [ ] Create visual examples of corrected card types
- [ ] Document above/below decorrelation
- [ ] Add horizontal optimization examples
- [ ] Create implementation guide

#### Docs review (2025-08-18)
- [ ] Unify slot allocation across docs: Full(4), Compact(8), Title-only(8), Multi-event(4); describe multi-event as "contains up to 5 events in one full-size card" and remove conflicting "10-slot" phrasing.
- [ ] Update ARCHITECTURE.md title to "Deterministic Layout v5" and align all examples and formulas to corrected numbers (remove the early "2/4/8/10" bullet and the 10-slot capacity table).
- [ ] README: expand Tests section to reflect full Playwright suite (mention playwright.config.ts, common scripts: test, test:screens, test:clustered, test:degradation) and that tests are headless by default.
- [ ] Fix references to VISUALS.md in COMPLETED.md: either add the file with the documented visuals/tokens or replace references with ARCHITECTURE.md/PLAN.md sections.
- [ ] Cross-check file paths mentioned in docs (e.g., src/styles/tokens.css, layout engines) and correct any outdated names.
- [ ] Add a short "Architecture quickstart" paragraph to README pointing to ARCHITECTURE.md, PLAN.md, and PRD.md.

## Phase 8: Edge Cases & Robustness

### 8.1 Edge Case Handling
- [ ] Test single event scenarios
- [ ] Handle empty timeline gracefully
- [ ] Test extreme density scenarios (100+ events)
- [ ] Validate behavior with very wide timespans
- [ ] Test rapid zoom in/out scenarios

### 8.2 Error Handling & Fallbacks
- [ ] Add fallback mechanisms for clustering failures
- [ ] Implement graceful degradation for overflow scenarios
- [ ] Add error reporting for layout issues
- [ ] Create recovery mechanisms for invalid states
- [ ] Test error scenarios comprehensively

### 8.3 Accessibility & Usability
- [ ] Ensure keyboard navigation works with decorrelated layout
- [ ] Add screen reader support for above/below sections
- [ ] Test high contrast mode compatibility
- [ ] Verify focus management across sections
- [ ] Test reduced motion preferences

## Success Criteria

### Core Requirements
- ✅ **Corrected slot allocation** (4/8/8/4) implemented and tested
- ✅ **Independent above/below layouts** with decorrelated clustering
- ✅ **Horizontal space optimization** maximizing screen utilization
- ✅ **Timeline-driven process** following specified order
- ✅ **Zero overlaps guaranteed** with new slot system

### Performance Targets
- Layout calculation < 100ms for 50 events
- Smooth 60fps interaction during zoom/pan
- Memory usage < 50MB for 100 events
- Zero layout thrashing during interactions

### Quality Metrics
- 100% test coverage for core layout algorithms
- Zero overlap detection in all test scenarios
- Consistent visual hierarchy across card types
- Accessible to WCAG 2.1 AA standards

## Phase 9: UI Refinement & Bug Fixes (Current)

### 9.1 Card Styling Improvements
- [x] Update card styling to match info panels (rounded corners, shadows)
- [x] Fix text overflow issues with proper truncation
- [x] Add consistent padding and typography
- [x] Implement proper color scheme for card types

### 9.2 Vertical Space Optimization
- [x] Calculate card height as (viewport_height / 2) - spacing
- [x] Ensure 2 full card slots fit in half-space above/below timeline
- [x] Implement proper spacing between cards and timeline
- [x] Balance card distribution above/below timeline

### 9.3 Degradation Logic Fixes
- [x] Fix premature multi-event card creation (5 events → 5 title-only cards)
- [x] Update 2-event clusters to use separate full cards
- [x] Revise degradation thresholds to avoid early multi-event usage
- [x] Implement proper degradation cascade

### 9.4 Info Panel Transparency
- [x] Add opacity to info panels (70% default)
- [x] Implement hover effect (100% opacity on mouseover)
- [x] Add smooth transitions for opacity changes
- [x] Apply to all corner info panels

### 9.5 Dev Panel Persistence
- [ ] Fix dev panel visibility (stay visible 2-3 seconds)
- [ ] Implement fade-out transition after delay
- [ ] Add hover detection to keep panel visible
- [ ] Apply same behavior to all navigation rail panels

### 9.6 Overlap and Distribution Fixes
- [x] Fix card overlap issues by improving vertical stacking
- [x] Limit events per column to 8 to prevent overcrowding
- [x] Use tighter clustering threshold (50% of column width)
- [x] Fix vertical positioning calculation for above/below cards
- [x] Fix slot calculation for new single-event card approach
- [x] Improve horizontal spreading with better clustering logic

### 9.7 Critical UI Fixes
- [x] Fix title-only cards displaying dates instead of event titles
- [x] Convert info panels to absolute overlays (not consuming graph space)
- [x] Fix text truncation issues in compact cards
- [x] Resolve remaining card overlap issues (especially title-only cards)
- [x] Extend card positioning to use full viewport height
- [x] Ensure all available horizontal space is used for timeline

### 9.8 Final Layout Fixes (Completed)
- [x] Fix info panels blocking dev panel with z-index issues
- [x] Reduce info panel z-index from z-20 to z-[5]
- [x] Verify full vertical space usage (16px margins top/bottom)
- [x] Test with actual seeded events to confirm functionality
- [x] Ensure transparency working on info panels (bg-opacity-70)

## Implementation Notes

### Technical Decisions
- Use TypeScript for type safety in slot calculations
- Implement immutable layout state for predictability
- Create separate layout engines for above/below sections
- Use canvas-based rendering for performance if needed

### Monitoring & Metrics
- Track slot utilization efficiency
- Monitor horizontal space usage percentages
- Measure clustering effectiveness
- Log degradation frequency and causes

This plan ensures complete compliance with the enhanced architecture specifications while maintaining the deterministic, zero-overlap guarantee.