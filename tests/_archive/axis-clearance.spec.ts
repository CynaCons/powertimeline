import { test, expect } from '@playwright/test';

test('Axis clearance: no card intersects the axis line', async ({ page }) => {
  await page.goto('/');
  // Seed with clustered data to create pressure near axis
  await page.locator('button[aria-label="Toggle developer options"]').click();
  await page.locator('button[aria-label="Developer Panel"]').click();
  await page.locator('button:has-text("Clustered")').click();
  await page.locator('button[aria-label="Developer Panel"]').click();

  const axis = page.locator('[data-testid="timeline-axis"]');
  const axisRect = await axis.evaluate(el => el.getBoundingClientRect());

  const cards = page.locator('[data-testid="event-card"]');
  const intersections = await cards.evaluateAll((els, axisRect) => {
    return els.filter(el => {
      const r = el.getBoundingClientRect();
      return r.top <= (axisRect.top + 1) && r.bottom >= (axisRect.bottom - 1);
    }).length;
  }, axisRect as any);

  expect(intersections).toBe(0);
});
