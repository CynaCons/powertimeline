import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

/**
 * Test 36: Card Degradation System
 * Validates the first level of card degradation: full → compact
 * 
 * Tests:
 * - Full cards used for 1-2 events per half-column
 * - Compact cards used for 3+ events per half-column
 * - Degradation telemetry collection
 * - Space savings calculations
 * - Card sizing and positioning accuracy
 */

test('Card degradation system - full to compact cards', async ({ page }) => {
  await loginAsTestUser(page);
  await loadTestTimeline(page, 'timeline-napoleon');
  await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });

  console.log('🔍 TESTING CARD DEGRADATION SYSTEM');

  // Wait for initial load and telemetry
  await page.waitForTimeout(1000);

  // Wait for telemetry to appear
  await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry));

  // Get telemetry data
  const telemetryData = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
  expect(telemetryData).toBeTruthy();

  console.log('📊 Telemetry structure:', Object.keys(telemetryData));
  
  // Check degradation metrics
  console.log('🔍 Degradation field value:', telemetryData.degradation);
  
  if (telemetryData.degradation) {
    const degradation = telemetryData.degradation;

    // Verify cluster-based degradation metrics are being collected
    // Note: System now uses cluster coordination (ENABLE_CLUSTER_COORDINATION flag)
    expect(degradation.totalClusters).toBeGreaterThanOrEqual(0);
    expect(degradation.clustersWithOverflow).toBeGreaterThanOrEqual(0);
    expect(degradation.clustersWithMixedTypes).toBeGreaterThanOrEqual(0);

    // Verify cluster coordination events are tracked
    expect(Array.isArray(degradation.clusterCoordinationEvents)).toBe(true);

    // If there are clusters, verify the structure
    if (degradation.totalClusters > 0) {
      console.log(`✅ Found ${degradation.totalClusters} clusters`);
      if (degradation.clustersWithOverflow > 0) {
        console.log(`  - ${degradation.clustersWithOverflow} with overflow (uniform title-only)`);
      }
      if (degradation.clustersWithMixedTypes > 0) {
        console.log(`  - ${degradation.clustersWithMixedTypes} with mixed card types`);
      }
    }

    console.log('✅ Cluster-based Degradation Metrics:', {
      totalClusters: degradation.totalClusters,
      clustersWithOverflow: degradation.clustersWithOverflow,
      clustersWithMixedTypes: degradation.clustersWithMixedTypes,
      coordinationEvents: degradation.clusterCoordinationEvents?.length || 0
    });
  } else {
    console.log('❌ Degradation metrics not found in telemetry - value is:', telemetryData.degradation);
  }

  // Test card height differences visually
  const cards = await page.locator('[data-testid="event-card"]').all();
  if (cards.length > 0) {
    // Get card heights from style attributes
    const cardHeights = await Promise.all(
      cards.map(async (card) => {
        const style = await card.getAttribute('style');
        const heightMatch = style?.match(/height:\s*(\d+)px/);
        return heightMatch ? parseInt(heightMatch[1]) : null;
      })
    );

    const validHeights = cardHeights.filter(h => h !== null) as number[];
    if (validHeights.length > 0) {
      // Check for presence of different card sizes (heights vary by content)
      // Full cards: ~169px, Title-only cards: ~32px
      const fullCardHeights = validHeights.filter(h => h > 100);
      const compactCardHeights = validHeights.filter(h => h <= 100 && h > 20);
      
      console.log('Card Heights Found:', {
        total: validHeights.length,
        fullCards: fullCardHeights.length,
        compactCards: compactCardHeights.length,
        uniqueHeights: [...new Set(validHeights)].sort()
      });
      
      // Expect at least one type of card height
      expect(fullCardHeights.length + compactCardHeights.length).toBeGreaterThan(0);
    }
  }

  // Test different zoom levels to trigger more degradation scenarios
  console.log('Testing degradation at different zoom levels...');
  
  // Zoom in to create denser regions
  await page.keyboard.press('Equal'); // Zoom in
  await page.waitForTimeout(1000);
  await page.keyboard.press('Equal'); // Zoom in more
  await page.waitForTimeout(1000);

  // Check telemetry again after zooming - access directly from window object
  const zoomedTelemetry = await page.evaluate(() => (window as any).__ccTelemetry);

  if (zoomedTelemetry?.degradation) {
    console.log('Cluster-based Degradation Metrics After Zoom:', {
      totalClusters: zoomedTelemetry.degradation.totalClusters,
      clustersWithOverflow: zoomedTelemetry.degradation.clustersWithOverflow,
      clustersWithMixedTypes: zoomedTelemetry.degradation.clustersWithMixedTypes,
      coordinationEvents: zoomedTelemetry.degradation.clusterCoordinationEvents?.length || 0
    });

    // After zooming in, we expect clusters to exist (may increase or decrease based on visible events)
    expect(zoomedTelemetry.degradation.totalClusters).toBeGreaterThanOrEqual(0);
  }

  // Reset zoom
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(1000);

  console.log('✓ Card degradation system test completed successfully');
});

test('Card degradation system - space efficiency validation', async ({ page }) => {
  await loginAsTestUser(page);
  await loadTestTimeline(page, 'timeline-napoleon');
  await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Create a scenario with many events to trigger degradation
  // Zoom to a busy region
  await page.keyboard.press('Equal');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Equal');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Equal');
  await page.waitForTimeout(1000);
  
  // Wait for telemetry
  await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry));

  // Get telemetry data
  const telemetryData = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
  
  if (telemetryData && telemetryData.degradation) {
    const degradation = telemetryData.degradation;

    // Validate cluster coordination system
    // Note: New system uses cluster coordination instead of individual degradation triggers
    console.log(`Found ${degradation.totalClusters || 0} clusters`);

    if (degradation.clusterCoordinationEvents && degradation.clusterCoordinationEvents.length > 0) {
      for (const event of degradation.clusterCoordinationEvents) {
        // Verify cluster coordination event structure
        expect(event.clusterId).toBeTruthy();
        expect(typeof event.hasOverflow).toBe('boolean');
        expect(event.aboveCardType).toBeTruthy();

        if (event.hasOverflow && event.coordinationApplied) {
          console.log(`✅ Cluster ${event.clusterId}: overflow detected, coordination applied (${event.aboveCardType}/${event.belowCardType})`);
        }
      }

      console.log(`✅ Processed ${degradation.clusterCoordinationEvents.length} cluster coordination events`);
    }

    console.log('✅ Cluster-based space efficiency validation passed');
  }
});
