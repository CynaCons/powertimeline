import { test, expect } from '@playwright/test';
import {
  loginAsUser,
  loadTimeline,
  getUserTimelines,
  getTimelineById,
  navigateToUserProfile,
  getCurrentUrlTimelineId,
} from '../utils/timelineTestUtils';

test.describe('v5/72 Timeline Navigation', () => {
  test('can load timeline directly using utility', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-001' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get CynaCons' timelines
    const timelines = await getUserTimelines(page, 'cynacons');
    expect(timelines.length).toBeGreaterThan(0);

    const firstTimeline = timelines[0];
    console.log('First timeline:', firstTimeline);

    // Verify timeline has events
    expect(firstTimeline.events.length).toBeGreaterThan(0);
    console.log(`Timeline "${firstTimeline.title}" has ${firstTimeline.events.length} events`);

    // Load the timeline using our utility
    await loadTimeline(page, 'cynacons', firstTimeline.id);

    // Verify URL is correct
    const urlTimelineId = await getCurrentUrlTimelineId(page);
    expect(urlTimelineId).toBe(firstTimeline.id);
  });

  test('clicking timeline card in user profile navigates correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-002' });

    // Login as CynaCons
    await loginAsUser(page, 'cynacons');

    // Navigate to CynaCons user profile
    await navigateToUserProfile(page, 'cynacons');

    // Get timelines from localStorage to verify
    const timelines = await getUserTimelines(page, 'cynacons');
    expect(timelines.length).toBeGreaterThan(0);

    const firstTimeline = timelines[0];
    console.log('Testing navigation for timeline:', {
      id: firstTimeline.id,
      title: firstTimeline.title
    });

    // Find and click the first timeline card
    const timelineCard = page.locator('.cursor-pointer').filter({ hasText: firstTimeline.title }).first();
    await expect(timelineCard).toBeVisible({ timeout: 5000 });

    // Click the card
    await timelineCard.click();
    await page.waitForLoadState('networkidle');

    // Verify URL contains the correct timeline ID
    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);
    expect(currentUrl).toContain(`/timeline/${firstTimeline.id}`);

    // Verify URL timeline ID matches
    const urlTimelineId = await getCurrentUrlTimelineId(page);
    console.log('URL timeline ID:', urlTimelineId);
    console.log('Expected timeline ID:', firstTimeline.id);
    expect(urlTimelineId).toBe(firstTimeline.id);
  });

  test('clicking multiple different timelines navigates correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-003' });

    await loginAsUser(page, 'cynacons');
    await navigateToUserProfile(page, 'cynacons');

    const timelines = await getUserTimelines(page, 'cynacons');

    // Test first 2 timelines (or all if less than 2)
    const timelinesToTest = timelines.slice(0, Math.min(2, timelines.length));

    for (const timeline of timelinesToTest) {
      console.log(`Testing timeline: ${timeline.title} (${timeline.id})`);

      // Go back to profile page
      await navigateToUserProfile(page, 'cynacons');

      // Click the timeline card
      const timelineCard = page.locator('.cursor-pointer').filter({ hasText: timeline.title }).first();
      await expect(timelineCard).toBeVisible({ timeout: 5000 });
      await timelineCard.click();
      await page.waitForLoadState('networkidle');

      // Verify correct timeline loaded
      const urlTimelineId = await getCurrentUrlTimelineId(page);
      expect(urlTimelineId).toBe(timeline.id);
    }
  });

  test('timeline IDs are in slug format (not timestamp format)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-004' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const timelines = await getUserTimelines(page, 'cynacons');
    expect(timelines.length).toBeGreaterThan(0);

    // Check that timeline IDs are NOT in old timestamp format
    // Old format: timeline-1761254688359-1
    // New format: timeline-french-revolution
    const timestampFormatRegex = /timeline-\d{13}-\d+/;

    for (const timeline of timelines) {
      console.log(`Checking timeline ID format: ${timeline.id}`);
      expect(timeline.id).not.toMatch(timestampFormatRegex);
      expect(timeline.id).toMatch(/^timeline-[a-z0-9-]+$/);
    }
  });

  test('French Revolution timeline exists for CynaCons', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-005' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const timeline = await getTimelineById(page, 'timeline-french-revolution');
    expect(timeline).not.toBeNull();
    expect(timeline.title).toBe('French Revolution');
    expect(timeline.ownerId).toBe('cynacons');
    expect(timeline.events.length).toBeGreaterThan(0);
    console.log(`French Revolution timeline has ${timeline.events.length} events`);
  });

  test('all CynaCons timelines contain events', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-007' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const timelines = await getUserTimelines(page, 'cynacons');

    // Verify all timelines have events
    for (const timeline of timelines) {
      expect(timeline.events.length).toBeGreaterThan(0);
      console.log(`"${timeline.title}" has ${timeline.events.length} events`);
    }

    // Verify RFK timeline specifically
    const rfkTimeline = await getTimelineById(page, 'timeline-rfk-1968-campaign');
    expect(rfkTimeline).not.toBeNull();
    expect(rfkTimeline.events.length).toBeGreaterThan(0);

    // Verify JFK timeline specifically
    const jfkTimeline = await getTimelineById(page, 'timeline-jfk-presidency-1961-1963');
    expect(jfkTimeline).not.toBeNull();
    expect(jfkTimeline.events.length).toBeGreaterThan(0);

    // Verify French Revolution timeline specifically
    const frTimeline = await getTimelineById(page, 'timeline-french-revolution');
    expect(frTimeline).not.toBeNull();
    expect(frTimeline.events.length).toBeGreaterThan(0);

    // Verify that timeline events are different (check first event title)
    const rfkFirstEvent = rfkTimeline.events[0].title;
    const jfkFirstEvent = jfkTimeline.events[0].title;
    const frFirstEvent = frTimeline.events[0].title;

    expect(rfkFirstEvent).not.toBe(jfkFirstEvent);
    expect(rfkFirstEvent).not.toBe(frFirstEvent);
    expect(jfkFirstEvent).not.toBe(frFirstEvent);

    console.log('RFK first event:', rfkFirstEvent);
    console.log('JFK first event:', jfkFirstEvent);
    console.log('FR first event:', frFirstEvent);
  });

  test('can navigate from home page timeline card to editor', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-NAV-006' });

    await loginAsUser(page, 'cynacons');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find a timeline card on home page (in any section)
    const timelineCards = page.locator('[class*="cursor-pointer"]:has-text("events")');
    const cardCount = await timelineCards.count();

    if (cardCount > 0) {
      // Get the timeline title from the first card
      const firstCard = timelineCards.first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });

      // Extract timeline title for verification
      const cardText = await firstCard.textContent();
      console.log('Clicking timeline card with text:', cardText);

      // Click the card
      await firstCard.click();
      await page.waitForLoadState('networkidle');

      // Verify navigation happened
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/user\/\w+\/timeline\/timeline-[a-z0-9-]+/);

      // Verify URL has a valid timeline ID
      const urlTimelineId = await getCurrentUrlTimelineId(page);
      expect(urlTimelineId).not.toBeNull();
      expect(urlTimelineId).toMatch(/^timeline-[a-z0-9-]+$/);
    }
  });
});
