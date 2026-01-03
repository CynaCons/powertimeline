# Responsive Testing Requirements

**Last Updated:** 2026-01-02

This document defines requirements for multi-viewport testing infrastructure and responsive layout validation across PowerTimeline's web application. The testing framework ensures consistent user experience across desktop, tablet, and mobile devices.

## Overview

PowerTimeline's responsive testing strategy validates:
- **Multi-viewport infrastructure** - Playwright configuration supporting 4 viewport projects (desktop, desktop-xl, tablet, mobile)
- **Mobile-specific behaviors** - Touch gestures, auto-opening overlays, minimum touch targets
- **Layout adaptation** - Breakpoint transitions, grid systems, navigation responsiveness
- **Wide-screen optimization** - Horizontal space utilization on large displays (2560px+)

The testing framework runs all tests across all viewports by default (`npm test`), with viewport-specific scripts available for targeted testing.

## Scope

**In Scope:**
- Playwright multi-viewport project configuration
- Mobile-specific interaction tests (touch gestures, swipe actions)
- Responsive layout validation at all breakpoints (768px, 1024px, 2560px)
- Touch target size validation (minimum 44px)
- Horizontal overflow detection
- Large screen layout optimization tests

**Out of Scope (Current):**
- Performance testing (separate SRS)
- Cross-browser compatibility (Chrome-only for now)
- Orientation change handling
- Device-specific features (notches, safe areas)

## Requirement Tables

### Multi-Viewport Testing Infrastructure

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-RESP-001 | Playwright config supports 4 viewport projects | • `desktop` project: 1920x1080<br>• `desktop-xl` project: 2560x1440<br>• `tablet` project: iPad Mini 820x1180<br>• `mobile` project: iPhone 14 390x844<br>• Projects defined in playwright.config.ts<br>• All projects use same test files | `playwright.config.ts` (to be added) | N/A (config validation) |
| CC-REQ-RESP-002 | npm test runs all tests across all viewports by default | • `npm test` executes tests in all 4 viewport projects<br>• Failures reported per-viewport<br>• Test results grouped by project name<br>• Total runtime acceptable (<10 min for full suite) | `package.json:15`, `playwright.config.ts` | N/A (CI validation) |
| CC-REQ-RESP-003 | Viewport-specific npm scripts available | • `npm run test:mobile` - runs only mobile viewport<br>• `npm run test:tablet` - runs only tablet viewport<br>• `npm run test:responsive` - runs mobile + tablet only<br>• Scripts use `--project` flag to filter viewports | `package.json` (to be added) | N/A (script validation) |

### Mobile-Specific Tests

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MOBILE-001 | Stream View auto-opens on mobile viewport | • When viewport width <768px, Stream View overlay opens automatically on timeline load<br>• Desktop viewport (≥768px) does NOT auto-open<br>• Auto-open behavior configurable via query param `?streamView=true`<br>• User can close and reopen manually | `src/components/StreamViewerOverlay.tsx`, `src/App.tsx` | `tests/mobile/01-stream-view-auto-open.spec.ts` |
| CC-REQ-MOBILE-002 | Swipe gestures work on Stream View event cards | • Swipe left (≥80px threshold) reveals delete action (red background)<br>• Swipe right (≥80px threshold) reveals edit action (blue background)<br>• Swipe auto-closes after 3s if no action taken<br>• Only enabled for timeline owners<br>• Touch events don't interfere with vertical scrolling | `src/components/StreamViewer.tsx` | `tests/mobile/02-swipe-gestures.spec.ts` |
| CC-REQ-MOBILE-003 | All interactive elements have minimum 44px touch target | • Buttons, links, menu items ≥44px height<br>• Horizontal spacing allows 44px clickable area<br>• Tested via bounding box measurement in Playwright<br>• Includes: NavRail icons, card kebab menus, search clear button, timeline cards | All interactive components | `tests/mobile/03-touch-targets.spec.ts` |
| CC-REQ-MOBILE-004 | No horizontal overflow on any page at mobile width | • `document.documentElement.scrollWidth ≤ viewport.width`<br>• Tested on: Home page, Timeline editor, User profile, Admin panel<br>• All content fits within 390px (iPhone 14 width)<br>• Cards, buttons, text wrap appropriately | All pages | `tests/mobile/04-no-horizontal-overflow.spec.ts` |
| CC-REQ-MOBILE-005 | Navigation rail adapts appropriately on mobile | • NavRail remains visible and functional at mobile width<br>• Icon size minimum 40px touch target<br>• Rail does not obstruct main content<br>• Tooltips positioned correctly (no overflow) | `src/components/NavRail.tsx` | `tests/mobile/05-navigation-rail-mobile.spec.ts` |

