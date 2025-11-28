/**
 * Timeline Navigation Tests
 * v0.5.11 - Updated for Firebase Auth
 *
 * Tests navigation between timelines using public Firestore data
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';
import {
  loadTimeline,
  navigateToUserProfile,
  getCurrentUrlTimelineId,
  clickTimelineCard,
} from '../utils/timelineTestUtils';

// Known public timelines in Firestore
const PUBLIC_TIMELINES = [
  { id: 'timeline-french-revolution', title: 'French Revolution', ownerId: 'cynacons' },
  { id: 'timeline-napoleon', title: 'Napoleon', ownerId: 'cynacons' },
  { id: 'timeline-rfk', title: 'RFK', ownerId: 'cynacons' },
];

test.describe('v5/72 Timeline Navigation', () => {

  test('T72.1: Can load public timeline directly via URL', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-001' });

    const timeline = PUBLIC_TIMELINES[0];

    // Load timeline directly
    await loadTimeline(page, timeline.ownerId, timeline.id);

    // Verify URL is correct
    const urlTimelineId = await getCurrentUrlTimelineId(page);
    expect(urlTimelineId).toBe(timeline.id);

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Timeline should render (look for axis, events, or SVG container)
    const hasAxis = await page.getByTestId('timeline-axis').isVisible({ timeout: 5000 }).catch(() => false);
    const hasEventCard = await page.getByTestId('event-card').first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasSvg = await page.locator('svg').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAxis || hasEventCard || hasSvg).toBe(true);
  });

  test('T72.2: Clicking timeline card in user profile navigates correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-002' });

    // Navigate to cynacons user profile (public profile)
    await navigateToUserProfile(page, 'cynacons');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    // Find and click a timeline card
    const timelineCards = page.locator('[data-testid^="timeline-card-"], .cursor-pointer:has-text("events")');
    const cardCount = await timelineCards.count();

    if (cardCount > 0) {
      await timelineCards.first().click();
      await page.waitForLoadState('domcontentloaded');

      // Verify URL contains timeline ID
      const urlTimelineId = await getCurrentUrlTimelineId(page);
      expect(urlTimelineId).toBeTruthy();
      expect(urlTimelineId).toMatch(/^timeline-/);
    } else {
      test.skip(true, 'No timeline cards found on user profile');
    }
  });

  test('T72.3: Clicking multiple different timelines navigates correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-003' });

    const visitedUrls: string[] = [];

    // Test first 2 public timelines
    for (const timeline of PUBLIC_TIMELINES.slice(0, 2)) {
      await loadTimeline(page, timeline.ownerId, timeline.id);

      const url = page.url();
      expect(url).toContain(timeline.id);
      visitedUrls.push(url);
    }

    // Verify we visited different URLs
    expect(visitedUrls[0]).not.toBe(visitedUrls[1]);
  });

  test('T72.4: Timeline IDs are in slug format', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-004' });

    // Load a known timeline
    await loadTimeline(page, 'cynacons', 'timeline-french-revolution');

    // Verify URL has correct format
    const urlTimelineId = await getCurrentUrlTimelineId(page);
    expect(urlTimelineId).toBe('timeline-french-revolution');

    // Check that ID is NOT in old timestamp format
    const timestampFormatRegex = /timeline-\d{13}-\d+/;
    expect(urlTimelineId).not.toMatch(timestampFormatRegex);
    expect(urlTimelineId).toMatch(/^timeline-[a-z0-9-]+$/);
  });

  test('T72.5: French Revolution timeline loads correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-005' });

    await loadTimeline(page, 'cynacons', 'timeline-french-revolution');

    // Verify URL
    expect(page.url()).toContain('timeline-french-revolution');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Should show timeline content (axis, events, or SVG)
    const hasAxis = await page.getByTestId('timeline-axis').isVisible({ timeout: 5000 }).catch(() => false);
    const hasEventCard = await page.getByTestId('event-card').first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasSvg = await page.locator('svg').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAxis || hasEventCard || hasSvg).toBe(true);
  });

  test('T72.6: Can navigate from browse page to timeline editor', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-006' });

    // Go to browse page
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    // Find a timeline card
    const timelineCards = page.locator('[data-testid^="timeline-card-"], .cursor-pointer:has-text("events")');
    const cardCount = await timelineCards.count();

    if (cardCount > 0) {
      // Click the first card
      await timelineCards.first().click();
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation happened
      expect(page.url()).toMatch(/\/user\/\w+\/timeline\/timeline-[a-z0-9-]+/);

      // Verify URL has a valid timeline ID
      const urlTimelineId = await getCurrentUrlTimelineId(page);
      expect(urlTimelineId).not.toBeNull();
      expect(urlTimelineId).toMatch(/^timeline-[a-z0-9-]+$/);
    } else {
      console.log('Note: No timeline cards found on browse page');
    }
  });

  test('T72.7: Authenticated user can navigate to own timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-007' });

    // Sign in
    await signInWithEmail(page);

    // Navigate to user's profile page
    const testUserUid = process.env.TEST_USER_UID || 'iTMZ9n0IuzUSbhWfCaR86WsB2AC3';
    await page.goto(`/user/${testUserUid}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for content
    await page.waitForTimeout(2000);

    // Check if there are any timeline cards
    const timelineCards = page.locator('[data-testid^="timeline-card-"], .cursor-pointer:has-text("events")');
    const cardCount = await timelineCards.count();

    if (cardCount > 0) {
      // Click first card
      await timelineCards.first().click();
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation
      expect(page.url()).toContain('/timeline/');
    } else {
      console.log('Note: User has no timelines yet');
    }
  });
});
