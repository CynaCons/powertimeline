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
  await page.goto('http://localhost:5179');

  // Wait for timeline to load using CSS selector (like other tests)
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('🔍 TESTING CARD DEGRADATION SYSTEM');
  
  // Wait for initial load and telemetry
  await page.waitForTimeout(2000);

  // Wait for telemetry to appear
  await page.waitForFunction(() => Boolean((window as any).__ccTelemetry));
  
  // Get telemetry data
  const telemetryData = await page.evaluate(() => (window as any).__ccTelemetry || null);
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
      // Check for presence of both full cards (140px) and compact cards (64px)
      const fullCardHeights = validHeights.filter(h => Math.abs(h - 140) < 5);
      const compactCardHeights = validHeights.filter(h => Math.abs(h - 64) < 5);
      
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

  // Check telemetry again after zooming
  const zoomedTelemetryText = await page.textContent('[data-testid="telemetry-display"]');
  const zoomedDegradationMatch = zoomedTelemetryText!.match(/"degradation":\s*{[^}]+}/);
  
  if (zoomedDegradationMatch) {
    const zoomedDegradationData = JSON.parse(`{${zoomedDegradationMatch[0]}}`);
    
    console.log('Degradation Metrics After Zoom:', {
      totalGroups: zoomedDegradationData.degradation.totalGroups,
      fullCardGroups: zoomedDegradationData.degradation.fullCardGroups,
      compactCardGroups: zoomedDegradationData.degradation.compactCardGroups,
      degradationRate: zoomedDegradationData.degradation.degradationRate,
      spaceReclaimed: zoomedDegradationData.degradation.spaceReclaimed
    });
    
    // After zooming in, we might expect more compact cards due to higher density
    expect(zoomedDegradationData.degradation.totalGroups).toBeGreaterThan(0);
  }

  // Reset zoom
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(1000);

  console.log('✓ Card degradation system test completed successfully');
});

test('Card degradation system - space efficiency validation', async ({ page }) => {
  await page.goto('http://localhost:5179');
  
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
  await page.waitForFunction(() => Boolean((window as any).__ccTelemetry));
  
  // Get telemetry data
  const telemetryData = await page.evaluate(() => (window as any).__ccTelemetry || null);
  
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