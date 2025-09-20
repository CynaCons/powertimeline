import { test, expect } from '@playwright/test';

test.describe('v5/02 Cards placement', () => {
  test('cards render above and below the axis', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARDS-001' });
    await page.goto('/');
    // Seed RFK deterministic dataset via DevPanel through navigation rail
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

  const cards = page.locator('[data-testid="event-card"]');
  expect(await cards.count()).toBeGreaterThan(0);

    const axis = page.locator('[data-testid="timeline-axis"]').first();
    const axisBox = await axis.boundingBox();
    if (!axisBox) throw new Error('Axis bbox missing');

    const centers = await cards.evaluateAll((els) => {
      return els.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
    });

    const above = centers.filter((y) => y < axisBox.y).length;
    const below = centers.filter((y) => y > axisBox.y).length;
    expect(above).toBeGreaterThan(0);
    expect(below).toBeGreaterThan(0);
  });
});
