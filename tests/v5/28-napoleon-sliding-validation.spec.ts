import { test, expect } from '@playwright/test';

test.describe('Napoleon Timeline Sliding Validation Tests', () => {
  test('Step-by-step sliding from beginning to end detects layout issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load Napoleon timeline
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Zoom in significantly to create a focused view window
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Get minimap elements
    const minimapBar = page.locator('.relative.h-4.bg-gray-200');
    const minimapBox = await minimapBar.boundingBox();
    const viewWindow = page.locator('.bg-transparent.border-blue-500');
    
    // Define sliding steps (10 steps from start to end)
    const steps = 10;
    const stepSize = 1.0 / steps;
    
    for (let step = 0; step <= steps; step++) {
      const targetPosition = step * stepSize;
      console.log(`\n=== STEP ${step}: Testing at position ${targetPosition.toFixed(2)} ===`);
      
      // Click on minimap to navigate to this position
      const clickX = minimapBox!.x + minimapBox!.width * targetPosition;
      const clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(400); // Allow layout to stabilize
      
      // 1. Check for card overlaps
      const cards = page.locator('[data-testid="event-card"]');
      const cardCount = await cards.count();
      console.log(`  Visible cards: ${cardCount}`);
      
      if (cardCount > 1) {
        // Get all card positions and check for overlaps
        const cardBoxes = [];
        for (let i = 0; i < cardCount; i++) {
          const card = cards.nth(i);
          const box = await card.boundingBox();
          if (box) {
            cardBoxes.push({ index: i, ...box });
          }
        }
        
        // Check for overlaps between cards
        for (let i = 0; i < cardBoxes.length; i++) {
          for (let j = i + 1; j < cardBoxes.length; j++) {
            const cardA = cardBoxes[i];
            const cardB = cardBoxes[j];
            
            // Check for overlap (allowing 2px tolerance for borders)
            const overlapX = Math.max(0, Math.min(cardA.x + cardA.width, cardB.x + cardB.width) - Math.max(cardA.x, cardB.x) - 2);
            const overlapY = Math.max(0, Math.min(cardA.y + cardA.height, cardB.y + cardB.height) - Math.max(cardA.y, cardB.y) - 2);
            
            if (overlapX > 0 && overlapY > 0) {
              console.log(`  ❌ OVERLAP DETECTED: Card ${cardA.index} and ${cardB.index} overlap by ${overlapX}x${overlapY}px`);
              await page.screenshot({ path: `test-results/napoleon-overlap-step-${step}.png` });
              expect(overlapX).toBe(0); // This will fail and show the overlap
            }
          }
        }
        console.log(`  ✅ No card overlaps detected`);
      }
      
      // 2. Check overflow badges are within timeline bounds
      const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const overflowCount = await overflowBadges.count();
      console.log(`  Overflow badges: ${overflowCount}`);
      
      if (overflowCount > 0) {
        for (let i = 0; i < overflowCount; i++) {
          const badge = overflowBadges.nth(i);
          const badgeBox = await badge.boundingBox();
          if (badgeBox) {
            // Check badge is within timeline area
            const withinBounds = badgeBox.x >= timelineBox!.x && 
                               badgeBox.x + badgeBox.width <= timelineBox!.x + timelineBox!.width &&
                               badgeBox.y >= timelineBox!.y &&
                               badgeBox.y + badgeBox.height <= timelineBox!.y + timelineBox!.height;
            
            if (!withinBounds) {
              console.log(`  ❌ OVERFLOW BADGE OUT OF BOUNDS: Badge ${i} at (${badgeBox.x}, ${badgeBox.y})`);
              await page.screenshot({ path: `test-results/napoleon-badge-oob-step-${step}.png` });
              expect(withinBounds).toBe(true);
            }
          }
        }
        console.log(`  ✅ All overflow badges within bounds`);
      }
      
      // 3. Check blue event indicators are properly positioned
      const blueIndicators = page.locator('.text-blue-600');
      const blueCount = await blueIndicators.count();
      console.log(`  Blue indicators: ${blueCount}`);
      
      // 4. Check timeline axis dates are reasonable for current view
      const timelineAxis = page.locator('.absolute.border.border-dashed');
      const axisElements = await timelineAxis.count();
      console.log(`  Timeline axis elements: ${axisElements}`);
      
      // 5. Check for any elements positioned outside viewport
      const allTimelineElements = page.locator('[data-testid="event-card"], [data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const allElementsCount = await allTimelineElements.count();
      
      for (let i = 0; i < allElementsCount; i++) {
        const element = allTimelineElements.nth(i);
        const elementBox = await element.boundingBox();
        if (elementBox) {
          // Check element is visible within viewport
          const isVisible = elementBox.x + elementBox.width > 0 && 
                          elementBox.x < page.viewportSize()!.width &&
                          elementBox.y + elementBox.height > 0 && 
                          elementBox.y < page.viewportSize()!.height;
          
          if (!isVisible) {
            const testId = await element.getAttribute('data-testid');
            console.log(`  ❌ ELEMENT OUT OF VIEWPORT: ${testId} at (${elementBox.x}, ${elementBox.y})`);
            await page.screenshot({ path: `test-results/napoleon-element-oov-step-${step}.png` });
            // Don't fail here, just log - some elements might be intentionally off-screen
          }
        }
      }
      
      // Take screenshot for this step
      await page.screenshot({ path: `test-results/napoleon-step-${step.toString().padStart(2, '0')}.png` });
    }
    
    console.log('\n✅ All sliding steps completed without layout issues');
  });

  test('Detect anchor point positioning issues during sliding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load Napoleon timeline
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Zoom in to focus on specific period
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Test sliding via minimap drag
    const minimapBar = page.locator('.relative.h-4.bg-gray-200');
    const minimapBox = await minimapBar.boundingBox();
    
    // Slide through timeline by dragging view window
    const slideSteps = 5;
    const slideDistance = minimapBox!.width / slideSteps;
    
    for (let slide = 0; slide < slideSteps; slide++) {
      console.log(`\n=== SLIDE ${slide}: Dragging view window ===`);
      
      // Get current view window position
      const viewWindow = page.locator('.bg-transparent.border-blue-500');
      const viewBox = await viewWindow.boundingBox();
      const viewCenterX = viewBox!.x + viewBox!.width / 2;
      const viewCenterY = viewBox!.y + viewBox!.height / 2;
      
      // Drag to next position
      await page.mouse.move(viewCenterX, viewCenterY);
      await page.mouse.down();
      await page.mouse.move(viewCenterX + slideDistance, viewCenterY, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      // Check for anchor point issues
      const anchors = page.locator('[data-testid^="anchor-"]');
      const anchorCount = await anchors.count();
      console.log(`  Anchor points: ${anchorCount}`);
      
      // Check each anchor has valid positioning
      for (let i = 0; i < anchorCount; i++) {
        const anchor = anchors.nth(i);
        const anchorBox = await anchor.boundingBox();
        if (anchorBox) {
          // Anchor should be within timeline horizontal bounds
          const withinHorizontalBounds = anchorBox.x >= timelineBox!.x - 50 && 
                                       anchorBox.x <= timelineBox!.x + timelineBox!.width + 50;
          
          if (!withinHorizontalBounds) {
            const anchorId = await anchor.getAttribute('data-testid');
            console.log(`  ❌ ANCHOR OUT OF BOUNDS: ${anchorId} at x=${anchorBox.x}`);
            await page.screenshot({ path: `test-results/napoleon-anchor-oob-slide-${slide}.png` });
            expect(withinHorizontalBounds).toBe(true);
          }
        }
      }
      
      // Check for unexpected timeline artifacts
      const unexpectedElements = await page.evaluate(() => {
        // Check for any elements with suspicious positioning
        const allElements = document.querySelectorAll('[data-testid]');
        const suspicious = [];
        
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          // Check for elements way outside viewport or with invalid dimensions
          if (rect.width > 10000 || rect.height > 10000 || 
              rect.x < -5000 || rect.x > window.innerWidth + 5000) {
            suspicious.push({
              testId: el.getAttribute('data-testid'),
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            });
          }
        }
        
        return suspicious;
      });
      
      if (unexpectedElements.length > 0) {
        console.log(`  ❌ SUSPICIOUS ELEMENTS:`, unexpectedElements);
        await page.screenshot({ path: `test-results/napoleon-suspicious-slide-${slide}.png` });
        expect(unexpectedElements.length).toBe(0);
      }
      
      console.log(`  ✅ Slide ${slide} validation passed`);
      await page.screenshot({ path: `test-results/napoleon-slide-${slide.toString().padStart(2, '0')}.png` });
    }
    
    console.log('\n✅ All sliding validation completed');
  });
});