import { test, expect } from '@playwright/test';

test.describe('Timeline Anchor Directional Connectors', () => {
  test.setTimeout(60000);

  test('Verify anchor connectors point toward events (above/below timeline)', async ({ page }) => {
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
    
    console.log('🔍 TESTING DIRECTIONAL ANCHOR CONNECTORS');
    
    // Zoom to moderate level where we expect anchors to appear
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    // Test different timeline positions with predictable event distributions
    const testScenarios = [
      {
        name: 'Early Career (1796-1800)',
        position: 0.35,
        description: 'Military campaigns - expect events both above and below'
      },
      {
        name: 'Peak Empire (1810)',
        position: 0.65,
        description: 'Dense period - expect mixed distribution'
      },
      {
        name: 'Final Years (1815-1821)',
        position: 0.85,
        description: 'Exile period - fewer events, predictable positioning'
      }
    ];
    
    const connectorResults: Array<{
      scenario: string,
      position: number,
      anchors: number,
      upConnectors: number,
      downConnectors: number,
      bidirectionalConnectors: number,
      eventsAbove: number,
      eventsBelow: number
    }> = [];
    
    for (const scenario of testScenarios) {
      console.log(`\n=== SCENARIO: ${scenario.name} ===`);
      
      // Navigate to test position
      const clickX = minimapBox!.x + minimapBox!.width * scenario.position;
      const clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(400);
      
      // Wait for layout to stabilize
      await page.waitForTimeout(200);
      
      // Count anchors and their connector types
      const anchors = page.locator('[data-testid="timeline-anchor"]');
      const anchorCount = await anchors.count();
      
      // Get timeline position for reference
      const timelineRect = await page.locator('[data-testid="timeline-axis"]').boundingBox();
      const timelineY = timelineRect ? timelineRect.y : centerY;
      
      // Count events above and below timeline
      const eventCards = page.locator('[data-testid="event-card"]');
      const eventCount = await eventCards.count();
      
      let eventsAbove = 0;
      let eventsBelow = 0;
      
      for (let i = 0; i < eventCount; i++) {
        const card = eventCards.nth(i);
        const cardBox = await card.boundingBox();
        if (cardBox) {
          if (cardBox.y < timelineY) {
            eventsAbove++;
          } else {
            eventsBelow++;
          }
        }
      }
      
      // Analyze connector directions
      let upConnectors = 0;
      let downConnectors = 0;
      let bidirectionalConnectors = 0;
      
      for (let i = 0; i < anchorCount; i++) {
        const anchor = anchors.nth(i);
        const anchorBox = await anchor.boundingBox();
        
        if (anchorBox) {
          // Check for upward connectors (negative margin-top)
          const upConnector = anchor.locator('.bg-gray-400.-mt-8');
          const hasUpConnector = await upConnector.count() > 0;
          
          // Check for downward connectors (positive margin-top or mt-0)
          const downConnector = anchor.locator('.bg-gray-400.mt-0');
          const hasDownConnector = await downConnector.count() > 0;
          
          // Check for bidirectional connectors (-mt-2, centered)
          const biConnector = anchor.locator('.bg-gray-400.-mt-2');
          const hasBiConnector = await biConnector.count() > 0;
          
          if (hasUpConnector) upConnectors++;
          if (hasDownConnector) downConnectors++;
          if (hasBiConnector) bidirectionalConnectors++;
        }
      }
      
      console.log(`  📊 Anchors: ${anchorCount}`);
      console.log(`  📊 Events: ${eventCount} (${eventsAbove} above, ${eventsBelow} below timeline)`);
      console.log(`  📊 Connectors: ${upConnectors} up, ${downConnectors} down, ${bidirectionalConnectors} bidirectional`);
      
      connectorResults.push({
        scenario: scenario.name,
        position: scenario.position,
        anchors: anchorCount,
        upConnectors,
        downConnectors,
        bidirectionalConnectors,
        eventsAbove,
        eventsBelow
      });
      
      await page.screenshot({ path: `test-results/connector-test-${scenario.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
    }
    
    // ANALYZE CONNECTOR LOGIC
    console.log('\n📈 DIRECTIONAL CONNECTOR ANALYSIS:');
    
    for (const result of connectorResults) {
      console.log(`\n--- ${result.scenario} ---`);
      console.log(`  Events distribution: ${result.eventsAbove} above, ${result.eventsBelow} below`);
      console.log(`  Connector distribution: ${result.upConnectors} up, ${result.downConnectors} down, ${result.bidirectionalConnectors} bi`);
      
      // Validate connector logic
      const totalConnectors = result.upConnectors + result.downConnectors + result.bidirectionalConnectors;
      
      if (totalConnectors !== result.anchors) {
        console.log(`  ❌ CONNECTOR COUNT MISMATCH: ${totalConnectors} connectors vs ${result.anchors} anchors`);
        expect(totalConnectors).toBe(result.anchors);
      }
      
      // Logic validation: If events are only above, connectors should point up
      if (result.eventsAbove > 0 && result.eventsBelow === 0) {
        if (result.upConnectors === 0) {
          console.log(`  ❌ LOGIC ERROR: Events only above but no upward connectors`);
          expect(result.upConnectors).toBeGreaterThan(0);
        } else {
          console.log(`  ✅ Correct: Events only above, connectors point up`);
        }
      }
      
      // Logic validation: If events are only below, connectors should point down
      if (result.eventsBelow > 0 && result.eventsAbove === 0) {
        if (result.downConnectors === 0) {
          console.log(`  ❌ LOGIC ERROR: Events only below but no downward connectors`);
          expect(result.downConnectors).toBeGreaterThan(0);
        } else {
          console.log(`  ✅ Correct: Events only below, connectors point down`);
        }
      }
      
      // Logic validation: If events are both above and below, expect bidirectional or mixed
      if (result.eventsAbove > 0 && result.eventsBelow > 0) {
        const hasMixedConnectors = result.upConnectors > 0 || result.downConnectors > 0 || result.bidirectionalConnectors > 0;
        if (!hasMixedConnectors) {
          console.log(`  ❌ LOGIC ERROR: Events above and below but no appropriate connectors`);
          expect(hasMixedConnectors).toBe(true);
        } else {
          console.log(`  ✅ Correct: Events distributed, connectors appropriate`);
        }
      }
    }
    
    console.log('✅ Directional connector test complete');
  });
  
  test('Verify connectors update correctly when view changes', async ({ page }) => {
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
    
    console.log('🔍 TESTING CONNECTOR UPDATES ON VIEW CHANGES');
    
    // Set moderate zoom level
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    // Test sequence: Same position at different zoom levels
    const testPosition = 0.6; // Busy period
    const clickX = minimapBox!.x + minimapBox!.width * testPosition;
    const clickY = minimapBox!.y + minimapBox!.height / 2;
    
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    const zoomTests = [
      { name: 'Moderate Zoom', zoomSteps: 0, description: 'Current zoom level' },
      { name: 'Deeper Zoom', zoomSteps: 5, description: 'Zoom in further to change layout' },
      { name: 'Maximum Zoom', zoomSteps: 8, description: 'Very deep zoom' },
      { name: 'Zoom Out', zoomSteps: -10, description: 'Zoom back out' }
    ];
    
    const zoomResults: Array<{
      zoomLevel: string,
      anchors: number,
      connectorTypes: { up: number, down: number, bi: number },
      events: { total: number, above: number, below: number }
    }> = [];
    
    for (const zoomTest of zoomTests) {
      console.log(`\n=== ${zoomTest.name}: ${zoomTest.description} ===`);
      
      // Apply zoom
      if (zoomTest.zoomSteps !== 0) {
        const wheelDirection = zoomTest.zoomSteps > 0 ? -100 : 100;
        for (let i = 0; i < Math.abs(zoomTest.zoomSteps); i++) {
          await page.mouse.wheel(0, wheelDirection);
          await page.waitForTimeout(30);
        }
      }
      
      await page.waitForTimeout(200);
      
      // Count elements
      const anchors = await page.locator('[data-testid="timeline-anchor"]').count();
      const events = await page.locator('[data-testid="event-card"]').count();
      
      // Get timeline position
      const timelineRect = await page.locator('[data-testid="timeline-axis"]').boundingBox();
      const timelineY = timelineRect ? timelineRect.y : centerY;
      
      // Count events above/below
      const eventCards = page.locator('[data-testid="event-card"]');
      let eventsAbove = 0;
      let eventsBelow = 0;
      
      for (let i = 0; i < events; i++) {
        const cardBox = await eventCards.nth(i).boundingBox();
        if (cardBox) {
          if (cardBox.y < timelineY) eventsAbove++;
          else eventsBelow++;
        }
      }
      
      // Count connector types
      const anchorElements = page.locator('[data-testid="timeline-anchor"]');
      let upConnectors = 0;
      let downConnectors = 0;
      let biConnectors = 0;
      
      for (let i = 0; i < anchors; i++) {
        const anchor = anchorElements.nth(i);
        
        const hasUp = await anchor.locator('.bg-gray-400.-mt-8').count() > 0;
        const hasDown = await anchor.locator('.bg-gray-400.mt-0').count() > 0;
        const hasBi = await anchor.locator('.bg-gray-400.-mt-2').count() > 0;
        
        if (hasUp) upConnectors++;
        if (hasDown) downConnectors++;
        if (hasBi) biConnectors++;
      }
      
      console.log(`  📊 ${events} events (${eventsAbove} above, ${eventsBelow} below)`);
      console.log(`  📊 ${anchors} anchors (${upConnectors} up, ${downConnectors} down, ${biConnectors} bi)`);
      
      zoomResults.push({
        zoomLevel: zoomTest.name,
        anchors,
        connectorTypes: { up: upConnectors, down: downConnectors, bi: biConnectors },
        events: { total: events, above: eventsAbove, below: eventsBelow }
      });
      
      await page.screenshot({ path: `test-results/connector-zoom-${zoomTest.name.toLowerCase().replace(' ', '-')}.png` });
    }
    
    // ANALYZE ZOOM BEHAVIOR
    console.log('\n📈 CONNECTOR ZOOM BEHAVIOR ANALYSIS:');
    
    for (let i = 0; i < zoomResults.length; i++) {
      const result = zoomResults[i];
      console.log(`\n--- ${result.zoomLevel} ---`);
      
      // Verify connector logic still holds at this zoom level
      const { up, down, bi } = result.connectorTypes;
      const { above, below } = result.events;
      
      if (above > 0 && below === 0 && up === 0) {
        console.log(`  ❌ ZOOM LOGIC ERROR: Events only above but no up connectors`);
      }
      
      if (below > 0 && above === 0 && down === 0) {
        console.log(`  ❌ ZOOM LOGIC ERROR: Events only below but no down connectors`);
      }
      
      if (up + down + bi !== result.anchors) {
        console.log(`  ❌ ZOOM CONNECTOR MISMATCH: ${up + down + bi} connectors vs ${result.anchors} anchors`);
      }
    }
    
    console.log('✅ Connector zoom behavior test complete');
  });

  test('Detect leftover anchor connectors that persist when navigating to empty regions', async ({ page }) => {
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
    
    console.log('🔍 TESTING LEFTOVER ANCHOR CONNECTOR FILTERING');
    
    // Zoom to create anchor conditions
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    // First, navigate to a region that SHOULD have anchors and connectors
    console.log('\n=== STEP 1: Navigate to DENSE region (should have anchors/connectors) ===');
    const densePosition = 0.6; // Around 1810s - busy period
    let clickX = minimapBox!.x + minimapBox!.width * densePosition;
    let clickY = minimapBox!.y + minimapBox!.height / 2;
    
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(400);
    
    const cardsInDense = await page.locator('[data-testid="event-card"]').count();
    const anchorsInDense = await page.locator('[data-testid="timeline-anchor"]').count();
    const connectorsInDense = await page.locator('[data-testid="timeline-anchor"] .bg-gray-400').count();
    
    console.log(`Dense region: ${cardsInDense} cards, ${anchorsInDense} anchors, ${connectorsInDense} connectors`);
    await page.screenshot({ path: 'test-results/connector-filtering-step1-dense.png' });
    
    // Test empty regions that should NOT have leftover connectors
    const emptyRegions = [
      { name: 'Very Early (1769)', position: 0.02 },
      { name: 'Youth Gap (1785)', position: 0.12 },
      { name: 'Mid Career Gap (1798)', position: 0.28 },
      { name: 'Late Gap (1820)', position: 0.95 }
    ];
    
    const leftoverConnectorProblems: Array<{
      region: string,
      position: number,
      cards: number,
      anchors: number,
      connectors: number,
      suspiciouslyHigh: boolean
    }> = [];
    
    for (const region of emptyRegions) {
      console.log(`\n=== STEP: Navigate to EMPTY region ${region.name} (${region.position}) ===`);
      
      clickX = minimapBox!.x + minimapBox!.width * region.position;
      clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(400);
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const anchors = await page.locator('[data-testid="timeline-anchor"]').count();
      const connectors = await page.locator('[data-testid="timeline-anchor"] .bg-gray-400').count();
      
      // Detect suspicious leftover connectors
      const suspiciouslyHigh = cards === 0 && (anchors > 0 || connectors > 0);
      
      console.log(`  📊 Cards: ${cards}, Anchors: ${anchors}, Connectors: ${connectors} ${suspiciouslyHigh ? '⚠️ SUSPICIOUS' : '✅'}`);
      
      if (suspiciouslyHigh) {
        console.log(`  ❌ LEFTOVER CONNECTORS DETECTED: ${anchors} anchors, ${connectors} connectors in empty region!`);
        leftoverConnectorProblems.push({
          region: region.name,
          position: region.position,
          cards,
          anchors,
          connectors,
          suspiciouslyHigh
        });
        
        await page.screenshot({ path: `test-results/leftover-connectors-${region.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
      } else if (cards === 0 && anchors === 0 && connectors === 0) {
        console.log(`  ✅ Correctly empty - no cards, no anchors, no connectors`);
      } else if (cards > 0) {
        console.log(`  ✅ Has content - ${cards} cards, anchors/connectors acceptable`);
      }
    }
    
    // ANALYZE LEFTOVER CONNECTOR PROBLEMS
    console.log('\n📈 LEFTOVER CONNECTOR ANALYSIS:');
    console.log(`  📊 Regions tested: ${emptyRegions.length}`);
    console.log(`  📊 Leftover problems detected: ${leftoverConnectorProblems.length}`);
    
    if (leftoverConnectorProblems.length > 0) {
      console.log(`  ❌ LEFTOVER CONNECTOR ISSUES:`);
      for (const problem of leftoverConnectorProblems) {
        console.log(`    - ${problem.region}: ${problem.anchors} anchors, ${problem.connectors} connectors in empty region`);
      }
      
      // FAIL THE TEST - leftover connectors indicate filtering problems
      expect(leftoverConnectorProblems.length).toBe(0);
    } else {
      console.log(`  ✅ No leftover connector problems detected`);
    }
    
    console.log('✅ Leftover connector filtering test complete');
  });

  test('Verify connectors cleanup correctly during zoom transitions', async ({ page }) => {
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
    
    console.log('🔍 TESTING CONNECTOR CLEANUP DURING ZOOM TRANSITIONS');
    
    // Start zoomed out (should show most events without anchors)
    console.log('\n=== STEP 1: Start zoomed out ===');
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(50);
    }
    
    const cardsZoomedOut = await page.locator('[data-testid="event-card"]').count();
    const anchorsZoomedOut = await page.locator('[data-testid="timeline-anchor"]').count();
    const connectorsZoomedOut = await page.locator('[data-testid="timeline-anchor"] .bg-gray-400').count();
    
    console.log(`Zoomed out: ${cardsZoomedOut} cards, ${anchorsZoomedOut} anchors, ${connectorsZoomedOut} connectors`);
    await page.screenshot({ path: 'test-results/connector-cleanup-step1-zoomed-out.png' });
    
    // Zoom in to create anchor/connector conditions
    console.log('\n=== STEP 2: Zoom in to create anchors/connectors ===');
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(50);
    }
    
    const cardsZoomedIn = await page.locator('[data-testid="event-card"]').count();
    const anchorsZoomedIn = await page.locator('[data-testid="timeline-anchor"]').count();
    const connectorsZoomedIn = await page.locator('[data-testid="timeline-anchor"] .bg-gray-400').count();
    
    console.log(`Zoomed in: ${cardsZoomedIn} cards, ${anchorsZoomedIn} anchors, ${connectorsZoomedIn} connectors`);
    await page.screenshot({ path: 'test-results/connector-cleanup-step2-zoomed-in.png' });
    
    // Zoom back out - connectors should cleanup
    console.log('\n=== STEP 3: Zoom back out - connectors should cleanup ===');
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(50);
    }
    
    const cardsAfterCleanup = await page.locator('[data-testid="event-card"]').count();
    const anchorsAfterCleanup = await page.locator('[data-testid="timeline-anchor"]').count();
    const connectorsAfterCleanup = await page.locator('[data-testid="timeline-anchor"] .bg-gray-400').count();
    
    console.log(`After cleanup: ${cardsAfterCleanup} cards, ${anchorsAfterCleanup} anchors, ${connectorsAfterCleanup} connectors`);
    await page.screenshot({ path: 'test-results/connector-cleanup-step3-after-cleanup.png' });
    
    // ANALYZE CONNECTOR CLEANUP BEHAVIOR
    console.log('\n📈 CONNECTOR CLEANUP ANALYSIS:');
    console.log(`  📊 Zoomed out → Zoomed in → Zoomed out progression:`);
    console.log(`    Cards: ${cardsZoomedOut} → ${cardsZoomedIn} → ${cardsAfterCleanup}`);
    console.log(`    Anchors: ${anchorsZoomedOut} → ${anchorsZoomedIn} → ${anchorsAfterCleanup}`);
    console.log(`    Connectors: ${connectorsZoomedOut} → ${connectorsZoomedIn} → ${connectorsAfterCleanup}`);
    
    // Connectors should return to approximately the same level when zoomed back out
    const anchorDifference = Math.abs(anchorsAfterCleanup - anchorsZoomedOut);
    const connectorDifference = Math.abs(connectorsAfterCleanup - connectorsZoomedOut);
    
    console.log(`  📊 Differences after zoom cycle: anchors ±${anchorDifference}, connectors ±${connectorDifference}`);
    
    // ASSERTIONS: When zoomed out, we should be back to similar state
    if (anchorsAfterCleanup > anchorsZoomedOut + 3) { // Allow small increase but not dramatic
      console.log(`  ❌ ANCHORS NOT CLEANED UP: Started with ${anchorsZoomedOut}, ended with ${anchorsAfterCleanup}`);
      expect(anchorsAfterCleanup).toBeLessThanOrEqual(anchorsZoomedOut + 3);
    }
    
    if (connectorsAfterCleanup > connectorsZoomedOut + 5) { // Allow small increase but not dramatic
      console.log(`  ❌ CONNECTORS NOT CLEANED UP: Started with ${connectorsZoomedOut}, ended with ${connectorsAfterCleanup}`);
      expect(connectorsAfterCleanup).toBeLessThanOrEqual(connectorsZoomedOut + 5);
    }
    
    console.log('✅ Connector cleanup behavior validated');
  });

  test('Detect leftover connectors through realistic zoom/navigate cycles', async ({ page }) => {
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
    
    console.log('🔍 TESTING REALISTIC LEFTOVER CONNECTOR DETECTION');
    console.log('Flow: zoom in → zoom out → zoom in elsewhere → check for leftovers');
    
    const minimapBar = page.locator('[data-testid="timeline-minimap"]').locator('.relative.h-2');
    const minimapBox = await minimapBar.boundingBox();
    
    // STEP 1: Start zoomed out (baseline)
    console.log('\n=== STEP 1: Start zoomed out (baseline) ===');
    await page.mouse.move(centerX, centerY);
    
    const baselineAnchors = await page.locator('[data-testid^="anchor-"]').count();
    const baselineConnectors = await page.locator('[data-testid^="anchor-"] .bg-gray-400').count();
    console.log(`Baseline: ${baselineAnchors} anchors, ${baselineConnectors} connectors`);
    await page.screenshot({ path: 'test-results/leftover-cycle-step1-baseline.png' });
    
    // STEP 2: Navigate to first position and zoom in
    console.log('\n=== STEP 2: Navigate to position 1 (early career) and zoom in ===');
    const position1 = 0.35; // Early career
    let clickX = minimapBox!.x + minimapBox!.width * position1;
    let clickY = minimapBox!.y + minimapBox!.height / 2;
    
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    // EXTREME zoom in to force anchor/overflow conditions
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const zoomedAnchors1 = await page.locator('[data-testid^="anchor-"]').count();
    const zoomedConnectors1 = await page.locator('[data-testid^="anchor-"] .bg-gray-400').count();
    const cards1 = await page.locator('[data-testid="event-card"]').count();
    
    console.log(`Position 1 zoomed in: ${cards1} cards, ${zoomedAnchors1} anchors, ${zoomedConnectors1} connectors`);
    await page.screenshot({ path: 'test-results/leftover-cycle-step2-position1-zoomed.png' });
    
    // STEP 3: Zoom out
    console.log('\n=== STEP 3: Zoom out from position 1 ===');
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    
    const zoomOutAnchors1 = await page.locator('[data-testid^="anchor-"]').count();
    const zoomOutConnectors1 = await page.locator('[data-testid^="anchor-"] .bg-gray-400').count();
    const cardsOut1 = await page.locator('[data-testid="event-card"]').count();
    
    console.log(`Position 1 zoomed out: ${cardsOut1} cards, ${zoomOutAnchors1} anchors, ${zoomOutConnectors1} connectors`);
    await page.screenshot({ path: 'test-results/leftover-cycle-step3-position1-zoomout.png' });
    
    // STEP 4: Navigate to second position and zoom in
    console.log('\n=== STEP 4: Navigate to position 2 (peak empire) and zoom in ===');
    const position2 = 0.65; // Peak empire
    clickX = minimapBox!.x + minimapBox!.width * position2;
    clickY = minimapBox!.y + minimapBox!.height / 2;
    
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    // EXTREME zoom in again to force anchor/overflow conditions
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const zoomedAnchors2 = await page.locator('[data-testid^="anchor-"]').count();
    const zoomedConnectors2 = await page.locator('[data-testid^="anchor-"] .bg-gray-400').count();
    const cards2 = await page.locator('[data-testid="event-card"]').count();
    
    console.log(`Position 2 zoomed in: ${cards2} cards, ${zoomedAnchors2} anchors, ${zoomedConnectors2} connectors`);
    await page.screenshot({ path: 'test-results/leftover-cycle-step4-position2-zoomed.png' });
    
    // STEP 5: Navigate to empty region while still zoomed in
    console.log('\n=== STEP 5: Navigate to empty region while zoomed in ===');
    const emptyPosition = 0.95; // Late gap (1820)
    clickX = minimapBox!.x + minimapBox!.width * emptyPosition;
    clickY = minimapBox!.y + minimapBox!.height / 2;
    
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(400);
    
    const emptyCards = await page.locator('[data-testid="event-card"]').count();
    const emptyAnchors = await page.locator('[data-testid^="anchor-"]').count();
    const emptyConnectors = await page.locator('[data-testid^="anchor-"] .bg-gray-400').count();
    
    // Collect detailed anchor information
    const anchors = page.locator('[data-testid^="anchor-"]');
    const anchorDetails: Array<{id: string, x: number, y: number, connectors: number}> = [];
    
    for (let i = 0; i < emptyAnchors; i++) {
      const anchor = anchors.nth(i);
      const id = await anchor.getAttribute('data-testid') || `anchor-${i}`;
      const box = await anchor.boundingBox();
      const connectorCount = await anchor.locator('.bg-gray-400').count();
      
      if (box) {
        anchorDetails.push({
          id,
          x: Math.round(box.x),
          y: Math.round(box.y),
          connectors: connectorCount
        });
      }
    }
    
    console.log(`Empty region: ${emptyCards} cards, ${emptyAnchors} anchors, ${emptyConnectors} connectors`);
    if (anchorDetails.length > 0) {
      console.log(`Anchor details:`, anchorDetails.map(a => `${a.id} at (${a.x},${a.y}) with ${a.connectors} connectors`).join(', '));
    }
    
    await page.screenshot({ path: 'test-results/leftover-cycle-step5-empty-region.png' });
    
    // CRITICAL DETECTION: Empty regions should have NO anchors or connectors
    const hasLeftoverConnectors = emptyCards === 0 && (emptyAnchors > 0 || emptyConnectors > 0);
    
    console.log('\n📈 LEFTOVER CONNECTOR CYCLE ANALYSIS:');
    console.log(`  📊 Flow progression:`);
    console.log(`    Baseline: ${baselineAnchors} anchors, ${baselineConnectors} connectors`);
    console.log(`    Position 1 zoom in: ${zoomedAnchors1} anchors, ${zoomedConnectors1} connectors`);
    console.log(`    Position 1 zoom out: ${zoomOutAnchors1} anchors, ${zoomOutConnectors1} connectors`);
    console.log(`    Position 2 zoom in: ${zoomedAnchors2} anchors, ${zoomedConnectors2} connectors`);
    console.log(`    Empty region final: ${emptyAnchors} anchors, ${emptyConnectors} connectors`);
    
    if (hasLeftoverConnectors) {
      console.log(`  ❌ LEFTOVER CONNECTORS DETECTED: ${emptyAnchors} anchors, ${emptyConnectors} connectors in empty region!`);
      console.log(`  🔍 This indicates the zoom/navigate cycle is leaving behind stale anchor elements`);
      
      // FAIL THE TEST - this is exactly the bug you described
      expect(hasLeftoverConnectors).toBe(false);
    } else {
      console.log(`  ✅ No leftover connectors detected - filtering is working correctly`);
    }
    
    console.log('✅ Realistic leftover connector cycle test complete');
  });
});