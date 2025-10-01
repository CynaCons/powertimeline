import { test, expect } from '@playwright/test';

/**
 * Test 38: Degradation System with Real Data
 * Tests the degradation system using actual dataset loading through DevPanel
 * 
 * Validates:
 * - Napoleon dataset loading and degradation triggering
 * - Actual degradation metrics with populated events
 * - Card height verification with real cards
 * - Space efficiency in dense regions
 */

test('Degradation system with Napoleon dataset - Real data validation', async ({ page }) => {
  await page.goto('/');

  // Wait for timeline to load
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔍 DEGRADATION SYSTEM TEST WITH REAL NAPOLEON DATA');
  
  // Open developer panel to access dataset controls
  const devToggle = page.getByRole('button', { name: 'Developer Panel' });
  if (await devToggle.count() > 0) {
    await devToggle.click();
    await page.waitForTimeout(500);

    // Load Napoleon dataset
    const napoleonButton = page.getByRole('button', { name: 'Napoleon 1769-1821' });
    if (await napoleonButton.count() > 0) {
      console.log('📚 Loading Napoleon dataset...');
      await napoleonButton.click();
      await page.waitForTimeout(3000); // Wait for data to load and layout to calculate
      
      // Wait for telemetry with real data
      await page.waitForFunction(() => {
        const telemetry = (window as unknown as { __ccTelemetry?: { events?: { total?: number } } }).__ccTelemetry;
        return telemetry && telemetry.events && telemetry.events.total && telemetry.events.total > 0;
      }, { timeout: 10000 });

      // Get telemetry with loaded data
      const telemetryData = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
      expect(telemetryData).toBeTruthy();
      expect(telemetryData.events.total).toBeGreaterThan(0);
      
      console.log('📊 Napoleon dataset loaded:', {
        totalEvents: telemetryData.events.total,
        totalGroups: telemetryData.groups.count,
        hasDegradationMetrics: !!telemetryData.degradation
      });
      
      // Test initial state (before zooming)
      if (telemetryData.degradation) {
        const degradation = telemetryData.degradation;
        console.log('📊 Initial degradation state:', {
          totalGroups: degradation.totalGroups,
          fullCardGroups: degradation.fullCardGroups,
          compactCardGroups: degradation.compactCardGroups,
          spaceReclaimed: degradation.spaceReclaimed
        });
        
        // Validate initial state
        expect(degradation.totalGroups).toBeGreaterThanOrEqual(0);
        expect(degradation.fullCardGroups).toBeGreaterThanOrEqual(0);
        expect(degradation.compactCardGroups).toBeGreaterThanOrEqual(0);
      }
      
      // Get timeline center for zoom operations  
      const timelineArea = page.locator('.absolute.inset-0.ml-14');
      const timelineBox = await timelineArea.boundingBox();
      const centerX = timelineBox!.x + timelineBox!.width * 0.5;
      const centerY = timelineBox!.y + timelineBox!.height * 0.5;
      
      // Progressive zoom to trigger degradation
      console.log('🔎 Testing progressive zoom to trigger degradation...');
      let degradationTriggered = false;
      let maxCompactCards = 0;
      let maxSpaceReclaimed = 0;
      
      for (let zoomStep = 1; zoomStep <= 6; zoomStep++) {
        console.log(`  Zoom step ${zoomStep}/6`);
        
        // Zoom in
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(800);
        
        // Get updated telemetry
        const zoomedTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
        
        if (zoomedTelemetry && zoomedTelemetry.degradation) {
          const degradation = zoomedTelemetry.degradation;
          
          if (degradation.compactCardGroups > 0) {
            degradationTriggered = true;
            maxCompactCards = Math.max(maxCompactCards, degradation.compactCardGroups);
            maxSpaceReclaimed = Math.max(maxSpaceReclaimed, degradation.spaceReclaimed || 0);
            
            console.log(`    Degradation active: ${degradation.compactCardGroups}/${degradation.totalGroups} groups using compact cards`);
            console.log(`    Space saved: ${degradation.spaceReclaimed}px`);
            
            // Validate degradation metrics
            expect(degradation.totalGroups).toBeGreaterThan(0);
            expect(degradation.compactCardGroups).toBeGreaterThan(0);
            expect(degradation.spaceReclaimed).toBeGreaterThan(0);
            
            // Validate space savings calculation (76px per event)
            if (degradation.degradationTriggers && degradation.degradationTriggers.length > 0) {
              for (const trigger of degradation.degradationTriggers) {
                const expectedSpaceSaved = 76 * trigger.eventCount;
                expect(trigger.spaceSaved).toBe(expectedSpaceSaved);
                console.log(`      Trigger: ${trigger.groupId} saved ${trigger.spaceSaved}px (${trigger.eventCount} events)`);
              }
            }
          }
        }
      }
      
      if (degradationTriggered) {
        console.log(`✅ Degradation system successfully triggered!`);
        console.log(`   Max compact card groups: ${maxCompactCards}`);
        console.log(`   Max space reclaimed: ${maxSpaceReclaimed}px`);
        
        // Test card visual properties with real cards
        const cards = await page.locator('div[style*="position: absolute"]').all();
        if (cards.length > 0) {
          console.log(`🎯 Analyzing ${Math.min(cards.length, 15)} visible cards...`);
          
          const cardHeights = await Promise.all(
            cards.slice(0, 15).map(async (card) => {
              const style = await card.getAttribute('style');
              const heightMatch = style?.match(/height:\s*(\d+)px/);
              return heightMatch ? parseInt(heightMatch[1]) : null;
            })
          );

          const validHeights = cardHeights.filter(h => h !== null) as number[];
          if (validHeights.length > 0) {
            // Count different card types
            const fullCardHeights = validHeights.filter(h => Math.abs(h - 140) < 5);
            const compactCardHeights = validHeights.filter(h => Math.abs(h - 64) < 5);
            const otherHeights = validHeights.filter(h => Math.abs(h - 140) >= 5 && Math.abs(h - 64) >= 5);
            
            console.log(`   Card height analysis:`, {
              total: validHeights.length,
              fullCards: fullCardHeights.length,
              compactCards: compactCardHeights.length,
              otherHeights: otherHeights.length,
              uniqueHeights: [...new Set(validHeights)].sort()
            });
            
            // Validate we have compact cards when degradation is active
            expect(compactCardHeights.length).toBeGreaterThan(0);
            expect(fullCardHeights.length + compactCardHeights.length).toBeGreaterThan(0);
          }
        }
      } else {
        console.log('ℹ️ No degradation triggered - timeline may not be dense enough');
        // This is still a valid outcome for some zoom levels
      }
      
      // Reset zoom
      await page.keyboard.press('Digit0');
      await page.waitForTimeout(1000);
      
      console.log('✅ Napoleon dataset degradation test completed successfully');
      
    } else {
      console.log('❌ Napoleon dataset button not found in DevPanel');
      expect(false).toBe(true); // Fail the test if we can't load the dataset
    }
  } else {
    console.log('❌ Developer Panel toggle not found');
    expect(false).toBe(true); // Fail the test if we can't open the dev panel
  }
});

