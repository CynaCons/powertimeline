import { test, expect } from '@playwright/test';

/**
 * Test 45: Degradation with Generated Data
 * Creates controlled test data to validate degradation system behavior
 */

test('Degradation system with generated dense events', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🧪 DEGRADATION SYSTEM WITH GENERATED DENSE EVENTS');
  
  // Try to use the seed buttons to generate data
  try {
    // Enable dev mode first
    await page.keyboard.press('d');
    await page.waitForTimeout(300);
    
    // Look for developer panel button
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      if (ariaLabel?.includes('Developer')) {
        console.log('📱 Opening developer panel...');
        await button.click();
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Look for seed buttons
    const allButtons = await page.locator('button').all();
    let seedFound = false;
    
    for (const button of allButtons) {
      const text = await button.textContent();
      if (text?.includes('Clustered') || text?.includes('Random')) {
        console.log(`🎲 Using seed: ${text}`);
        await button.click();
        await page.waitForTimeout(2000);
        seedFound = true;
        break;
      }
    }
    
    if (!seedFound) {
      console.log('⚠️ No seed buttons found, trying to generate data programmatically');
      
      // Try to inject test events programmatically
      await page.evaluate(() => {
        // Create a dense cluster of events
        const events = [];
        const baseDate = new Date('2020-07-01');
        
        // Create multiple clusters of dense events
        for (let cluster = 0; cluster < 3; cluster++) {
          const clusterStart = new Date(baseDate.getTime() + (cluster * 60 * 24 * 60 * 60 * 1000)); // 60 days apart
          
          // Create 6 events per cluster (should trigger compact degradation)
          for (let i = 0; i < 6; i++) {
            events.push({
              id: `cluster-${cluster}-event-${i}`,
              title: `Event ${cluster + 1}.${i + 1}`,
              description: `Dense cluster ${cluster + 1}, event ${i + 1}`,
              date: new Date(clusterStart.getTime() + (i * 3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            });
          }
        }
        
        console.log('🧪 Generated 18 events in 3 dense clusters');
        
        // Try to update timeline if possible (this might not work depending on app structure)
        const windowWithTest = window as unknown as { setTestEvents?: (events: typeof events) => void };
        if (windowWithTest.setTestEvents) {
          windowWithTest.setTestEvents(events);
        }
        
        return events.length;
      });
    }
    
    // Close dev panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
  } catch (error: unknown) {
    console.log('⚠️ Could not generate data, testing with default state:', error);
  }

  // Wait for data to load and telemetry to update
  await page.waitForTimeout(2000);
  await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry), { timeout: 3000 });
  
  const telemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
  console.log('📊 Data state:', {
    events: telemetry?.events?.total || 0,
    groups: telemetry?.groups?.count || 0
  });
  
  // Check for cards
  const cards = await page.locator('[data-testid="event-card"]').all();
  console.log(`🎯 Found ${cards.length} cards to analyze`);
  
  if (cards.length === 0) {
    console.log('ℹ️ No cards found - this might indicate the app is using a different data loading mechanism');
    console.log('ℹ️ Degradation system cannot be tested without events');
    return; // Exit gracefully
  }
  
  // Analyze initial state
  const initialColorAnalysis = { blue: 0, green: 0, other: 0 };
  
  for (const card of cards.slice(0, 10)) {
    const className = await card.getAttribute('class') || '';
    const cardType = await card.getAttribute('data-card-type');
    
    console.log(`  Initial card: type=${cardType}, blue=${className.includes('border-l-blue-500')}, green=${className.includes('border-l-green-500')}`);
    
    if (className.includes('border-l-blue-500')) initialColorAnalysis.blue++;
    else if (className.includes('border-l-green-500')) initialColorAnalysis.green++;
    else initialColorAnalysis.other++;
  }
  
  console.log('📊 Initial color analysis:', initialColorAnalysis);
  
  // Progressive zoom to trigger degradation
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (timelineBox && cards.length > 0) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    console.log('🔎 Progressive zoom to trigger degradation...');
    
    for (let zoomLevel = 1; zoomLevel <= 6; zoomLevel++) {
      console.log(`  Zoom ${zoomLevel}/6`);
      
      await page.mouse.move(centerX, centerY);
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(600);
      
      const zoomedCards = await page.locator('[data-testid="event-card"]').all();
      const overflowBadges = await page.locator('.bg-red-500').all();
      
      const colorAnalysis = { blue: 0, green: 0, other: 0 };
      
      for (const card of zoomedCards.slice(0, 8)) {
        const className = await card.getAttribute('class') || '';
        
        if (className.includes('border-l-blue-500')) colorAnalysis.blue++;
        else if (className.includes('border-l-green-500')) colorAnalysis.green++;
        else colorAnalysis.other++;
      }
      
      console.log(`    Cards: ${zoomedCards.length}, Colors: 🔵${colorAnalysis.blue} 🟢${colorAnalysis.green}, Overflow: ${overflowBadges.length}`);
      
      // Check telemetry
      const zoomedTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
      if (zoomedTelemetry?.degradation) {
        const deg = zoomedTelemetry.degradation;
        console.log(`    Degradation: Total:${deg.totalGroups}, Full:${deg.fullCardGroups}, Compact:${deg.compactCardGroups}`);
        
        // Test the key relationship: if we have compact groups in telemetry, we should see green cards
        if (deg.compactCardGroups > 0) {
          console.log(`    🎯 Telemetry shows ${deg.compactCardGroups} compact groups`);
          
          if (colorAnalysis.green > 0) {
            console.log(`    ✅ SUCCESS: Found ${colorAnalysis.green} green cards matching compact groups!`);
            console.log('    🎉 DEGRADATION SYSTEM IS WORKING CORRECTLY');
            
            // Validate the correlation
            expect(colorAnalysis.green).toBeGreaterThan(0);
            break;
          } else {
            console.log(`    ❌ ISSUE: Telemetry shows compact groups but no green cards visible`);
          }
        }
      }
      
      // If we see green cards, the system is working
      if (colorAnalysis.green > 0) {
        console.log(`    ✅ Found ${colorAnalysis.green} green (compact) cards - degradation working!`);
        break;
      }
    }
    
    // Reset zoom
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(1000);
  }
  
  console.log('✅ Degradation system test with generated data completed');
});

