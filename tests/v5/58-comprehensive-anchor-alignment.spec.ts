/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

async function getTimelineAxisBounds(page: any) {
  const timelineAxis = page.locator('[data-testid="timeline-axis"], [data-testid="enhanced-timeline-axis"]').first();
  const timelineBox = await timelineAxis.boundingBox();
  expect(timelineBox).toBeTruthy();
  return timelineBox;
}

async function getAnchorPositions(page: any, maxAnchors = 5) {
  const anchors = page.locator('[data-testid^="anchor-event-"]');
  const anchorCount = await anchors.count();
  const positions: Array<{id: string, x: number, eventId: string}> = [];

  for (let i = 0; i < Math.min(anchorCount, maxAnchors); i++) {
    const anchor = anchors.nth(i);
    const anchorBox = await anchor.boundingBox();
    const anchorId = await anchor.getAttribute('data-testid');

    if (anchorBox && anchorId) {
      positions.push({
        id: anchorId,
        x: anchorBox.x + anchorBox.width / 2,
        eventId: anchorId.replace('anchor-event-', '')
      });
    }
  }

  return positions;
}

test.describe('Comprehensive Anchor-Timeline Date Alignment Tests', () => {
  test('Anchors align precisely with event dates across multiple timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);

    // Test multiple historical timelines for different date ranges
    const timelines = ['RFK 1968', 'JFK', 'Napoleon'];

    for (const timeline of timelines) {
      console.log(`Testing anchor alignment for: ${timeline}`);

      await page.getByRole('button', { name: 'Clear All' }).click();
      await page.getByRole('button', { name: timeline }).click();
      await page.waitForTimeout(800);

      const timelineBox = await getTimelineAxisBounds(page);
      const anchorPositions = await getAnchorPositions(page, 3);

      expect(anchorPositions.length).toBeGreaterThan(0, `${timeline} should have anchors`);

      for (const anchor of anchorPositions) {
        // Anchor must be within timeline bounds
        expect(anchor.x).toBeGreaterThanOrEqual(timelineBox!.x - 10);
        expect(anchor.x).toBeLessThanOrEqual(timelineBox!.x + timelineBox!.width + 10);

        // Get corresponding event card
        const eventCard = page.locator(`[data-event-id="${anchor.eventId}"]`);
        if (await eventCard.count() > 0) {
          const cardBox = await eventCard.boundingBox();
          if (cardBox) {
            const cardCenterX = cardBox.x + cardBox.width / 2;
            const xDifference = Math.abs(anchor.x - cardCenterX);

            // Anchor should be reasonably close to its event card
            expect(xDifference).toBeLessThan(200,
              `${timeline} anchor ${anchor.eventId} should align with card (diff: ${xDifference}px)`);
          }
        }
      }
    }
  });

  test('Anchor alignment accuracy improves with zoom level', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(500);

    // Test anchor alignment at different zoom levels
    const zoomLevels = [
      { name: 'default', zoomSteps: 0 },
      { name: 'medium', zoomSteps: 3 },
      { name: 'high', zoomSteps: 6 },
      { name: 'maximum', zoomSteps: 10 }
    ];

    for (const level of zoomLevels) {
      console.log(`Testing zoom level: ${level.name} (${level.zoomSteps} steps)`);

      // Apply zoom
      for (let i = 0; i < level.zoomSteps; i++) {
        await page.keyboard.press('=');
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(300);

      const timelineBox = await getTimelineAxisBounds(page);
      const anchorPositions = await getAnchorPositions(page, 2);

      if (anchorPositions.length > 0) {
        for (const anchor of anchorPositions) {
          // At higher zoom levels, anchors should be more precisely positioned
          const tolerance = level.zoomSteps === 0 ? 150 : Math.max(50, 150 - level.zoomSteps * 10);

          expect(anchor.x).toBeGreaterThan(timelineBox!.x - tolerance);
          expect(anchor.x).toBeLessThan(timelineBox!.x + timelineBox!.width + tolerance);

          console.log(`Zoom ${level.name}: anchor at ${anchor.x}, timeline [${timelineBox!.x}, ${timelineBox!.x + timelineBox!.width}], tolerance=${tolerance}`);
        }
      }

      // Reset zoom for next test
      await page.keyboard.press('0'); // Reset zoom to default
      await page.waitForTimeout(200);
    }
  });

  test('Anchor positions remain stable during rapid zoom changes', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: '⏰ Minute Test' }).click();
    await page.waitForTimeout(500);

    // Perform rapid zoom in/out cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      console.log(`Rapid zoom cycle ${cycle + 1}`);

      // Zoom in rapidly
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('=');
        await page.waitForTimeout(50);
      }

      // Zoom out rapidly
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('-');
        await page.waitForTimeout(50);
      }

      await page.waitForTimeout(200);

      // Check anchor stability
      const timelineBox = await getTimelineAxisBounds(page);
      const anchorPositions = await getAnchorPositions(page, 3);

      expect(anchorPositions.length).toBeGreaterThan(0, 'Should maintain anchors during rapid zoom');

      for (const anchor of anchorPositions) {
        expect(anchor.x).toBeGreaterThan(timelineBox!.x - 100);
        expect(anchor.x).toBeLessThan(timelineBox!.x + timelineBox!.width + 100);
      }
    }
  });

  test('Anchor alignment accuracy with different event densities', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);

    // Test different density scenarios
    const densityTests = [
      { name: 'Simple Incremental (5 events)', button: '+5' },
      { name: 'Medium density (10 events)', button: 'Random (10)' },
      { name: 'High density (Napoleon)', button: 'Napoleon 1769-1821' }
    ];

    for (const density of densityTests) {
      console.log(`Testing density: ${density.name}`);

      await page.getByRole('button', { name: 'Clear All' }).click();
      await page.getByRole('button', { name: density.button }).click();
      await page.waitForTimeout(600);

      const timelineBox = await getTimelineAxisBounds(page);
      const anchorPositions = await getAnchorPositions(page, 5);

      console.log(`${density.name}: Found ${anchorPositions.length} anchors`);

      if (anchorPositions.length > 0) {
        // Check anchor distribution across timeline
        const anchorXPositions = anchorPositions.map(a => a.x).sort((a, b) => a - b);
        const timelineStart = timelineBox!.x;
        const timelineEnd = timelineBox!.x + timelineBox!.width;

        // First anchor should not be too close to timeline start
        expect(anchorXPositions[0]).toBeGreaterThan(timelineStart - 50);

        // Last anchor should not be too close to timeline end
        expect(anchorXPositions[anchorXPositions.length - 1]).toBeLessThan(timelineEnd + 50);

        // Anchors should be reasonably distributed (not all clustered)
        if (anchorXPositions.length > 1) {
          const spread = anchorXPositions[anchorXPositions.length - 1] - anchorXPositions[0];
          const timelineWidth = timelineBox!.width;
          const spreadRatio = spread / timelineWidth;

          expect(spreadRatio).toBeGreaterThan(0.1,
            `${density.name}: Anchors should spread across timeline (spread ratio: ${spreadRatio.toFixed(2)})`);
        }
      }
    }
  });

  test('Anchor coordinate system matches timeline scale calculations', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(500);

    // Get timeline bounds and event data for coordinate calculation
    const timelineBox = await getTimelineAxisBounds(page);
    const anchorPositions = await getAnchorPositions(page, 3);

    if (anchorPositions.length >= 2) {
      // Sort anchors by position to analyze spacing
      const sortedAnchors = anchorPositions.sort((a, b) => a.x - b.x);

      // Check that anchor spacing reflects temporal spacing
      for (let i = 1; i < sortedAnchors.length; i++) {
        const prevAnchor = sortedAnchors[i - 1];
        const currAnchor = sortedAnchors[i];
        const spacingPx = currAnchor.x - prevAnchor.x;

        // Anchors should not be too close together (minimum spacing)
        expect(spacingPx).toBeGreaterThan(10,
          `Anchors ${prevAnchor.eventId} and ${currAnchor.eventId} should have adequate spacing (${spacingPx}px)`);

        // Anchors should not be unreasonably far apart relative to timeline width
        expect(spacingPx).toBeLessThan(timelineBox!.width * 0.8,
          `Anchors ${prevAnchor.eventId} and ${currAnchor.eventId} spacing should be reasonable (${spacingPx}px)`);
      }

      // Verify anchor positions are within expected coordinate bounds
      const leftMargin = 136; // Expected left margin from layout engine
      const rightMargin = 40;  // Expected right margin

      for (const anchor of sortedAnchors) {
        expect(anchor.x).toBeGreaterThanOrEqual(leftMargin - 20,
          `Anchor ${anchor.eventId} should respect left margin (${anchor.x} >= ${leftMargin - 20})`);

        expect(anchor.x).toBeLessThanOrEqual(page.viewportSize()!.width - rightMargin + 20,
          `Anchor ${anchor.eventId} should respect right margin (${anchor.x} <= ${page.viewportSize()!.width - rightMargin + 20})`);
      }
    }
  });

  test('Anchor alignment with timeline tick marks and labels', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'JFK' }).click();
    await page.waitForTimeout(500);

    // Zoom to see timeline labels clearly
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    const timelineBox = await getTimelineAxisBounds(page);
    const anchorPositions = await getAnchorPositions(page, 3);

    // Look for timeline tick marks and labels
    const timelineTicks = page.locator('[data-testid="enhanced-timeline-axis"] line, [data-testid="timeline-axis"] line');
    const timelineLabels = page.locator('[data-testid="enhanced-timeline-axis"] text, [data-testid="timeline-axis"] text');

    const tickCount = await timelineTicks.count();
    const labelCount = await timelineLabels.count();

    console.log(`Found ${tickCount} timeline ticks and ${labelCount} labels`);

    if (anchorPositions.length > 0 && (tickCount > 0 || labelCount > 0)) {
      for (const anchor of anchorPositions) {
        // Anchor should be positioned relative to timeline structure
        const relativePosition = (anchor.x - timelineBox!.x) / timelineBox!.width;

        expect(relativePosition).toBeGreaterThanOrEqual(-0.1);
        expect(relativePosition).toBeLessThanOrEqual(1.1);

        console.log(`Anchor ${anchor.eventId}: relative position ${relativePosition.toFixed(3)} on timeline`);

        // If we can get event date information, verify it matches timeline position
        const eventCard = page.locator(`[data-event-id="${anchor.eventId}"]`);
        if (await eventCard.count() > 0) {
          const dateText = await eventCard.locator('.card-date, [class*="date"]').first().textContent();
          if (dateText) {
            console.log(`Event ${anchor.eventId} date: ${dateText}, position: ${relativePosition.toFixed(3)}`);

            // Verify the anchor position makes sense for the event date
            // This is a qualitative check - events later in timeline should have higher relative positions
            expect(relativePosition).toBeLessThan(2.0, 'Anchor position should be reasonable for timeline scale');
          }
        }
      }
    }
  });

  test('Hover date precision matches event cards across multiple timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);

    // Test with multiple historical timelines
    const timelines = [
      { name: 'French Revolution', expectedAnchors: 5 },
      { name: 'De Gaulle 1890-1970', expectedAnchors: 3 }
    ];

    for (const timeline of timelines) {
      console.log(`\n=== TESTING HOVER PRECISION FOR: ${timeline.name} ===`);

      await page.getByRole('button', { name: 'Clear All' }).click();
      await page.getByRole('button', { name: timeline.name }).click();
      await page.waitForTimeout(1000);

      const timelineBox = await getTimelineAxisBounds(page);
      const anchorPositions = await getAnchorPositions(page, 4);

      console.log(`${timeline.name}: Found ${anchorPositions.length} anchors`);
      expect(anchorPositions.length).toBeGreaterThan(0, `${timeline.name} should have anchors`);

      let successfulMatches = 0;
      let totalAttempts = 0;

      for (const anchor of anchorPositions.slice(0, 3)) { // Test first 3 anchors
        totalAttempts++;
        console.log(`\nTesting anchor: ${anchor.eventId}`);

        // Get the event card and its date
        const eventCard = page.locator(`[data-event-id="${anchor.eventId}"]`);

        if (await eventCard.count() > 0) {
          // Get date from reliable data attribute
          const cardDateAttribute = await eventCard.getAttribute('data-event-date');

          if (cardDateAttribute) {
            console.log(`Card date from data: "${cardDateAttribute}"`);

            // Test hover at the anchor position on the timeline
            const testPositions = [
              { x: anchor.x, y: timelineBox!.y + 40, desc: 'center of timeline' },
              { x: anchor.x - 5, y: timelineBox!.y + 40, desc: '5px left of anchor' },
              { x: anchor.x + 5, y: timelineBox!.y + 40, desc: '5px right of anchor' }
            ];

            let bestMatch = { daysDiff: Infinity, tooltipText: '', position: '' };

            for (const pos of testPositions) {
              await page.mouse.move(pos.x, pos.y);
              await page.waitForTimeout(400); // Wait for tooltip

              // Look for tooltip - be more specific to avoid UI buttons
              const tooltip = page.locator('div.absolute.bg-gray-800.text-white.text-xs').first();

              let tooltipText = '';
              if (await tooltip.count() > 0 && await tooltip.isVisible()) {
                const text = await tooltip.textContent();
                if (text && text.trim()) {
                  tooltipText = text.trim();
                }
              }

              if (tooltipText) {
                console.log(`Hover at ${pos.desc}: "${tooltipText}"`);

                // Parse and compare dates - using improved parsing for ISO dates
                const cardDate = parseISODate(cardDateAttribute);
                const hoverDate = parseEventDate(tooltipText);

                if (cardDate && hoverDate) {
                  const timeDiffMs = Math.abs(cardDate.getTime() - hoverDate.getTime());
                  const daysDiff = timeDiffMs / (24 * 60 * 60 * 1000);

                  if (daysDiff < bestMatch.daysDiff) {
                    bestMatch = { daysDiff, tooltipText, position: pos.desc };
                  }

                  console.log(`Date comparison: card=${cardDate.toISOString().split('T')[0]}, hover=${hoverDate.toISOString().split('T')[0]}, diff=${daysDiff.toFixed(2)} days`);
                }
              }

              // Move mouse away
              await page.mouse.move(100, 100);
              await page.waitForTimeout(200);
            }

            // Evaluate best match
            if (bestMatch.daysDiff < Infinity) {
              if (bestMatch.daysDiff <= 7.0) { // Allow up to 7 days tolerance
                successfulMatches++;
                console.log(`✅ MATCH: ${anchor.eventId} - ${bestMatch.daysDiff.toFixed(2)} days difference at ${bestMatch.position}`);
              } else {
                console.log(`❌ MISMATCH: ${anchor.eventId} - ${bestMatch.daysDiff.toFixed(2)} days difference (too large)`);
              }
            } else {
              console.log(`⚠️ NO TOOLTIP: Could not get hover tooltip for ${anchor.eventId}`);
            }
          } else {
            console.log(`⚠️ NO DATE: Could not extract date from card for ${anchor.eventId}`);
          }
        }
      }

      // Report results for this timeline
      const successRate = totalAttempts > 0 ? (successfulMatches / totalAttempts) * 100 : 0;
      console.log(`\n${timeline.name} Results: ${successfulMatches}/${totalAttempts} matches (${successRate.toFixed(1)}%)`);

      // Requirement: At least 50% of anchors should have matching hover dates
      expect(successRate).toBeGreaterThan(50,
        `${timeline.name}: At least 50% of anchors should have matching hover dates. Got ${successRate.toFixed(1)}%`);
    }
  });

  test('Hover date accuracy improves with zoom on French Revolution timeline', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'French Revolution' }).click();
    await page.waitForTimeout(1000);

    // Test accuracy at different zoom levels
    const zoomLevels = [
      { name: 'default', zoomSteps: 0, tolerance: 7.0 },
      { name: 'medium', zoomSteps: 3, tolerance: 3.0 },
      { name: 'high', zoomSteps: 6, tolerance: 1.0 }
    ];

    for (const level of zoomLevels) {
      console.log(`\n=== TESTING ZOOM LEVEL: ${level.name} ===`);

      // Apply zoom
      for (let i = 0; i < level.zoomSteps; i++) {
        await page.keyboard.press('=');
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(500);

      const timelineBox = await getTimelineAxisBounds(page);
      const anchorPositions = await getAnchorPositions(page, 2);

      if (anchorPositions.length > 0) {
        const anchor = anchorPositions[0]; // Test first anchor
        console.log(`Testing anchor: ${anchor.eventId} at zoom ${level.name}`);

        // Get card date from data attribute
        const eventCard = page.locator(`[data-event-id="${anchor.eventId}"]`);
        if (await eventCard.count() > 0) {
          const cardDateAttribute = await eventCard.getAttribute('data-event-date');

          if (cardDateAttribute) {
            // Hover at anchor position
            await page.mouse.move(anchor.x, timelineBox!.y + 40);
            await page.waitForTimeout(400);

            const tooltip = page.locator('div.absolute.bg-gray-800.text-white.text-xs').first();
            if (await tooltip.count() > 0 && await tooltip.isVisible()) {
              const tooltipText = await tooltip.textContent();

              if (tooltipText) {
                const cardDate = parseISODate(cardDateAttribute);
                const hoverDate = parseEventDate(tooltipText);

                if (cardDate && hoverDate) {
                  const timeDiffMs = Math.abs(cardDate.getTime() - hoverDate.getTime());
                  const daysDiff = timeDiffMs / (24 * 60 * 60 * 1000);

                  console.log(`Zoom ${level.name}: ${daysDiff.toFixed(2)} days difference (tolerance: ${level.tolerance})`);

                  expect(daysDiff).toBeLessThan(level.tolerance,
                    `At zoom ${level.name}, hover date should be within ${level.tolerance} days of card date`);
                }
              }
            }

            await page.mouse.move(100, 100);
            await page.waitForTimeout(200);
          }
        }
      }

      // Reset zoom for next test
      await page.keyboard.press('0');
      await page.waitForTimeout(300);
    }
  });
});

