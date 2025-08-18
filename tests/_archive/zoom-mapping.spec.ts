import { test, expect } from '@playwright/test';

// Validates that zoom (view window) changes the x-span (zoom-in => cards spread out horizontally)

test('zoom-in expands x-span of visible cards', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.getByRole('button', { name: 'Developer Panel' }).click();
  await page.getByRole('button', { name: 'Long-range' }).click();
  await page.waitForTimeout(400);

  const getMetrics = async () => {
    const cards = page.locator('[data-testid="event-card"]');
    const container = page.locator('.ml-14 >> div.w-full.h-full.relative').first();
    const containerBox = await container.boundingBox();
    if (!containerBox) throw new Error('no container');
    const rects = await cards.evaluateAll((nodes, params) => {
      const { cLeft } = (params as any) || { cLeft: 0 };
      return nodes.map(n => {
        const r = n.getBoundingClientRect();
        return { cx: r.left + r.width/2 - cLeft };
      });
    }, { cLeft: containerBox.x });
    const xs = (rects as any[]).map(r => (r as any).cx).sort((a,b)=>a-b);
    if (xs.length < 3) return { count: xs.length, avgGap: 0, span: 0 };
    let sum = 0;
    for (let i=1;i<xs.length;i++) sum += xs[i] - xs[i-1];
    return { count: xs.length, avgGap: sum / (xs.length - 1), span: xs[xs.length-1] - xs[0] };
  };

  const before = await getMetrics();
  // Zoom in (use control bar zoom in button)
  await page.getByRole('button', { name: '＋ Zoom In' }).click();
  await page.waitForTimeout(200);
  const after = await getMetrics();
  // Expect average gap to increase (fewer cards in view but more space per card)
  expect(after.avgGap).toBeGreaterThan(before.avgGap);
  // And card count shouldn't increase
  expect(after.count).toBeLessThanOrEqual(before.count);
});