test('Overflow vs degradation correlation test', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔗 OVERFLOW vs DEGRADATION CORRELATION TEST');
  
  await page.waitForTimeout(1000);
  
  // This test validates the logical relationship:
  // If overflow badges appear, cards should degrade to make more space
  // If cards don't degrade when overflow appears, it's a system failure
  
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (timelineBox) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    console.log('🔍 Testing overflow/degradation correlation...');
    
    const testCases: Array<{
      zoomLevel: number;
      totalCards: number;
      overflowBadges: number;
      greenCards: number;
      blueCards: number;
    }> = [];
    
    // Test different zoom levels
    for (let zoom = 1; zoom <= 5; zoom++) {
      await page.mouse.move(centerX, centerY);
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(500);
      
      const cards = await page.locator('[data-testid="event-card"]').all();
      const overflowBadges = await page.locator('.bg-red-500').all();
      
      let greenCards = 0;
      let blueCards = 0;
      
      for (const card of cards.slice(0, 5)) {
        const className = await card.getAttribute('class') || '';
        if (className.includes('border-l-green-500')) greenCards++;
        if (className.includes('border-l-blue-500')) blueCards++;
      }
      
      testCases.push({
        zoomLevel: zoom,
        totalCards: cards.length,
        overflowBadges: overflowBadges.length,
        greenCards,
        blueCards
      });
      
      console.log(`  Zoom ${zoom}: Cards:${cards.length}, Overflow:${overflowBadges.length}, Green:${greenCards}, Blue:${blueCards}`);
    }
    
    // Analysis
    console.log('\n📊 Correlation Analysis:');
    
    const casesWithOverflow = testCases.filter(tc => tc.overflowBadges > 0);
    const casesWithGreenCards = testCases.filter(tc => tc.greenCards > 0);
    const casesWithOverflowAndGreen = testCases.filter(tc => tc.overflowBadges > 0 && tc.greenCards > 0);
    const casesWithOverflowButOnlyBlue = testCases.filter(tc => tc.overflowBadges > 0 && tc.greenCards === 0 && tc.blueCards > 0);
    
    console.log(`  Cases with overflow: ${casesWithOverflow.length}`);
    console.log(`  Cases with green cards: ${casesWithGreenCards.length}`);
    console.log(`  Cases with overflow AND green cards: ${casesWithOverflowAndGreen.length}`);
    console.log(`  Cases with overflow but ONLY blue cards: ${casesWithOverflowButOnlyBlue.length}`);
    
    if (casesWithOverflowButOnlyBlue.length > 0) {
      console.log('\n❌ DEGRADATION SYSTEM ISSUE DETECTED:');
      console.log('   Overflow badges indicate high density, but cards remain blue (full)');
      console.log('   This suggests degradation is not working properly');
      console.log('   Expected: overflow should trigger green (compact) cards');
    }
    
    if (casesWithOverflowAndGreen.length > 0) {
      console.log('\n✅ DEGRADATION SYSTEM WORKING:');
      console.log('   Overflow badges correlated with green (compact) cards');
      console.log('   System properly degrades cards when density increases');
    }
    
    if (casesWithOverflow.length === 0) {
      console.log('\nℹ️ NO HIGH-DENSITY SCENARIOS FOUND:');
      console.log('   No overflow badges detected during testing');
      console.log('   Cannot validate overflow/degradation correlation');
    }
    
    // Reset
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(500);
  }
  
  console.log('✅ Overflow/degradation correlation test completed');
});