### Responsive Layout Tests

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-LAYOUT-RESP-001 | Home page layout adapts correctly at all breakpoints | • **Desktop (1920px):** 3-column timeline card grid<br>• **Tablet (820px):** 2-column grid<br>• **Mobile (390px):** 1-column grid<br>• Search bar full-width at all sizes<br>• Statistics cards stack vertically on mobile (4→2→1 columns) | `src/pages/HomePage.tsx` | `tests/responsive/home-page-breakpoints.spec.ts` (planned) |
| CC-REQ-LAYOUT-RESP-002 | Timeline card grid fills available space at all viewports | • Cards use flexbox/grid to fill container width<br>• Gaps between cards consistent (16px)<br>• No orphaned cards with excessive whitespace<br>• Responsive card width maintains 2.5:1 aspect ratio | `src/components/TimelineCard.tsx` | `tests/responsive/timeline-card-grid.spec.ts` (planned) |
| CC-REQ-LAYOUT-RESP-003 | Navigation transitions smoothly at breakpoints | • NavRail width adjusts at 768px breakpoint (desktop/mobile)<br>• No layout shift/jank during resize<br>• Transitions use CSS animations (max 200ms duration)<br>• Content area adjusts padding to accommodate NavRail | `src/components/NavRail.tsx`, `src/App.tsx` | `tests/responsive/nav-breakpoints.spec.ts` (planned) |
| CC-REQ-LAYOUT-RESP-004 | Loading skeletons display correctly at all viewports | • Skeleton cards match actual card dimensions at each viewport<br>• Number of skeleton cards appropriate for viewport size (3/2/1)<br>• No layout shift when real data loads | `src/components/TimelineCardSkeleton.tsx` | `tests/responsive/loading-skeletons.spec.ts` (planned) |
| CC-REQ-LAYOUT-RESP-005 | Large screen (2560px+) layouts use full horizontal space | • Timeline canvas expands to fill available horizontal space<br>• Card layout engine utilizes extra width for more columns<br>• No artificial max-width constraints on editor canvas<br>• Minimap scales appropriately for wider view window | `src/timeline/DeterministicLayoutComponent.tsx`, `src/layout/LayoutEngine.ts` | `tests/responsive/large-screen-layout.spec.ts` (planned) |
| CC-REQ-LAYOUT-RESP-006 | Timeline canvas scales horizontally on wide screens | • View window width calculated as `Math.min(viewport.width - navRailWidth - 32, 2500)`<br>• More events visible horizontally without scrolling<br>• Zoom controls remain accessible<br>• PositioningEngine recalculates card positions for wider view | `src/layout/PositioningEngine.ts`, `src/layout/engine/PositioningEngine.ts` | `tests/responsive/canvas-scaling.spec.ts` (planned) |

## Implementation Notes

### Playwright Configuration

**Project Structure (playwright.config.ts):**
```typescript
export default defineConfig({
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'desktop-xl',
      use: { viewport: { width: 2560, height: 1440 } },
    },
    {
      name: 'tablet',
      use: {
        viewport: { width: 820, height: 1180 },
        // iPad Mini landscape
      },
    },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        // iPhone 14 Pro
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
```

**Test Scripts (package.json):**
```json
{
  "scripts": {
    "test:mobile": "playwright test --project=mobile",
    "test:tablet": "playwright test --project=tablet",
    "test:desktop": "playwright test --project=desktop",
    "test:desktop-xl": "playwright test --project=desktop-xl",
    "test:responsive": "playwright test --project=mobile --project=tablet"
  }
}
```

### Responsive Breakpoints

PowerTimeline uses these CSS breakpoints (defined in Tailwind config and CSS media queries):

| Breakpoint | Width | Description | Use Cases |
|------------|-------|-------------|-----------|
| `xs` | 0-639px | Mobile portrait | Single-column layouts, full-width cards |
| `sm` | 640-767px | Mobile landscape | Single-column with wider cards |
| `md` | 768-1023px | Tablet | 2-column grids, condensed NavRail |
| `lg` | 1024-1279px | Desktop | 3-column grids, full NavRail |
| `xl` | 1280-1919px | Desktop HD | 3-4 column grids |
| `2xl` | 1920-2559px | Desktop FHD | 4-column grids, wider canvas |
| `3xl` | 2560px+ | Desktop QHD+ | 5+ column grids, maximum canvas width |

### Touch Target Guidelines

All interactive elements must meet **minimum 44px × 44px** touch target size per WCAG 2.5.5 (Level AAA):

- **Buttons:** Minimum 44px height, padding ensures 44px clickable area
- **Links:** Inline links exempt, but standalone action links must meet target
- **Icons:** Minimum 40px with 4px padding = 44px target
- **Kebab menus:** Menu button minimum 44px, menu items minimum 44px height
- **Cards:** Entire card clickable area preferred over small "View" buttons

**Testing Pattern:**
```typescript
// Measure bounding box of interactive elements
const button = page.getByRole('button', { name: 'Create Timeline' });
const box = await button.boundingBox();
expect(box.height).toBeGreaterThanOrEqual(44);
expect(box.width).toBeGreaterThanOrEqual(44);
```

### Horizontal Overflow Detection

