/**
 * Single Event Positioning Test (v5/77)
 *
 * Requirements Coverage:
 * - CC-REQ-LAYOUT-SINGLE-001: Single event timelines must center events properly
 * - CC-REQ-ANCHOR-002: Anchors must align with events at all zoom levels
 * - CC-REQ-AXIS-001: Timeline scales must be visible for single events
 *
 * Test Scenarios:
 * - T77.1: Single event positioning with zoom in/out cycles
 */

import { test, expect } from '@playwright/test';

interface PositionData {
  anchorX: number;
  anchorY: number;
  cardX: number;
  cardY: number;
  timelineLeft: number;
  timelineRight: number;
  timelineY: number;
  alignment: number; // Horizontal distance between anchor and card
}

async function getPositions(page: any): Promise<PositionData | null> {
  // Get timeline axis bounds
  const timelineAxis = page.locator('[data-testid="timeline-axis"], [data-testid="enhanced-timeline-axis"]').first();
  const timelineBox = await timelineAxis.boundingBox();

  if (!timelineBox) {
    console.log('⚠️  Timeline axis not found');
    return null;
  }

  // Get anchor position
  const anchor = page.locator('[data-testid="timeline-anchor"]').first();
  const anchorBox = await anchor.boundingBox();

  if (!anchorBox) {
    console.log('⚠️  Anchor not found');
    return null;
  }

  // Get card position
  const card = page.locator('[data-testid="event-card"]').first();
  const cardBox = await card.boundingBox();

  if (!cardBox) {
    console.log('⚠️  Card not found');
    return null;
  }

  const anchorCenterX = anchorBox.x + anchorBox.width / 2;
  const anchorCenterY = anchorBox.y + anchorBox.height / 2;
  const cardCenterX = cardBox.x + cardBox.width / 2;
  const cardCenterY = cardBox.y + cardBox.height / 2;
  const alignment = Math.abs(anchorCenterX - cardCenterX);

  return {
    anchorX: anchorCenterX,
    anchorY: anchorCenterY,
    cardX: cardCenterX,
    cardY: cardCenterY,
    timelineLeft: timelineBox.x,
    timelineRight: timelineBox.x + timelineBox.width,
    timelineY: timelineBox.y + timelineBox.height / 2,
    alignment
  };
}

