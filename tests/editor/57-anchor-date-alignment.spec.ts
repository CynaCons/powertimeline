
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
import { test, expect } from '@playwright/test';

async function getTimelineAxisBounds(page: any) {
  const timelineAxis = page.locator('[data-testid="timeline-axis"], [data-testid="enhanced-timeline-axis"]').first();
  const timelineBox = await timelineAxis.boundingBox();
  expect(timelineBox).toBeTruthy();
  return timelineBox;
}

test.describe('Anchor-Timeline Date Alignment Tests', () => {
  test('Anchors align with corresponding timeline dates at default zoom', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'jfk-presidency');
    await page.waitForSelector('[data-testid="enhanced-timeline-axis"], [data-testid="timeline-axis"]', { timeout: 5000 });

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/anchor-alignment-default.png' });

    // Get timeline axis element to understand coordinate system
    const timelineAxis = page.locator('[data-testid="timeline-axis"], [data-testid="enhanced-timeline-axis"]').first();
    expect(await timelineAxis.count()).toBeGreaterThan(0);

    const timelineBox = await timelineAxis.boundingBox();
    expect(timelineBox).toBeTruthy();

    // Get anchors and their positions
    const anchors = page.locator('.anchor-wrapper');
    const anchorCount = await anchors.count();
    console.log(`Found ${anchorCount} anchors`);

    expect(anchorCount).toBeGreaterThan(0, 'Should have at least one anchor');

    // For each anchor, verify it aligns with timeline dates
    for (let i = 0; i < Math.min(anchorCount, 5); i++) { // Test first 5 anchors
      const anchor = anchors.nth(i);
      const anchorBox = await anchor.boundingBox();

      if (anchorBox && timelineBox) {
        const anchorCenterX = anchorBox.x + anchorBox.width / 2;

        // Anchor should be within timeline bounds
        expect(anchorCenterX).toBeGreaterThanOrEqual(timelineBox.x);
        expect(anchorCenterX).toBeLessThanOrEqual(timelineBox.x + timelineBox.width);

        console.log(`Anchor ${i}: x=${anchorCenterX}, timeline range=[${timelineBox.x}, ${timelineBox.x + timelineBox.width}]`);

        // Get corresponding event card to check date
        const anchorId = await anchor.getAttribute('data-testid');
        if (anchorId) {
          const eventId = anchorId.replace('anchor-event-', '');
          const eventCard = page.locator(`[data-event-id="${eventId}"]`);

          if (await eventCard.count() > 0) {
            const cardBox = await eventCard.boundingBox();
            if (cardBox) {
              const cardCenterX = cardBox.x + cardBox.width / 2;

              // Anchor X should reasonably align with its event card position
              // Allow some tolerance for layout spacing and boundary clamping
              const xDifference = Math.abs(anchorCenterX - cardCenterX);
              expect(xDifference).toBeLessThan(150,
                `Anchor and card X positions should be reasonably close (diff: ${xDifference}px)`);
            }
          }
        }
      }
    }
  });

  test('Anchors maintain date alignment when zooming in', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'napoleon-bonaparte');
    await page.waitForSelector('[data-testid="enhanced-timeline-axis"], [data-testid="timeline-axis"]', { timeout: 5000 });

    // Record initial anchor positions
    const anchors = page.locator('.anchor-wrapper');
    const initialAnchorCount = await anchors.count();
    const initialPositions: Array<{id: string, x: number}> = [];

    for (let i = 0; i < Math.min(initialAnchorCount, 3); i++) {
      const anchor = anchors.nth(i);
      const anchorBox = await anchor.boundingBox();
      const anchorId = await anchor.getAttribute('data-testid');

      if (anchorBox && anchorId) {
        initialPositions.push({
          id: anchorId,
          x: anchorBox.x + anchorBox.width / 2
        });
      }
    }

    console.log('Initial anchor positions:', initialPositions);

    // Zoom in several levels
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/anchor-alignment-zoomed.png' });

    // Check anchor positions after zoom
    const zoomedAnchors = page.locator('.anchor-wrapper');
    const zoomedAnchorCount = await zoomedAnchors.count();

    console.log(`Anchors after zoom: ${zoomedAnchorCount}`);

    // Verify that anchors still align properly with timeline
    // This test should FAIL initially due to coordinate system mismatch
    const timelineAxis = page.locator('[data-testid="timeline-axis"], [data-testid="enhanced-timeline-axis"]').first();
    const timelineBox = await timelineAxis.boundingBox();

    if (timelineBox) {
      for (let i = 0; i < Math.min(zoomedAnchorCount, 5); i++) {
        const anchor = zoomedAnchors.nth(i);
        const anchorBox = await anchor.boundingBox();

        if (anchorBox) {
          const anchorCenterX = anchorBox.x + anchorBox.width / 2;

          // Critical assertion: anchors should stay within timeline bounds
          expect(anchorCenterX).toBeGreaterThanOrEqual(timelineBox.x - 50,
            'Anchor should not drift far left of timeline');
          expect(anchorCenterX).toBeLessThanOrEqual(timelineBox.x + timelineBox.width + 50,
            'Anchor should not drift far right of timeline');

          console.log(`Zoomed anchor ${i}: x=${anchorCenterX}, timeline range=[${timelineBox.x}, ${timelineBox.x + timelineBox.width}]`);
        }
      }
    }
  });

  test.skip('Anchors align with timeline tick marks for corresponding dates', async ({ page }) => {
    // Dev Panel removed in v0.5.24 - this test relied on '⏰ Minute Test' seeder
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForSelector('[data-testid="enhanced-timeline-axis"], [data-testid="timeline-axis"]', { timeout: 5000 });

    // Zoom in to see minute-level precision
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/anchor-alignment-precise.png' });

    // Get timeline ticks and anchors
    const timelineAxis = page.locator('[data-testid="timeline-axis"], [data-testid="enhanced-timeline-axis"]').first();
    const anchors = page.locator('.anchor-wrapper');

    const anchorCount = await anchors.count();
    console.log(`Minute test anchors: ${anchorCount}`);

    if (anchorCount > 0) {
      // Verify anchors are positioned correctly relative to timeline
      const timelineBox = await timelineAxis.boundingBox();

      if (timelineBox) {
        for (let i = 0; i < Math.min(anchorCount, 3); i++) {
          const anchor = anchors.nth(i);
          const anchorBox = await anchor.boundingBox();

          if (anchorBox) {
            const anchorCenterX = anchorBox.x + anchorBox.width / 2;

            // At this zoom level, anchors should be precisely positioned
            // This assertion will help identify coordinate system issues
            expect(anchorCenterX).toBeGreaterThan(timelineBox.x + 50);
            expect(anchorCenterX).toBeLessThan(timelineBox.x + timelineBox.width - 50);

            console.log(`Precise anchor ${i}: x=${anchorCenterX}, timeline bounds=[${timelineBox.x}, ${timelineBox.x + timelineBox.width}]`);
          }
        }
      }
    }
  });

  test.skip('Anchor positions update correctly when panning timeline', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'jfk-presidency');
    await page.waitForSelector('[data-testid="enhanced-timeline-axis"], [data-testid="timeline-axis"]', { timeout: 5000 });

    // Record initial anchor positions
    const anchors = page.locator('.anchor-wrapper');
    const initialPositions: number[] = [];

    const initialCount = await anchors.count();
    for (let i = 0; i < Math.min(initialCount, 3); i++) {
      const anchor = anchors.nth(i);
      const anchorBox = await anchor.boundingBox();
      if (anchorBox) {
        initialPositions.push(anchorBox.x + anchorBox.width / 2);
      }
    }

    console.log('Initial positions before pan:', initialPositions);

    // Pan right
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);

    // Record positions after pan
    const afterPanPositions: number[] = [];
    const afterPanCount = await anchors.count();

    for (let i = 0; i < Math.min(afterPanCount, 3); i++) {
      const anchor = anchors.nth(i);
      const anchorBox = await anchor.boundingBox();
      if (anchorBox) {
        afterPanPositions.push(anchorBox.x + anchorBox.width / 2);
      }
    }

    console.log('Positions after pan:', afterPanPositions);

    // Verify anchor positions changed appropriately with pan
    // This helps verify that anchors maintain proper alignment with timeline coordinate system
    if (initialPositions.length > 0 && afterPanPositions.length > 0) {
      const positionChange = afterPanPositions[0] - initialPositions[0];
      console.log(`Position change: ${positionChange}px`);

      // After panning right, anchor positions should shift (could be left or right depending on implementation)
      expect(Math.abs(positionChange)).toBeGreaterThan(10,
        'Anchor positions should change when panning timeline');
    }
  });

  test('Timeline hover date matches anchor event dates', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForSelector('[data-testid="enhanced-timeline-axis"], [data-testid="timeline-axis"]', { timeout: 5000 });

    // Get anchors and their positions
    const anchors = page.locator('.anchor-wrapper');
    const anchorCount = await anchors.count();
    console.log(`French Revolution anchors: ${anchorCount}`);

    expect(anchorCount).toBeGreaterThan(0, 'French Revolution should have anchors');

    // Test first 3 anchors for hover date alignment
    for (let i = 0; i < Math.min(anchorCount, 3); i++) {
      const anchor = anchors.nth(i);
      const anchorBox = await anchor.boundingBox();
      const anchorId = await anchor.getAttribute('data-testid');

      if (anchorBox && anchorId) {
        const eventId = anchorId.replace('anchor-event-', '');
        console.log(`Testing anchor ${i}: ${eventId}`);

        // Get the event card and its date from data attribute
        const eventCard = page.locator(`[data-event-id="${eventId}"]`);

        if (await eventCard.count() > 0) {
          // Get date from reliable data attribute
          const cardDateAttribute = await eventCard.getAttribute('data-event-date');

          if (cardDateAttribute) {
            console.log(`Card ${eventId} date from data: "${cardDateAttribute}"`);

            // Hover near the anchor on the timeline to trigger timeline tooltip
            const timelineBox = await getTimelineAxisBounds(page);
            const hoverX = anchorBox.x + anchorBox.width / 2;
            const hoverY = timelineBox.y + 40; // Center of timeline axis

            await page.mouse.move(hoverX, hoverY);
            await page.waitForTimeout(400); // Wait for tooltip to appear

            // Look for the hover tooltip - be more specific to avoid UI buttons
            const tooltip = page.locator('div.absolute.bg-gray-800.text-white.text-xs').first();

            if (await tooltip.count() > 0 && await tooltip.isVisible()) {
              const tooltipText = await tooltip.textContent();
              console.log(`Hover tooltip shows: "${tooltipText}"`);

              if (tooltipText) {
                // Parse dates for comparison - using improved parsing for ISO dates
                const cardDate = parseISODate(cardDateAttribute);
                const hoverDate = parseEventDate(tooltipText);

                if (cardDate && hoverDate) {
                  // Allow tolerance of 1 day for date matching
                  const timeDiffMs = Math.abs(cardDate.getTime() - hoverDate.getTime());
                  const daysDiff = timeDiffMs / (24 * 60 * 60 * 1000);

                  console.log(`Date comparison for ${eventId}: card=${cardDate.toISOString().split('T')[0]}, hover=${hoverDate.toISOString().split('T')[0]}, diff=${daysDiff.toFixed(2)} days`);

                  expect(daysDiff).toBeLessThan(1.0,
                    `Hover date should match card date within 1 day for event ${eventId}. Card: "${cardDateAttribute}", Hover: "${tooltipText}"`);
                } else {
                  console.warn(`Could not parse dates for ${eventId}: card="${cardDateAttribute}", hover="${tooltipText}"`);
                }
              }
            } else {
              console.warn(`No hover tooltip found for anchor ${eventId}`);
            }

            // Move mouse away to clear tooltip
            await page.mouse.move(100, 100);
            await page.waitForTimeout(200);
          } else {
            console.warn(`No date data attribute found for event ${eventId}`);
          }
        }
      }
    }
  });

  test('Specific test: Necker Compte Rendu date alignment', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForSelector('[data-testid="enhanced-timeline-axis"], [data-testid="timeline-axis"]', { timeout: 5000 });

    // Find any French Revolution anchor that contains "necker" in the event IDs
    const anchors = page.locator('.anchor-wrapper');
    const anchorCount = await anchors.count();
    console.log(`Found ${anchorCount} French Revolution anchors`);

    let neckerAnchor = null;
    for (let i = 0; i < anchorCount; i++) {
      const anchor = anchors.nth(i);
      const eventIds = await anchor.getAttribute('data-anchor-event-ids');
      if (eventIds && eventIds.toLowerCase().includes('necker')) {
        neckerAnchor = anchor;
        console.log(`Found Necker anchor with events: ${eventIds}`);
        break;
      }
    }

    if (neckerAnchor) {
      const anchorBox = await neckerAnchor.boundingBox();

      if (anchorBox) {
        console.log(`Necker anchor position: x=${anchorBox.x + anchorBox.width / 2}`);

        // Get timeline bounds
        const timelineBox = await getTimelineAxisBounds(page);

        // Hover at the anchor position on the timeline
        const hoverX = anchorBox.x + anchorBox.width / 2;
        const hoverY = timelineBox.y + 40;

        await page.mouse.move(hoverX, hoverY);
        await page.waitForTimeout(500);

        // Get the hover tooltip
        const tooltip = page.locator('div.absolute.bg-gray-800.text-white.text-xs').first();

        if (await tooltip.count() > 0 && await tooltip.isVisible()) {
          const tooltipText = await tooltip.textContent();
          console.log(`Necker hover shows: "${tooltipText}"`);

          // Expected date: February 1, 1781 (fr-necker-compte date: '1781-02-01')
          // Parse the displayed date and verify it's close to the expected date
          const displayedDate = new Date(tooltipText || '');
          const expectedDate = new Date('1781-02-01');

          if (!isNaN(displayedDate.getTime())) {
            const timeDiff = Math.abs(displayedDate.getTime() - expectedDate.getTime());
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

            console.log(`Expected: ${expectedDate.toDateString()}, Got: ${displayedDate.toDateString()}, Difference: ${daysDiff.toFixed(1)} days`);

            // Allow 1 day tolerance for date formatting differences
            expect(daysDiff).toBeLessThan(1,
              `Necker's Compte Rendu hover date should be February 1, 1781. Expected: ${expectedDate.toDateString()}, Got: ${displayedDate.toDateString()}, Difference: ${daysDiff.toFixed(1)} days`);
          } else {
            throw new Error(`Invalid date format in hover tooltip: "${tooltipText}"`);
          }
        } else {
          console.log('No hover tooltip found for Necker anchor');
        }

        await page.mouse.move(100, 100);
      }
    } else {
      console.warn('Necker Compte Rendu anchor not found');
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

// Helper function to parse various date formats
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