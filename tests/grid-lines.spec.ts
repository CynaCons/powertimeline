import { test, expect } from '@playwright/test';

// Phase G: verify grid lines (major + minor) render and do not exceed performance budget.
// Simple presence & density checks.

test('grid lines render within expected counts', async ({ page }) => {
  await page.goto('/');
  // Count major grid (full height) lines -> use stroke color or axis tick lines markers.
  const major = page.locator('svg line[stroke="var(--cc-color-grid-major)"]');
  await expect(major.first()).toBeVisible();
  const majorCount = await major.count();
  expect(majorCount).toBeGreaterThan(0);
  expect(majorCount).toBeLessThanOrEqual(60);

  const minor = page.locator('svg line[stroke="var(--cc-color-grid-minor)"]');
  const minorCount = await minor.count();
  expect(minorCount).toBeLessThanOrEqual(160);
});
