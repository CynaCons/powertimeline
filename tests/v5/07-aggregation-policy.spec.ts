 
import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/07 Aggregation policy (telemetry)', () => {
  test('aggregation metrics present and event count reconciles', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');

    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.aggregation?.totalAggregations >= 0));
    const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();
    expect(t.aggregation.totalAggregations).toBeGreaterThanOrEqual(0);
    expect(t.aggregation.eventsAggregated).toBeGreaterThanOrEqual(0);
    // Reconciliation: total events equals single + aggregated + summary-contained (summary may be 0 for now)
    expect(t.events.total).toBeGreaterThan(0);
    const left = t.cards.single + t.cards.multiContained + t.cards.summaryContained;
    expect(left).toEqual(t.events.total);
  });
});
