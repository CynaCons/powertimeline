# Visual Audit Infrastructure Design

**Created:** 2025-12-27
**Status:** Proposed for v0.8.2.1
**Purpose:** Automated detection of visual UI issues that code-based audits cannot find

## Problem Statement

Code-based audits (v0.8.1/v0.8.2) successfully identified:
- Hardcoded colors
- Missing CSS variables
- Theme inconsistencies

Code-based audits FAILED to identify:
- Zoom control bar hidden behind cards
- Breadcrumbs overlapping with event cards
- Z-index conflicts at runtime
- Interactive elements becoming unreachable

**Root Cause:** Agents read source files but don't execute the UI. Visual overlaps only manifest at runtime.

## Solution: Automated Visual Audit

### Core Capabilities

| Capability | Technology | Purpose |
|------------|------------|---------|
| Screenshot capture | Playwright `page.screenshot()` | Visual state documentation |
| Image analysis | Claude Vision (multimodal) | AI-powered visual issue detection |
| DOM inspection | Playwright `page.evaluate()` | Bounding box extraction |
| Overlap detection | Custom algorithm | Programmatic conflict identification |
| Computed styles | `getComputedStyle()` | Actual rendered z-index values |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Visual Audit Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Predictive Analysis                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Code Analysis Agent                                       │  │
│  │ - Identify components with position: absolute/fixed       │  │
│  │ - Find explicit z-index values                            │  │
│  │ - Map overlay/floating UI components                      │  │
│  │ - Output: danger_zones.json                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  Phase 2: DOM Overlap Detection                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Playwright Script (visual-audit.spec.ts)                  │  │
│  │ - Load editor with test timeline                          │  │
│  │ - Extract bounding boxes of all UI layers                 │  │
│  │ - Get computed z-index values                             │  │
│  │ - Detect geometric overlaps                               │  │
│  │ - Flag z-index priority inversions                        │  │
│  │ - Output: overlaps.json                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  Phase 3: Screenshot Analysis                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Screenshot Capture + Vision Analysis                      │  │
│  │ - Take screenshots at key states                          │  │
│  │ - Different zoom levels (25%, 50%, 100%, 200%)            │  │
│  │ - Cards at edges (top, bottom, corners)                   │  │
│  │ - Both light and dark themes                              │  │
│  │ - Feed to Claude Vision for analysis                      │  │
│  │ - Output: visual_issues.json + screenshots/               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  Phase 4: Fix Implementation                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Fix Agent                                                 │  │
│  │ - Receive structured issue reports                        │  │
│  │ - Apply z-index fixes using tokens.css variables          │  │
│  │ - Adjust positioning as needed                            │  │
│  │ - Re-run audit to verify                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Phase 1: Predictive Code Analysis

**Goal:** Identify "danger zones" - areas likely to have visual conflicts.

**Agent Prompt:**
```
Analyze the codebase for visual conflict risk:
1. Find all components with position: absolute, fixed, or sticky
2. Find all explicit z-index values (inline styles, CSS classes, Tailwind z-*)
3. Map the layering hierarchy
4. Identify components that render in the same visual space
5. Output a JSON report of danger zones
```

**Files to analyze:**
- `src/app/App.tsx` - Main canvas and overlays
- `src/timeline/` - Cards, axis, anchors
- `src/components/TimelineMinimap.tsx`
- `src/components/Breadcrumb.tsx`
- `src/styles/tokens.css` - Z-index variables

### Phase 2: DOM Overlap Detection

