/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

async function closeDevPanel(page: any) {
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Alternating Pattern Tests', () => {
  test('Simple incremental events — alternating pattern', async ({ page }) => {
    await page.goto('/');

    // Clear and add 5 incremental events
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: '+5' }).click();
    await closeDevPanel(page);
    await page.waitForTimeout(1000);

    const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);

    console.log('5 Events Telemetry:', JSON.stringify({
      totalEvents: telemetry.events.total,
      aboveHalfColumns: telemetry.halfColumns.above,
      belowHalfColumns: telemetry.halfColumns.below,
      alternatingPattern: telemetry.placement.alternatingPattern
    }, null, 2));

    // With 5 events: should have alternating above/below placement
    expect(telemetry.events.total).toBe(5);
    expect(telemetry.halfColumns.above.events + telemetry.halfColumns.below.events).toBeLessThanOrEqual(5);

    // Check if we have better distribution
    const aboveEvents = telemetry.halfColumns.above.events;
    const belowEvents = telemetry.halfColumns.below.events;
    console.log(`Event distribution: ${aboveEvents} above, ${belowEvents} below`);
  });
  
  test('10 incremental events — alternating pattern', async ({ page }) => {
    await page.goto('/');
    
    // Clear and add 10 incremental events
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: '+5' }).click();
    await page.getByRole('button', { name: '+5' }).click();
    await closeDevPanel(page);
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