import { test, expect } from '@playwright/test';

test.describe('Leftover Overflow Indicator Detection Tests', () => {
  test.setTimeout(60000);

  test('Detect leftover overflow indicators that persist in empty timeline regions', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-OVERFLOW-001' });
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Load Napoleon timeline
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Zoom to moderate level to create overflow conditions initially
    console.log('🔍 SETTING UP OVERFLOW CONDITIONS...');
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    console.log('🔍 TESTING FOR LEFTOVER OVERFLOW INDICATORS');
    
    // First, navigate to a region that SHOULD have overflow indicators
    console.log('\n=== STEP 1: Navigate to DENSE region (should have overflow) ===');
    const densePosition = 0.6; // Around 1810s - busy period
    let clickX = minimapBox!.x + minimapBox!.width * densePosition;
    let clickY = minimapBox!.y + minimapBox!.height / 2;
    
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    const cardsInDense = await page.locator('[data-testid="event-card"]').count();
    const overflowInDense = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    
    console.log(`Dense region: ${cardsInDense} cards, ${overflowInDense} overflow badges`);
    await page.screenshot({ path: 'test-results/leftover-step1-dense-region.png' });
    
    // Now navigate to regions that SHOULD BE EMPTY (no events, no overflow)
    const emptyRegions = [
      { name: 'Very Early (1769)', position: 0.02 },
      { name: 'Youth Gap (1785)', position: 0.12 },
      { name: 'Mid Career Gap (1798)', position: 0.28 },
      { name: 'Late Gap (1820)', position: 0.95 }
    ];
    
    const leftoverProblems: Array<{region: string, position: number, cards: number, overflow: number, badgeTexts: string[]}> = [];
    
    for (const region of emptyRegions) {
      console.log(`\n=== STEP: Navigate to EMPTY region ${region.name} (${region.position}) ===`);
      
      clickX = minimapBox!.x + minimapBox!.width * region.position;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(300);
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const overflowCount = await overflowBadges.count();
      
      // Collect overflow badge texts and positions for debugging
      const badgeTexts: string[] = [];
      const badgePositions: Array<{text: string, x: number, y: number, id: string}> = [];
      
      for (let i = 0; i < overflowCount; i++) {
        const badge = overflowBadges.nth(i);
        const text = await badge.textContent() || '';
        const id = await badge.getAttribute('data-testid') || '';
        const box = await badge.boundingBox();
        
        badgeTexts.push(text);
        if (box) {
          badgePositions.push({ text, x: Math.round(box.x), y: Math.round(box.y), id });
        }
      }
      
      console.log(`  📊 Cards: ${cards}, Overflow badges: ${overflowCount}`);
      if (overflowCount > 0) {
        console.log(`  🔍 Badge details:`, badgePositions.map(b => `${b.id}="${b.text}" at (${b.x},${b.y})`).join(', '));
      }
      
      // CRITICAL DETECTION: Empty regions should have NO overflow indicators
      if (cards === 0 && overflowCount > 0) {
        console.log(`  ❌ LEFTOVER OVERFLOW DETECTED: ${overflowCount} badges in empty region!`);
        leftoverProblems.push({
          region: region.name,
          position: region.position,
          cards,
          overflow: overflowCount,
          badgeTexts
        });
        
        await page.screenshot({ path: `test-results/leftover-overflow-${region.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
      } else if (cards === 0 && overflowCount === 0) {
        console.log(`  ✅ Correctly empty - no cards, no overflow badges`);
      } else if (cards > 0) {
        console.log(`  ✅ Has content - ${cards} cards, overflow badges acceptable`);
      }
      
      await page.screenshot({ path: `test-results/leftover-region-${region.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
    }
    
    // ANALYZE LEFTOVER PROBLEMS
    console.log('\n📈 LEFTOVER OVERFLOW ANALYSIS:');
    console.log(`  📊 Regions tested: ${emptyRegions.length}`);
    console.log(`  📊 Leftover problems detected: ${leftoverProblems.length}`);
    
    if (leftoverProblems.length > 0) {
      console.log(`  ❌ LEFTOVER OVERFLOW ISSUES:`);
      for (const problem of leftoverProblems) {
        console.log(`    - ${problem.region}: ${problem.overflow} badges [${problem.badgeTexts.join(', ')}]`);
      }
      
      // FAIL THE TEST - this is the core issue we're detecting
      expect(leftoverProblems.length).toBe(0);
    } else {
      console.log(`  ✅ No leftover overflow indicators detected`);
    }
    
    console.log('✅ Leftover overflow detection test complete');
  });

  test('Overflow indicators should disappear when zooming out from dense regions', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-OVERFLOW-002' });
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Load Napoleon timeline
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    console.log('🔍 TESTING OVERFLOW CLEANUP ON ZOOM OUT');
    
    // 1. Start zoomed out (should show most/all events without overflow)
    console.log('\n=== STEP 1: Zoom out to see full timeline ===');
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(50);
    }
    
    const cardsZoomedOut = await page.locator('[data-testid="event-card"]').count();
    const overflowZoomedOut = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    
    console.log(`Zoomed out: ${cardsZoomedOut} cards, ${overflowZoomedOut} overflow badges`);
    await page.screenshot({ path: 'test-results/zoom-cleanup-step1-zoomed-out.png' });
    
    // 2. Zoom in to create overflow conditions
    console.log('\n=== STEP 2: Zoom in to create overflow ===');
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(50);
    }
    
    const cardsZoomedIn = await page.locator('[data-testid="event-card"]').count();
    const overflowZoomedIn = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    
    console.log(`Zoomed in: ${cardsZoomedIn} cards, ${overflowZoomedIn} overflow badges`);
    await page.screenshot({ path: 'test-results/zoom-cleanup-step2-zoomed-in.png' });
    
    // 3. Zoom back out - overflow indicators should disappear or reduce significantly
    console.log('\n=== STEP 3: Zoom back out - overflow should cleanup ===');
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(50);
    }
    
    const cardsAfterCleanup = await page.locator('[data-testid="event-card"]').count();
    const overflowAfterCleanup = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    
    console.log(`After cleanup: ${cardsAfterCleanup} cards, ${overflowAfterCleanup} overflow badges`);
    await page.screenshot({ path: 'test-results/zoom-cleanup-step3-after-cleanup.png' });
    
    // ANALYZE ZOOM CLEANUP BEHAVIOR
    console.log('\n📈 ZOOM CLEANUP ANALYSIS:');
    console.log(`  📊 Zoomed out → Zoomed in → Zoomed out progression:`);
    console.log(`    Cards: ${cardsZoomedOut} → ${cardsZoomedIn} → ${cardsAfterCleanup}`);
    console.log(`    Overflow: ${overflowZoomedOut} → ${overflowZoomedIn} → ${overflowAfterCleanup}`);
    
    // Cards should return to approximately the same level when zoomed back out
    const cardDifference = Math.abs(cardsAfterCleanup - cardsZoomedOut);
    const overflowDifference = Math.abs(overflowAfterCleanup - overflowZoomedOut);
    
    console.log(`  📊 Differences after zoom cycle: cards ±${cardDifference}, overflow ±${overflowDifference}`);
    
    // ASSERTIONS: When zoomed out, we should be back to similar state
    if (cardDifference > cardsZoomedOut * 0.3) { // Allow 30% variance
      console.log(`  ❌ CARD COUNT NOT RESTORED: Expected ~${cardsZoomedOut}, got ${cardsAfterCleanup}`);
      expect(cardDifference).toBeLessThan(cardsZoomedOut * 0.3);
    }
    
    if (overflowAfterCleanup > overflowZoomedOut + 3) { // Allow small increase but not dramatic
      console.log(`  ❌ OVERFLOW NOT CLEANED UP: Started with ${overflowZoomedOut}, ended with ${overflowAfterCleanup}`);
      expect(overflowAfterCleanup).toBeLessThanOrEqual(overflowZoomedOut + 3);
    }
    
    console.log('✅ Zoom cleanup behavior validated');
  });

  test('Navigate to completely different timeline positions to force overflow recalculation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Load Napoleon timeline
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Zoom to deep level where overflow is likely
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    console.log('🔍 TESTING OVERFLOW RECALCULATION ON POSITION JUMPS');
    
    // Test dramatic position jumps that should force overflow recalculation
    const jumpSequence = [
      { name: 'Start of Life (Birth)', position: 0.0 },
      { name: 'Peak Empire (1810)', position: 0.7 },
      { name: 'Early Youth (1775)', position: 0.05 },
      { name: 'Military Rise (1796)', position: 0.35 },
      { name: 'End of Life (Death)', position: 1.0 },
      { name: 'Middle Career (1800)', position: 0.45 }
    ];
    
    const jumpResults: Array<{
      position: string,
      coordinates: number,
      cards: number,
      overflow: number,
      badgeTexts: string[],
      suspiciouslyHigh: boolean
    }> = [];
    
    for (const jump of jumpSequence) {
      console.log(`\n=== JUMP TO: ${jump.name} (${jump.position}) ===`);
      
      // Navigate to position
      const clickX = minimapBox!.x + minimapBox!.width * jump.position;
      const clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(400); // Allow recalculation
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const overflowCount = await overflowBadges.count();
      
      // Collect overflow texts
      const badgeTexts: string[] = [];
      for (let i = 0; i < overflowCount; i++) {
        const text = await overflowBadges.nth(i).textContent() || '';
        badgeTexts.push(text);
      }
      
      // Detect suspiciously high overflow counts (likely leftover indicators)
      const suspiciouslyHigh = cards === 0 && overflowCount > 0; // Empty region with overflow = suspicious
      
      jumpResults.push({
        position: jump.name,
        coordinates: jump.position,
        cards,
        overflow: overflowCount,
        badgeTexts,
        suspiciouslyHigh
      });
      
      console.log(`  📊 ${cards} cards, ${overflowCount} overflow [${badgeTexts.join(', ')}] ${suspiciouslyHigh ? '⚠️ SUSPICIOUS' : '✅'}`);
      
      await page.screenshot({ path: `test-results/position-jump-${jump.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
    }
    
    // ANALYZE POSITION JUMP RESULTS
    console.log('\n📈 POSITION JUMP ANALYSIS:');
    const suspiciousJumps = jumpResults.filter(r => r.suspiciouslyHigh);
    const totalOverflowBadges = jumpResults.reduce((sum, r) => sum + r.overflow, 0);
    
    console.log(`  📊 Total position jumps: ${jumpResults.length}`);
    console.log(`  📊 Suspicious results: ${suspiciousJumps.length}`);
    console.log(`  📊 Total overflow badges across all positions: ${totalOverflowBadges}`);
    
    if (suspiciousJumps.length > 0) {
      console.log(`  ❌ SUSPICIOUS OVERFLOW PERSISTENCE:`);
      for (const suspicious of suspiciousJumps) {
        console.log(`    - ${suspicious.position}: ${suspicious.overflow} badges in empty region [${suspicious.badgeTexts.join(', ')}]`);
      }
      
      // Fail if we detect leftover overflow indicators
      expect(suspiciousJumps.length).toBe(0);
    }
    
    // Additionally check for unreasonably high overflow counts at any position
    const unreasonableOverflow = jumpResults.filter(r => r.overflow > 10); // More than 10 overflow badges is likely a bug
    if (unreasonableOverflow.length > 0) {
      console.log(`  ❌ UNREASONABLE OVERFLOW COUNTS:`);
      for (const unreasonable of unreasonableOverflow) {
        console.log(`    - ${unreasonable.position}: ${unreasonable.overflow} overflow badges (too many)`);
      }
      
      expect(unreasonableOverflow.length).toBe(0);
    }
    
    console.log('✅ Position jump overflow recalculation validated');
  });
});
