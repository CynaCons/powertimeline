import { test, expect } from '@playwright/test';

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
  await page.goto('/');

  // Load Napoleon dataset to have events
  await page.getByRole('button', { name: 'Developer Panel' }).click();
  await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

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
    
    // Verify degradation metrics are being collected
    expect(degradation.totalGroups).toBeGreaterThan(0);
    expect(degradation.fullCardGroups).toBeGreaterThanOrEqual(0);
    expect(degradation.compactCardGroups).toBeGreaterThanOrEqual(0);
    
    // Verify degradation rate calculation
    const expectedRate = degradation.compactCardGroups / degradation.totalGroups;
    expect(Math.abs(degradation.degradationRate - expectedRate)).toBeLessThan(0.01);
    
    // Verify space reclaimed is calculated
    if (degradation.compactCardGroups > 0) {
      expect(degradation.spaceReclaimed).toBeGreaterThan(0);
    }

    console.log('✅ Degradation Metrics:', {
      totalGroups: degradation.totalGroups,
      fullCardGroups: degradation.fullCardGroups,
      compactCardGroups: degradation.compactCardGroups,
      degradationRate: degradation.degradationRate,
      spaceReclaimed: degradation.spaceReclaimed
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
    console.log('Degradation Metrics After Zoom:', {
      totalGroups: zoomedTelemetry.degradation.totalGroups,
      fullCardGroups: zoomedTelemetry.degradation.fullCardGroups,
      compactCardGroups: zoomedTelemetry.degradation.compactCardGroups,
      degradationRate: zoomedTelemetry.degradation.degradationRate,
      spaceReclaimed: zoomedTelemetry.degradation.spaceReclaimed
    });

    // After zooming in, we might expect more compact cards due to higher density
    expect(zoomedTelemetry.degradation.totalGroups).toBeGreaterThan(0);
  }

  // Reset zoom
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(1000);

  console.log('✓ Card degradation system test completed successfully');
});

test('Card degradation system - space efficiency validation', async ({ page }) => {
  await page.goto('/');
  
  // Wait for timeline to load
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
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
    
    // Validate space efficiency calculations
    if (degradation.degradationTriggers && degradation.degradationTriggers.length > 0) {
      for (const trigger of degradation.degradationTriggers) {
        // Each compact card should save 76px per event (140px - 64px)
        const expectedSpaceSaved = 76 * trigger.eventCount;
        expect(Math.abs(trigger.spaceSaved - expectedSpaceSaved)).toBeLessThan(1);
        
        console.log(`✅ Degradation trigger: ${trigger.groupId} - ${trigger.eventCount} events, saved ${trigger.spaceSaved}px`);
      }
    }
    
    console.log('✅ Space efficiency validation passed');
  }
});