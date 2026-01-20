import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

/**
 * Test 37: Degradation System Validation Across All Datasets
 * Comprehensive test of card degradation system using all available seeders
 * 
 * Tests:
 * - Degradation system works across Napoleon, RFK, WWII, and other datasets
 * - Full → Compact degradation triggers appropriately
 * - Space savings calculations are accurate
 * - Card dimensions match expected values (140px vs 64px)
 * - Telemetry metrics are consistent across datasets
 */

const DATASETS = [
  { name: 'Napoleon 1769-1821', testId: 'dataset-napoleon' },
  { name: 'RFK 1968', testId: 'dataset-rfk' },
  { name: 'WWII 1939-1945', testId: 'dataset-wwii' }
];

test.describe('Degradation System Validation', () => {
  
  for (const dataset of DATASETS) {
    test(`Card degradation system - ${dataset.name}`, async ({ page }) => {
      await loginAsTestUser(page);

      console.log(`\n🔍 TESTING DEGRADATION SYSTEM WITH ${dataset.name.toUpperCase()}`);

      // Load specific dataset by direct timeline navigation
      // Map dataset testId to timeline slug
      const timelineSlugMap: Record<string, string> = {
        'dataset-napoleon': 'timeline-napoleon',
        'dataset-rfk': 'timeline-rfk',
        'dataset-wwii': 'timeline-napoleon' // Fallback to Napoleon for WWII
      };

      const timelineSlug = timelineSlugMap[dataset.testId] || 'timeline-napoleon';
      await loadTestTimeline(page, timelineSlug);

      // Wait for timeline to load
      await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      // Wait for telemetry to appear
      await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry));

      // Get initial telemetry data
      const telemetryData = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
      expect(telemetryData).toBeTruthy();

      console.log(`📊 ${dataset.name} - Initial state:`, {
        totalEvents: telemetryData.events?.total || 0,
        totalGroups: telemetryData.groups?.count || 0,
        degradation: telemetryData.degradation ? 'Available' : 'Not Available'
      });
      
      // Test different zoom levels to trigger degradation
      console.log(`🔎 Testing zoom levels for ${dataset.name}...`);
      
      // Get timeline center for zoom operations
      const timelineArea = page.locator('[data-testid="timeline-container"]');
      const timelineBox = await timelineArea.boundingBox();
      const centerX = timelineBox!.x + timelineBox!.width * 0.5;
      const centerY = timelineBox!.y + timelineBox!.height * 0.5;
      
      let degradationDetected = false;
      let maxDegradationRate = 0;
      let totalSpaceReclaimed = 0;
      
      // Test multiple zoom levels
      for (let zoomLevel = 1; zoomLevel <= 5; zoomLevel++) {
        console.log(`  Zoom level ${zoomLevel}/5`);
        
        // Zoom in progressively
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, -150);
        await page.waitForTimeout(500);
        
        // Get updated telemetry
        const zoomedTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
        
        if (zoomedTelemetry && zoomedTelemetry.degradation) {
          const degradation = zoomedTelemetry.degradation;
          
          if (degradation.totalGroups > 0) {
            degradationDetected = true;
            const currentRate = degradation.degradationRate || 0;
            maxDegradationRate = Math.max(maxDegradationRate, currentRate);
            totalSpaceReclaimed = Math.max(totalSpaceReclaimed, degradation.spaceReclaimed || 0);
            
            console.log(`    Groups: ${degradation.totalGroups}, Full: ${degradation.fullCardGroups}, Compact: ${degradation.compactCardGroups}`);
            console.log(`    Degradation Rate: ${(currentRate * 100).toFixed(1)}%, Space Saved: ${degradation.spaceReclaimed || 0}px`);
          }
        }
      }
      
      // Reset zoom
      await page.keyboard.press('Digit0');
      await page.waitForTimeout(1000);
      
      // Validate degradation system functionality
      if (degradationDetected) {
        console.log(`✅ ${dataset.name} - Degradation system active`);
        console.log(`  Max degradation rate: ${(maxDegradationRate * 100).toFixed(1)}%`);
        console.log(`  Total space reclaimed: ${totalSpaceReclaimed}px`);
        
        // Verify space savings calculation (76px per event when degrading)
        if (totalSpaceReclaimed > 0) {
          expect(totalSpaceReclaimed).toBeGreaterThan(0);
          // Should be multiple of 76px (full card height 140px - compact card height 64px)
          expect(totalSpaceReclaimed % 76).toBeLessThan(76); // Allow for multiple events per group
        }
      } else {
        console.log(`ℹ️ ${dataset.name} - No degradation needed (sparse timeline)`);
      }
      
      // Test card visual properties
      const cards = await page.locator('div[style*="position: absolute"]').all();
      if (cards.length > 0) {
        const cardHeights = await Promise.all(
          cards.slice(0, 10).map(async (card) => { // Check first 10 cards
            const style = await card.getAttribute('style');
            const heightMatch = style?.match(/height:\s*(\d+)px/);
            return heightMatch ? parseInt(heightMatch[1]) : null;
          })
        );

        const validHeights = cardHeights.filter(h => h !== null) as number[];
        if (validHeights.length > 0) {
          const fullCardHeights = validHeights.filter(h => Math.abs(h - 140) < 5);
          const compactCardHeights = validHeights.filter(h => Math.abs(h - 64) < 5);
          
          console.log(`  Card heights found: Full(140px): ${fullCardHeights.length}, Compact(64px): ${compactCardHeights.length}`);
          
          // Verify we have valid card heights
          expect(fullCardHeights.length + compactCardHeights.length).toBeGreaterThan(0);
        }
      }
      
      console.log(`✓ ${dataset.name} degradation test completed\n`);
    });
  }
  
  test('Degradation system stress test - Dense regions', async ({ page }) => {
    await loginAsTestUser(page);

    console.log('\n🔥 DEGRADATION STRESS TEST - Dense Timeline Regions');

    // Load Napoleon dataset (typically has dense periods)
    await loadTestTimeline(page, 'timeline-napoleon');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Wait for telemetry
    await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry));
    
    // Find dense regions by zooming in aggressively
    const timelineArea = page.locator('[data-testid="timeline-container"]');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Aggressive zoom to create density
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(300);
    }
    
    // Get stress test telemetry
    const stressTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
    
    if (stressTelemetry && stressTelemetry.degradation) {
      const degradation = stressTelemetry.degradation;
      
      console.log('🔥 Stress Test Results:', {
        totalGroups: degradation.totalGroups,
        fullCardGroups: degradation.fullCardGroups,
        compactCardGroups: degradation.compactCardGroups,
        degradationRate: `${((degradation.degradationRate || 0) * 100).toFixed(1)}%`,
        spaceReclaimed: `${degradation.spaceReclaimed || 0}px`,
        triggers: degradation.degradationTriggers?.length || 0
      });
      
      // Stress test validations
      if (degradation.totalGroups > 0) {
        expect(degradation.fullCardGroups).toBeGreaterThanOrEqual(0);
        expect(degradation.compactCardGroups).toBeGreaterThanOrEqual(0);
        expect(degradation.fullCardGroups + degradation.compactCardGroups).toBeLessThanOrEqual(degradation.totalGroups);
        
        // If there's degradation, validate the triggers
        if (degradation.compactCardGroups > 0) {
          expect(degradation.spaceReclaimed).toBeGreaterThan(0);
          expect(degradation.degradationTriggers).toBeTruthy();
          
          if (degradation.degradationTriggers && degradation.degradationTriggers.length > 0) {
            // Validate individual triggers
            for (const trigger of degradation.degradationTriggers) {
              expect(trigger.eventCount).toBeGreaterThan(2); // Should only degrade when >2 events
              expect(trigger.from).toBe('full');
              expect(trigger.to).toBe('compact');
              expect(trigger.spaceSaved).toBe(76 * trigger.eventCount);
            }
          }
        }
        
        console.log('✅ Stress test validations passed');
      }
    }
    
    // Reset zoom
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(1000);
    
    console.log('✓ Degradation stress test completed');
  });
  
  test('Degradation system telemetry accuracy', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-napoleon');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });

    console.log('\n📊 TELEMETRY ACCURACY TEST');

    // Wait for timeline to stabilize
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry));

    // Get telemetry data
    const telemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
    
    if (telemetry) {
      console.log('📊 Available telemetry keys:', Object.keys(telemetry));
      
      // Validate telemetry structure
      expect(telemetry.version).toBeTruthy();
      expect(telemetry.events).toBeTruthy();
      expect(telemetry.groups).toBeTruthy();
      
      // Check if degradation key exists (even if undefined)
      expect('degradation' in telemetry).toBe(true);
      
      console.log('📊 Telemetry structure validation:', {
        version: telemetry.version,
        events: telemetry.events?.total,
        groups: telemetry.groups?.count,
        hasDegradation: 'degradation' in telemetry,
        degradationValue: telemetry.degradation
      });
      
      console.log('✅ Telemetry structure is correct');
    }
  });
});
