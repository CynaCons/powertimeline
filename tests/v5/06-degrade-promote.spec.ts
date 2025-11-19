/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/06 Degrade & Promote (telemetry)', () => {
  test('degradation counts and placeholders present', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');

    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.degradations?.count >= 0));
    const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();
    expect(t.degradations.count).toBeGreaterThanOrEqual(0);
    expect(t.degradations.byType.compact).toBeGreaterThanOrEqual(0);
    expect(t.degradations.byType['title-only']).toBeGreaterThanOrEqual(0);
    // Promotions are not implemented yet; ensure field exists with a non-negative number
    expect(t.promotions.count).toBeGreaterThanOrEqual(0);
  });
});
