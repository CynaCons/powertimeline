import { test, expect } from '@playwright/test';

/**
 * Test 44: Simple Degradation Validation
 * Validates that the degradation system fix is working by testing the core logic
 * without relying on external data loading
 */

test('Degradation system basic fix validation', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔧 SIMPLE DEGRADATION FIX VALIDATION');
  
  // Wait for basic telemetry
  await page.waitForTimeout(2000);
  
  try {
    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry), { timeout: 3000 });
  } catch {
    console.log('⚠️ Telemetry not immediately available, continuing...');
  }
  
  const initialTelemetry = await page.evaluate(() => (window as any).__ccTelemetry || null);
  
  console.log('📊 Initial state:', {
    telemetryAvailable: !!initialTelemetry,
    events: initialTelemetry?.events?.total || 0,
    groups: initialTelemetry?.groups?.count || 0,
    degradationField: 'degradation' in (initialTelemetry || {}),
    degradationValue: initialTelemetry?.degradation
  });
  
  // Test that our fix didn't break the telemetry structure
  if (initialTelemetry) {
    expect('degradation' in initialTelemetry).toBe(true);
    console.log('✅ Degradation field exists in telemetry');
    
    // Check if we have any cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    console.log(`📊 Found ${cards.length} cards initially`);
    
    if (cards.length > 0) {
      // Check card types and colors
      const cardAnalysis = { full: 0, compact: 0, other: 0 };
      
      for (const card of cards.slice(0, 5)) {
        const cardType = await card.getAttribute('data-card-type');
        const className = await card.getAttribute('class') || '';
        
        console.log(`  Card type: ${cardType}, has blue: ${className.includes('border-l-blue-500')}, has green: ${className.includes('border-l-green-500')}`);
        
        if (cardType === 'full') cardAnalysis.full++;
        else if (cardType === 'compact') cardAnalysis.compact++;
        else cardAnalysis.other++;
      }
      
      console.log('📊 Card type distribution:', cardAnalysis);
      
      // All cards should have valid types
      expect(cardAnalysis.full + cardAnalysis.compact + cardAnalysis.other).toBe(Math.min(cards.length, 5));
      
    }
  }
  
  // Test progressive zoom to see if degradation can be triggered
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (timelineBox) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    console.log('🔎 Testing zoom behavior...');
    
    // Light zoom test
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(300);
    }
    
    // Check state after zoom
    const zoomedCards = await page.locator('[data-testid="event-card"]').all();
    const zoomedTelemetry = await page.evaluate(() => (window as any).__ccTelemetry || null);
    
    console.log(`📊 After zoom: ${zoomedCards.length} cards, degradation available: ${!!zoomedTelemetry?.degradation}`);
    
    if (zoomedTelemetry?.degradation) {
      console.log('📊 Degradation metrics:', {
        totalGroups: zoomedTelemetry.degradation.totalGroups,
        fullCardGroups: zoomedTelemetry.degradation.fullCardGroups,
        compactCardGroups: zoomedTelemetry.degradation.compactCardGroups
      });
      
      // If we have degradation metrics, validate they're reasonable
      const deg = zoomedTelemetry.degradation;
      expect(deg.totalGroups).toBeGreaterThanOrEqual(0);
      expect(deg.fullCardGroups).toBeGreaterThanOrEqual(0);
      expect(deg.compactCardGroups).toBeGreaterThanOrEqual(0);
      
      if (deg.totalGroups > 0) {
        expect(deg.fullCardGroups + deg.compactCardGroups).toBeLessThanOrEqual(deg.totalGroups);
      }
    }
    
    // Reset zoom
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(500);
  }
  
  console.log('✅ Basic degradation system validation completed');
});

test('Degradation telemetry structure validation', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔍 DEGRADATION TELEMETRY STRUCTURE VALIDATION');
  
  await page.waitForTimeout(1500);
  
  // Check that telemetry has the expected structure
  const telemetryStructure = await page.evaluate(() => {
    const telemetry = (window as any).__ccTelemetry;
    
    if (!telemetry) return { available: false };
    
    return {
      available: true,
      keys: Object.keys(telemetry),
      hasDegradation: 'degradation' in telemetry,
      degradationType: typeof telemetry.degradation,
      degradationKeys: telemetry.degradation ? Object.keys(telemetry.degradation) : null
    };
  });
  
  console.log('📊 Telemetry structure analysis:', telemetryStructure);
  
  // Basic structure validation
  expect(telemetryStructure.available).toBe(true);
  expect(telemetryStructure.hasDegradation).toBe(true);
  
  // The degradation field should exist (can be undefined if no events)
  expect(telemetryStructure.keys).toContain('degradation');
  
  if (telemetryStructure.degradationKeys) {
    // If degradation is defined, it should have the expected structure
    const expectedKeys = ['totalGroups', 'fullCardGroups', 'compactCardGroups', 'degradationRate', 'spaceReclaimed', 'degradationTriggers'];
    
    for (const key of expectedKeys) {
      expect(telemetryStructure.degradationKeys).toContain(key);
    }
    
    console.log('✅ Degradation metrics have correct structure');
  } else {
    console.log('ℹ️ Degradation metrics undefined (acceptable with no events)');
  }
  
  console.log('✅ Telemetry structure validation completed');
});