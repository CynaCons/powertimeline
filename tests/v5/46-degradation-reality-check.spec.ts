import { test, expect } from '@playwright/test';

/**
 * Test 46: Degradation Reality Check
 * Actually loads Napoleon timeline and thoroughly tests degradation system
 * Tests random zoom locations to verify no leftover indicators
 */

test('Degradation system reality check with Napoleon timeline', async ({ page }) => {
  test.setTimeout(30000);
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔬 DEGRADATION SYSTEM REALITY CHECK - Napoleon Timeline');
  
  // Step 1: Enable dev mode and load Napoleon timeline
  console.log('📱 Step 1: Loading Napoleon timeline data...');
  
  // First click the "build" button to enable dev mode
  console.log('🔨 Clicking build button to enable dev mode...');
  const buildButton = page.locator('button:has-text("build")');
  await buildButton.click();
  await page.waitForTimeout(1000);
  
  // Enable dev mode with 'd' key
  await page.keyboard.press('d');
  await page.waitForTimeout(500);
  
  // Look for developer panel (settings button)
  const settingsButton = page.locator('button[aria-label="Developer Panel"]');
  await settingsButton.click();
  await page.waitForTimeout(1000);
  
  // Find and click Napoleon button
  const napoleonButton = page.locator('button:has-text("Napoleon 1769-1821")');
  await napoleonButton.click();
  await page.waitForTimeout(1500); // Wait for data to load
  
  // Close dev panel
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  // Step 2: Verify data loaded
  await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry), { timeout: 5000 });
  const telemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
  
  console.log('📊 Napoleon data loaded:', {
    events: telemetry?.events?.total || 0,
    groups: telemetry?.groups?.count || 0,
    degradationField: telemetry?.degradation !== undefined ? 'defined' : 'undefined'
  });
  
  // Verify we have events
  expect(telemetry?.events?.total).toBeGreaterThan(0);
  
  // Step 3: Check initial state
  const initialCards = await page.locator('[data-testid="event-card"]').all();
  const initialOverflow = await page.locator('.bg-red-500').all();
  
  console.log('📊 Initial state:', {
    cards: initialCards.length,
    overflowBadges: initialOverflow.length
  });
  
  // Analyze initial card colors
  let initialBlue = 0, initialGreen = 0;
  for (const card of initialCards.slice(0, 10)) {
    const className = await card.getAttribute('class') || '';
    if (className.includes('border-l-blue-500')) initialBlue++;
    if (className.includes('border-l-green-500')) initialGreen++;
  }
  
  console.log(`📊 Initial colors: 🔵 ${initialBlue} blue, 🟢 ${initialGreen} green`);
  
  // Step 4: Systematic zoom testing at random locations
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  expect(timelineBox).toBeTruthy();
  
  const testScenarios = [
    { name: 'Left side', x: 0.2, y: 0.5 },
    { name: 'Center', x: 0.5, y: 0.5 },
    { name: 'Right side', x: 0.8, y: 0.5 },
    { name: 'Random 1', x: 0.3, y: 0.4 },
    { name: 'Random 2', x: 0.7, y: 0.6 }
  ];
  
  let degradationEverWorked = false;
  let leftoverIssuesFound = 0;
  
  for (const scenario of testScenarios) {
    console.log(`\n🎯 Testing scenario: ${scenario.name}`);
    
    // Reset to full view first
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(1000);
    
    // Navigate to test location
    const targetX = timelineBox.x + (timelineBox.width * scenario.x);
    const targetY = timelineBox.y + (timelineBox.height * scenario.y);
    
    await page.mouse.move(targetX, targetY);
    
    // Progressive zoom in at this location
    for (let zoomLevel = 1; zoomLevel <= 6; zoomLevel++) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(300);
      
      // Check current state
      const cards = await page.locator('[data-testid="event-card"]').all();
      const overflowBadges = await page.locator('.bg-red-500').all();
      const anchors = await page.locator('[class*="bg-gray-500"]').all();
      
      // Analyze card colors
      let blueCards = 0, greenCards = 0;
      for (const card of cards.slice(0, 8)) {
        const className = await card.getAttribute('class') || '';
        if (className.includes('border-l-blue-500')) blueCards++;
        if (className.includes('border-l-green-500')) greenCards++;
      }
      
      console.log(`  Zoom ${zoomLevel}: Cards:${cards.length} (🔵${blueCards} 🟢${greenCards}), Overflow:${overflowBadges.length}, Anchors:${anchors.length}`);
      
      // Check telemetry degradation
      const currentTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
      if (currentTelemetry?.degradation) {
        const deg = currentTelemetry.degradation;
        console.log(`    Telemetry: Total:${deg.totalGroups}, Full:${deg.fullCardGroups}, Compact:${deg.compactCardGroups}`);
        
        // CRITICAL TEST: If telemetry shows compact groups, we should see green cards
        if (deg.compactCardGroups > 0 && greenCards === 0) {
          console.log('    ❌ DEGRADATION BROKEN: Telemetry shows compact groups but no green cards!');
        } else if (deg.compactCardGroups > 0 && greenCards > 0) {
          console.log('    ✅ DEGRADATION WORKING: Compact groups match green cards!');
          degradationEverWorked = true;
        }
      }
      
      // CRITICAL TEST: If we have overflow badges but only blue cards, degradation failed
      if (overflowBadges.length > 0 && greenCards === 0 && blueCards > 0) {
        console.log(`    ❌ DEGRADATION FAILURE: ${overflowBadges.length} overflow badges but no green cards!`);
      } else if (overflowBadges.length > 0 && greenCards > 0) {
        console.log(`    ✅ DEGRADATION SUCCESS: Overflow badges with ${greenCards} green cards!`);
        degradationEverWorked = true;
      }
    }
    
    // Zoom out and check for leftovers
    console.log(`  🔄 Zooming out to check for leftovers...`);
    for (let zoomOut = 1; zoomOut <= 4; zoomOut++) {
      await page.mouse.wheel(0, 150);
      await page.waitForTimeout(300);
    }
    
    // Check for leftover indicators
    const finalOverflow = await page.locator('.bg-red-500').all();
    const finalAnchors = await page.locator('[class*="bg-gray-500"]').all();
    const finalCards = await page.locator('[data-testid="event-card"]').all();
    
    console.log(`  Final state: Cards:${finalCards.length}, Overflow:${finalOverflow.length}, Anchors:${finalAnchors.length}`);
    
    // Check for leftover issues (indicators without corresponding cards)
    if (finalOverflow.length > 0 && finalCards.length === 0) {
      console.log('    ❌ LEFTOVER ISSUE: Overflow badges without cards!');
      leftoverIssuesFound++;
    }
    
    if (finalAnchors.length > 0 && finalCards.length === 0) {
      console.log('    ❌ LEFTOVER ISSUE: Anchors without cards!');
      leftoverIssuesFound++;
    }
  }
  
  // Final assessment
  console.log('\n📊 FINAL ASSESSMENT:');
  console.log(`  Degradation ever worked: ${degradationEverWorked ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Leftover issues found: ${leftoverIssuesFound}`);
  
  // The test should fail if degradation never worked
  if (!degradationEverWorked) {
    console.log('\n💥 DEGRADATION SYSTEM COMPLETELY BROKEN:');
    console.log('  - Loaded Napoleon timeline with events');
    console.log('  - Tested multiple zoom scenarios');
    console.log('  - Never saw green cards despite overflow indicators');
    console.log('  - Degradation system is not functioning');
    
    expect(degradationEverWorked).toBe(true); // This will fail
  }
  
  // The test should fail if we found leftover issues
  if (leftoverIssuesFound > 0) {
    console.log('\n🔧 LEFTOVER INDICATOR ISSUES FOUND:');
    console.log('  - Indicators persist without corresponding content');
    console.log('  - View window filtering may not be working correctly');
    
    expect(leftoverIssuesFound).toBe(0); // This will fail
  }
  
  console.log('✅ Degradation reality check completed');
});

