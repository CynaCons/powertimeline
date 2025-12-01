 
import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

// Dev Panel removed in v0.5.24 - use direct navigation to Firestore timelines

test.describe('Half-Column Telemetry', () => {
  test('RFK timeline — enhanced telemetry structure', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for layout to stabilize
    await page.waitForTimeout(1000);
    
    // Get telemetry data
    const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);
    
    // Verify telemetry structure exists
    expect(telemetry).toBeDefined();
    expect(telemetry.version).toBe('v5');
    
    // Verify half-column telemetry structure
    expect(telemetry.halfColumns).toBeDefined();
    expect(telemetry.halfColumns.above).toBeDefined();
    expect(telemetry.halfColumns.below).toBeDefined();
    
    // Verify above half-column metrics
    expect(telemetry.halfColumns.above).toMatchObject({
      count: expect.any(Number),
      totalSlots: expect.any(Number),
      usedSlots: expect.any(Number),
      utilization: expect.any(Number),
      events: expect.any(Number),
      eventsPerHalfColumn: expect.any(Array)
    });
    
    // Verify below half-column metrics
    expect(telemetry.halfColumns.below).toMatchObject({
      count: expect.any(Number),
      totalSlots: expect.any(Number),
      usedSlots: expect.any(Number),
      utilization: expect.any(Number),
      events: expect.any(Number),
      eventsPerHalfColumn: expect.any(Array)
    });
    
    // Verify placement validation metrics
    expect(telemetry.placement).toBeDefined();
    expect(telemetry.placement).toMatchObject({
      alternatingPattern: expect.any(Boolean),
      spatialClustering: expect.any(Boolean),
      temporalDistribution: expect.any(Number)
    });
    
    // Log telemetry for debugging
    console.log('Half-Column Telemetry:', JSON.stringify(telemetry.halfColumns, null, 2));
    console.log('Placement Metrics:', JSON.stringify(telemetry.placement, null, 2));
    
    // Basic sanity checks for RFK timeline (10 events)
    expect(telemetry.events.total).toBe(10);
    expect(telemetry.halfColumns.above.events + telemetry.halfColumns.below.events).toBeLessThanOrEqual(telemetry.events.total);
  });
  
  test('Half-column slot calculation — 2 slots per half-column', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);
    
    // Verify slot calculation: totalSlots = count * 2
    expect(telemetry.halfColumns.above.totalSlots).toBe(telemetry.halfColumns.above.count * 2);
    expect(telemetry.halfColumns.below.totalSlots).toBe(telemetry.halfColumns.below.count * 2);
    
    // Verify utilization calculation is consistent
    if (telemetry.halfColumns.above.count > 0) {
      const expectedUtilization = (telemetry.halfColumns.above.usedSlots / telemetry.halfColumns.above.totalSlots) * 100;
      expect(telemetry.halfColumns.above.utilization).toBeCloseTo(expectedUtilization, 1);
    }
    
    if (telemetry.halfColumns.below.count > 0) {
      const expectedUtilization = (telemetry.halfColumns.below.usedSlots / telemetry.halfColumns.below.totalSlots) * 100;
      expect(telemetry.halfColumns.below.utilization).toBeCloseTo(expectedUtilization, 1);
    }
  });
  
  test('Temporal distribution measurement', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);
    
    // Verify temporal distribution is a valid percentage
    expect(telemetry.placement.temporalDistribution).toBeGreaterThanOrEqual(0);
    expect(telemetry.placement.temporalDistribution).toBeLessThanOrEqual(100);
    
    // For RFK timeline, we expect events to be distributed across multiple positions
    expect(telemetry.placement.temporalDistribution).toBeGreaterThan(0);
  });
});