import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'chronochart-events';

test.skip('performance regression check at 150 events', async ({ page }) => {
  await page.goto('/');
  const ok = await page.evaluate((key) => {
    try {
      const start = new Date('2025-01-01').getTime();
      const day = 24*60*60*1000;
      const events = Array.from({ length: 150 }).map((_, i) => ({ id: 'P'+i, date: new Date(start + i*day).toISOString().slice(0,10), title: 'P'+i }));
      localStorage.setItem(key, JSON.stringify(events));
      return true;
    } catch { return false; }
  }, STORAGE_KEY);
  expect(ok).toBeTruthy();
  const before = performance.now();
  await page.reload();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(150, { timeout: 8000 });
  const after = performance.now();
  expect(after - before).toBeLessThan(4000); // simple upper bound
});
