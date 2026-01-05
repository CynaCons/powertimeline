# SRS: Mobile Navigation

## Version
1.0

## Overview
This document specifies the requirements for mobile-first navigation accessibility in PowerTimeline. The primary component is a bottom navigation bar that provides access to main app sections on mobile devices.

## Background
The NavigationRail component is hidden on mobile viewports (`hidden md:flex`) to preserve screen real estate. Without an alternative navigation pattern, mobile users cannot access key app sections like Browse, My Timelines, or Settings. This SRS defines the BottomNavigation component that addresses this accessibility gap.

## Requirements

### CC-REQ-MOB-001: Bottom Navigation Visibility
**Priority:** P0 (Critical)

- Bottom navigation bar SHALL be visible on viewports < 768px (md breakpoint)
- Bottom navigation bar SHALL be hidden on viewports >= 768px where NavigationRail is visible
- Implementation: `md:hidden` Tailwind class on the navigation container

### CC-REQ-MOB-002: Navigation Items
**Priority:** P0 (Critical)

The bottom navigation SHALL contain the following items:

| Item | Icon | Label | Path | Auth Required |
|------|------|-------|------|---------------|
| Browse | `explore` | Browse | `/browse` | No |
| My Timelines | `collections` | My Timelines | `/user/:userId` | Yes |
| Settings | `settings` | Settings | `/settings` | Yes |
| Sign In | `person` | Sign In | `/login` | No (guest only) |

- For authenticated users: Browse, My Timelines, Settings
- For unauthenticated users: Browse, Sign In

### CC-REQ-MOB-003: Active State Indication
**Priority:** P1 (High)

- Active nav item SHALL have accent color (`var(--page-accent)`)
- Inactive nav items SHALL have secondary text color (`var(--page-text-secondary)`)
- Active icon SHALL use filled variant (`fontVariationSettings: "'FILL' 1"`)
- Inactive icon SHALL use outlined variant (`fontVariationSettings: "'FILL' 0"`)

### CC-REQ-MOB-004: Safe Area Support
**Priority:** P1 (High)

- Navigation bar SHALL respect iOS safe area insets (notch, home indicator)
- SHALL use `env(safe-area-inset-bottom, 0)` for bottom padding
- CSS class: `.safe-area-bottom`

### CC-REQ-MOB-005: Content Padding
**Priority:** P1 (High)

- Pages with bottom navigation SHALL have bottom padding to prevent content from being hidden
- CSS class: `.has-bottom-nav` providing `padding-bottom: 5rem` on mobile
- Padding SHALL be removed on desktop (md+) where NavigationRail is visible

### CC-REQ-MOB-006: Accessibility
**Priority:** P0 (Critical)

- Navigation container SHALL have `role="navigation"`
- Navigation container SHALL have `aria-label="Mobile navigation"`
- Each nav item SHALL have `aria-label` matching the visible label
- Active item SHALL have `aria-current="page"`
- All icons SHALL have `aria-hidden="true"`

### CC-REQ-MOB-007: Theme Support
**Priority:** P1 (High)

- Background color: `var(--page-bg-elevated)`
- Border color: `var(--page-border)`
- Navigation SHALL render correctly in both light and dark themes

### CC-REQ-MOB-008: Z-Index Layering
**Priority:** P2 (Medium)

- Bottom navigation SHALL use `z-index: 50` to appear above page content
- SHALL be below modals and toasts (z-1000+)

## Component Integration

### Pages Requiring BottomNavigation

| Page | Component | Nav Rail | Bottom Nav |
|------|-----------|----------|------------|
| Browse | `HomePage` | `hidden md:flex` | Yes |
| User Profile | `UserProfilePage` | `hidden md:flex` | Yes |
| Settings | `SettingsPage` | None | Yes |
| Landing | `LandingPage` | None | No (own nav) |
| Login | `LoginPage` | None | No |
| Editor | `EditorPage` | Custom | No |
| Admin | `AdminPage` | Always visible | No |

### CSS Classes

```css
/* Safe area inset for iOS devices */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Content padding when bottom navigation is present */
.has-bottom-nav {
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .has-bottom-nav {
    padding-bottom: 0;
  }
}
```

## Test References

- `tests/mobile/bottom-navigation.spec.ts` (to be created)
- Manual testing on iOS Safari (safe area insets)
- Manual testing on Android Chrome

## Files

| File | Purpose |
|------|---------|
| `src/components/BottomNavigation.tsx` | Main component |
| `src/styles/index.css` | CSS classes |
| `src/pages/HomePage.tsx` | Integration |
| `src/pages/UserProfilePage.tsx` | Integration |
| `src/pages/SettingsPage.tsx` | Integration |

## Acceptance Criteria

1. Mobile users can navigate between Browse, My Timelines, and Settings
2. Navigation is hidden on desktop where NavigationRail is visible
3. Active state is clearly indicated
4. Content is not hidden behind navigation bar
5. Works correctly on iOS devices with notch/home indicator
6. Meets WCAG 2.1 AA accessibility guidelines
