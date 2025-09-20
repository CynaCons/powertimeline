import { test, expect } from '@playwright/test';

test.describe('v5/48 Title-only degradation', () => {
  test('dense clusters trigger title-only cards without overlaps', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-TITLE-ONLY' });

    // Boot app once to ensure origin is set
    await page.goto('/');

    // Create a dense set of events clustered on the same day to exceed compact capacity
    const baseDate = '2025-06-15';
    const mk = (i: number) => ({
      id: `dense-${i}`,
      date: baseDate,
      title: `Dense Event ${i+1}`,
      description: `Dense event ${i+1}`
    });
    const denseEvents = [
      // Anchor events to widen the global time range so dense items cluster spatially
      { id: 'anchor-min', date: '2025-01-01', title: 'Anchor Min', description: 'Range anchor' },
      { id: 'anchor-max', date: '2025-12-31', title: 'Anchor Max', description: 'Range anchor' },
      // Dense cluster around mid-year
      ...Array.from({ length: 12 }, (_, i) => mk(i))
    ];

    await page.evaluate((events) => {
      localStorage.setItem('chronochart-events', JSON.stringify(events));
    }, denseEvents);

    await page.reload();

    // Axis present
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible();

    // Read telemetry for debugging and assertion
    const telemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry);
     
    console.log('telemetry.degradation', telemetry?.degradation);
    // Ensure at least one title-only card is rendered
    const titleOnly = page.locator('[data-testid="event-card"][data-card-type="title-only"]');
    expect(await titleOnly.count()).toBeGreaterThan(0);

    // No overlaps across all cards
    const overlaps = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]')) as HTMLElement[];
      const rects = cards.map((el) => el.getBoundingClientRect());
      const collide = (a: DOMRect, b: DOMRect) => (
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      );
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
