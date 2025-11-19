/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

async function openDevPanel(page: any) {
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

async function closeDevPanel(page: any) {
  await page.keyboard.press('Escape');
}

test.describe('Zoom Functionality Tests', () => {
  test('Zoom controls should filter visible events', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ZOOM-001' });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-jfk');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Count cards at full zoom (Fit All)
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(500);
    const fullZoomCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Full zoom (Fit All): ${fullZoomCards} cards visible`);
    
    // Take screenshot at full zoom
    await page.screenshot({ path: 'test-results/zoom-full.png' });
    
    // Zoom in using the zoom button
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(500);
    const zoomedInCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Zoomed in: ${zoomedInCards} cards visible`);
    
    // Take screenshot after zoom in
    await page.screenshot({ path: 'test-results/zoom-in.png' });
    
    // Zoom in more
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(500);
    const deepZoomCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Deep zoom: ${deepZoomCards} cards visible`);
    
    // Take screenshot after deep zoom
    await page.screenshot({ path: 'test-results/zoom-deep.png' });
    
    // Zoom out to test reverse direction
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await page.waitForTimeout(500);
    const zoomedOutCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Zoomed out: ${zoomedOutCards} cards visible`);
    
    console.log('\n=== ZOOM FUNCTIONALITY SUMMARY ===');
    console.log(`Full zoom → Zoom in: ${fullZoomCards} → ${zoomedInCards} cards`);
    console.log(`Zoom in → Deep zoom: ${zoomedInCards} → ${deepZoomCards} cards`);
    console.log(`Deep zoom → Zoom out: ${deepZoomCards} → ${zoomedOutCards} cards`);
    
    // Verify zoom is working - should show different numbers of cards
    // When zoomed in, we should see fewer cards (focused on smaller time range)
    // When zoomed out, we should see more cards (wider time range)
    
    // At minimum, zoom should change the number of visible cards
    const zoomChangesCardCount = fullZoomCards !== zoomedInCards || zoomedInCards !== deepZoomCards;
    expect(zoomChangesCardCount).toBe(true);
    
    // Also verify cards are actually being filtered (not just hidden)
    // All zoom levels should show some cards (not 0)
    expect(fullZoomCards).toBeGreaterThan(0);
    expect(zoomedInCards).toBeGreaterThan(0);
    expect(deepZoomCards).toBeGreaterThan(0);
  });
  
  test('Mouse wheel zoom should work with Ctrl key', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ZOOM-002' });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-jfk');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get initial card count
    const initialCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Initial: ${initialCards} cards`);
    
    // Get timeline area for mouse position
    const timelineArea = page.locator('div').first(); // Main timeline container
    const timelineBounds = await timelineArea.boundingBox();
    
    if (timelineBounds) {
      // Position cursor in center of timeline
      const centerX = timelineBounds.x + timelineBounds.width / 2;
      const centerY = timelineBounds.y + timelineBounds.height / 2;
      
      // Move mouse to center
      await page.mouse.move(centerX, centerY);
      
      // Test Ctrl+Wheel zoom in (negative deltaY = zoom in)
      await page.keyboard.down('Control');
      await page.mouse.wheel(0, -100);
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      const wheelZoomInCards = await page.locator('[data-testid="event-card"]').count();
      console.log(`Ctrl+Wheel zoom in: ${wheelZoomInCards} cards`);
      
      // Test Ctrl+Wheel zoom out (positive deltaY = zoom out)
      await page.keyboard.down('Control');
      await page.mouse.wheel(0, 100);
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      const wheelZoomOutCards = await page.locator('[data-testid="event-card"]').count();
      console.log(`Ctrl+Wheel zoom out: ${wheelZoomOutCards} cards`);
      
      // Verify wheel zoom works
      const wheelZoomWorks = initialCards !== wheelZoomInCards || wheelZoomInCards !== wheelZoomOutCards;
      expect(wheelZoomWorks).toBe(true);
    }
  });

  test('Keyboard zoom shortcuts should work', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ZOOM-003' });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get initial card count
    const initialCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Initial: ${initialCards} cards`);
    
    // Test keyboard zoom in (+/= keys)
    await page.keyboard.press('+');
    await page.waitForTimeout(300);
    const keyboardZoomInCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Keyboard zoom in (+): ${keyboardZoomInCards} cards`);
    
    // Test keyboard zoom out (- key)  
    await page.keyboard.press('-');
    await page.waitForTimeout(300);
    const keyboardZoomOutCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Keyboard zoom out (-): ${keyboardZoomOutCards} cards`);
    
    // Verify keyboard shortcuts work
    const keyboardZoomWorks = initialCards !== keyboardZoomInCards || keyboardZoomInCards !== keyboardZoomOutCards;
    expect(keyboardZoomWorks).toBe(true);
  });
});
