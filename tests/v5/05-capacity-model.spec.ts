import { test, expect } from '@playwright/test';

// Skipped until capacity telemetry is available on window.__ccTelemetry

test.describe('v5/05 Capacity model (telemetry)', () => {
  test('reports total/used cells and utilization', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

  // Wait for telemetry to be populated
  await page.waitForFunction(() => Boolean((window as any).__ccTelemetry && (window as any).__ccTelemetry.capacity?.totalCells >= 0));
  const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();
  expect(t.capacity).toBeTruthy();
  expect(t.capacity.totalCells).toBeGreaterThan(0);
  expect(t.capacity.usedCells).toBeGreaterThan(0);
  expect(t.capacity.usedCells).toBeLessThanOrEqual(t.capacity.totalCells);
  expect(t.capacity.utilization).toBeGreaterThanOrEqual(0);
  expect(t.capacity.utilization).toBeLessThanOrEqual(100);
  });
});
