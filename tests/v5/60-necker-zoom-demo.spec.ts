import { test, expect, Page, Locator } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Necker Event Timeline-Anchor Alignment with Zoom Demo', () => {
  test('Demonstrate Necker event alignment at multiple zoom levels', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-french-revolution');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Find the Necker event card and anchor
    const neckerCard = page.locator('[data-event-id="fr-necker-compte"]');
    await expect(neckerCard).toBeVisible({ timeout: 5000 });
    await neckerCard.scrollIntoViewIfNeeded();
    await neckerCard.hover();
    await page.waitForTimeout(1000);

    const neckerAnchor = page.locator('[data-testid="anchor-event-fr-necker-compte"]');
    await expect(neckerAnchor).toBeVisible({ timeout: 5000 });

    // Store results for comparison
    const zoomResults: Array<{level: string, success: boolean, date: string, accuracy: number}> = [];

    // Test at multiple zoom levels
    const zoomLevels = [
      { name: 'Default Zoom', scrolls: 0 },
      { name: 'Zoom Level 1', scrolls: 2 },
      { name: 'Zoom Level 2', scrolls: 4 },
      { name: 'Zoom Level 3', scrolls: 6 },
      { name: 'Max Zoom', scrolls: 10 }
    ];

    for (let i = 0; i < zoomLevels.length; i++) {
      const zoomLevel = zoomLevels[i];
      console.log(`\n🔍 Phase ${i + 1}: Testing alignment at ${zoomLevel.name}...`);

      // Perform zoom if needed
      if (zoomLevel.scrolls > 0) {
        // Get current anchor position for cursor-targeted zoom
        const currentAnchorBox = await neckerAnchor.boundingBox();
        if (!currentAnchorBox) {
          console.log(`⚠️ Anchor not found for ${zoomLevel.name}, skipping zoom`);
          continue;
        }

        const anchorCenterX = currentAnchorBox.x + currentAnchorBox.width / 2;
        const anchorCenterY = currentAnchorBox.y + currentAnchorBox.height / 2;

        console.log(`🎯 Positioning cursor at anchor (${anchorCenterX}, ${anchorCenterY}) for targeted zoom`);

        // Position cursor at anchor before zooming
        await page.mouse.move(anchorCenterX, anchorCenterY);
        await page.waitForTimeout(300);

        // Calculate how many more scrolls we need from previous level
        const previousScrolls = i > 0 ? zoomLevels[i - 1].scrolls : 0;
        const additionalScrolls = zoomLevel.scrolls - previousScrolls;

        for (let j = 0; j < additionalScrolls; j++) {
          // Keep cursor at anchor position during zoom
          await page.mouse.move(anchorCenterX, anchorCenterY);
          await page.mouse.wheel(0, -100); // Zoom in
          await page.waitForTimeout(800);
          console.log(`🔍 Zoom scroll ${j + 1}/${additionalScrolls} at anchor position`);
        }

        console.log(`🔧 Applied ${additionalScrolls} additional zoom scrolls (total: ${zoomLevel.scrolls})`);
        await page.waitForTimeout(1000);
      }

      // Test alignment at current zoom level
      const result = await testAnchorAlignment(page, neckerCard, neckerAnchor, zoomLevel.name);
      zoomResults.push(result);

      // Take screenshot for this zoom level
      await page.screenshot({ path: `test-results/necker-zoom-${zoomLevel.name.toLowerCase().replace(' ', '-')}.png` });
    }

    // Final comparison and reporting
    console.log('\n📊 ZOOM ALIGNMENT SUMMARY:');
    console.log('=' .repeat(60));

    let allGood = true;
    let degradationDetected = false;

    for (let i = 0; i < zoomResults.length; i++) {
      const result = zoomResults[i];
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.level}: ${result.date} (${result.accuracy.toFixed(1)} days accuracy)`);

      if (!result.success) allGood = false;
      if (i > 0 && zoomResults[0].success && !result.success) {
        degradationDetected = true;
      }
    }

    console.log('=' .repeat(60));

    if (allGood) {
      console.log('🎉 EXCELLENT: Alignment maintained across all zoom levels!');
    } else if (degradationDetected) {
      console.log('🚨 ZOOM-INDUCED ALIGNMENT DEGRADATION DETECTED');
      console.log('   Default zoom works well but alignment degrades with zoom');
    } else {
      console.log('⚠️  Alignment issues detected at multiple zoom levels');
    }

    console.log('✅ Multi-zoom demo test completed');
  });

  // Helper function to test anchor alignment using pixel-by-pixel movement
  async function testAnchorAlignment(page: Page, neckerCard: Locator, neckerAnchor: Locator, phase: string) {
    // Get current anchor position
    const anchorBox = await neckerAnchor.boundingBox();
    if (!anchorBox) {
      return { level: phase, success: false, date: 'Anchor not found', accuracy: 999 };
    }

    console.log(`📍 ${phase} - Necker anchor at: x=${anchorBox.x}, y=${anchorBox.y}`);

    // Get timeline axis bounds
    const timelineAxis = page.locator('[data-testid="timeline-axis"]');
    const timelineBox = await timelineAxis.boundingBox();
    if (!timelineBox) {
      return { level: phase, success: false, date: 'Timeline not found', accuracy: 999 };
    }

    // Start pixel-by-pixel movement from anchor
    const anchorCenterX = anchorBox.x + anchorBox.width / 2;
    const anchorCenterY = anchorBox.y + anchorBox.height / 2;

    let tooltipFound = false;
    let tooltipText = '';

    // Function to check for tooltip
    async function checkForHoverTooltip() {
      const tooltipSelectors = [
        'div.absolute.bg-gray-800.text-white.text-xs',
        'div.bg-gray-800.text-white',
        'div[class*="tooltip"]'
      ];

      for (const selector of tooltipSelectors) {
        const tooltip = page.locator(selector);
        if (await tooltip.isVisible()) {
          const text = await tooltip.textContent() || '';
          if (text.trim() && text.length < 100 && text.match(/\d{4}/)) {
            tooltipText = text.trim();
            return true;
          }
        }
      }
      return false;
    }

    // Move upward from anchor (most likely direction)
    for (let i = 0; i <= 60; i += 2) {
      const currentY = anchorCenterY - i;
      await page.mouse.move(anchorCenterX, currentY);
      await page.waitForTimeout(100);

      if (await checkForHoverTooltip()) {
        tooltipFound = true;
        console.log(`💡 ${phase} - Tooltip found moving upward at offset -${i}px: "${tooltipText}"`);
        break;
      }

      if (currentY < timelineBox.y - 50) break;
    }

    // If not found going up, try going down
    if (!tooltipFound) {
      for (let i = 2; i <= 60; i += 2) {
        const currentY = anchorCenterY + i;
        await page.mouse.move(anchorCenterX, currentY);
        await page.waitForTimeout(100);

        if (await checkForHoverTooltip()) {
          tooltipFound = true;
          console.log(`💡 ${phase} - Tooltip found moving downward at offset +${i}px: "${tooltipText}"`);
          break;
        }

        if (currentY > timelineBox.y + timelineBox.height + 50) break;
      }
    }

    if (tooltipFound) {
      console.log(`📅 ${phase} - Timeline shows: ${tooltipText}`);

      // Calculate accuracy
      const expectedDate = new Date('1781-02-01');
      const dateMatch = tooltipText.match(/(\w+ \d+,? \d{4})/);

      if (dateMatch) {
        const tooltipDate = new Date(dateMatch[1]);
        const daysDifference = Math.abs((tooltipDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

        const success = daysDifference <= 30;
        const status = success ? '✅ Good alignment' : (daysDifference <= 150 ? '⚠️  Marginal' : '❌ Poor alignment');

        console.log(`📊 ${phase} - ${status}: ${daysDifference.toFixed(1)} days difference`);

        return { level: phase, success, date: tooltipText, accuracy: daysDifference };
      } else {
        console.log(`⚠️  ${phase} - Could not parse date from: "${tooltipText}"`);
        return { level: phase, success: false, date: tooltipText, accuracy: 999 };
      }
    } else {
      console.log(`❌ ${phase} - No tooltip found`);
      return { level: phase, success: false, date: 'No tooltip found', accuracy: 999 };
    }
  }
});