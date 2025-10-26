/**
 * Timeline Visibility Controls End-to-End Tests (v5/80)
 * Tests visibility controls in timeline creation, editing, and display
 *
 * Test Coverage:
 * - T80.1: Verify visibility indicators displayed on all timeline cards
 * - T80.2: Verify visibility badge positioning (bottom right)
 * - T80.3: Create public timeline and verify indicator
 * - T80.4: Verify visibility can be changed via dialog
 *
 * Requirements: CC-REQ-VISIBILITY-001 through CC-REQ-VISIBILITY-007
 *
 * Note: Full dialog testing requires MUI-specific selectors which are being refined.
 * This version focuses on visual indicators and core functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Timeline Visibility Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Start from HomePage
    await page.goto('/');

    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to initialize demo data
    await page.reload();

    // Wait for page to be ready
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
  });

  test('T80.1: Verify visibility indicators displayed on existing timeline cards', async ({ page }) => {
    // Demo data should have timelines - check if any cards have visibility indicators
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });

    // Check if we have any timelines
    const createButton = page.getByRole('button', { name: /create new/i }).first();
    const hasTimelines = await myTimelinesSection.locator('.bg-white.border').first().isVisible().catch(() => false);

    if (!hasTimelines) {
      // Create a timeline first
      await createButton.click();
      await page.getByLabel('Title').fill('Visibility Test Timeline');
      await page.getByRole('button', { name: /create timeline/i }).click();
      await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-visibility-test-timeline/, { timeout: 15000 });
      await page.goto('/');
      await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
    }

    // Now check for visibility badges on timeline cards
    const timelineCards = myTimelinesSection.locator('.bg-white.border');
    const firstCard = timelineCards.first();
    await expect(firstCard).toBeVisible();

    // Should have at least one of the visibility badges
    const hasPublic = await firstCard.locator('text=🌍 Public').isVisible().catch(() => false);
    const hasUnlisted = await firstCard.locator('text=🔗 Unlisted').isVisible().catch(() => false);
    const hasPrivate = await firstCard.locator('text=🔒 Private').isVisible().catch(() => false);

    expect(hasPublic || hasUnlisted || hasPrivate).toBeTruthy();
  });

  test('T80.2: Verify visibility badge positioning at bottom right', async ({ page }) => {
    // Create a timeline to test
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Badge Position Test');
    await page.getByRole('button', { name: /create timeline/i }).click();
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-badge-position-test/, { timeout: 15000 });

    // Go back to home page
    await page.goto('/');
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Find the timeline card
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const timelineCard = myTimelinesSection.locator('div').filter({ hasText: 'Badge Position Test' }).first();
    await expect(timelineCard).toBeVisible();

    // Find the visibility badge
    const publicBadge = timelineCard.locator('text=🌍 Public').first();
    await expect(publicBadge).toBeVisible();

    // Get the parent container of the badge
    const badgeParent = publicBadge.locator('..');

    // Check that it has flexbox classes that position it at the end (right)
    const classes = await badgeParent.getAttribute('class');
    expect(classes).toContain('justify-end');
  });

  test('T80.3: Create public timeline and verify default public indicator', async ({ page }) => {
    // Create a timeline (default should be public)
    await page.getByRole('button', { name: /create new/i }).first().click();

    // Fill in basic information
    await page.getByLabel('Title').fill('Public Timeline Test');
    await page.getByLabel('Description').fill('This should be public by default');

    // Create timeline
    await page.getByRole('button', { name: /create timeline/i }).click();
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-public-timeline-test/, { timeout: 15000 });

    // Go back to home page
    await page.goto('/');
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Find the timeline card in "My Timelines" section
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const timelineCard = myTimelinesSection.locator('div').filter({ hasText: 'Public Timeline Test' }).first();

    // Verify public badge is displayed (default)
    await expect(timelineCard.locator('text=🌍 Public').first()).toBeVisible();
  });

  test('T80.4: Verify all visibility badges have correct styling', async ({ page }) => {
    // Create a public timeline to test badge styling
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Styling Test Timeline');
    await page.getByRole('button', { name: /create timeline/i }).click();
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-styling-test-timeline/, { timeout: 15000 });

    // Go back to home
    await page.goto('/');
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Find the card
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const timelineCard = myTimelinesSection.locator('div').filter({ hasText: 'Styling Test Timeline' }).first();

    // Check public badge styling
    const publicBadge = timelineCard.locator('text=🌍 Public').first();
    await expect(publicBadge).toBeVisible();

    const badgeClasses = await publicBadge.getAttribute('class');
    // Verify it has the green coloring for public
    expect(badgeClasses).toContain('bg-green-100');
    expect(badgeClasses).toContain('text-green-800');
  });

  test('T80.5: Verify visibility badge consistent across all sections', async ({ page }) => {
    // Create a timeline
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Cross-Section Test');
    await page.getByRole('button', { name: /create timeline/i }).click();
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-cross-section-test/, { timeout: 15000 });

    // Go back to home
    await page.goto('/');
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Check "My Timelines" section
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const myTimelineCard = myTimelinesSection.locator('div').filter({ hasText: 'Cross-Section Test' }).first();
    await expect(myTimelineCard.locator('text=🌍 Public').first()).toBeVisible();

    // Check "Recently Edited" section (if visible)
    const recentlyEditedSection = page.locator('section').filter({ hasText: /recently edited/i });
    if (await recentlyEditedSection.isVisible()) {
      const recentCard = recentlyEditedSection.locator('div').filter({ hasText: 'Cross-Section Test' }).first();
      if (await recentCard.isVisible()) {
        await expect(recentCard.locator('text=🌍 Public').first()).toBeVisible();
      }
    }
  });
});