**Playwright Script:** `tests/visual-audit/overlap-detection.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

interface ElementInfo {
  selector: string;
  testId: string | null;
  rect: { x: number; y: number; width: number; height: number };
  zIndex: number;
  isInteractive: boolean;
  pointerEvents: string;
}

interface Overlap {
  elementA: ElementInfo;
  elementB: ElementInfo;
  overlapArea: number;
  zIndexConflict: boolean; // true if lower priority covers higher
}

test.describe('Visual Audit - Overlap Detection', () => {
  test('detect z-index conflicts on canvas', async ({ page }) => {
    // Load editor with test timeline
    await page.goto('/testuser/timeline/test-timeline-id');
    await page.waitForSelector('[data-testid="timeline-canvas"]');

    // Define UI layer priorities (higher = should be on top)
    const layerPriority: Record<string, number> = {
      'toast': 100,
      'modal': 90,
      'stream-panel': 85,
      'zoom-controls': 80,
      'minimap': 70,
      'breadcrumbs': 60,
      'panels': 50,
      'cards': 10,
      'canvas': 0,
    };

    // Extract all relevant elements
    const elements = await page.evaluate(() => {
      const selectors = [
        '[data-testid*="zoom"]',
        '[data-testid*="minimap"]',
        '[data-testid*="breadcrumb"]',
        '[data-testid*="card"]',
        '.zoom-controls',
        '.minimap',
        '.breadcrumbs',
        '.event-card',
        '[class*="Controls"]',
      ];

      const results: ElementInfo[] = [];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          results.push({
            selector,
            testId: el.getAttribute('data-testid'),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            zIndex: parseInt(style.zIndex) || 0,
            isInteractive: ['BUTTON', 'A', 'INPUT'].includes(el.tagName) ||
                          el.getAttribute('role') === 'button' ||
                          style.cursor === 'pointer',
            pointerEvents: style.pointerEvents,
          });
        });
      });

      return results;
    });

    // Detect overlaps
    const overlaps = detectOverlaps(elements);

    // Report conflicts
    console.log('=== OVERLAP REPORT ===');
    overlaps.forEach(o => {
      console.log(`OVERLAP: ${o.elementA.selector} vs ${o.elementB.selector}`);
      console.log(`  Area: ${o.overlapArea}px²`);
      console.log(`  Z-Index: ${o.elementA.zIndex} vs ${o.elementB.zIndex}`);
      console.log(`  Conflict: ${o.zIndexConflict}`);
    });

    // Fail if critical conflicts found
    const criticalConflicts = overlaps.filter(o =>
      o.zIndexConflict && o.elementA.isInteractive
    );
    expect(criticalConflicts).toHaveLength(0);
  });
});

function rectsOverlap(a: ElementInfo['rect'], b: ElementInfo['rect']): boolean {
  return !(a.x + a.width < b.x ||
           b.x + b.width < a.x ||
           a.y + a.height < b.y ||
           b.y + b.height < a.y);
}

function detectOverlaps(elements: ElementInfo[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      if (rectsOverlap(a.rect, b.rect)) {
        // Calculate overlap area
        const xOverlap = Math.min(a.rect.x + a.rect.width, b.rect.x + b.rect.width) -
                        Math.max(a.rect.x, b.rect.x);
        const yOverlap = Math.min(a.rect.y + a.rect.height, b.rect.y + b.rect.height) -
                        Math.max(a.rect.y, b.rect.y);
        const overlapArea = xOverlap * yOverlap;

        // Check for z-index conflict (interactive element covered by non-interactive)
        const zIndexConflict = (a.isInteractive && a.zIndex < b.zIndex) ||
                               (b.isInteractive && b.zIndex < a.zIndex);

        overlaps.push({ elementA: a, elementB: b, overlapArea, zIndexConflict });
      }
    }
  }

  return overlaps;
}
```

### Phase 3: Screenshot Analysis

**Screenshot Capture Script:**

```typescript
test('capture visual audit screenshots', async ({ page }) => {
  await page.goto('/testuser/timeline/test-timeline-id');
  await page.waitForSelector('[data-testid="timeline-canvas"]');

  const states = [
    { name: 'default', setup: async () => {} },
    { name: 'zoomed-out', setup: async () => { /* zoom to 25% */ } },
    { name: 'zoomed-in', setup: async () => { /* zoom to 200% */ } },
    { name: 'card-at-bottom', setup: async () => { /* scroll card to bottom */ } },
    { name: 'card-at-top', setup: async () => { /* scroll card near breadcrumbs */ } },
  ];

  for (const state of states) {
    await state.setup();

    // Light theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.screenshot({ path: `screenshots/audit-${state.name}-light.png`, fullPage: true });

    // Dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: `screenshots/audit-${state.name}-dark.png`, fullPage: true });
  }
});
```

