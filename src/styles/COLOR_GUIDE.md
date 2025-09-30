# Color System & Theme Guide

PowerTimeline uses a comprehensive semantic color system based on Material Design 3 principles with full dark mode support.

## Overview

Our color system is built around **semantic meanings** rather than specific colors, making it easy to maintain consistency and support multiple themes.

## Color Palette

### Primary Colors
- **Purpose**: Main brand color, primary actions, links, focus states
- **Shades**: 50-900 (50 is lightest, 900 is darkest)
- **Main**: `#2196F3` (Blue 500)
- **Usage**: Buttons, links, active states, highlights

### Secondary Colors
- **Purpose**: Secondary actions, complementary elements
- **Main**: `#9C27B0` (Purple 500)
- **Usage**: Secondary buttons, accent elements

### Success Colors
- **Purpose**: Positive actions, confirmations, success states
- **Main**: `#4CAF50` (Green 500)
- **Usage**: Success messages, positive indicators, checkmarks

### Warning Colors
- **Purpose**: Cautions, pending states, attention needed
- **Main**: `#FF9800` (Orange 500)
- **Usage**: Warnings, pending indicators, caution messages

### Error Colors
- **Purpose**: Destructive actions, error states, failures
- **Main**: `#F44336` (Red 500)
- **Usage**: Error messages, delete buttons, failure states

### Neutral Colors
- **Purpose**: Text, backgrounds, borders, general UI
- **Range**: 0 (white) to 1000 (black)
- **Usage**: All general interface elements

## Usage Guidelines

### 1. Use Semantic Names
```css
/* ✅ Good - Semantic */
.error-message { color: var(--color-error-500); }
.primary-button { background: var(--color-primary-500); }

/* ❌ Bad - Color names */
.red-text { color: red; }
.blue-button { background: blue; }
```

### 2. CSS Variables
All colors are available as CSS variables:
```css
/* Primary colors */
var(--color-primary-50)   /* Light tint */
var(--color-primary-500)  /* Main color */
var(--color-primary-700)  /* Dark shade */

/* Semantic theme colors */
var(--color-background)     /* Main background */
var(--color-surface)        /* Card/panel background */
var(--color-text-primary)   /* Main text */
var(--color-text-secondary) /* Secondary text */
var(--color-border-primary) /* Main borders */
```

### 3. Utility Classes
Pre-defined utility classes are available:
```html
<!-- Backgrounds -->
<div class="bg-surface">Card background</div>
<div class="bg-primary-50">Light primary background</div>

<!-- Text -->
<p class="text-primary">Main text</p>
<p class="text-secondary">Secondary text</p>

<!-- Borders -->
<div class="border border-primary">Standard border</div>
```

### 4. Component Colors
For cards and specific components:
```css
/* Default event cards */
.event-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
}

/* Multi-event cards (primary theme) */
.multi-event-card {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
}

/* Infinite cards (error theme for attention) */
.infinite-card {
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
}
```

## Dark Mode Support

### Automatic Theme Switching
The color system automatically adjusts for dark mode:
```html
<!-- Light mode -->
<html data-theme="light">

<!-- Dark mode -->
<html data-theme="dark">
```

### Theme-Aware Components
Components automatically adapt to theme changes:
```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="bg-surface text-primary transition-theme">
      Content adapts to theme automatically
    </div>
  );
}
```

## Accessibility

### Color Contrast
All color combinations meet WCAG AA standards:
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Proper focus indicators

### High Contrast Mode
Enhanced contrast for users who need it:
```css
@media (prefers-contrast: high) {
  /* Automatically enhances contrast */
}
```

### Reduced Motion
Respects user's motion preferences:
```css
@media (prefers-reduced-motion: reduce) {
  /* Disables theme transitions */
  --transition-fast: 0ms;
}
```

## Implementation Examples

### Button Styling
```tsx
// Primary button
<Button
  variant="contained"
  className="bg-primary-500 text-white hover:bg-primary-600"
>
  Primary Action
</Button>

// Error button
<Button
  variant="outlined"
  className="border-error-500 text-error-500 hover:bg-error-50"
>
  Delete
</Button>
```

### Card Styling
```tsx
function EventCard({ type }: { type: 'default' | 'milestone' | 'deadline' }) {
  const cardClasses = {
    default: 'bg-surface border-primary',
    milestone: 'bg-primary-50 border-primary-200',
    deadline: 'bg-error-50 border-error-200'
  };

  return (
    <div className={`${cardClasses[type]} rounded-lg p-4 transition-theme`}>
      Card content
    </div>
  );
}
```

### Form Validation
```tsx
function FormField({ error }: { error?: string }) {
  return (
    <div>
      <input
        className={`border rounded-md p-2 ${
          error
            ? 'border-error-500 text-error-700'
            : 'border-primary focus:border-primary-500'
        }`}
      />
      {error && (
        <p className="text-error-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
```

## TypeScript Support

### Color Type Definitions
```typescript
import { semanticColors, getSemanticColor } from './colors';

// Get specific color value
const primaryColor = getSemanticColor('primary', 500);

// Event type colors
import { eventTypeColors } from './colors';
const milestoneColors = eventTypeColors.milestone;
```

### Theme Hook
```typescript
import { useTheme, useThemeClasses } from './contexts/ThemeContext';

function Component() {
  const { isDarkMode, toggleTheme, themePreference } = useTheme();
  const classes = useThemeClasses();

  return (
    <div className={`${classes.surface} ${classes.textPrimary}`}>
      Theme-aware component
    </div>
  );
}
```

## Migration Guide

### From Hardcoded Colors
```css
/* Before */
.old-component {
  background: #ffffff;
  color: #333333;
  border: 1px solid #cccccc;
}

/* After */
.new-component {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

### From Tailwind to Semantic
```html
<!-- Before -->
<div class="bg-white text-gray-900 border-gray-200">

<!-- After -->
<div class="bg-surface text-primary border-primary">
```

## Testing

### Visual Regression
- Test both light and dark modes
- Verify color contrast ratios
- Check accessibility compliance
- Test system theme switching

### Theme Testing
```typescript
// Test theme switching
const { toggleTheme } = useTheme();
toggleTheme(); // Should smoothly transition

// Test color variables
expect(getComputedStyle(element).color).toBe('rgb(33, 150, 243)');
```

## Performance

### CSS Variables Benefits
- **Dynamic**: Change themes without CSS rebuilds
- **Efficient**: Browser optimizes variable lookups
- **Maintainable**: Single source of truth for colors

### Bundle Impact
- CSS increased by ~6KB for comprehensive color system
- JavaScript increased by ~3KB for theme context
- No runtime color calculations needed

## Future Enhancements

- [ ] Color customization API for users
- [ ] Additional semantic colors (info, link, etc.)
- [ ] Automatic color generation from brand colors
- [ ] Advanced accessibility features (colorblind support)
- [ ] Theme animation improvements