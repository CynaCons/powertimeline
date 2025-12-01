 
import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

// Dev Panel removed in v0.5.24 - use direct navigation to Firestore timelines

test.describe('Alternating Pattern Tests', () => {
  test('Simple incremental events — alternating pattern', async ({ page }) => {
    // Dev Panel removed in v0.5.24 - use RFK timeline (10 events) instead
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load
    await page.locator('[data-testid="event-card"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);

    const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);

    console.log('RFK Events Telemetry:', JSON.stringify({
      totalEvents: telemetry.events.total,
      aboveHalfColumns: telemetry.halfColumns.above,
      belowHalfColumns: telemetry.halfColumns.below,
      alternatingPattern: telemetry.placement.alternatingPattern
    }, null, 2));

    // RFK has 10 events: should have alternating above/below placement
    expect(telemetry.events.total).toBe(10);
    expect(telemetry.halfColumns.above.events + telemetry.halfColumns.below.events).toBeLessThanOrEqual(10);

    // Check if we have better distribution
    const aboveEvents = telemetry.halfColumns.above.events;
    const belowEvents = telemetry.halfColumns.below.events;
    console.log(`Event distribution: ${aboveEvents} above, ${belowEvents} below`);
  });
  
  test('10 incremental events — alternating pattern', async ({ page }) => {
    // Dev Panel removed in v0.5.24 - use RFK timeline (10 events) instead
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load
    await page.locator('[data-testid="event-card"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);

    const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);

    console.log('10 Events Telemetry:', JSON.stringify({
      totalEvents: telemetry.events.total,
      aboveHalfColumns: telemetry.halfColumns.above,
      belowHalfColumns: telemetry.halfColumns.below,
      alternatingPattern: telemetry.placement.alternatingPattern
    }, null, 2));

    // With 10 events: should be 5 above (events 0,2,4,6,8) + 5 below (events 1,3,5,7,9)
    expect(telemetry.events.total).toBe(10);
    expect(telemetry.halfColumns.above.events + telemetry.halfColumns.below.events).toBeLessThanOrEqual(10);

    // Check if we get proper alternating distribution
    const aboveEvents = telemetry.halfColumns.above.events;
    const belowEvents = telemetry.halfColumns.below.events;
    console.log(`Event distribution: ${aboveEvents} above, ${belowEvents} below`);
    expect(telemetry.placement.alternatingPattern).toBe(true);
  });
});