**Vision Analysis Prompt:**
```
Analyze this screenshot of a timeline editor UI. Look for:

1. OVERLAPPING ELEMENTS: Any UI elements that appear to be incorrectly layered
   (e.g., cards covering controls, breadcrumbs hidden behind content)

2. VISIBILITY ISSUES: Elements that are hard to see, have poor contrast,
   or appear cut off

3. INTERACTIVE ELEMENTS: Buttons, controls, or clickable areas that might be
   unreachable due to overlapping elements

4. Z-INDEX PROBLEMS: Cases where background elements appear in front of
   foreground elements

For each issue found, report:
- Element description
- Location (top-left, bottom-center, etc.)
- Severity (critical/high/medium/low)
- Suggested fix
```

### Phase 4: Fix Implementation

Based on findings, agents apply fixes using the z-index system from `tokens.css`:

```css
/* Z-Index Layer System (from v0.8.2) */
--z-canvas: 0;
--z-cards: 10;
--z-anchors: 20;
--z-minimap: 50;
--z-navigation: 60;
--z-panels: 100;
--z-overlays: 500;
--z-modals: 1000;
--z-toasts: 1400;
--z-stream-panel: 1500;
```

## Known Issues to Verify

From user feedback (v0.8.2):

| Issue | Component | Expected Behavior |
|-------|-----------|-------------------|
| Zoom controls hidden | Bottom of canvas | Should be above cards, visible on hover |
| Breadcrumbs overlap cards | Top of canvas | Should never hide card content |
| Minimap overlap | Corner | Should be above cards at all zoom levels |

## Test Data Requirements

Create a test timeline with:
- Cards positioned at all edges (top, bottom, left, right)
- Cards at different vertical positions to test breadcrumb overlap
- Multiple cards to test various zoom levels
- Long timeline to test scroll behavior

## Success Criteria

1. **Zero critical overlaps**: No interactive elements covered by lower-priority elements
2. **All controls reachable**: Zoom bar, minimap, breadcrumbs always clickable
3. **Consistent across themes**: No issues unique to light or dark mode
4. **Consistent across zoom levels**: 25% to 200% zoom all work correctly

## File Structure

```
tests/
└── visual-audit/
    ├── overlap-detection.spec.ts   # DOM-based overlap detection
    ├── screenshot-capture.spec.ts  # Screenshot generation
    ├── visual-analysis.spec.ts     # Vision AI analysis runner
    └── fixtures/
        └── test-timeline.json      # Test data with edge-case positioning

docs/
├── VISUAL_AUDIT_DESIGN.md          # This document
└── UI_AUDIT_FINDINGS.md            # Updated with visual findings
```

## Execution Plan

### v0.8.2.1 Tasks

1. **Create test infrastructure**
   - [ ] Create `tests/visual-audit/` directory
   - [ ] Implement overlap detection script
   - [ ] Implement screenshot capture script
   - [ ] Create test timeline fixture with edge-case card positions

2. **Run automated detection**
   - [ ] Execute overlap detection, generate report
   - [ ] Capture screenshots at key states
   - [ ] Analyze screenshots with Claude Vision

3. **Fix identified issues**
   - [ ] Apply z-index variables to zoom controls
   - [ ] Fix breadcrumb positioning/z-index
   - [ ] Fix minimap z-index
   - [ ] Add hover z-index boost where needed

4. **Verify fixes**
   - [ ] Re-run overlap detection (expect 0 conflicts)
   - [ ] Re-capture screenshots for comparison
   - [ ] Manual spot-check of known problem areas

## Integration with CI

Future enhancement: Add visual audit to CI pipeline
- Run on PRs that modify canvas/overlay components
- Fail PR if new overlaps detected
- Store screenshots as artifacts for review
