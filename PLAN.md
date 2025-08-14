# Development Plan

## REBUILD: Timeline UI from Scratch

### Context
After struggling with SVG+foreignObject rendering issues and complex coordinate systems, we're rebuilding the Timeline and Node components from scratch with a focus on visual appeal, simplicity, full screen usage, and iterative approach.

---

## Iteration 1: Foundation ✅ COMPLETE
- [x] Create full-screen grid background (12x12 CSS grid)
- [x] Draw horizontal timeline line in center  
- [x] Ensure grid covers ENTIRE available space (no centering, no margins)
- [x] Verify layout works at different viewport sizes
- [x] Clean slate implementation with Tailwind CSS Grid

---

## Iteration 2: Event Cards ✅ COMPLETE
**Test file**: `cards.spec.ts`

Card Rendering
- [x] Create HTML card components with modern styling
- [x] White background, rounded corners, subtle shadows
- [x] Proper padding and spacing
- [x] Responsive card sizing

Content Display  
- [x] Show title, description, and date clearly
- [x] Bold title at the top
- [x] Readable description text (NOT hidden or clipped)
- [x] Small date label at bottom
- [x] Clear visual hierarchy

Positioning
- [x] Place timeline anchors at date positions horizontally
- [x] Position cards above or below their timeline anchors
- [x] Center cards vertically on anchor position
- [x] Allow slight left/right shifting for card width accommodation
- [x] Ensure cards remain fully visible in viewport

---

## Iteration 3: Card Layout & Distribution ✅ COMPLETE (Extended)
**Test files**: `layout.spec.ts`, `seeding-visual.spec.ts`

Vertical Distribution
- [x] Distribute cards above and below timeline (not horizontally across)
- [x] Use multiple vertical layers/rows when events cluster
- [x] Maintain anchor alignment - cards stay near their timeline anchors
- [x] Balance above/below distribution for visual symmetry
- [x] **NEW**: Dynamic layer count (3-8 layers) based on event density
- [x] **NEW**: Adaptive layer spacing for dense datasets

Overlap Avoidance
- [x] Detect card-to-card collisions in vertical space
- [x] Shift cards to different vertical layers when overlapping
- [x] Allow slight horizontal nudging to prevent edge overlaps
- [x] Keep cards visually connected to their timeline anchors
- [x] **NEW**: Advanced collision detection with spatial optimization
- [x] **NEW**: Horizontal nudging algorithm with multiple positions
- [x] **NEW**: Score-based position selection (collision count + distance from anchor)

Connectors
- [x] Add lines from timeline anchors to cards
- [x] Connect anchor point to card center or edge
- [x] Handle variable card positions (above/below/shifted)
- [x] Subtle styling (gray, thin lines)

Timeline Scaling & Dense Layout Support
- [x] **NEW**: Proper timeline scaling based on actual date ranges
- [x] **NEW**: Chronological positioning instead of equal spacing
- [x] **NEW**: Compact card mode for datasets > 20 events
- [x] **NEW**: Napoleon Bonaparte timeline (63 events, 1746-1832)
- [x] **NEW**: Comprehensive visual testing with all seeding options
- [x] **NEW**: Collision overlap reduced by 65% (186 → 64 overlaps)

Historical Datasets Added
- [x] **NEW**: Napoleon Bonaparte comprehensive timeline from Henri Guillemin biography
- [x] **NEW**: Includes family context, military campaigns, political events, exile and death
- [x] **NEW**: Visual testing demonstrates algorithm effectiveness across different data densities

Space Optimization & UI Refinement
- [x] **NEW**: Move controls (Pan/Zoom/Fit All) to centered bottom overlay bar
- [x] **NEW**: Remove Export function to declutter interface
- [x] **NEW**: Remove top app bar and integrate ChronoChart logo into navigation rail
- [x] **NEW**: Move Dev toggle from header to navigation rail
- [x] **NEW**: Maximize timeline viewport by reclaiming header space

Grid-Based Card Layout System
- [x] **NEW**: Redesign grid as functional card slot system (not just visual)
- [x] **NEW**: One card per grid slot with smart grid sizing based on event count
- [x] **NEW**: Cards snap to grid positions for consistent alignment
- [x] **NEW**: Dynamic grid dimensions adapt to viewport and event density
- [x] **NEW**: Grid serves as collision detection foundation (no overlapping slots)
- [x] **NEW**: Visual grid indicators show occupied vs available slots
- [x] **NEW**: Perfect overlap prevention (0 collisions achieved)
- [x] **NEW**: Chronological positioning within grid constraints

---

## Iteration 4: Intelligent Timeline System (NEW)

### Context
The current grid-slot system works but lacks sophistication. We need to evolve toward an intelligent positioning algorithm that maintains chronological accuracy while handling dense datasets elegantly.

