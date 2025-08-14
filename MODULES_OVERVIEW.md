# Current Modules Overview (Before Cleanup)

## Timeline.tsx (src/components/Timeline.tsx)
**Current Features:**
- SVG-based timeline with viewBox="0 0 100 40" 
- Container with minHeight: 600px
- Wheel zoom functionality at cursor position
- View window management (start/end fractions)
- Drag state management
- Create affordance (+ button) for adding events
- Slot-based layout system via useSlotLayout hook
- Axis ticks and labels via useAxisTicks hook
- Integration with multiple child components (Node, Axis, RangeBar, CreateAffordance, SlotGridVisualizer)
- Pointer move tracking for create hints
- Date/time calculations and conversions
- Event sorting and positioning

**Issues:**
- Complex coordinate system (SVG units vs pixels)
- ForeignObject rendering problems
- Vertical space not fully utilized
- Cards clustering in limited area

## Node.tsx (src/timeline/Node/Node.tsx)
**Current Features:**
- SVG-based card rendering with foreignObject for HTML content
- Dynamic text wrapping with splitIntoLines utility
- Card sizing calculations (width/height based on content)
- Title and description rendering with separator line
- Anchor point rendering (small square)
- Connector lines from anchor to card
- Selection state styling
- Label visibility toggling
- Lane-based positioning
- Scale-based adjustments
- Override parameters for position and size
- HTML content with flex layout inside foreignObject

**Issues:**
- Descriptions not visually rendering despite being in DOM
- Complex foreignObject namespace issues
- Overflow and clipping problems
- Poor visual appearance (black rectangles)
- Text visibility issues at various scales

## Related Components
- **useSlotLayout**: Grid/slot positioning logic (3x3 grid, round-robin distribution)
- **useAxisTicks**: Adaptive tick generation based on zoom
- **Axis.tsx**: Timeline axis with ticks and labels (hardcoded at Y=10)
- **SlotGridVisualizer**: Green dashed debug grid overlay
- **CreateAffordance**: Plus button for creating events
- **RangeBar**: Visual range indicator

## Current Architecture Problems
1. **SVG + ForeignObject Complexity**: Mixing SVG and HTML causing rendering issues
2. **Coordinate System Confusion**: Multiple coordinate systems (SVG units, pixels, percentages)
3. **Hardcoded Positions**: Axis at Y=10, timeline positions not synced
4. **Visual Quality**: Black rectangles instead of proper cards
5. **Layout Constraints**: Cannot easily expand to full screen
6. **Test Burden**: 24+ tests constraining any changes