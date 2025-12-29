import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';

interface ElementInfo {
  selector: string;
  testId: string | null;
  className: string;
  tagName: string;
  rect: { x: number; y: number; width: number; height: number };
  zIndex: number;
  computedZIndex: string;
  isInteractive: boolean;
  pointerEvents: string;
  position: string;
}

interface Overlap {
  elementA: ElementInfo;
  elementB: ElementInfo;
  overlapArea: number;
  zIndexConflict: boolean;
  description: string;
}

// Test configuration
const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

test.describe('Visual Audit - Overlap Detection (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    skipIfNoCredentials(test);

    // Login as test user
    await loginAsTestUser(page);
  });

  test('detect z-index conflicts in editor mode', async ({ page }) => {
    // Load timeline as owner (edit mode)
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false); // Already logged in

    // Wait for editor to fully load
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000); // Allow animations to settle

    // Verify we're in editor mode by checking for edit controls
    const editorControls = page.locator('[data-testid="zoom-controls"], .zoom-controls, [class*="ZoomControl"]');
    const minimapVisible = await page.locator('[class*="Minimap"], [data-testid*="minimap"]').isVisible({ timeout: 5000 }).catch(() => false);

    console.log('=== EDITOR STATE ===');
    console.log(`Minimap visible: ${minimapVisible}`);

    // Extract all positioned elements
    const elements: ElementInfo[] = await page.evaluate(() => {
      const selectors = [
        // Zoom controls
        '[data-testid*="zoom"]',
        '[class*="zoom"]',
        '[class*="Zoom"]',
        // Minimap
        '[data-testid*="minimap"]',
        '[class*="Minimap"]',
        '[class*="minimap"]',
        // Breadcrumbs
        '[data-testid*="breadcrumb"]',
        '[class*="Breadcrumb"]',
        '[class*="breadcrumb"]',
        // Cards
        '[data-testid*="card"]',
        '[class*="event-card"]',
        '[class*="EventCard"]',
        // Overlays and panels
        '[class*="Overlay"]',
        '[class*="Panel"]',
        '[class*="AuthoringOverlay"]',
        // Navigation
        '[class*="NavigationRail"]',
        '[class*="nav-rail"]',
        // Controls
        '[class*="Controls"]',
      ];

      const results: any[] = [];
      const seen = new Set<Element>();

      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (seen.has(el)) return;
            seen.add(el);

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const style = getComputedStyle(el);
            const position = style.position;

            // Only care about positioned elements
            if (!['absolute', 'fixed', 'sticky'].includes(position)) return;

            results.push({
              selector,
              testId: el.getAttribute('data-testid'),
              className: el.className?.toString()?.slice(0, 50) || '',
              tagName: el.tagName,
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              zIndex: parseInt(style.zIndex) || 0,
              computedZIndex: style.zIndex,
              isInteractive: ['BUTTON', 'A', 'INPUT'].includes(el.tagName) ||
                            el.getAttribute('role') === 'button' ||
                            style.cursor === 'pointer' ||
                            el.hasAttribute('onclick'),
              pointerEvents: style.pointerEvents,
              position,
            });
          });
        } catch (e) {
          // Ignore selector errors
        }
      });

      return results;
    });

    console.log(`\n=== POSITIONED ELEMENTS: ${elements.length} ===`);
    elements.forEach(el => {
      const name = el.testId || el.className.slice(0, 30) || el.tagName;
      console.log(`  ${name}: z-index=${el.computedZIndex}, pos=${el.position}, interactive=${el.isInteractive}`);
    });

    // Detect overlaps
    const overlaps = detectOverlaps(elements);

    console.log(`\n=== OVERLAPS FOUND: ${overlaps.length} ===`);
    overlaps.slice(0, 20).forEach(o => {
      console.log(`  ${o.description}`);
      console.log(`    Area: ${o.overlapArea}px², Conflict: ${o.zIndexConflict}`);
    });

    // Find critical conflicts
    const criticalConflicts = overlaps.filter(o => o.zIndexConflict);

    console.log(`\n=== CRITICAL CONFLICTS: ${criticalConflicts.length} ===`);
    criticalConflicts.forEach(o => {
      console.log(`  ⚠️  ${o.description}`);
    });

    // Report findings (don't fail - this is an audit)
    if (criticalConflicts.length > 0) {
      console.log('\n❌ AUDIT FINDING: Critical z-index conflicts detected!');
    } else {
      console.log('\n✅ AUDIT PASSED: No critical z-index conflicts');
    }

    // Store results for later analysis
    const results = {
      timestamp: new Date().toISOString(),
      elementsAnalyzed: elements.length,
      totalOverlaps: overlaps.length,
      criticalConflicts: criticalConflicts.length,
      conflicts: criticalConflicts.map(c => ({
        description: c.description,
        area: c.overlapArea,
      })),
    };

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(results, null, 2));
  });

  test('verify z-index layer system after fixes', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Check specific z-index values match expected token system
    const zIndexChecks = await page.evaluate(() => {
      const checks: { component: string; expected: number; actual: string; pass: boolean }[] = [];

      // Check zoom controls (should be z-60 = --z-navigation)
      const zoomControls = document.querySelector('[class*="zoom"], [class*="Zoom"]');
      if (zoomControls) {
        const z = getComputedStyle(zoomControls).zIndex;
        checks.push({ component: 'Zoom Controls', expected: 60, actual: z, pass: parseInt(z) >= 60 });
      }

      // Check minimap (should be z-50 = --z-minimap)
      const minimap = document.querySelector('[class*="Minimap"], [class*="minimap"]');
      if (minimap) {
        const z = getComputedStyle(minimap).zIndex;
        checks.push({ component: 'Minimap', expected: 50, actual: z, pass: parseInt(z) >= 50 });
      }

      // Check navigation rail (should be z-60 = --z-navigation)
      const navRail = document.querySelector('[class*="NavigationRail"], [class*="nav-rail"]');
      if (navRail) {
        const z = getComputedStyle(navRail).zIndex;
        checks.push({ component: 'Navigation Rail', expected: 60, actual: z, pass: parseInt(z) >= 60 });
      }

      return checks;
    });

    console.log('\n=== Z-INDEX VERIFICATION ===');
    zIndexChecks.forEach(check => {
      const status = check.pass ? '✅' : '❌';
      console.log(`${status} ${check.component}: expected >=${check.expected}, actual=${check.actual}`);
    });

    const allPassed = zIndexChecks.every(c => c.pass);
    if (allPassed) {
      console.log('\n✅ All z-index checks passed!');
    } else {
      console.log('\n❌ Some z-index checks failed');
    }
  });
});