test('Half-column degradation verification', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🏛️ HALF-COLUMN DEGRADATION VERIFICATION');
  
  // Load Napoleon data
  // First click the "build" button to enable dev mode
  const buildButton = page.locator('button:has-text("build")');
  await buildButton.click();
  await page.waitForTimeout(1000);
  
  await page.keyboard.press('d');
  await page.waitForTimeout(500);
  await page.locator('button[aria-label="Developer Panel"]').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Napoleon 1769-1821")').click();
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  // This test specifically looks at half-column behavior
  // According to the degradation system:
  // - 1-2 events per half-column → full cards (blue)
  // - 3+ events per half-column → compact cards (green)
  
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  const centerX = timelineBox!.x + timelineBox!.width * 0.5;
  const centerY = timelineBox!.y + timelineBox!.height * 0.5;
  
  // Find a dense region by zooming in
  console.log('🔍 Finding dense regions for half-column analysis...');
  
  await page.mouse.move(centerX, centerY);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, -250);
    await page.waitForTimeout(1000);
    
    const cards = await page.locator('[data-testid="event-card"]').all();
    const telemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
    
    if (cards.length > 3) {
      console.log(`📊 Dense region found: ${cards.length} cards`);
      
      // Analyze card distribution by position
      const cardsAbove = [];
      const cardsBelow = [];
      const timelineY = timelineBox!.y + timelineBox!.height * 0.5;
      
      for (const card of cards.slice(0, 10)) {
        const cardBox = await card.boundingBox();
        if (cardBox) {
          if (cardBox.y < timelineY) {
            cardsAbove.push(card);
          } else {
            cardsBelow.push(card);
          }
        }
      }
      
      console.log(`📊 Card distribution: ${cardsAbove.length} above timeline, ${cardsBelow.length} below`);
      
      // Check if cards in dense areas are degraded
      const aboveColors = { blue: 0, green: 0 };
      const belowColors = { blue: 0, green: 0 };
      
      for (const card of cardsAbove) {
        const className = await card.getAttribute('class') || '';
        if (className.includes('border-l-blue-500')) aboveColors.blue++;
        if (className.includes('border-l-green-500')) aboveColors.green++;
      }
      
      for (const card of cardsBelow) {
        const className = await card.getAttribute('class') || '';
        if (className.includes('border-l-blue-500')) belowColors.blue++;
        if (className.includes('border-l-green-500')) belowColors.green++;
      }
      
      console.log(`📊 Above timeline: 🔵 ${aboveColors.blue} blue, 🟢 ${aboveColors.green} green`);
      console.log(`📊 Below timeline: 🔵 ${belowColors.blue} blue, 🟢 ${belowColors.green} green`);
      
      // If we have many cards in a half-column (above OR below), they should be green
      if (cardsAbove.length > 2 && aboveColors.green === 0) {
        console.log('❌ HALF-COLUMN DEGRADATION BROKEN: >2 cards above but no green cards!');
      }
      
      if (cardsBelow.length > 2 && belowColors.green === 0) {
        console.log('❌ HALF-COLUMN DEGRADATION BROKEN: >2 cards below but no green cards!');
      }
      
      if (telemetry?.degradation) {
        console.log('📊 Telemetry degradation:', telemetry.degradation);
      }
      
      break;
    }
  }
  
  // Reset
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(1000);
  
  console.log('✅ Half-column degradation verification completed');
});




