/**
 * Timeline Test Utilities
 * Helper functions for testing timeline loading and navigation
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Timeline, User } from '../../src/types';

/**
 * Default test user configuration
 * Change this single value to update the test user for all tests
 */
const DEFAULT_TEST_USER = 'cynacons';

/**
 * Login as the default test user
 * User-agnostic function that can be updated in one place for all tests
 * @param page - Playwright page object
 *
 * TODO(v0.5.1): When Firebase Auth is implemented, update this to use real authentication
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await loginAsUser(page, DEFAULT_TEST_USER);
}

/**
 * Load a timeline for the default test user
 * User-agnostic function for loading test timelines
 * @param page - Playwright page object
 * @param timelineId - Timeline ID to load
 *
 * TODO(v0.5.1): When Firebase Auth is implemented, this will automatically use authenticated user
 */
export async function loadTestTimeline(page: Page, timelineId: string): Promise<void> {
  await loadTimeline(page, DEFAULT_TEST_USER, timelineId, false);
}

/**
 * Login as a specific user by setting localStorage
 * @param page - Playwright page object
 * @param userId - User ID to log in as (e.g., 'cynacons', 'alice')
 */
export async function loginAsUser(page: Page, userId: string): Promise<void> {
  await page.goto('/');

  // Set current user in localStorage
  await page.evaluate((uid) => {
    const users = JSON.parse(localStorage.getItem('powertimeline_users') || '[]');
    const user = users.find((u: User) => u.id === uid);
    if (user) {
      localStorage.setItem('powertimeline_current_user', JSON.stringify(user));
    }
  }, userId);

  // Reload to apply the user change
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Load a specific timeline by navigating to its URL
 * @param page - Playwright page object
 * @param userId - Owner user ID
 * @param timelineId - Timeline ID
 * @param ensureLoggedIn - Whether to ensure user is logged in before navigation
 */
export async function loadTimeline(
  page: Page,
  userId: string,
  timelineId: string,
  ensureLoggedIn: boolean = true
): Promise<void> {
  if (ensureLoggedIn) {
    // Get current logged-in user
    const currentUserId = await page.evaluate(() => {
      const stored = localStorage.getItem('powertimeline_current_user');
      if (stored) {
        const user = JSON.parse(stored);
        return user.id;
      }
      return null;
    });

    // If not logged in, log in as the timeline owner
    if (!currentUserId) {
      await loginAsUser(page, userId);
    }
  }

  // Navigate to timeline URL
  await page.goto(`/user/${userId}/timeline/${timelineId}`);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Get all timelines for a user from localStorage
 * @param page - Playwright page object
 * @param userId - User ID to get timelines for
 * @returns Array of timeline objects
 */
export async function getUserTimelines(page: Page, userId: string): Promise<Timeline[]> {
  return page.evaluate((uid) => {
    const timelines = JSON.parse(localStorage.getItem('powertimeline_timelines') || '[]');
    return timelines.filter((t: Timeline) => t.ownerId === uid);
  }, userId);
}

/**
 * Get a specific timeline by ID from localStorage
 * @param page - Playwright page object
 * @param timelineId - Timeline ID
 * @returns Timeline object or null if not found
 */
export async function getTimelineById(page: Page, timelineId: string): Promise<Timeline | null> {
  return page.evaluate((tid) => {
    const timelines = JSON.parse(localStorage.getItem('powertimeline_timelines') || '[]');
    return timelines.find((t: Timeline) => t.id === tid) || null;
  }, timelineId);
}

/**
 * Wait for timeline editor to load
 * @param page - Playwright page object
 * @param timeoutMs - Timeout in milliseconds
 */
export async function waitForEditorLoaded(page: Page, timeoutMs: number = 5000): Promise<void> {
  // Wait for canvas or main editor element
  await expect(page.locator('canvas, [data-testid="timeline-editor"]').first()).toBeVisible({
    timeout: timeoutMs
  });
}

/**
 * Verify that the correct timeline is loaded in the editor
 * @param page - Playwright page object
 * @param expectedTitle - Expected timeline title
 */
export async function verifyTimelineLoaded(page: Page, expectedTitle: string): Promise<void> {
  // Check if the timeline title appears somewhere on the page
  // (This might need adjustment based on your actual editor UI)
  const titleVisible = await page.locator(`text="${expectedTitle}"`).count();
  expect(titleVisible).toBeGreaterThan(0);
}

/**
 * Navigate to user profile page
 * @param page - Playwright page object
 * @param userId - User ID
 */
export async function navigateToUserProfile(page: Page, userId: string): Promise<void> {
  await page.goto(`/user/${userId}`);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Click on a timeline card by title
 * @param page - Playwright page object
 * @param timelineTitle - Timeline title to click
 */
export async function clickTimelineCard(page: Page, timelineTitle: string): Promise<void> {
  const card = page.locator(`[class*="cursor-pointer"]:has-text("${timelineTitle}")`).first();
  await expect(card).toBeVisible({ timeout: 5000 });
  await card.click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Get current URL timeline ID from the browser
 * @param page - Playwright page object
 * @returns Timeline ID from URL or null
 */
export async function getCurrentUrlTimelineId(page: Page): Promise<string | null> {
  const url = page.url();
  const match = url.match(/\/timeline\/([^/]+)/);
  return match ? match[1] : null;
}