**Test Pattern:**
```typescript
// Detect horizontal overflow on mobile
test.use({ viewport: { width: 390, height: 844 } });

const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
```

**Common Causes:**
- Fixed-width elements (e.g., `width: 400px` on mobile)
- Long unbreakable text (URLs, email addresses) - use `word-break: break-word`
- Tables without responsive wrappers - use horizontal scroll containers
- Images without `max-width: 100%`

### Large Screen Layout Strategy

PowerTimeline optimizes for ultra-wide displays (2560px+):

1. **Canvas Width:** Dynamic calculation based on viewport
   ```typescript
   const canvasWidth = Math.min(
     window.innerWidth - navRailWidth - horizontalPadding,
     MAX_CANVAS_WIDTH // 2500px to prevent excessive zoom-out
   );
   ```

2. **Card Columns:** LayoutEngine automatically calculates column count
   ```typescript
   const columnWidth = 280; // Base card width
   const maxColumns = Math.floor(canvasWidth / (columnWidth + gap));
   ```

3. **Responsive Images:** Timeline cards scale images proportionally
   ```css
   .timeline-card img {
     max-width: 100%;
     height: auto;
   }
   ```

## Test Coverage

### Planned Test Files

#### Mobile Tests (tests/mobile/)
| Test File | Description | Requirements Covered |
|---|---|---|
| `01-stream-view-auto-open.spec.ts` | Stream View auto-opens on mobile | CC-REQ-MOBILE-001 |
| `02-swipe-gestures.spec.ts` | Swipe gestures for edit/delete | CC-REQ-MOBILE-002 |
| `03-touch-targets.spec.ts` | Minimum 44px touch targets | CC-REQ-MOBILE-003 |
| `04-no-horizontal-overflow.spec.ts` | No horizontal scroll on any page | CC-REQ-MOBILE-004 |
| `05-navigation-rail-mobile.spec.ts` | Navigation rail mobile adaptation | CC-REQ-MOBILE-005 |

#### Responsive Tests (tests/responsive/)
| Test File | Description | Requirements Covered |
|---|---|---|
| `home-page-breakpoints.spec.ts` | Home page grid adaptation (3→2→1 columns) | CC-REQ-LAYOUT-RESP-001 |
| `timeline-card-grid.spec.ts` | Timeline card grid fills available space | CC-REQ-LAYOUT-RESP-002 |
| `nav-breakpoints.spec.ts` | Navigation transitions at breakpoints | CC-REQ-LAYOUT-RESP-003 |
| `loading-skeletons.spec.ts` | Loading skeletons match viewport | CC-REQ-LAYOUT-RESP-004 |
| `large-screen-layout.spec.ts` | 2560px+ layout optimization | CC-REQ-LAYOUT-RESP-005, CC-REQ-LAYOUT-RESP-006 |
| `canvas-scaling.spec.ts` | Timeline canvas horizontal scaling | CC-REQ-LAYOUT-RESP-006 |

### Existing Tests with Viewport Relevance

The following existing tests should run across all viewports once multi-viewport configuration is implemented:

| Test File | Viewport Sensitivity | Notes |
|---|---|---|
| `tests/editor/82-stream-viewer.spec.ts` | Mobile-critical | Tests full-screen vs. modal overlay behavior |
| `tests/home/71-home-page-basic.spec.ts` | All viewports | Card grid layout varies by viewport |
| `tests/editor/16-real-viewport-layout.spec.ts` | Desktop-focused | Validates canvas layout calculations |
| `tests/editor/14-navigation-rail-overlap.spec.ts` | All viewports | NavRail positioning critical on mobile |

## Dependencies

- **Playwright** - E2E testing framework with multi-viewport support
- **MUI useMediaQuery** - Runtime breakpoint detection in React components
- **Tailwind CSS** - Responsive utility classes (md:, lg:, xl: prefixes)
- **CSS Custom Properties** - Dynamic values for responsive layouts (--nav-rail-width, --canvas-width)

## Known Limitations

1. **No device rotation testing** - Only portrait orientation tested for mobile (844px height)
2. **Touch simulation limitations** - Playwright's touch emulation may not perfectly match real devices
3. **Network conditions** - Responsive tests assume fast network (no throttling)
4. **Safe area insets** - iOS notch/home indicator safe areas not currently tested
5. **Foldable devices** - No tests for foldable/dual-screen devices

## Change History

- **2026-01-02** - Initial SRS document created with 15 requirements (3 infrastructure + 5 mobile + 6 responsive layout)
- Requirements align with planned v0.8.3.5 responsive testing infrastructure

## Future Enhancements (Post-v1.0)

- **Visual regression testing** - Screenshot comparison across viewports
- **Performance metrics** - Lighthouse scores for mobile vs. desktop
- **Cross-browser testing** - Safari, Firefox, Edge viewport projects
- **Orientation change tests** - Landscape ↔ portrait transitions
- **Device-specific tests** - Notch handling, safe areas, foldable screens
- **Accessibility viewport tests** - Screen reader + zoom combinations
