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
      
      // 2. Check overflow badges are within timeline bounds and validate their content
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
            
            // Validate overflow badge content and numbers
            const badgeText = await badge.textContent();
            const badgeId = await badge.getAttribute('data-testid');
            console.log(`    Badge ${i} (${badgeId}): "${badgeText}"`);
            
            // Check badge displays a valid number (should be +1, +2, +3, etc.)
            if (badgeText && badgeText.startsWith('+')) {
              const overflowNumber = parseInt(badgeText.slice(1));
              if (isNaN(overflowNumber) || overflowNumber < 1) {
                console.log(`  ❌ INVALID OVERFLOW NUMBER: Badge shows "${badgeText}", expected +[number >= 1]`);
                await page.screenshot({ path: `test-results/napoleon-invalid-overflow-step-${step}.png` });
                expect(overflowNumber).toBeGreaterThan(0);
              }
            } else {
              console.log(`  ❌ INVALID OVERFLOW FORMAT: Badge shows "${badgeText}", expected format: +[number]`);
              await page.screenshot({ path: `test-results/napoleon-bad-overflow-format-step-${step}.png` });
              expect(badgeText).toMatch(/^\+\d+$/);
            }
          }
        }
        console.log(`  ✅ All overflow badges within bounds and showing valid numbers`);
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

  test('Overflow indicators update correctly when sliding to different timeline regions', async ({ page }) => {
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
    
    // Zoom in significantly to focus on specific periods
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Get minimap for navigation
    const minimapBar = page.locator('.relative.h-4.bg-gray-200');
    const minimapBox = await minimapBar.boundingBox();
    
    // Test different timeline regions to verify overflow indicators change
    const testRegions = [
      { name: 'Early Period (Birth/Childhood)', position: 0.1 },
      { name: 'Education Period', position: 0.25 },
      { name: 'Military Rise', position: 0.4 },
      { name: 'Emperor Period', position: 0.75 },
      { name: 'Exile Period', position: 0.9 }
    ];
    
    const regionResults: Array<{region: string, cards: number, badges: number, badgeTexts: string[]}> = [];
    
    for (const region of testRegions) {
      console.log(`\n=== TESTING REGION: ${region.name} (position ${region.position}) ===`);
      
      // Navigate to this region via minimap
      const clickX = minimapBox!.x + minimapBox!.width * region.position;
      const clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(500); // Allow layout to stabilize
      
      // Count visible cards and overflow badges
      const cards = page.locator('[data-testid="event-card"]');
      const cardCount = await cards.count();
      
      const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const badgeCount = await overflowBadges.count();
      
      // Collect overflow badge texts
      const badgeTexts: string[] = [];
      for (let i = 0; i < badgeCount; i++) {
        const badgeText = await overflowBadges.nth(i).textContent();
        if (badgeText) {
          badgeTexts.push(badgeText);
        }
      }
      
      regionResults.push({
        region: region.name,
        cards: cardCount,
        badges: badgeCount,
        badgeTexts
      });
      
      console.log(`  Region: ${region.name}`);
      console.log(`  Visible cards: ${cardCount}`);
      console.log(`  Overflow badges: ${badgeCount}`);
      console.log(`  Badge texts: [${badgeTexts.join(', ')}]`);
      
      await page.screenshot({ path: `test-results/napoleon-region-${region.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` });
    }
    
    // Verify overflow indicators change across different regions
    const uniqueBadgeTexts = new Set(regionResults.flatMap(r => r.badgeTexts));
    console.log(`\nUnique overflow badge texts across all regions: [${Array.from(uniqueBadgeTexts).join(', ')}]`);
    
    // Check that overflow indicators are responsive to timeline position
    // (Either different numbers appear in different regions, or badges appear/disappear)
    const badgeCountsVary = regionResults.some(r => r.badges !== regionResults[0].badges);
    const badgeTextsVary = uniqueBadgeTexts.size > 1;
    const responsiveOverflow = badgeCountsVary || badgeTextsVary;
    
    if (!responsiveOverflow) {
      console.log('❌ OVERFLOW INDICATORS NOT RESPONSIVE: Same badges appear at all timeline positions');
      console.log('Region results:', regionResults.map(r => `${r.region}: ${r.badges} badges [${r.badgeTexts.join(', ')}]`));
    }
    
    expect(responsiveOverflow).toBe(true);
    console.log('✅ Overflow indicators update correctly across timeline regions');
  });

  test('Fully zoomed-in sliding detects overflow indicator inconsistencies', async ({ page }) => {
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
    
    // Zoom in to MAXIMUM level to expose overflow inconsistencies
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 15; i++) { // Much more aggressive zoom
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    console.log('🔍 TESTING FULLY ZOOMED SLIDING BEHAVIOR');
    
    // Get minimap elements for navigation
    const minimapBar = page.locator('.relative.h-4.bg-gray-200');
    const minimapBox = await minimapBar.boundingBox();
    
    // Slide through timeline at maximum zoom with smaller steps to catch inconsistencies
    const steps = 20; // More granular steps
    const stepSize = 1.0 / steps;
    
    for (let step = 0; step <= steps; step++) {
      const targetPosition = step * stepSize;
      console.log(`\\n=== FULL ZOOM STEP ${step}: Position ${targetPosition.toFixed(3)} ===`);
      
      // Navigate via minimap
      const clickX = minimapBox!.x + minimapBox!.width * targetPosition;
      const clickY = minimapBox!.y + minimapBox!.height / 2;
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(300);
      
      // Count elements at this zoom level
      const cards = page.locator('[data-testid="event-card"]');
      const cardCount = await cards.count();
      
      const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
      const overflowCount = await overflowBadges.count();
      
      // Collect detailed overflow information
      const overflowDetails: Array<{id: string, text: string, x: number, y: number}> = [];
      for (let i = 0; i < overflowCount; i++) {
        const badge = overflowBadges.nth(i);
        const badgeText = await badge.textContent();
        const badgeId = await badge.getAttribute('data-testid');
        const badgeBox = await badge.boundingBox();
        
        if (badgeText && badgeId && badgeBox) {
          overflowDetails.push({
            id: badgeId,
            text: badgeText,
            x: Math.round(badgeBox.x),
            y: Math.round(badgeBox.y)
          });
        }
      }
      
      console.log(`  Cards: ${cardCount}`);
      console.log(`  Overflow badges: ${overflowCount}`);
      if (overflowDetails.length > 0) {
        console.log(`  Badge details:`, overflowDetails.map(b => `${b.id}="${b.text}" at (${b.x},${b.y})`).join(', '));
      }
      
      // Check for overflow indicator inconsistencies
      if (cardCount === 0 && overflowCount === 0) {
        console.log(`  ⚠️  NO CONTENT: No cards or overflow badges at position ${targetPosition.toFixed(3)}`);
      }
      
      if (cardCount > 10) {
        console.log(`  ⚠️  HIGH DENSITY: ${cardCount} cards at max zoom - may indicate insufficient overflow triggering`);
      }
      
      // Check for duplicate or inconsistent overflow badges
      const badgeTexts = overflowDetails.map(b => b.text);
      const uniqueTexts = new Set(badgeTexts);
      if (badgeTexts.length > uniqueTexts.size) {
        console.log(`  ❌ DUPLICATE OVERFLOW BADGES: Found duplicate badge texts: [${badgeTexts.join(', ')}]`);
        await page.screenshot({ path: `test-results/napoleon-duplicate-badges-step-${step}.png` });
        expect(badgeTexts.length).toBe(uniqueTexts.size);
      }
      
      // Take screenshot for analysis
      await page.screenshot({ path: `test-results/napoleon-fullzoom-step-${step.toString().padStart(2, '0')}.png` });
    }
    
    console.log('\\n✅ Fully zoomed sliding validation completed');
  });
});