import { test, expect } from '@playwright/test';

// Ensures layout responds to container resize (via ResizeObserver)

test('timeline reflows on resize', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.getByRole('button', { name: 'Developer Panel' }).click();
  await page.getByRole('button', { name: 'JFK 1961-63' }).click();
  await page.waitForTimeout(300);

  // Ensure UI is visible
  const axis = page.locator('[data-testid="timeline-axis"]');
  await expect(axis).toBeVisible();

  // Measure axis width before
  const beforeAxis = await axis.boundingBox();
  if (!beforeAxis) throw new Error('no axis before');

  // Resize viewport (which resizes container)
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.waitForTimeout(200);

  const afterAxis = await axis.boundingBox();
  if (!afterAxis) throw new Error('no axis after');
  // Expect axis width to change on viewport resize
  expect(afterAxis.width).not.toBe(beforeAxis.width);
});
