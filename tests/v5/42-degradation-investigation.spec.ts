import { test, expect } from '@playwright/test';

/**
 * Test 42: Degradation System Investigation  
 * Investigates why overflow indicators appear but cards remain blue (full)
 * instead of degrading to green (compact) cards
 */

test('Degradation system investigation - Napoleon timeline', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔍 INVESTIGATING DEGRADATION vs OVERFLOW DISCONNECT');
  
  // Try to access the developer panel to load Napoleon dataset
  try {
    // Look for developer panel toggle button
    const devButtons = await page.locator('button').all();
    let devPanelFound = false;
    
    for (const button of devButtons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      if (text?.includes('Developer') || ariaLabel?.includes('Developer') || text?.includes('settings')) {
        console.log('📱 Found developer panel button, attempting to click...');
        await button.click();
        await page.waitForTimeout(500);
        devPanelFound = true;
        break;
      }
    }
    
    if (devPanelFound) {
      // Look for Napoleon dataset button
      const napoleonButtons = await page.locator('button').all();
      for (const button of napoleonButtons) {
        const text = await button.textContent();
        if (text?.includes('Napoleon')) {
          console.log('📚 Loading Napoleon dataset...');
          await button.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Could not access developer panel, using default data');
  }

  // Wait for telemetry and layout to update
  await page.waitForFunction(() => Boolean((window as any).__ccTelemetry), { timeout: 5000 });
  
  const initialTelemetry = await page.evaluate(() => (window as any).__ccTelemetry || null);
  console.log('📊 Initial state:', {
    events: initialTelemetry?.events?.total || 0,
    groups: initialTelemetry?.groups?.count || 0,
    degradation: initialTelemetry?.degradation || 'undefined'
  });

  // Progressive zoom to create density and investigate the disconnect
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (timelineBox) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    for (let zoomLevel = 1; zoomLevel <= 8; zoomLevel++) {
      console.log(`\n🔎 Zoom Level ${zoomLevel}/8:`);
      
      // Zoom in
      await page.mouse.move(centerX, centerY);
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(1000);
      
      // Get current state
      const telemetry = await page.evaluate(() => (window as any).__ccTelemetry || null);
      const cards = await page.locator('[data-testid="event-card"]').all();
      const overflowBadges = await page.locator('.bg-red-500').all();
      
      // Analyze card colors
      const cardAnalysis = { blue: 0, green: 0, other: 0, total: cards.length };
      
      for (const card of cards.slice(0, 10)) {
        const cardType = await card.getAttribute('data-card-type');
        const className = await card.getAttribute('class');
        
        if (className?.includes('border-l-blue-500')) {
          cardAnalysis.blue++;
        } else if (className?.includes('border-l-green-500')) {
          cardAnalysis.green++;
        } else {
          cardAnalysis.other++;
        }
      }
      
      console.log(`  📊 State Analysis:`);
      console.log(`     Cards: ${cardAnalysis.total} (🔵${cardAnalysis.blue} 🟢${cardAnalysis.green} ❓${cardAnalysis.other})`);
      console.log(`     Overflow badges: ${overflowBadges.length}`);
      console.log(`     Groups: ${telemetry?.groups?.count || 0}`);
      
      if (telemetry?.degradation) {
        const deg = telemetry.degradation;
        console.log(`     Degradation: Total:${deg.totalGroups} Full:${deg.fullCardGroups} Compact:${deg.compactCardGroups}`);
      }
      
      // ❌ CRITICAL TEST: If we have overflow badges but only blue cards, something is wrong
      if (overflowBadges.length > 0 && cardAnalysis.green === 0 && cardAnalysis.blue > 0) {
        console.log(`❌ ISSUE DETECTED: ${overflowBadges.length} overflow badges but 0 green cards!`);
        console.log('   This suggests degradation is not working properly.');
        console.log('   Overflow indicators mean high density, so we should see compact (green) cards.');
        
        // Let's investigate further
        const debugInfo = await page.evaluate(() => {
          const telemetry = (window as any).__ccTelemetry;
          return {
            hasLayoutResult: !!(window as any).debugLayoutResult,
            degradationDefined: telemetry?.degradation !== undefined,
            degradationValue: telemetry?.degradation,
            groupsWithEvents: telemetry?.groups?.count > 0,
            eventsTotal: telemetry?.events?.total
          };
        });
        
        console.log('🔍 Debug info:', debugInfo);
        
        // This should fail the test to highlight the issue
        expect(cardAnalysis.green).toBeGreaterThan(0); // We expect green cards when there are overflow badges
      }
      
      // ✅ EXPECTED BEHAVIOR: Overflow badges should correlate with green cards
      if (overflowBadges.length > 0 && cardAnalysis.green > 0) {
        console.log('✅ CORRECT: Overflow badges present and green cards active');
      }
      
      // Stop if we found the issue or confirmed correct behavior
      if (overflowBadges.length > 2) break;
    }
    
    // Reset zoom
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(1000);
  }
  
  console.log('\n🔍 Investigation completed');
});

test('Degradation triggering investigation', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🧪 DEGRADATION TRIGGERING INVESTIGATION');
  
  // Create a controlled test scenario
  await page.evaluate(() => {
    // Try to inject events directly to test degradation
    const testEvents = [];
    const baseDate = new Date('2020-06-01');
    
    // Create a very dense cluster of events that SHOULD trigger degradation
    for (let i = 0; i < 8; i++) {
      testEvents.push({
        id: `test-dense-${i}`,
        title: `Dense Event ${i + 1}`,
        description: `Event ${i + 1} in dense cluster`,
        date: new Date(baseDate.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      });
    }
    
    console.log('🧪 Created test scenario with 8 events in 8 days');
    
    // Try to update events if possible
    if ((window as any).testUpdateEvents) {
      (window as any).testUpdateEvents(testEvents);
    }
  });
  
  await page.waitForTimeout(2000);
  
  // Wait for telemetry
  await page.waitForFunction(() => Boolean((window as any).__ccTelemetry), { timeout: 3000 });
  
  // Zoom to create high density
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (timelineBox) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    // Aggressive zoom to force high density
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(300);
    }
    
    // Check if degradation was triggered
    const finalTelemetry = await page.evaluate(() => (window as any).__ccTelemetry || null);
    const cards = await page.locator('[data-testid="event-card"]').all();
    
    console.log('🧪 After aggressive zoom:');
    console.log(`   Cards found: ${cards.length}`);
    console.log(`   Telemetry degradation:`, finalTelemetry?.degradation);
    
    if (finalTelemetry?.degradation) {
      const deg = finalTelemetry.degradation;
      console.log(`   Groups: Total:${deg.totalGroups}, Full:${deg.fullCardGroups}, Compact:${deg.compactCardGroups}`);
      
      // Check if we have any compact cards
      let compactCount = 0;
      for (const card of cards.slice(0, 5)) {
        const cardType = await card.getAttribute('data-card-type');
        if (cardType === 'compact') compactCount++;
      }
      
      console.log(`   Visual compact cards: ${compactCount}`);
      
      if (deg.compactCardGroups > 0 && compactCount === 0) {
        console.log('❌ MISMATCH: Telemetry shows compact groups but no visual compact cards');
      }
    } else {
      console.log('❌ No degradation telemetry available');
    }
  }
  
  console.log('✅ Degradation triggering investigation completed');
});