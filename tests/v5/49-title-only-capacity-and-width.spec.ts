import { test, expect } from '@playwright/test';

test.describe('v5/49 Title-only capacity and width', () => {
  test('title-only width matches full/compact and per-cluster count <= 8', async ({ page }) => {
    await page.goto('/');

    // Seed a very dense cluster plus anchors to widen range
    const baseDate = '2025-06-15';
    const mk = (i: number) => ({ id: `dense2-${i}`, date: baseDate, title: `Dense-2 ${i+1}`, description: 'x' });
    const events = [
      { id: 'anchor-min-2', date: '2025-01-01', title: 'Min', description: 'anchor' },
      { id: 'anchor-max-2', date: '2025-12-31', title: 'Max', description: 'anchor' },
      ...Array.from({ length: 20 }, (_, i) => mk(i))
    ];
    await page.evaluate((evts) => localStorage.setItem('chronochart-events', JSON.stringify(evts)), events);
    await page.reload();

    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible();

    const cards = page.locator('[data-testid="event-card"]');
    expect(await cards.count()).toBeGreaterThan(0);

    // All title-only should have width ~260px (+/- 6px to account for rounding)
    const widths = await page.locator('[data-card-type="title-only"]').evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => el.getBoundingClientRect().width)
    );
    if (widths.length > 0) {
      widths.forEach((w) => expect(w).toBeGreaterThan(254));
      widths.forEach((w) => expect(w).toBeLessThan(266));
    }

    // Count title-only per cluster and assert <= 8 and at least one cluster >= 6
    const perCluster = await page.locator('[data-card-type="title-only"]').evaluateAll((els) => {
      const map: Record<string, number> = {};
      (els as HTMLElement[]).forEach((el) => {
        const cid = el.getAttribute('data-cluster-id') || 'none';
        map[cid] = (map[cid] || 0) + 1;
      });
      return map;
    });
    const counts = Object.values(perCluster);
    counts.forEach((c) => expect(c).toBeLessThanOrEqual(8));
    expect(counts.some((c) => c >= 6)).toBeTruthy();

    // No overlaps across all cards
    const overlaps = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-testid="event-card"]')) as HTMLElement[];
      const rects = els.map((el) => el.getBoundingClientRect());
      const collide = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          if (collide(rects[i], rects[j])) return true;
        }
      }
      return false;
    });
    expect(overlaps).toBeFalsy();
  });
});
