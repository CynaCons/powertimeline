/**
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
 * Visibility Badge Exact Positioning Test (v5/81)
 * Ensures visibility indicators are at the exact same position across all cards
 *
 * Test Coverage:
 * - T81.1: Verify visibility badges are at identical bottom-right positions across all cards
 * - T81.2: Verify badge position remains consistent with different content lengths
 * - T81.3: Verify badge position consistency across HomePage sections
 * - T81.4: Verify badge position consistency on UserProfilePage
 *
 * Requirements: CC-REQ-VISIBILITY-007
 */

import { test, expect } from '@playwright/test';

test.describe('Visibility Badge Exact Positioning', () => {
  test.beforeEach(async ({ page }) => {
    // Start from HomePage
    await loginAsTestUser(page);
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

  test('T81.1: Verify visibility badges are at identical bottom-right positions across multiple cards', async ({ page }) => {
    // Create 3 timelines with different description lengths to test consistency
    const timelines = [
      { title: 'Short Description', description: 'Brief' },
      { title: 'Medium Description Test', description: 'This is a medium length description to test positioning' },
      { title: 'Long Description Timeline', description: 'This is a very long description that spans multiple lines and should test whether the badge position remains consistent regardless of how much text content is in the card description area' }
    ];

    // Create all timelines
    for (const timeline of timelines) {
      await page.getByRole('button', { name: /create new/i }).first().click();
      await page.getByLabel('Title').fill(timeline.title);
      await page.getByLabel('Description').fill(timeline.description);
      await page.getByRole('button', { name: /create timeline/i }).click();
      await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-/);
      await page.goto('/');
      await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
    }

    // Find all timeline cards in "My Timelines" section
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const cards = myTimelinesSection.locator('.bg-white.border').filter({ has: page.locator('text=/Short|Medium|Long/') });

    // Get all cards count
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Measure badge position for each card
    const badgePositions: Array<{ bottom: number, right: number, cardBottom: number, cardRight: number }> = [];

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      const badge = card.locator('span').filter({ hasText: /🌍|🔗|🔒/ }).first();

      // Get bounding boxes
      const cardBox = await card.boundingBox();
      const badgeBox = await badge.boundingBox();

      expect(cardBox).not.toBeNull();
      expect(badgeBox).not.toBeNull();

      if (cardBox && badgeBox) {
        // Calculate position of badge relative to card's bottom-right corner
        const distanceFromBottom = (cardBox.y + cardBox.height) - (badgeBox.y + badgeBox.height);
        const distanceFromRight = (cardBox.x + cardBox.width) - (badgeBox.x + badgeBox.width);

        badgePositions.push({
          bottom: distanceFromBottom,
          right: distanceFromRight,
          cardBottom: cardBox.y + cardBox.height,
          cardRight: cardBox.x + cardBox.width
        });

        console.log(`Card ${i}: Badge offset from bottom-right: (${distanceFromRight.toFixed(1)}px from right, ${distanceFromBottom.toFixed(1)}px from bottom)`);
      }
    }

    // Verify all badges are at the same position (allow 2px tolerance for rendering differences)
    const tolerance = 2;

    for (let i = 1; i < badgePositions.length; i++) {
      const diff = {
        bottom: Math.abs(badgePositions[i].bottom - badgePositions[0].bottom),
        right: Math.abs(badgePositions[i].right - badgePositions[0].right)
      };

      expect(diff.bottom).toBeLessThanOrEqual(tolerance);
      expect(diff.right).toBeLessThanOrEqual(tolerance);
    }

    // Additionally verify badges are positioned close to bottom-right (not floating in middle)
    for (const pos of badgePositions) {
      // Should be within 30px of bottom and right edges (allowing for badge height + bottom-2)
      expect(pos.bottom).toBeLessThanOrEqual(30);
      expect(pos.right).toBeLessThanOrEqual(30);

      // Should not be at exact edge (should have some padding)
      expect(pos.bottom).toBeGreaterThanOrEqual(4);
      expect(pos.right).toBeGreaterThanOrEqual(4);
    }
  });

  test('T81.2: Verify badge position consistency with extreme content variations', async ({ page }) => {
    // Create timelines with very different content to stress-test positioning
    const extremeTimelines = [
      { title: 'T1', description: '' }, // Minimal content
      { title: 'Maximum Title Length Test For Positioning Verification Testing Requirements Specification', description: 'Maximum description length test with lots of text to fill multiple lines and really push the boundaries of what the card can display. This should wrap to multiple lines and potentially get truncated with ellipsis but the badge should stay in the exact same position.' }
    ];

    for (const timeline of extremeTimelines) {
      await page.getByRole('button', { name: /create new/i }).first().click();
      await page.getByLabel('Title').fill(timeline.title);
      if (timeline.description) {
        await page.getByLabel('Description').fill(timeline.description);
      }
      await page.getByRole('button', { name: /create timeline/i }).click();
      await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-/);
      await page.goto('/');
      await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
    }

    // Measure positions
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const minimalCard = myTimelinesSection.locator('div').filter({ hasText: 'T1' }).first();
    const maximalCard = myTimelinesSection.locator('div').filter({ hasText: 'Maximum Title' }).first();

    const minimalBadge = minimalCard.locator('span').filter({ hasText: /🌍|🔗|🔒/ }).first();
    const maximalBadge = maximalCard.locator('span').filter({ hasText: /🌍|🔗|🔒/ }).first();

    const minimalCardBox = await minimalCard.boundingBox();
    const minimalBadgeBox = await minimalBadge.boundingBox();
    const maximalCardBox = await maximalCard.boundingBox();
    const maximalBadgeBox = await maximalBadge.boundingBox();

    expect(minimalCardBox).not.toBeNull();
    expect(minimalBadgeBox).not.toBeNull();
    expect(maximalCardBox).not.toBeNull();
    expect(maximalBadgeBox).not.toBeNull();

    if (minimalCardBox && minimalBadgeBox && maximalCardBox && maximalBadgeBox) {
      const minimalOffset = {
        bottom: (minimalCardBox.y + minimalCardBox.height) - (minimalBadgeBox.y + minimalBadgeBox.height),
        right: (minimalCardBox.x + minimalCardBox.width) - (minimalBadgeBox.x + minimalBadgeBox.width)
      };

      const maximalOffset = {
        bottom: (maximalCardBox.y + maximalCardBox.height) - (maximalBadgeBox.y + maximalBadgeBox.height),
        right: (maximalCardBox.x + maximalCardBox.width) - (maximalBadgeBox.x + maximalBadgeBox.width)
      };

      console.log(`Minimal card badge offset: ${minimalOffset.right.toFixed(1)}px from right, ${minimalOffset.bottom.toFixed(1)}px from bottom`);
      console.log(`Maximal card badge offset: ${maximalOffset.right.toFixed(1)}px from right, ${maximalOffset.bottom.toFixed(1)}px from bottom`);

      // Positions must be identical (2px tolerance)
      expect(Math.abs(minimalOffset.bottom - maximalOffset.bottom)).toBeLessThanOrEqual(2);
      expect(Math.abs(minimalOffset.right - maximalOffset.right)).toBeLessThanOrEqual(2);
    }
  });

  test('T81.3: Verify badge position consistency across HomePage sections', async ({ page }) => {
    // Create a timeline that will appear in multiple sections
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Cross Section Position Test');
    await page.getByLabel('Description').fill('Testing badge position across sections');
    await page.getByRole('button', { name: /create timeline/i }).click();
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-cross-section-position-test/);
    await page.goto('/');
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Find card in "My Timelines"
    const myTimelinesSection = page.locator('section').filter({ hasText: /my timelines/i });
    const myCard = myTimelinesSection.locator('div').filter({ hasText: 'Cross Section Position Test' }).first();
    const myBadge = myCard.locator('span').filter({ hasText: /🌍|🔗|🔒/ }).first();

    const myCardBox = await myCard.boundingBox();
    const myBadgeBox = await myBadge.boundingBox();

    expect(myCardBox).not.toBeNull();
    expect(myBadgeBox).not.toBeNull();

    if (myCardBox && myBadgeBox) {
      const myOffset = {
        bottom: (myCardBox.y + myCardBox.height) - (myBadgeBox.y + myBadgeBox.height),
        right: (myCardBox.x + myCardBox.width) - (myBadgeBox.x + myBadgeBox.width)
      };

      // Check "Recently Edited" section if visible
      const recentlyEditedSection = page.locator('section').filter({ hasText: /recently edited/i });
      if (await recentlyEditedSection.isVisible()) {
        const recentCard = recentlyEditedSection.locator('div').filter({ hasText: 'Cross Section Position Test' }).first();
        if (await recentCard.isVisible()) {
          const recentBadge = recentCard.locator('span').filter({ hasText: /🌍|🔗|🔒/ }).first();
          const recentCardBox = await recentCard.boundingBox();
          const recentBadgeBox = await recentBadge.boundingBox();

          if (recentCardBox && recentBadgeBox) {
            const recentOffset = {
              bottom: (recentCardBox.y + recentCardBox.height) - (recentBadgeBox.y + recentBadgeBox.height),
              right: (recentCardBox.x + recentCardBox.width) - (recentBadgeBox.x + recentBadgeBox.width)
            };

            console.log(`My Timelines badge offset: ${myOffset.right.toFixed(1)}px from right, ${myOffset.bottom.toFixed(1)}px from bottom`);
            console.log(`Recently Edited badge offset: ${recentOffset.right.toFixed(1)}px from right, ${recentOffset.bottom.toFixed(1)}px from bottom`);

            // Positions must match across sections (2px tolerance)
            expect(Math.abs(myOffset.bottom - recentOffset.bottom)).toBeLessThanOrEqual(2);
            expect(Math.abs(myOffset.right - recentOffset.right)).toBeLessThanOrEqual(2);
          }
        }
      }
    }
  });

  test('T81.4: Verify badge position consistency on UserProfilePage', async ({ page }) => {
    // Create timelines with varying content
    const timelines = [
      { title: 'Profile Test 1', description: 'Short' },
      { title: 'Profile Test 2', description: 'Much longer description for testing purposes' }
    ];

    for (const timeline of timelines) {
      await page.getByRole('button', { name: /create new/i }).first().click();
      await page.getByLabel('Title').fill(timeline.title);
      await page.getByLabel('Description').fill(timeline.description);
      await page.getByRole('button', { name: /create timeline/i }).click();
      await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-/);
      await page.goto('/');
      await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
    }

    // Navigate to user profile page
    // First get the current user ID from a timeline URL
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Temp Timeline');
    await page.getByRole('button', { name: /create timeline/i }).click();
    await page.waitForURL(/\/user\/(.+)\/timeline\/.+/);

    const url = page.url();
    const userIdMatch = url.match(/\/user\/([^/]+)\//);
    expect(userIdMatch).not.toBeNull();

    if (userIdMatch) {
      const userId = userIdMatch[1];

      // Navigate to user profile page
      await page.goto(`/user/${userId}`);
      await expect(page.locator('h1').filter({ hasText: /user profile/i })).toBeVisible();

      // Find cards on profile page
      const profileCards = page.locator('.bg-white.border').filter({ has: page.locator('text=/Profile Test/') });
      const cardCount = await profileCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(2);

      // Measure positions
      const positions: Array<{ bottom: number, right: number }> = [];

      for (let i = 0; i < Math.min(cardCount, 2); i++) {
        const card = profileCards.nth(i);
        const badge = card.locator('span').filter({ hasText: /🌍|🔗|🔒/ }).first();

        const cardBox = await card.boundingBox();
        const badgeBox = await badge.boundingBox();

        if (cardBox && badgeBox) {
          const offset = {
            bottom: (cardBox.y + cardBox.height) - (badgeBox.y + badgeBox.height),
            right: (cardBox.x + cardBox.width) - (badgeBox.x + badgeBox.width)
          };
          positions.push(offset);
          console.log(`Profile card ${i}: Badge offset ${offset.right.toFixed(1)}px from right, ${offset.bottom.toFixed(1)}px from bottom`);
        }
      }

      // Verify consistency (2px tolerance)
      if (positions.length >= 2) {
        const diff = {
          bottom: Math.abs(positions[1].bottom - positions[0].bottom),
          right: Math.abs(positions[1].right - positions[0].right)
        };
        expect(diff.bottom).toBeLessThanOrEqual(2);
        expect(diff.right).toBeLessThanOrEqual(2);
      }
    }
  });
});
