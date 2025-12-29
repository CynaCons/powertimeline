import { test, expect } from '@playwright/test';

interface ElementInfo {
  selector: string;
  testId: string | null;
  className: string;
  rect: { x: number; y: number; width: number; height: number };
  zIndex: number;
  isInteractive: boolean;
  pointerEvents: string;
}

interface Overlap {
  elementA: ElementInfo;
  elementB: ElementInfo;
  overlapArea: number;
  zIndexConflict: boolean;
}

test.describe('Visual Audit - Overlap Detection', () => {
  test('detect z-index conflicts on canvas', async ({ page }) => {
    // Load a public timeline directly (no auth required for viewing)
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline events to render
    const eventCards = page.getByTestId('event-card');
    await eventCards.first().waitFor({ state: 'visible', timeout: 10000 });

    // Wait for UI to settle
    await page.waitForTimeout(1000);

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
    const elements: ElementInfo[] = await page.evaluate(() => {
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
        '[class*="Minimap"]',
        '[class*="Breadcrumb"]',
      ];

      const results: any[] = [];
      const seen = new Set<Element>();

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (seen.has(el)) return;
          seen.add(el);

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const style = getComputedStyle(el);
          results.push({
            selector,
            testId: el.getAttribute('data-testid'),
            className: el.className?.toString() || '',
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

    console.log(`Found ${elements.length} elements to analyze`);

    // Detect overlaps
    const overlaps = detectOverlaps(elements);

    // Report all overlaps
    console.log('=== OVERLAP REPORT ===');
    console.log(`Total overlaps found: ${overlaps.length}`);

    overlaps.forEach(o => {
      const aName = o.elementA.testId || o.elementA.className.slice(0, 30);
      const bName = o.elementB.testId || o.elementB.className.slice(0, 30);
      console.log(`OVERLAP: "${aName}" vs "${bName}"`);
      console.log(`  Area: ${o.overlapArea}px²`);
      console.log(`  Z-Index: ${o.elementA.zIndex} vs ${o.elementB.zIndex}`);
      console.log(`  Interactive: A=${o.elementA.isInteractive}, B=${o.elementB.isInteractive}`);
      console.log(`  CONFLICT: ${o.zIndexConflict}`);
    });

    // Find critical conflicts (interactive element covered)
    const criticalConflicts = overlaps.filter(o =>
      o.zIndexConflict && (o.elementA.isInteractive || o.elementB.isInteractive)
    );

    console.log(`\n=== CRITICAL CONFLICTS: ${criticalConflicts.length} ===`);
    criticalConflicts.forEach(o => {
      const aName = o.elementA.testId || o.elementA.className.slice(0, 30);
      const bName = o.elementB.testId || o.elementB.className.slice(0, 30);
      console.log(`CRITICAL: "${aName}" vs "${bName}" - z-index ${o.elementA.zIndex} vs ${o.elementB.zIndex}`);
    });

    // Test assertion - report but don't fail (this is an audit)
    if (criticalConflicts.length > 0) {
      console.log('\n⚠️  AUDIT FINDING: Critical z-index conflicts detected');
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

        // Z-index conflict: interactive element has lower z-index than overlapping element
        const zIndexConflict =
          (a.isInteractive && a.zIndex < b.zIndex && b.pointerEvents !== 'none') ||
          (b.isInteractive && b.zIndex < a.zIndex && a.pointerEvents !== 'none');

        if (overlapArea > 100) { // Only report significant overlaps
          overlaps.push({ elementA: a, elementB: b, overlapArea, zIndexConflict });
        }
      }
    }
  }

  return overlaps.sort((a, b) => b.overlapArea - a.overlapArea);
}