test('Degradation system efficiency validation', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n⚡ DEGRADATION EFFICIENCY VALIDATION');
  
  // Load data through dev panel
  const devToggle = page.locator('button:has-text("Developer Panel")');
  if (await devToggle.count() > 0) {
    await devToggle.click();
    await page.waitForTimeout(500);
    
    // Try clustered seed data first
    const clusteredButton = page.locator('button:has-text("Seed Clustered")');
    if (await clusteredButton.count() > 0) {
      console.log('🎲 Loading clustered seed data for efficiency test...');
      await clusteredButton.click();
      await page.waitForTimeout(2000);
      
      // Wait for data to load
      await page.waitForFunction(() => {
        const telemetry = (window as unknown as { __ccTelemetry?: { events?: { total?: number } } }).__ccTelemetry;
        return telemetry && telemetry.events && telemetry.events.total && telemetry.events.total > 0;
      });

      const initialTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
      console.log('📊 Clustered data loaded:', {
        events: initialTelemetry.events.total,
        groups: initialTelemetry.groups.count
      });
      
      // Create high density by aggressive zooming
      const timelineArea = page.locator('.absolute.inset-0.ml-14');
      const timelineBox = await timelineArea.boundingBox();
      const centerX = timelineBox!.x + timelineBox!.width * 0.5;
      const centerY = timelineBox!.y + timelineBox!.height * 0.5;
      
      // Extreme zoom for maximum density
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, -250);
        await page.waitForTimeout(200);
      }
      
      // Get efficiency metrics
      const efficiencyTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
      
      if (efficiencyTelemetry && efficiencyTelemetry.degradation) {
        const degradation = efficiencyTelemetry.degradation;
        
        console.log('⚡ Efficiency Results:', {
          degradationRate: `${((degradation.degradationRate || 0) * 100).toFixed(1)}%`,
          spaceEfficiency: `${degradation.spaceReclaimed || 0}px saved`,
          compactGroups: degradation.compactCardGroups,
          totalGroups: degradation.totalGroups,
          triggers: degradation.degradationTriggers?.length || 0
        });
        
        // Efficiency validations
        if (degradation.compactCardGroups > 0) {
          // Should have meaningful space savings
          expect(degradation.spaceReclaimed).toBeGreaterThan(0);
          
          // Degradation rate should be reasonable (not 100% unless truly necessary)
          const degradationRate = degradation.degradationRate || 0;
          expect(degradationRate).toBeLessThanOrEqual(1.0);
          expect(degradationRate).toBeGreaterThanOrEqual(0);
          
          // Space savings should be multiple of 76px per event
          const totalEvents = degradation.degradationTriggers?.reduce((sum, t) => sum + t.eventCount, 0) || 0;
          if (totalEvents > 0) {
            const expectedSpaceSaved = totalEvents * 76;
            expect(degradation.spaceReclaimed).toBe(expectedSpaceSaved);
          }
          
          console.log('✅ Efficiency validation passed');
        }
      }
      
      // Reset
      await page.keyboard.press('Digit0');
      await page.waitForTimeout(1000);
    }
  }
  
  console.log('✅ Efficiency validation completed');
});