### Phase A: Adaptive Card Content ⏳ PENDING
**Goal**: Cards adapt content display based on available space and dataset density
- [ ] Detect when dataset is dense (e.g., >30 events)
- [ ] Implement title-only mode for dense datasets
- [ ] Smooth content transitions between modes
- [ ] Maintain visual hierarchy with consistent styling

### Phase B: Intelligent Positioning Algorithm ⏳ PENDING  
**Goal**: Replace grid system with anchor-relative positioning
- [ ] Cards positioned above/below their chronological anchors
- [ ] Dynamic connector lines from anchors to cards
- [ ] Collision detection and vertical layering
- [ ] Maintain chronological accuracy vs. grid constraints

### Phase C: Anchor Fusion System ⏳ PENDING
**Goal**: Handle time-dense periods elegantly  
- [ ] Detect events within close time proximity
- [ ] Fuse nearby anchors with count badges
- [ ] Expandable fused anchors showing grouped events
- [ ] Smart clustering algorithm (time + spatial proximity)

### Phase D: Card Expansion & Focus ⏳ PENDING
**Goal**: Rich card interaction for detailed content view
- [ ] Click card → expand to 70%×80% viewport
- [ ] Background blur effect for focus
- [ ] Full description display with scrolling
- [ ] Click-outside-to-close + close button
- [ ] Smooth expand/collapse animations

### Phase E: Angular Distribution ⏳ PENDING
**Goal**: Advanced positioning for crowded timeline areas
- [ ] Detect overcrowded anchor regions  
- [ ] Angular "burst" positioning (90°±30° from anchor)
- [ ] Varying distances to prevent overlaps
- [ ] Dynamic connector line routing

---

## Iteration 5: User Interactions (Legacy)
**Test file**: `interactions.spec.ts`

Selection
- [ ] Click cards to select
- [ ] Visual feedback (border highlight)
- [ ] Click outside to deselect
- [ ] Only one selected at a time

Hover Effects
- [ ] Shadow increase on hover
- [ ] Slight scale up (1.02x)
- [ ] Smooth transitions

Keyboard Navigation
- [ ] Left/right to navigate chronologically
- [ ] Enter to select
- [ ] Escape to deselect

---

## Iteration 5: Timeline Axis & Context
**Test file**: `timeline.spec.ts`

Date Labels
- [ ] Show months/years below timeline
- [ ] Adaptive density (don't overcrowd)
- [ ] Clear, readable labels
- [ ] Aligned with timeline position

Tick Marks
- [ ] Major ticks for years
- [ ] Minor ticks for months
- [ ] Extend from timeline line

Grid Lines
- [ ] Extend from major ticks
- [ ] Light gray, not distracting
- [ ] Help align cards temporally

---

## Iteration 6: Timeline Navigation
**Test file**: `navigation.spec.ts`

Zoom Controls
- [ ] In/out buttons in UI
- [ ] Zoom in to focus on periods
- [ ] Zoom out for overview
- [ ] Smooth zoom transitions

Mouse Wheel Zoom
- [ ] Zoom at cursor position
- [ ] Natural zoom behavior
- [ ] Prevent over-zoom
- [ ] Clamp to reasonable bounds

Pan Controls
- [ ] Pan buttons in UI
- [ ] Drag timeline to pan
- [ ] Keep cards in sync with timeline

---

## Iteration 7: Content Management
**Test file**: `editing.spec.ts`

Create Events
- [ ] Click timeline to add
- [ ] Show create form
- [ ] Set date based on click position
- [ ] Add to timeline immediately

Edit Events
- [ ] Click to select, then edit button
- [ ] Inline or modal editing
- [ ] Update cards in real-time

Delete Events
- [ ] Delete button when selected
- [ ] Confirm dangerous actions
- [ ] Animate removal

---

## Iteration 8: Polish & Performance
**Test file**: `performance.spec.ts`

Animations
- [ ] Card entrance/exit
- [ ] Selection feedback
- [ ] Zoom/pan smoothness

Performance
- [ ] Handle 100+ events
- [ ] Virtual scrolling if needed
- [ ] Efficient re-rendering
- [ ] Smooth at 60fps

Accessibility
- [ ] ARIA labels
- [ ] Focus management
- [ ] Semantic HTML structure

Error Handling
- [ ] Loading states
- [ ] Empty states
- [ ] Network error recovery

---

## Technical Decisions

### What We're Using:
- **HTML/CSS for cards** - Native rendering, no foreignObject
- **Tailwind for styling** - Consistent, maintainable styles
- **Absolute positioning** - Simple x/y coordinates
- **CSS Grid for background** - Full screen coverage

### What We're NOT Using (for now):
- **SVG for cards** - Only for timeline/connectors
- **Complex slot algorithms** - Start with simple distribution
- **24+ UI tests** - Will add tests after UI is working
- **Overcomplicated coordinate systems** - Keep it simple

---

## Completed Work
Previous completed iterations have been archived in PLAN_COMPLETED.md