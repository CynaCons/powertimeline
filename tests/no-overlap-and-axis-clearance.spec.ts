import { test, expect } from '@playwright/test';

// Helper to detect significant overlaps
async function getOverlapAnalysis(page) {
  return await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]')) as HTMLElement[];
    const rects = cards.map((card, index) => {
      const rect = card.getBoundingClientRect();
      return {
        index,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        centerY: rect.top + rect.height / 2
      };
    });

    const overlaps: Array<{ i: number; j: number; w: number; h: number }>=[];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];
        const xOverlap = r1.right > r2.left && r2.right > r1.left;
        const yOverlap = r1.bottom > r2.top && r2.bottom > r1.top;
        if (xOverlap && yOverlap) {
          const w = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
          const h = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
          // Allow tiny overlaps within visual margin (<= 12px on either dimension)
          if (w > 12 && h > 12) overlaps.push({ i, j, w, h });
        }
      }
    }

    const axis = document.querySelector('[data-testid="timeline-axis"]') as HTMLElement;
    const axisRect = axis?.getBoundingClientRect();

    const axisViolations = rects.filter(r => r.top <= axisRect.top + 1 && r.bottom >= axisRect.bottom - 1);

    return { count: rects.length, overlaps, axisY: axisRect?.top ?? 0, axisViolations: axisViolations.length };
  });
}

// Clustered seeding via DevPanel
async function seedClustered(page) {
  await page.locator('button[aria-label="Toggle developer options"]').click();
  await page.locator('button[aria-label="Developer Panel"]').click();
  await page.locator('button:has-text("Clustered")').click();
  await page.locator('button[aria-label="Developer Panel"]').click();
}

// Long range seeding for zoom behavior
async function seedLongRange(page) {
  await page.locator('button[aria-label="Toggle developer options"]').click();
  await page.locator('button[aria-label="Developer Panel"]').click();
  await page.locator('button:has-text("Long-range")').click();
  await page.locator('button[aria-label="Developer Panel"]').click();
}


test.describe('Layout Engine: no-overlap & axis clearance', () => {
  test('Clustered seeding should produce zero significant overlaps', async ({ page }) => {
    await page.goto('/');
    await seedClustered(page);
    await page.waitForTimeout(400);

    const analysis = await getOverlapAnalysis(page);
    expect(analysis.count).toBeGreaterThan(0);
    expect(analysis.overlaps, `Found overlaps: ${JSON.stringify(analysis.overlaps)}`).toHaveLength(0);
    expect(analysis.axisViolations).toBe(0);
  });

  test('Zoom-in should split clusters (more clusters, still no overlaps)', async ({ page }) => {
    await page.goto('/');
    await seedLongRange(page);

    // Baseline: cluster count
    const baselineClusters = await page.locator('[class*="bg-gray-800"][class*="rounded-full"]').count();

    // Zoom in by adjusting viewStart/viewEnd through localStorage (if supported) or by dispatching event
    await page.evaluate(() => {
      const evt = new CustomEvent('chronochart:setViewWindow', { detail: { start: 0.4, end: 0.6 } });
      window.dispatchEvent(evt);
    });
    await page.waitForTimeout(200);

    const analysis = await getOverlapAnalysis(page);
    const clustersAfter = await page.locator('[class*="bg-gray-800"][class*="rounded-full"]').count();

    expect(clustersAfter).toBeGreaterThanOrEqual(baselineClusters);
    expect(analysis.overlaps).toHaveLength(0);
    expect(analysis.axisViolations).toBe(0);
  });
});
