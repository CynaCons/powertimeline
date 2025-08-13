# Visual Design Spec (Chronochart)

Comprehensive visual documentation for the Chronochart timeline component, featuring a modern dark theme with precise typography and accessible interaction states.

## 1. Updated Color Palette (Dark Theme Default)

### Background & Foundation
- **Primary Background**: Dark gradient (#111827 → #1f2937) with subtle vignette effect
- **Surface**: var(--cc-color-surface) - elevated content areas
- **Border**: var(--cc-color-border) - subtle element separation

### Typography & Content
- **Primary Text**: var(--cc-color-text-primary) - high contrast readable text
- **Secondary Text**: var(--cc-color-text-secondary) - supporting information
- **Muted Text**: var(--cc-color-text-muted) - timestamps and metadata

### Interactive Elements
- **Accent Primary**: var(--cc-color-accent-primary) - primary actions and highlights
- **Accent Create**: var(--cc-color-accent-create) - creation affordances
- **Success**: var(--cc-color-success-*) - positive actions and confirmations
- **Danger**: var(--cc-color-danger-*) - destructive actions and warnings

## 2. Timeline Anchors (Small Light Grey Squares)

### Default State
- **Fill**: var(--cc-color-anchor-fill) - #e5e7eb (light grey)
- **Size**: 0.6 units (reduced from 0.8 for subtlety)
- **Shape**: Square with slight border radius (1px)
- **Outline**: var(--cc-color-anchor-outline) - #9ca3af

### Interactive States
- **Hover**: var(--cc-color-anchor-hover) - #d1d5db (slightly darker)
- **Selected**: var(--cc-color-anchor-selected) - #4f9dfc (blue accent)
- **Focus**: Inherits selection color with glow effect
- **Glow Effect**: var(--cc-color-selection-glow) for selected/focused states

### Dark Theme Variants
- **Fill**: #f3f4f6 (lighter for dark backgrounds)
- **Hover**: #e5e7eb
- **Outline**: #6b7280 (reduced contrast for dark theme)

## 3. Connector Design Specification

### Visual Properties
- **Color**: Light neutral gray var(--cc-color-connector)
- **Stroke Width**: Reduced thickness (0.8px) for precision
- **Style**: Straight lines with square endpoints
- **Geometry**: geometricPrecision for crisp rendering

### Connection Behavior
- **Start Point**: Anchor edge (not center) for visual precision
- **End Point**: Card edge with square terminal
- **Length**: Adaptive based on lane distance and card positioning
- **Hover**: Subtle opacity increase for selection feedback

## 4. Card Architecture & Content

### Surface Design
- **Background**: var(--cc-color-card-bg) - dark surface with transparency
- **Border**: var(--cc-color-card-border) - hairline border definition
- **Shadow**: Soft drop shadow for depth hierarchy
- **Radius**: var(--radius-md) for consistent corner treatment

### Typography Scale
- **Title**: Monospace font, var(--cc-color-card-title), 1.2rem base
- **Body**: Sans-serif, var(--cc-color-card-body), 1rem base
- **Metadata**: Reduced scale for dates and secondary info

### Content Layout (HTML via foreignObject)
- **Collapsed**: 2 title lines max + 1 body line with ellipsis
- **Expanded**: Up to 6 body lines with natural wrapping
- **Divider**: var(--cc-color-card-divider) between header and content
- **Padding**: Consistent internal spacing using token system

### Dynamic Height Expansion
- **Base Height**: Fixed collapsed dimensions for consistency
- **Expansion**: Auto-calculated based on wrapped content lines
- **Animation**: Smooth transitions during selection state changes
- **Lane Compensation**: Bonus spacing in multi-lane layouts

## 5. Grid Lines & Temporal Scaffolding

### Hierarchy System
- **Major Grid**: var(--cc-color-grid-major) - primary time divisions
- **Minor Grid**: var(--cc-color-grid-minor) - secondary subdivisions
- **Opacity**: Graduated transparency for visual hierarchy
- **Adaptive Rendering**: Density-aware display based on zoom level

### Performance Considerations
- **Budget Limit**: Grid complexity capped to maintain smooth interactions
- **Zoom Adaptation**: Line density scales with visible time range
- **Selective Rendering**: Only visible grid lines rendered for efficiency

## 6. Multi-Lane System (4-Lane Collision Avoidance)

### Lane Distribution
- **Above Axis**: Lanes 0 and 1 (2 lanes above centerline)
- **Below Axis**: Lanes 2 and 3 (2 lanes below centerline)
- **Visual Separation**: Clear vertical spacing between lanes
- **Collision Detection**: Expansion-aware overlap prevention

### Dense Layout Behavior
- **Threshold**: >40 events activates lane distribution
- **Very Dense**: >80 events enables tighter spacing optimization
- **Overflow Handling**: Smart fallback for extreme density scenarios

## 7. Accessibility & Focus Design

### Focus Ring System
- **Token**: var(--cc-focus-ring-width) and var(--cc-color-focus-accent)
- **SVG Elements**: Consistent stroke-based focus indicators
- **HTML Elements**: Standard outline with custom color mapping
- **High Contrast**: Automatic system color mapping for forced-colors mode

### Live Region Announcements
- **Event Creation**: "Created event: [title] on [date]"
- **Selection Changes**: "Selected event: [title]"
- **Edit Mode**: "Editing [title]" / "Finished editing [title]"
- **Drag Operations**: Real-time date preview during drag

### Keyboard Navigation
- **Arrow Keys**: ±1 day movement (±7 days with Shift)
- **Page Keys**: ±7 days (±30 days with Shift)
- **Enter**: Toggle edit mode or confirm actions
- **Escape**: Cancel editing or close overlays
- **Tab**: Logical focus order through interactive elements

## 8. Component Token Reference

### Spacing & Layout
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
```

### Border Radius
```css
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 1rem;
```

### Typography Scale
```css
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
```

### Interactive States
```css
--cc-color-input-bg: /* Form input backgrounds */
--cc-color-input-border: /* Form input borders */
--cc-color-input-placeholder: /* Placeholder text */
--cc-color-button-primary: /* Primary action buttons */
--cc-color-button-secondary: /* Secondary action buttons */
```

## 9. Theme Toggle Scaffold

### Implementation Status
- **Light Theme**: Complete token set defined but not default
- **Dark Theme**: Current default with full implementation
- **Toggle Mechanism**: data-theme attribute switching
- **Persistence**: localStorage-based theme memory (implementation ready)

### Future Enhancements
- **System Preference**: Automatic light/dark detection
- **UI Placement**: Theme toggle button integration
- **Animation**: Smooth color transitions during theme changes

## 10. Performance & Optimization

### SVG Rendering
- **Minimal DOM**: Efficient node count for large datasets
- **Selective Updates**: Only changed elements re-render
- **Memory Management**: Proper cleanup of event listeners
- **Smooth Interactions**: 60fps target maintained during drag operations

### Visual Regression Testing
- **Baseline Screenshots**: Automated visual comparison testing
- **State Coverage**: All major interaction states captured
- **Cross-Theme**: Both light and dark theme baselines
- **Responsive**: Multiple viewport size validations

## 11. Architecture Notes

### HTML vs SVG Integration
- **Positioning**: SVG handles precise geometric positioning
- **Content**: HTML (foreignObject) provides rich text layout and accessibility
- **Fallback**: Minimal SVG text preserved for compatibility
- **Performance**: Hybrid approach optimizes for both precision and capability

### Data Flow & State Management
- **Event Storage**: localStorage with JSON serialization
- **Real-time Updates**: Optimistic UI with persistent write-through
- **Lane Calculation**: Dynamic collision detection with caching
- **Accessibility Sync**: State changes trigger appropriate announcements

## 12. Development Guidelines

### CSS Token Usage
```css
/* Correct: Use semantic tokens */
.component {
  background: var(--cc-color-surface);
  border: 1px solid var(--cc-color-border);
  color: var(--cc-color-text-primary);
}

/* Avoid: Direct color values */
.component {
  background: #1f2937; /* Use tokens instead */
}
```

### Component Integration
- **Props Interface**: TypeScript strict typing for all component props
- **Event Handling**: Descriptive callback naming and consistent patterns
- **Error Boundaries**: Graceful fallback for rendering failures
- **Testing**: Comprehensive coverage with Playwright automation

This visual specification serves as the authoritative reference for maintaining design consistency and implementing future enhancements to the Chronochart timeline component.
