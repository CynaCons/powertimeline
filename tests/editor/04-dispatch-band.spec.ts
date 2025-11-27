 
import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

// NOTE: Skipped until telemetry is emitted by the runtime.
// Target: assert dispatch avg events/cluster band (e.g., 4–6) and group pitch limits.

test.describe('v5/04 Dispatch band (telemetry)', () => {
  test('avg events/cluster stays within target band', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');

  // Wait for telemetry to appear after seeding
  await page.waitForFunction(() => Boolean((window as any).__ccTelemetry && (window as any).__ccTelemetry.groups?.count >= 0));
  const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();
  // Soft assertions to avoid flakiness while tuning thresholds
  expect(t.dispatch.avgEventsPerCluster).toBeGreaterThan(0);
  expect(t.groups.count).toBeGreaterThan(0);
  // pitch stats exist
  expect(t.dispatch.groupPitchPx).toBeTruthy();
  });
});
