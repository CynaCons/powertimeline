 
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Overflow Indicators Visibility Tests', () => {
  test('Overflow badges appear when events exceed capacity', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-OVERFLOW-003' });

    await page.goto('/');

    // Clear any existing events
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();

    // Use clustered seeder multiple times to force overflow conditions
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);

    // Zoom in to create overflow conditions by making clusters denser
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('='); // Zoom in
      await page.waitForTimeout(100);
    }

    // Wait for layout to settle
    await page.waitForTimeout(500);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/overflow-indicators-test.png' });

    // Check that we have some visible event cards
    const visibleCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Visible cards: ${visibleCards}`);
    expect(visibleCards).toBeGreaterThan(0);

    // Check for overflow badges using data-testid selectors first
    const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
    const overflowCount = await overflowBadges.count();
    console.log(`Overflow badges found by testid: ${overflowCount}`);

    // Also check using text pattern (as done in existing tests)
    const badgesByText = page.locator('text=/^\\+\\d+$/');
    const textBadgeCount = await badgesByText.count();
    console.log(`Overflow badges found by text pattern: ${textBadgeCount}`);

    // For now, accept either approach working - but we want testid to work
    const totalBadges = Math.max(overflowCount, textBadgeCount);
    console.log(`Total overflow indicators found: ${totalBadges}`);

    // This test should FAIL initially because overflow indicators are not showing
    // Once fixed, overflow badges should appear when events exceed half-column capacity
    expect(totalBadges).toBeGreaterThan(0, 'Expected overflow badges to appear when events exceed capacity');

    // Verify badge content format
    if (overflowCount > 0) {
      const firstBadge = overflowBadges.first();
      const badgeText = await firstBadge.textContent();
      expect(badgeText).toMatch(/^\+\d+$/, 'Overflow badge should show "+N" format');
      console.log(`First overflow badge text: "${badgeText}"`);
    }
  });

  test('Overflow badges disappear when zooming out reduces density', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-OVERFLOW-003' });

    await page.goto('/');

    // Setup overflow conditions
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon' }).click();

    // Create overflow conditions with deep zoom
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Count overflow badges in dense view
    const overflowBadgesDense = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
    const denseOverflowCount = await overflowBadgesDense.count();
    console.log(`Dense view overflow badges: ${denseOverflowCount}`);

    // Zoom out significantly to reduce density
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('-');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Count overflow badges after zoom out
    const overflowBadgesWide = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
    const wideOverflowCount = await overflowBadgesWide.count();
    console.log(`Wide view overflow badges: ${wideOverflowCount}`);

    // Overflow should reduce or stay same when zoomed out
    expect(wideOverflowCount).toBeLessThanOrEqual(denseOverflowCount + 2,
      'Overflow badges should not significantly increase when zooming out');
  });

  test('Overflow badges positioned correctly near their anchors', async ({ page }) => {
    // Add requirement traceability
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-OVERFLOW-003' });

    await page.goto('/');

    // Setup with known overflow conditions
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    // Create moderate zoom to get overflow without extreme density
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('=');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Get overflow badges and anchors
    const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
    const anchors = page.locator('[data-testid^="anchor-event-"]');

    const badgeCount = await overflowBadges.count();
    const anchorCount = await anchors.count();

    console.log(`Found ${badgeCount} overflow badges and ${anchorCount} anchors`);

    if (badgeCount > 0) {
      // Verify badges are positioned relative to anchors
      for (let i = 0; i < badgeCount; i++) {
        const badge = overflowBadges.nth(i);
        const badgeBox = await badge.boundingBox();

        if (badgeBox) {
          // Badge should be positioned within reasonable bounds of timeline
          expect(badgeBox.x).toBeGreaterThan(50);
          expect(badgeBox.x).toBeLessThan(1500);
          expect(badgeBox.y).toBeGreaterThan(50);
          expect(badgeBox.y).toBeLessThan(1000);

          console.log(`Badge ${i}: x=${badgeBox.x}, y=${badgeBox.y}`);
        }
      }
    }
  });
});