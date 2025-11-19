/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/08 Stability & churn (telemetry)', () => {
  test('small viewport change preserves placements (limited migrations)', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');

    // Ensure initial telemetry is present
    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.placements?.items?.length >= 1));
    const before = await page.evaluate(() => (window as any).__ccTelemetry?.placements || null);
    expect(before).toBeTruthy();

    // Trigger a very small layout recompute via viewport resize (simulates a tiny zoom/pan)
    const size = page.viewportSize();
    const w = size?.width ?? 1280;
    const h = size?.height ?? 720;
    await page.setViewportSize({ width: w + 16, height: h });

    // Wait for telemetry to update and compute migrations against previous snapshot
    await page.waitForFunction(() => {
      const t = (window as any).__ccTelemetry;
      return t && t.placements && typeof t.placements.migrations === 'number';
    });
    const after = await page.evaluate(() => (window as any).__ccTelemetry?.placements || null);
    expect(after).toBeTruthy();

    // Allow a tiny number of migrations but ensure churn is low
    expect(after.migrations).toBeLessThanOrEqual(2);
  });
});
