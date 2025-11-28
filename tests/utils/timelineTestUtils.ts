/**
 * Timeline Test Utilities
 * Helper functions for testing timeline loading and navigation
 * v0.5.11 - Updated for Firebase Auth (removed localStorage)
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { signInWithEmail, getTestUserUid } from './authTestUtils';

/**
 * Default test user configuration
 * This is the Firebase UID of the test user
 */
const DEFAULT_TEST_USER_UID = getTestUserUid();

// Known public timelines in Firestore (cynacons user)
const CYNACONS_USER_ID = 'cynacons';
const PUBLIC_TIMELINES = {
  'timeline-french-revolution': CYNACONS_USER_ID,
  'timeline-napoleon': CYNACONS_USER_ID,
  'timeline-charles-de-gaulle': CYNACONS_USER_ID,
  'timeline-rfk': CYNACONS_USER_ID,
};

/**
 * Login as the test user via Firebase Auth
 * @param page - Playwright page object
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await signInWithEmail(page);
}

/**
 * Load a public timeline (no auth required)
 * @param page - Playwright page object
 * @param timelineId - Timeline ID to load
 */
export async function loadTestTimeline(page: Page, timelineId: string): Promise<void> {
  // Check if this is a known public timeline
  const ownerId = PUBLIC_TIMELINES[timelineId as keyof typeof PUBLIC_TIMELINES] || CYNACONS_USER_ID;
  await loadTimeline(page, ownerId, timelineId, false);
}

/**
 * Load a specific timeline by navigating to its URL
 * @param page - Playwright page object
 * @param userId - Owner user ID
 * @param timelineId - Timeline ID
 * @param requireAuth - Whether to sign in before navigation
 */
export async function loadTimeline(
  page: Page,
  userId: string,
  timelineId: string,
  requireAuth: boolean = false
): Promise<void> {
  if (requireAuth) {
    await signInWithEmail(page);
  }

  // Navigate to timeline URL
  await page.goto(`/user/${userId}/timeline/${timelineId}`);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for timeline editor to load
 * @param page - Playwright page object
 * @param timeoutMs - Timeout in milliseconds
 */
export async function waitForEditorLoaded(page: Page, timeoutMs: number = 5000): Promise<void> {
  // Wait for timeline axis (indicator that editor loaded)
  await expect(page.locator('[data-testid="timeline-axis"]').first()).toBeVisible({
    timeout: timeoutMs
  });
}

/**
 * Wait for timeline to render with events
 * @param page - Playwright page object
 * @param timeoutMs - Timeout in milliseconds
 */
export async function waitForTimelineRendered(page: Page, timeoutMs: number = 10000): Promise<void> {
  // Wait for at least one event card to appear
  await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({
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
 * Navigate to browse page
 * @param page - Playwright page object
 */
export async function navigateToBrowse(page: Page): Promise<void> {
  await page.goto('/browse');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Click on a timeline card by title
 * @param page - Playwright page object
 * @param timelineTitle - Timeline title to click
 */
export async function clickTimelineCard(page: Page, timelineTitle: string): Promise<void> {
  const card = page.locator(`[data-testid^="timeline-card-"]:has-text("${timelineTitle}")`).first();
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

/**
 * Get current URL user ID from the browser
 * @param page - Playwright page object
 * @returns User ID from URL or null
 */
export async function getCurrentUrlUserId(page: Page): Promise<string | null> {
  const url = page.url();
  const match = url.match(/\/user\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Wait for page to be fully interactive
 * @param page - Playwright page object
 * @param delayMs - Additional delay after load
 */
export async function waitForPageReady(page: Page, delayMs: number = 500): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(delayMs);
}