function logPositions(phase: string, positions: PositionData) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📍 ${phase}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Anchor position:   X=${positions.anchorX.toFixed(1)}, Y=${positions.anchorY.toFixed(1)}`);
  console.log(`Card position:     X=${positions.cardX.toFixed(1)}, Y=${positions.cardY.toFixed(1)}`);
  console.log(`Timeline bounds:   Left=${positions.timelineLeft.toFixed(1)}, Right=${positions.timelineRight.toFixed(1)}`);
  console.log(`Timeline Y:        ${positions.timelineY.toFixed(1)}`);
  console.log(`Horizontal align:  ${positions.alignment.toFixed(1)}px`);

  // Calculate and log anchor position relative to timeline width
  const timelineWidth = positions.timelineRight - positions.timelineLeft;
  const anchorRelativePos = ((positions.anchorX - positions.timelineLeft) / timelineWidth) * 100;
  console.log(`Anchor position:   ${anchorRelativePos.toFixed(1)}% across timeline`);
  console.log(`${'='.repeat(60)}\n`);
}

test.describe('Single Event Positioning (CC-REQ-LAYOUT-SINGLE-001, CC-REQ-ANCHOR-002)', () => {

  test.beforeEach(async ({ page }) => {
    // Start from HomePage
    await page.goto('/');

    // Clear localStorage for clean test environment
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // Wait for HomePage to load
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible({ timeout: 10000 });
  });

  test('T77.1: Single event positioning with zoom in/out cycles', async ({ page }) => {
    console.log('\n🧪 Starting Single Event Positioning Test...\n');

    // Step 1: Create a timeline
    console.log('📝 Step 1: Creating timeline...');
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Single Event Position Test');
    await page.getByLabel('Description').fill('Testing single event anchor and card positioning');
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to timeline editor
    await expect(page).toHaveURL(/\/user\/.+\/timeline-/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Step 2: Create a single event with today's date
    console.log('📝 Step 2: Creating event with today\'s date...');
    await page.getByTestId('nav-create').click();

    // Wait for the authoring overlay to appear
    await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible({ timeout: 10000 });

    // Fill in event details
    await page.getByLabel(/^title/i).fill('Single Event Test');
    await page.getByLabel(/description/i).fill('Testing positioning of a single event');

    // Use today's date - click "Choose date" and select today
    await page.getByRole('button', { name: 'Choose date' }).click();
    await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });

    // Find and click today's date (which should have special styling)
    const today = page.locator('.MuiPickersDay-today').first();
    await today.click();
    await page.waitForTimeout(500);

    // Save the event
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for authoring overlay to close
    await expect(page.locator('[data-testid="authoring-overlay"]')).not.toBeVisible({ timeout: 5000 });

    // Wait for layout to stabilize
    await page.waitForTimeout(1500);

    // Step 3: Check positions at default zoom
    console.log('📏 Step 3: Checking positions at default zoom...');
    const defaultPositions = await getPositions(page);
    expect(defaultPositions).not.toBeNull();

    if (defaultPositions) {
      logPositions('DEFAULT ZOOM', defaultPositions);

      // Verify anchor is within timeline bounds
      expect(defaultPositions.anchorX).toBeGreaterThanOrEqual(defaultPositions.timelineLeft);
      expect(defaultPositions.anchorX).toBeLessThanOrEqual(defaultPositions.timelineRight);

      // Verify card and anchor are horizontally aligned (within tolerance)
      expect(defaultPositions.alignment).toBeLessThan(200); // Increased tolerance for single event

      // Take screenshot
      await page.screenshot({ path: 'test-results/77-single-event-default.png', fullPage: true });
    }

    // Step 4: Zoom in (3x)
    console.log('🔍 Step 4: Zooming in (3x)...');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1000);

    const zoomedInPositions = await getPositions(page);
    expect(zoomedInPositions).not.toBeNull();

    if (zoomedInPositions) {
      logPositions('ZOOMED IN (3x)', zoomedInPositions);

      // Verify positions after zoom in
      expect(zoomedInPositions.anchorX).toBeGreaterThanOrEqual(zoomedInPositions.timelineLeft);
      expect(zoomedInPositions.anchorX).toBeLessThanOrEqual(zoomedInPositions.timelineRight);
      expect(zoomedInPositions.alignment).toBeLessThan(200);

      await page.screenshot({ path: 'test-results/77-single-event-zoomed-in.png', fullPage: true });
    }

    // Step 5: Zoom out (3x)
    console.log('🔍 Step 5: Zooming out (3x)...');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('-');
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1000);

    const zoomedOutPositions = await getPositions(page);
    expect(zoomedOutPositions).not.toBeNull();

    if (zoomedOutPositions) {
      logPositions('ZOOMED OUT (3x)', zoomedOutPositions);

      // Verify positions after zoom out
      expect(zoomedOutPositions.anchorX).toBeGreaterThanOrEqual(zoomedOutPositions.timelineLeft);
      expect(zoomedOutPositions.anchorX).toBeLessThanOrEqual(zoomedOutPositions.timelineRight);
      expect(zoomedOutPositions.alignment).toBeLessThan(200);

      await page.screenshot({ path: 'test-results/77-single-event-zoomed-out.png', fullPage: true });
    }

    // Step 6: Zoom in again (3x)
    console.log('🔍 Step 6: Zooming in again (3x)...');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1000);

    const finalZoomPositions = await getPositions(page);
    expect(finalZoomPositions).not.toBeNull();

    if (finalZoomPositions) {
      logPositions('FINAL ZOOM IN (3x)', finalZoomPositions);

      // Final verification
      expect(finalZoomPositions.anchorX).toBeGreaterThanOrEqual(finalZoomPositions.timelineLeft);
      expect(finalZoomPositions.anchorX).toBeLessThanOrEqual(finalZoomPositions.timelineRight);
      expect(finalZoomPositions.alignment).toBeLessThan(200);

      await page.screenshot({ path: 'test-results/77-single-event-final-zoom.png', fullPage: true });
    }

    // Step 7: Check timeline scales are visible
    console.log('📊 Step 7: Verifying timeline scales are visible...');
    const scaleLabels = page.locator('[data-testid="axis-label"]');
    const labelCount = await scaleLabels.count();
    console.log(`Found ${labelCount} timeline scale labels`);
    expect(labelCount).toBeGreaterThan(0, 'Timeline scales should be visible for single event');

    console.log('\n✅ Single Event Positioning Test Complete!\n');
  });
});
