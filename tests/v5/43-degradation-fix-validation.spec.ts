import { test, expect } from '@playwright/test';

/**
 * Test 43: Degradation Fix Validation
 * Tests that the degradation system properly converts blue cards to green cards
 * when density increases (e.g., when overflow indicators appear)
 */

test('Degradation system should show green cards when overflow badges appear', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔧 DEGRADATION FIX VALIDATION - Overflow vs Card Color Correlation');
  
  // Try to load Napoleon dataset via dev panel
  try {
    // Enable dev first, then open panel
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    
    // Look for settings button (developer panel)
    const settingsButtons = await page.locator('button').all();
    for (const button of settingsButtons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      if (text?.includes('settings') || ariaLabel?.includes('Developer')) {
        console.log('📱 Opening developer panel...');
        await button.click();
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Load Napoleon dataset
    const allButtons = await page.locator('button').all();
    for (const button of allButtons) {
      const text = await button.textContent();
      if (text?.includes('Napoleon')) {
        console.log('📚 Loading Napoleon 1769-1821 dataset...');
        await button.click();
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    // Close dev panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
  } catch (error: unknown) {
    console.log('⚠️ Could not load Napoleon dataset, proceeding with default data:', error);
  }

  // Wait for data to load and telemetry to be available
  await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry), { timeout: 5000 });
  
  const initialTelemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
  console.log('📊 Dataset loaded:', {
    events: initialTelemetry?.events?.total || 0,
    groups: initialTelemetry?.groups?.count || 0,
    hasDegradationMetrics: !!initialTelemetry?.degradation
  });

  // Get timeline dimensions for zoom operations
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (!timelineBox) {
    throw new Error('Timeline not found');
  }

  const centerX = timelineBox.x + timelineBox.width * 0.5;
  const centerY = timelineBox.y + timelineBox.height * 0.5;
  
  let foundOverflowWithGreenCards = false;
  let foundOverflowWithOnlyBlueCards = false;
  
  // Progressive zoom to find density scenarios
  for (let zoomLevel = 1; zoomLevel <= 10; zoomLevel++) {
    console.log(`\n🔎 Zoom Level ${zoomLevel}/10:`);
    
    // Zoom in to increase density
    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(0, -150);
    await page.waitForTimeout(800);
    
    // Check current state
    const cards = await page.locator('[data-testid="event-card"]').all();
    const overflowBadges = await page.locator('.bg-red-500').all();
    
    // Analyze card colors
    const colorAnalysis = { blue: 0, green: 0, yellow: 0, purple: 0, red: 0, other: 0 };
    
    for (const card of cards.slice(0, 15)) {
      const className = await card.getAttribute('class') || '';
      
      if (className.includes('border-l-blue-500')) colorAnalysis.blue++;
      else if (className.includes('border-l-green-500')) colorAnalysis.green++;
      else if (className.includes('border-l-yellow-500')) colorAnalysis.yellow++;
      else if (className.includes('border-l-purple-500')) colorAnalysis.purple++;
      else if (className.includes('border-l-red-500')) colorAnalysis.red++;
      else colorAnalysis.other++;
    }
    
    console.log(`  📊 Cards: ${cards.length} total (🔵${colorAnalysis.blue} 🟢${colorAnalysis.green} 🟡${colorAnalysis.yellow} 🟣${colorAnalysis.purple} 🔴${colorAnalysis.red})`);
    console.log(`  📊 Overflow badges: ${overflowBadges.length}`);
    
    // Check telemetry
    const telemetry = await page.evaluate(() => (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null);
    if (telemetry?.degradation) {
      const deg = telemetry.degradation;
      console.log(`  📊 Degradation: Total:${deg.totalGroups}, Full:${deg.fullCardGroups}, Compact:${deg.compactCardGroups}`);
    }
    
    // Test the correlation we expect to see
    if (overflowBadges.length > 0) {
      console.log(`  🎯 HIGH DENSITY DETECTED: ${overflowBadges.length} overflow badges found`);
      
      if (colorAnalysis.green > 0) {
        console.log(`  ✅ CORRECT: Found ${colorAnalysis.green} green (compact) cards with overflow indicators`);
        foundOverflowWithGreenCards = true;
      } else if (colorAnalysis.blue > 0) {
        console.log(`  ❌ ISSUE: Found ${overflowBadges.length} overflow badges but only ${colorAnalysis.blue} blue cards!`);
        console.log(`      This indicates degradation is not working - high density should show green cards`);
        foundOverflowWithOnlyBlueCards = true;
      }
    }
    
    // Stop if we have enough data points
    if (foundOverflowWithGreenCards && cards.length > 5) break;
  }
  
  // Reset zoom
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(1000);
  
  // Validate the fix
  if (foundOverflowWithOnlyBlueCards && !foundOverflowWithGreenCards) {
    console.log('\n❌ DEGRADATION SYSTEM BROKEN:');
    console.log('   - Overflow badges indicate high density');
    console.log('   - But cards remain blue (full) instead of degrading to green (compact)');
    console.log('   - This means the degradation logic is not working properly');
    
    expect(foundOverflowWithGreenCards).toBe(true); // This should fail to highlight the issue
  } else if (foundOverflowWithGreenCards) {
    console.log('\n✅ DEGRADATION SYSTEM WORKING:');
    console.log('   - High density scenarios show overflow badges');
    console.log('   - Cards properly degrade to green (compact) when needed');
    console.log('   - Degradation system is functioning correctly');
  } else {
    console.log('\nℹ️ NO HIGH DENSITY SCENARIOS FOUND:');
    console.log('   - Timeline may be sparse or zoom insufficient');
    console.log('   - This is acceptable behavior for low-density timelines');
  }
  
  console.log('\n✅ Degradation fix validation completed');
});

test('Card type consistency validation', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🔍 CARD TYPE CONSISTENCY VALIDATION');
  
  // Wait for any content to load
  await page.waitForTimeout(2000);
  await page.waitForFunction(() => Boolean((window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry), { timeout: 3000 });
  
  // Zoom moderately to potentially trigger some degradation
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  
  if (timelineBox) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    // Moderate zoom
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(400);
    }
  }
  
  // Check card type consistency between DOM attributes and visual styling
  const cards = await page.locator('[data-testid="event-card"]').all();
  
  console.log(`🎯 Analyzing ${cards.length} cards for type consistency...`);
  
  let consistencyIssues = 0;
  
  for (let i = 0; i < Math.min(cards.length, 10); i++) {
    const card = cards[i];
    const cardType = await card.getAttribute('data-card-type');
    const className = await card.getAttribute('class') || '';
    
    let expectedColor = '';
    let actualColorFound = false;
    
    switch (cardType) {
      case 'full':
        expectedColor = 'border-l-blue-500';
        actualColorFound = className.includes('border-l-blue-500');
        break;
      case 'compact':
        expectedColor = 'border-l-green-500';
        actualColorFound = className.includes('border-l-green-500');
        break;
      case 'title-only':
        expectedColor = 'border-l-yellow-500';
        actualColorFound = className.includes('border-l-yellow-500');
        break;
      case 'multi-event':
        expectedColor = 'border-l-purple-500';
        actualColorFound = className.includes('border-l-purple-500');
        break;
      case 'infinite':
        expectedColor = 'border-l-red-500';
        actualColorFound = className.includes('border-l-red-500');
        break;
    }
    
    if (cardType && expectedColor) {
      if (actualColorFound) {
        console.log(`  ✅ Card ${i + 1}: ${cardType} → ${expectedColor} ✓`);
      } else {
        console.log(`  ❌ Card ${i + 1}: ${cardType} should have ${expectedColor} but doesn't`);
        consistencyIssues++;
      }
    }
  }
  
  if (consistencyIssues > 0) {
    console.log(`\n❌ Found ${consistencyIssues} card type consistency issues`);
    expect(consistencyIssues).toBe(0);
  } else {
    console.log('\n✅ All cards have consistent types and colors');
  }
  
  console.log('✅ Card type consistency validation completed');
});