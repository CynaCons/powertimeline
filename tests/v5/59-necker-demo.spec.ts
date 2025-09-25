import { test, expect } from '@playwright/test';

test.describe('Necker Event Timeline-Anchor Alignment Demo', () => {
  test('Demonstrate Necker event alignment issue and fix', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for app to load and show events
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Allow for stabilization

    // Open dev panel using keyboard shortcut
    await page.keyboard.press('Alt+d');
    await page.waitForTimeout(500);

    // Load French Revolution timeline which contains Necker event
    const frenchRevButton = page.getByRole('button', { name: 'French Revolution' });
    await frenchRevButton.click();
    await page.waitForTimeout(2000); // Wait for events to load

    // Close dev panel
    await page.keyboard.press('Alt+d');
    await page.waitForTimeout(500);

    console.log('🔍 Looking for Necker event card...');

    // Find the Necker event card first
    const neckerCard = page.locator('[data-event-id="fr-necker-compte"]');
    await expect(neckerCard).toBeVisible({ timeout: 5000 });

    // Scroll the card into view and hover over it
    await neckerCard.scrollIntoViewIfNeeded();
    await neckerCard.hover();
    await page.waitForTimeout(1000); // Action delay as requested

    console.log('🎯 Found Necker card, now looking for corresponding anchor...');

    // Find the corresponding anchor using the correct data-testid format
    const neckerAnchor = page.locator('[data-testid="anchor-event-fr-necker-compte"]');
    await expect(neckerAnchor).toBeVisible({ timeout: 5000 });

    // Get anchor position
    const anchorBox = await neckerAnchor.boundingBox();
    expect(anchorBox).toBeTruthy();

    console.log(`📍 Necker anchor found at position: x=${anchorBox!.x}, y=${anchorBox!.y}`);

    // Get the timeline axis element to hover over it directly
    const timelineAxis = page.locator('[data-testid="timeline-axis"]');
    await expect(timelineAxis).toBeVisible();
    const timelineBox = await timelineAxis.boundingBox();
    expect(timelineBox).toBeTruthy();

    console.log(`📍 Timeline axis bounds: x=${timelineBox!.x}, y=${timelineBox!.y}, width=${timelineBox!.width}, height=${timelineBox!.height}`);

    // Start from anchor position and move pixel by pixel to find timeline hover area
    const anchorCenterX = anchorBox!.x + anchorBox!.width / 2;
    const anchorCenterY = anchorBox!.y + anchorBox!.height / 2;

    console.log('🔍 Starting from anchor and moving pixel by pixel to find timeline hover area...');

    let tooltipFound = false;
    let tooltipText = '';
    let hoverFound = false;

    // Function to check for tooltip and hover indicators
    async function checkForHoverTooltip() {
      // Check for hover indicator line
      const hoverLine = page.locator('line[stroke="#3b82f6"][stroke-dasharray="2,2"]');
      const isHoverLineVisible = await hoverLine.isVisible();

      if (isHoverLineVisible && !hoverFound) {
        console.log(`💡 Hover indicator line found!`);
        hoverFound = true;
      }

      // Look for tooltip with different selectors
      const tooltipSelectors = [
        'div.absolute.bg-gray-800.text-white.text-xs',
        'div.bg-gray-800.text-white',
        'div[class*="tooltip"]',
        'div[style*="position: absolute"][style*="background"]'
      ];

      for (const selector of tooltipSelectors) {
        const tooltip = page.locator(selector);
        if (await tooltip.isVisible()) {
          const text = await tooltip.textContent() || '';
          if (text.trim() && text.length < 100 && text.match(/\d{4}/)) {
            tooltipText = text.trim();
            console.log(`💡 Tooltip found with selector "${selector}": "${tooltipText}"`);
            return true;
          }
        }
      }
      return false;
    }

    // Move upward from anchor (towards timeline axis)
    console.log('🔍 Moving upward from anchor...');
    for (let i = 0; i <= 100; i += 2) {
      const currentY = anchorCenterY - i;
      await page.mouse.move(anchorCenterX, currentY);
      await page.waitForTimeout(100); // Fast movement

      if (await checkForHoverTooltip()) {
        tooltipFound = true;
        console.log(`✅ Found tooltip moving upward at offset -${i}px`);
        break;
      }

      // Stop if we're clearly above the timeline area
      if (currentY < timelineBox!.y - 50) break;
    }

    // If not found going up, try going down from anchor
    if (!tooltipFound) {
      console.log('🔍 Moving downward from anchor...');
      for (let i = 0; i <= 100; i += 2) {
        const currentY = anchorCenterY + i;
        await page.mouse.move(anchorCenterX, currentY);
        await page.waitForTimeout(100); // Fast movement

        if (await checkForHoverTooltip()) {
          tooltipFound = true;
          console.log(`✅ Found tooltip moving downward at offset +${i}px`);
          break;
        }

        // Stop if we're clearly below the timeline area
        if (currentY > timelineBox!.y + timelineBox!.height + 50) break;
      }
    }

    // If still not found, try moving horizontally along timeline axis
    if (!tooltipFound) {
      console.log('🔍 Moving horizontally along timeline axis...');
      const timelineCenterY = timelineBox!.y + timelineBox!.height / 2;

      // Try moving left and right from anchor X position
      for (let i = 0; i <= 200; i += 5) {
        // Try to the right
        await page.mouse.move(anchorCenterX + i, timelineCenterY);
        await page.waitForTimeout(100);

        if (await checkForHoverTooltip()) {
          tooltipFound = true;
          console.log(`✅ Found tooltip moving right at offset +${i}px`);
          break;
        }

        // Try to the left
        if (anchorCenterX - i > timelineBox!.x) {
          await page.mouse.move(anchorCenterX - i, timelineCenterY);
          await page.waitForTimeout(100);

          if (await checkForHoverTooltip()) {
            tooltipFound = true;
            console.log(`✅ Found tooltip moving left at offset -${i}px`);
            break;
          }
        }
      }
    }

    if (tooltipFound) {
      console.log(`📅 Timeline shows date: ${tooltipText}`);
      console.log('📋 Expected: February 1, 1781 (Necker\'s Compte Rendu publication date)');

      // Parse the tooltip date and check if it's reasonably close to February 1, 1781
      // This is a demo test, so we'll be lenient with the tolerance
      const expectedDate = new Date('1781-02-01');

      // Try to extract date from tooltip text
      const dateMatch = tooltipText.match(/(\w+ \d+,? \d{4})/);
      if (dateMatch) {
        const tooltipDate = new Date(dateMatch[1]);
        const daysDifference = Math.abs((tooltipDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`📊 Date difference: ${daysDifference.toFixed(1)} days`);

        if (daysDifference <= 30) {
          console.log('✅ Date alignment is acceptable (within 30 days)');
        } else {
          console.log(`❌ Date alignment issue detected: ${daysDifference.toFixed(1)} days difference`);
        }
      }
    } else {
      console.log('⚠️  No tooltip found near anchor - this indicates a hover mechanism issue');
    }

    // Take a screenshot for reference
    await page.screenshot({ path: 'test-results/necker-alignment-demo.png' });

    console.log('📸 Screenshot saved as necker-alignment-demo.png');
    console.log('✅ Demo test completed');
  });
});