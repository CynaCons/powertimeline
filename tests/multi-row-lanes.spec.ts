import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'chronochart-events';

function makeEvents(n: number) {
  const start = new Date('2025-01-01').getTime();
  const day = 24*60*60*1000;
  return Array.from({ length: n }).map((_, i) => ({ id: 'E'+i, date: new Date(start + i*day).toISOString().slice(0,10), title: 'E'+i }));
}

test('multi-row lanes distribute events into multiple vertical bands', async ({ page }) => {
  await page.goto('/');
  // Inject many events quickly
  await page.evaluate(({ key, events }) => localStorage.setItem(key, JSON.stringify(events)), { key: STORAGE_KEY, events: makeEvents(90) });
  await page.reload();
  const anchors = page.locator('svg rect[data-event-id]');
  await expect(anchors).toHaveCount(90, { timeout: 10000 });
  // Collect lane indices
  const laneIndices = await anchors.evaluateAll(nodes => nodes.map(n => (n.parentElement?.getAttribute('data-lane-index') || '0')));
  const unique = new Set(laneIndices);
  expect(unique.size).toBeGreaterThan(2); // should exceed 2 lanes
});