function rectsOverlap(a: ElementInfo['rect'], b: ElementInfo['rect']): boolean {
  return !(a.x + a.width <= b.x ||
           b.x + b.width <= a.x ||
           a.y + a.height <= b.y ||
           b.y + b.height <= a.y);
}

function detectOverlaps(elements: ElementInfo[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      if (rectsOverlap(a.rect, b.rect)) {
        const xOverlap = Math.min(a.rect.x + a.rect.width, b.rect.x + b.rect.width) -
                        Math.max(a.rect.x, b.rect.x);
        const yOverlap = Math.min(a.rect.y + a.rect.height, b.rect.y + b.rect.height) -
                        Math.max(a.rect.y, b.rect.y);
        const overlapArea = Math.round(xOverlap * yOverlap);

        if (overlapArea < 100) continue; // Ignore tiny overlaps

        const aName = a.testId || a.className.slice(0, 20) || a.tagName;
        const bName = b.testId || b.className.slice(0, 20) || b.tagName;

        // Z-index conflict: interactive element with lower z-index overlapped by higher
        const zIndexConflict =
          (a.isInteractive && a.zIndex < b.zIndex && b.pointerEvents !== 'none') ||
          (b.isInteractive && b.zIndex < a.zIndex && a.pointerEvents !== 'none');

        overlaps.push({
          elementA: a,
          elementB: b,
          overlapArea,
          zIndexConflict,
          description: `"${aName}" (z=${a.zIndex}) vs "${bName}" (z=${b.zIndex})`,
        });
      }
    }
  }

  return overlaps.sort((a, b) => b.overlapArea - a.overlapArea);
}
