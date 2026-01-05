# PowerTimeline Design System

## Overview
This document describes the design tokens, components, and patterns used in PowerTimeline.

## Design Tokens

### Colors
Located in `src/styles/tokens.css`:
- `--page-bg` - Page background
- `--page-text-primary` - Primary text color
- `--page-text-secondary` - Secondary text color
- `--page-accent` - Accent/brand color
- `--page-border` - Border color
- `--card-bg` - Card background
- `--color-beta-orange` - Beta badge orange

### Typography
- `--text-xs` through `--text-3xl` - Font sizes with line heights

### Spacing
- `--space-1` through `--space-20` - Spacing scale

### Shadows
- `--shadow-xs` through `--shadow-xl` - Elevation scale
- `--shadow-card-hover` - Card hover shadow
- `--shadow-accent-glow` - Button glow

### Transitions
- `--duration-fast` - 150ms
- `--duration-normal` - 200ms
- `--duration-slow` - 300ms

## Components

### Timeline Card
Class: `.timeline-card`
- Shadow and hover lift effect
- 12px border radius
- Focus ring for accessibility

### Primary Button
Class: `.pt-button`
- Hover lift and glow
- Active press feedback
- Focus ring

### Bottom Navigation
Component: `BottomNavigation.tsx`
- Mobile-only (hidden on md+)
- Fixed to bottom
- Safe area support for iOS

### Navigation Rail
Component: `NavigationRail.tsx`
- Desktop-only (hidden on mobile)
- 56px width
- Linear-inspired design

## Accessibility

### Focus States
All interactive elements have visible focus states using:
- `focus-visible:outline-2`
- `focus-visible:outline-[var(--page-accent)]`

### Keyboard Navigation
- Cards are keyboard accessible with Enter/Space activation
- Dialogs trap focus
- Skip-to-content link available

### Reduced Motion
All animations respect `prefers-reduced-motion: reduce`

## Responsive Breakpoints

Using Tailwind defaults:
- `sm`: 640px
- `md`: 768px (mobile/desktop transition)
- `lg`: 1024px
- `xl`: 1280px
