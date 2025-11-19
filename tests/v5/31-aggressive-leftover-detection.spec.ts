import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Aggressive Leftover Overflow Detection', () => {
  test.setTimeout(90000);

  test('Force leftover overflow by rapid navigation and zoom changes', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-napoleon');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    console.log('🔍 AGGRESSIVE LEFTOVER OVERFLOW TESTING');
    
    // SCENARIO 1: Create overflow conditions, then rapidly navigate to empty areas
    console.log('\n=== SCENARIO 1: Create overflow then rapid navigation ===');
    
    // First, zoom in deep to create overflow
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(30);
    }
    
    // Navigate to the busiest period (around 1810) to force overflow creation
    let clickX = minimapBox!.x + minimapBox!.width * 0.65;
    let clickY = minimapBox!.y + minimapBox!.height / 2;
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(200);
    
    const overflowAtBusy = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    console.log(`Created overflow conditions: ${overflowAtBusy} overflow badges`);
    await page.screenshot({ path: 'test-results/aggressive-step1-overflow-created.png' });
    
    // Now rapidly navigate to very sparse areas WITHOUT giving time for proper cleanup
    const sparsePositions = [0.01, 0.03, 0.08, 0.92, 0.96, 0.99];
    
    for (let i = 0; i < sparsePositions.length; i++) {
      const pos = sparsePositions[i];
      clickX = minimapBox!.x + minimapBox!.width * pos;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(50); // Very short wait - don't give time for cleanup
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      console.log(`  Rapid nav ${i+1}: pos=${pos.toFixed(2)}, cards=${cards}, overflow=${overflow}`);
      
      if (cards === 0 && overflow > 0) {
        console.log(`  ❌ LEFTOVER DETECTED: ${overflow} overflow badges in empty region at ${pos}`);
        await page.screenshot({ path: `test-results/aggressive-leftover-rapid-${i}.png` });
        
        // Collect debug info
        const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
        for (let j = 0; j < overflow; j++) {
          const badge = overflowBadges.nth(j);
          const text = await badge.textContent();
          const id = await badge.getAttribute('data-testid');
          const box = await badge.boundingBox();
          console.log(`    Leftover badge: ${id}="${text}" at (${box?.x}, ${box?.y})`);
        }
        
        expect(overflow).toBe(0); // Fail on leftover detection
      }
    }
    
    // SCENARIO 2: Extreme zoom in/out cycles to stress test overflow system
    console.log('\n=== SCENARIO 2: Extreme zoom cycling ===');
    
    // Start at moderate zoom at busy period
    clickX = minimapBox!.x + minimapBox!.width * 0.6;
    clickY = minimapBox!.y + minimapBox!.height / 2;
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(100);
    
    await page.mouse.move(centerX, centerY);
    
    // Perform rapid extreme zoom cycles
    for (let cycle = 0; cycle < 5; cycle++) {
      console.log(`  Zoom cycle ${cycle + 1}/5`);
      
      // Zoom in extremely deep
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(20);
      }
      
      // Immediately zoom back out
      for (let i = 0; i < 25; i++) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(20);
      }
      
      // Check for leftover overflow after extreme cycling
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      console.log(`    After cycle ${cycle + 1}: ${cards} cards, ${overflow} overflow`);
      
      if (cards > 10 && overflow > 5) {
        console.log(`  ⚠️  High overflow after zoom out: ${overflow} badges with ${cards} cards (suspicious)`);
        await page.screenshot({ path: `test-results/aggressive-high-overflow-cycle-${cycle}.png` });
      }
    }
    
    // SCENARIO 3: Navigate to completely empty areas after creating complex overflow state
    console.log('\n=== SCENARIO 3: Complex overflow state then empty navigation ===');
    
    // Create complex multi-position overflow state
    const complexPositions = [0.3, 0.45, 0.6, 0.72];
    for (const pos of complexPositions) {
      clickX = minimapBox!.x + minimapBox!.width * pos;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(50); // Brief visit to each position
    }
    
    // Now zoom deep at one of these positions
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(30);
    }
    
    const complexOverflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    console.log(`Complex state created: ${complexOverflow} overflow badges`);
    
    // Navigate to guaranteed empty areas (timeline extremes)
    const emptyExtremes = [
      { name: 'Timeline Start', pos: 0.001 },
      { name: 'Timeline End', pos: 0.999 }
    ];
    
    for (const extreme of emptyExtremes) {
      clickX = minimapBox!.x + minimapBox!.width * extreme.pos;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(100);
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      console.log(`  ${extreme.name}: ${cards} cards, ${overflow} overflow badges`);
      
      if (overflow > 0) {
        console.log(`  ❌ LEFTOVER AT EXTREME: ${overflow} badges at ${extreme.name}`);
        await page.screenshot({ path: `test-results/aggressive-leftover-extreme-${extreme.name.toLowerCase().replace(' ', '-')}.png` });
        
        // This is definitely a bug - timeline extremes should never have overflow
        expect(overflow).toBe(0);
      }
    }
    
    console.log('✅ Aggressive leftover detection complete');
  });

  test('Detect overflow indicators that survive view window changes', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-napoleon');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    console.log('🔍 TESTING VIEW WINDOW OVERFLOW SURVIVAL');
    
    // Set up deep zoom to create overflow conditions
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 18; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(25);
    }
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    // Test sequence: Create overflow → Navigate away → Return → Check for ghost overflow
    const testSequence = [
      { name: 'Dense Period', pos: 0.65, shouldHaveOverflow: true },
      { name: 'Sparse Period', pos: 0.1, shouldHaveOverflow: false },
      { name: 'Return to Dense', pos: 0.65, shouldHaveOverflow: true },
      { name: 'Different Sparse', pos: 0.9, shouldHaveOverflow: false },
      { name: 'Original Dense Again', pos: 0.65, shouldHaveOverflow: true }
    ];
    
    const sequenceResults: Array<{
      step: string,
      position: number,
      cards: number,
      overflow: number,
      expectedOverflow: boolean,
      hasUnexpectedOverflow: boolean
    }> = [];
    
    for (let i = 0; i < testSequence.length; i++) {
      const step = testSequence[i];
      console.log(`\n=== SEQUENCE STEP ${i+1}: ${step.name} (${step.pos}) ===`);
      
      // Navigate to position
      const clickX = minimapBox!.x + minimapBox!.width * step.pos;
      const clickY = minimapBox!.y + minimapBox!.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(200);
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const overflow = await overflowBadges.count();
      
      // Check for unexpected overflow (should not have overflow in sparse areas)
      const hasUnexpectedOverflow = !step.shouldHaveOverflow && overflow > 0;
      
      sequenceResults.push({
        step: step.name,
        position: step.pos,
        cards,
        overflow,
        expectedOverflow: step.shouldHaveOverflow,
        hasUnexpectedOverflow
      });
      
      console.log(`  📊 ${cards} cards, ${overflow} overflow ${hasUnexpectedOverflow ? '❌ UNEXPECTED' : '✅'}`);
      
      if (hasUnexpectedOverflow) {
        console.log(`  ❌ UNEXPECTED OVERFLOW: Found ${overflow} badges where none expected`);
        
        // Collect detailed info about unexpected overflow
        for (let j = 0; j < overflow; j++) {
          const badge = overflowBadges.nth(j);
          const text = await badge.textContent();
          const id = await badge.getAttribute('data-testid');
          const box = await badge.boundingBox();
          console.log(`    Ghost badge: ${id}="${text}" at (${box?.x}, ${box?.y})`);
        }
        
        await page.screenshot({ path: `test-results/view-window-ghost-overflow-step-${i}.png` });
        expect(hasUnexpectedOverflow).toBe(false);
      }
      
      await page.screenshot({ path: `test-results/view-window-sequence-step-${i}-${step.name.toLowerCase().replace(' ', '-')}.png` });
    }
    
    // ANALYZE SEQUENCE RESULTS
    console.log('\n📈 VIEW WINDOW SEQUENCE ANALYSIS:');
    const unexpectedOverflows = sequenceResults.filter(r => r.hasUnexpectedOverflow);
    const denseSteps = sequenceResults.filter(r => r.expectedOverflow);
    const sparseSteps = sequenceResults.filter(r => !r.expectedOverflow);
    
    console.log(`  📊 Total sequence steps: ${sequenceResults.length}`);
    console.log(`  📊 Dense periods: ${denseSteps.length} (should have overflow)`);
    console.log(`  📊 Sparse periods: ${sparseSteps.length} (should not have overflow)`);
    console.log(`  📊 Unexpected overflows: ${unexpectedOverflows.length}`);
    
    if (unexpectedOverflows.length > 0) {
      console.log(`  ❌ GHOST OVERFLOW DETECTED IN:`);
      for (const ghost of unexpectedOverflows) {
        console.log(`    - ${ghost.step}: ${ghost.overflow} ghost badges`);
      }
    }
    
    // Also check for overflow consistency in dense periods
    const denseOverflowCounts = denseSteps.map(r => r.overflow);
    const minDenseOverflow = Math.min(...denseOverflowCounts);
    const maxDenseOverflow = Math.max(...denseOverflowCounts);
    
    if (maxDenseOverflow - minDenseOverflow > 5) {
      console.log(`  ⚠️  INCONSISTENT OVERFLOW IN SAME DENSE REGION: ${minDenseOverflow} to ${maxDenseOverflow}`);
    }
    
    console.log('✅ View window overflow survival test complete');
  });
});