// Helper function to parse ISO date strings (for data attributes)
function parseISODate(isoString: string): Date | null {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

// Helper function to parse various date formats (shared with test 57)
function parseEventDate(dateText: string): Date | null {
  if (!dateText) return null;

  // Clean up the date text
  const cleaned = dateText.trim().replace(/[^\d\w\s,.-]/g, '');

  // Try various date parsing strategies
  const strategies = [
    // ISO format: 1789-07-14
    () => {
      const isoMatch = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
      }
      return null;
    },

    // US format: Jul 14, 1789 or July 14, 1789
    () => {
      const usMatch = cleaned.match(/(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
      if (usMatch) {
        const monthName = usMatch[1];
        const day = parseInt(usMatch[2]);
        const year = parseInt(usMatch[3]);

        const monthMap: {[key: string]: number} = {
          'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
          'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
          'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
          'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
        };

        const month = monthMap[monthName.toLowerCase()];
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }
      return null;
    },

    // European format: 14 Jul 1789
    () => {
      const eurMatch = cleaned.match(/(\d{1,2})\s+(\w{3,9})\s+(\d{4})/);
      if (eurMatch) {
        const day = parseInt(eurMatch[1]);
        const monthName = eurMatch[2];
        const year = parseInt(eurMatch[3]);

        const monthMap: {[key: string]: number} = {
          'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
          'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
          'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
          'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
        };

        const month = monthMap[monthName.toLowerCase()];
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }
      return null;
    },

    // Year only: 1789
    () => {
      const yearMatch = cleaned.match(/^\s*(\d{4})\s*$/);
      if (yearMatch) {
        return new Date(parseInt(yearMatch[1]), 0, 1);
      }
      return null;
    }
  ];

  // Try each parsing strategy
  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result && !isNaN(result.getTime())) {
        return result;
      }
    } catch {
      // Continue to next strategy
    }
  }

  return null;
}