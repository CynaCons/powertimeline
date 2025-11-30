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

// Known public timelines in Firestore
// v0.5.14: Updated to use username-based URLs
// The test owner (cynako@gmail.com) has username 'cynacons' in dev DB
const TEST_OWNER_USERNAME = 'cynacons';

// Actual timeline IDs in dev Firestore (format: slug without 'timeline-' prefix)
const PUBLIC_TIMELINES = {
  // Primary timeline IDs (actual IDs in Firestore)
  'french-revolution': TEST_OWNER_USERNAME,
  'napoleon-bonaparte': TEST_OWNER_USERNAME,
  'charles-de-gaulle': TEST_OWNER_USERNAME,
  'rfk-1968': TEST_OWNER_USERNAME,
  'jfk-presidency': TEST_OWNER_USERNAME,
  // Legacy aliases (for backwards compatibility with old test code)
  'timeline-french-revolution': TEST_OWNER_USERNAME,
  'timeline-napoleon': TEST_OWNER_USERNAME,
  'timeline-charles-de-gaulle': TEST_OWNER_USERNAME,
  'timeline-rfk': TEST_OWNER_USERNAME,
  'timeline-jfk': TEST_OWNER_USERNAME,
};

// v0.5.14: Map legacy timeline IDs to actual Firestore document IDs
const TIMELINE_ID_MAP: Record<string, string> = {
  'timeline-french-revolution': 'french-revolution',
  'timeline-napoleon': 'napoleon-bonaparte',
  'timeline-charles-de-gaulle': 'charles-de-gaulle',
  'timeline-rfk': 'rfk-1968',
  'timeline-jfk': 'jfk-presidency',
};

/**
 * Resolve a timeline ID to its actual Firestore document ID
 * Handles legacy 'timeline-*' aliases used in older test code
 */
function resolveTimelineId(timelineId: string): string {
  return TIMELINE_ID_MAP[timelineId] || timelineId;
}

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
 * @param timelineId - Timeline ID to load (supports legacy 'timeline-*' aliases)
 */
export async function loadTestTimeline(page: Page, timelineId: string): Promise<void> {
  // Check if this is a known public timeline
  const ownerUsername = PUBLIC_TIMELINES[timelineId as keyof typeof PUBLIC_TIMELINES] || TEST_OWNER_USERNAME;
  // v0.5.14: Resolve legacy timeline IDs to actual Firestore document IDs
  const resolvedId = resolveTimelineId(timelineId);
  await loadTimeline(page, ownerUsername, resolvedId, false);
}

/**
 * Load a specific timeline by navigating to its URL
 * v0.5.14: Updated to use username-based URLs (/:username/timeline/:id)
 * @param page - Playwright page object
 * @param username - Owner username (not user ID)
 * @param timelineId - Timeline ID
 * @param requireAuth - Whether to sign in before navigation
 */
export async function loadTimeline(
  page: Page,
  username: string,
  timelineId: string,
  requireAuth: boolean = false
): Promise<void> {
  if (requireAuth) {
    await signInWithEmail(page);
  }

  // Navigate to timeline URL using clean username-based pattern
  await page.goto(`/${username}/timeline/${timelineId}`);
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
 * v0.5.14: Updated to use username-based URLs (/:username)
 * @param page - Playwright page object
 * @param username - Username (not user ID)
 */
export async function navigateToUserProfile(page: Page, username: string): Promise<void> {
  await page.goto(`/${username}`);
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
