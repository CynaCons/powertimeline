import { test, expect } from '@playwright/test';

test.describe('View Window Overflow Bug Detection', () => {
  test.setTimeout(60000);

  test('Reproduce leftover overflow by resetting zoom constraints temporarily', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Load Napoleon timeline
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    console.log('🔍 TESTING VIEW WINDOW OVERFLOW BUG REPRODUCTION');
    
    // STEP 1: Go to old-style moderate zoom (using original 5% constraint behavior)
    console.log('\n=== STEP 1: Moderate zoom to trigger overflow system ===');
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    const minimapBar = page.locator('.relative.h-4.bg-gray-200');
    const minimapBox = await minimapBar.boundingBox();
    
    // Navigate to the busiest period to force overflow creation
    let clickX = minimapBox!.x + minimapBox!.width * 0.6; // 1810s period
    let clickY = minimapBox!.y + minimapBox!.height / 2;
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    const cardsAtBusy = await page.locator('[data-testid="event-card"]').count();
    const overflowAtBusy = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
    
    console.log(`Busy period: ${cardsAtBusy} cards, ${overflowAtBusy} overflow badges`);
    await page.screenshot({ path: 'test-results/bug-reproduction-step1-busy-period.png' });
    
    if (overflowAtBusy === 0) {
      console.log('⚠️ No overflow created - increasing zoom to force overflow');
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(100);
      }
      
      const moreOverflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      console.log(`After deeper zoom: ${moreOverflow} overflow badges`);
    }
    
    // STEP 2: Navigate to sparse regions and check for leftover overflow
    console.log('\n=== STEP 2: Navigate to sparse regions ===');
    
    const sparseRegions = [
      { name: 'Very Early Life', pos: 0.02 },
      { name: 'Youth Gap', pos: 0.08 },
      { name: 'Late Gap', pos: 0.88 },
      { name: 'Very End', pos: 0.98 }
    ];
    
    const leftoverDetections: Array<{region: string, overflow: number}> = [];
    
    for (const region of sparseRegions) {
      console.log(`\n--- Checking ${region.name} (${region.pos}) ---`);
      
      clickX = minimapBox!.x + minimapBox!.width * region.pos;
      clickY = minimapBar!.y + minimapBox!.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(200);
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      console.log(`  ${region.name}: ${cards} cards, ${overflow} overflow badges`);
      
      // Check for telemetry data from layout engine
      const telemetryData = await page.evaluate(() => {
        return (window as unknown as { __ccTelemetry?: unknown }).__ccTelemetry || null;
      });
      
      if (telemetryData) {
        console.log(`  📊 Telemetry: ${telemetryData.events} events, ${telemetryData.visibleCards} positioned cards`);
      }
      
      if (cards === 0 && overflow > 0) {
        console.log(`  ❌ LEFTOVER OVERFLOW: ${overflow} badges in empty region!`);
        leftoverDetections.push({ region: region.name, overflow });
        
        // Get detailed badge information
        const badges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
        for (let i = 0; i < overflow; i++) {
          const badge = badges.nth(i);
          const text = await badge.textContent();
          const id = await badge.getAttribute('data-testid');
          const box = await badge.boundingBox();
          console.log(`    Leftover: ${id}="${text}" at (${box?.x}, ${box?.y})`);
        }
        
        await page.screenshot({ path: `test-results/bug-leftover-${region.name.toLowerCase().replace(' ', '-')}.png` });
      } else if (cards <= 2 && overflow > 0) {
        console.log(`  ⚠️ SUSPICIOUS: ${overflow} overflow with only ${cards} cards`);
        await page.screenshot({ path: `test-results/bug-suspicious-${region.name.toLowerCase().replace(' ', '-')}.png` });
      }
      
      await page.screenshot({ path: `test-results/bug-region-${region.name.toLowerCase().replace(' ', '-')}.png` });
    }
    
    // STEP 3: Test rapid position changes to stress overflow system
    console.log('\n=== STEP 3: Rapid position changes to stress overflow system ===');
    
    const rapidPositions = [0.3, 0.7, 0.15, 0.85, 0.45, 0.25, 0.65, 0.95];
    let rapidLeftovers = 0;
    
    for (let i = 0; i < rapidPositions.length; i++) {
      const pos = rapidPositions[i];
      clickX = minimapBox!.x + minimapBox!.width * pos;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(50); // Very fast - don't give time for cleanup
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const overflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      if (cards === 0 && overflow > 0) {
        rapidLeftovers++;
        console.log(`  🔥 RAPID LEFTOVER ${i+1}: pos=${pos}, overflow=${overflow}`);
      }
    }
    
    console.log(`\n📈 BUG REPRODUCTION RESULTS:`);
    console.log(`  📊 Regions with leftover overflow: ${leftoverDetections.length}`);
    console.log(`  📊 Rapid navigation leftovers: ${rapidLeftovers}`);
    
    if (leftoverDetections.length > 0) {
      console.log(`  ❌ CONFIRMED BUG: Leftover overflow indicators detected`);
      for (const detection of leftoverDetections) {
        console.log(`    - ${detection.region}: ${detection.overflow} leftover badges`);
      }
      
      expect(leftoverDetections.length).toBe(0); // This should fail if bug exists
    } else if (rapidLeftovers > 0) {
      console.log(`  ❌ CONFIRMED BUG: ${rapidLeftovers} rapid navigation leftovers`);
      expect(rapidLeftovers).toBe(0);
    } else {
      console.log(`  ✅ No leftover overflow detected - bug may be fixed or not reproducible`);
    }
    
    console.log('✅ Bug reproduction test complete');
  });

  test('Test overflow persistence when view window changes dramatically', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Load Napoleon timeline
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    console.log('🔍 TESTING VIEW WINDOW CHANGE OVERFLOW PERSISTENCE');
    
    // Zoom to maximum level we set (0.1% granularity)
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const minimapBar = page.locator('.relative.h-4.bg-gray-200');
    const minimapBox = await minimapBar.boundingBox();
    
    console.log('\n=== Testing dramatic view window jumps at maximum zoom ===');
    
    // Jump between dramatically different timeline periods
    const dramaticJumps = [
      { from: 0.1, to: 0.9, desc: 'Early Life → Death Period' },
      { from: 0.9, to: 0.2, desc: 'Death Period → Youth' },
      { from: 0.2, to: 0.8, desc: 'Youth → Later Empire' },
      { from: 0.8, to: 0.05, desc: 'Later Empire → Birth' },
      { from: 0.05, to: 0.95, desc: 'Birth → Final Days' }
    ];
    
    const persistenceIssues: Array<{jump: string, issue: string}> = [];
    
    for (let i = 0; i < dramaticJumps.length; i++) {
      const jump = dramaticJumps[i];
      console.log(`\n--- Jump ${i+1}: ${jump.desc} ---`);
      
      // Navigate to 'from' position
      let clickX = minimapBox!.x + minimapBox!.width * jump.from;
      let clickY = minimapBox!.y + minimapBox!.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(150);
      
      const fromCards = await page.locator('[data-testid="event-card"]').count();
      const fromOverflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      console.log(`  From pos (${jump.from}): ${fromCards} cards, ${fromOverflow} overflow`);
      
      // Dramatic jump to 'to' position
      clickX = minimapBox!.x + minimapBox!.width * jump.to;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(150);
      
      const toCards = await page.locator('[data-testid="event-card"]').count();
      const toOverflow = await page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]').count();
      
      console.log(`  To pos (${jump.to}): ${toCards} cards, ${toOverflow} overflow`);
      
      // Check for suspicious patterns
      if (toCards === 0 && toOverflow > 0) {
        const issue = `Empty region has ${toOverflow} overflow badges`;
        console.log(`  ❌ PERSISTENCE ISSUE: ${issue}`);
        persistenceIssues.push({ jump: jump.desc, issue });
      }
      
      if (fromOverflow === toOverflow && fromOverflow > 0 && fromCards !== toCards) {
        const issue = `Same overflow count (${fromOverflow}) at different positions with different card counts`;
        console.log(`  ⚠️ SUSPICIOUS: ${issue}`);
        persistenceIssues.push({ jump: jump.desc, issue });
      }
      
      await page.screenshot({ path: `test-results/dramatic-jump-${i}-${jump.desc.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
    }
    
    console.log('\n📈 VIEW WINDOW PERSISTENCE ANALYSIS:');
    console.log(`  📊 Dramatic jumps tested: ${dramaticJumps.length}`);
    console.log(`  📊 Persistence issues: ${persistenceIssues.length}`);
    
    if (persistenceIssues.length > 0) {
      console.log(`  ❌ OVERFLOW PERSISTENCE ISSUES:`);
      for (const issue of persistenceIssues) {
        console.log(`    - ${issue.jump}: ${issue.issue}`);
      }
      
      expect(persistenceIssues.length).toBe(0);
    } else {
      console.log(`  ✅ No overflow persistence issues detected`);
    }
    
    console.log('✅ View window persistence test complete');
  });
});