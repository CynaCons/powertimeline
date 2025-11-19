/**
 * Timeline Test Utilities
 *
 * Centralized helper functions for v5 test suite to navigate timelines and setup users.
 * Designed to be resilient to future changes, especially Firebase Authentication migration.
 *
 * @see PLAN.md v0.5.0.3 - Test Suite Modernization
 */

import { Page } from '@playwright/test';

/**
 * Common test timeline IDs available in the seed data
 * These IDs match the migrated Firestore timeline IDs
 */
export const TEST_TIMELINES = {
  NAPOLEON: 'timeline-napoleon',
  FRENCH_REVOLUTION: 'timeline-french-revolution',
  JFK: 'timeline-jfk',
  RFK: 'timeline-rfk',
  DE_GAULLE: 'timeline-de-gaulle',
} as const;

/**
 * Common test users available in the system
 */
export const TEST_USERS = {
  CYNACONS: {
    id: 'cynacons',
    name: 'Cynacons',
    email: 'cynacons@example.com',
  },
  ALICE: {
    id: 'alice',
    name: 'Alice',
    email: 'alice@example.com',
  },
  BOB: {
    id: 'bob',
    name: 'Bob',
    email: 'bob@example.com',
  },
} as const;

/**
 * Sets up a mock user in localStorage for testing
 *
 * @param page - Playwright page object
 * @param userId - User ID to set as current user (defaults to 'cynacons')
 *
 * @example
 * await setupMockUser(page, 'cynacons');
 *
 * TODO(v0.5.1): When Firebase Authentication is implemented, update this function to:
 * 1. Navigate to /login
 * 2. Fill email and password fields
 * 3. Submit login form
 * 4. Wait for authentication redirect
 *
 * The function signature can stay the same, but the implementation will change from
 * localStorage manipulation to actual Firebase Auth login. All existing tests will
 * continue to work without modification.
 */
export async function setupMockUser(page: Page, userId: string = 'cynacons'): Promise<void> {
  // Find user in TEST_USERS or create a basic user object
  const userEntry = Object.values(TEST_USERS).find(u => u.id === userId);

  const user = userEntry || {
    id: userId,
    name: userId.charAt(0).toUpperCase() + userId.slice(1),
    email: `${userId}@example.com`,
  };

  await page.evaluate((userData) => {
    localStorage.setItem('powertimeline_current_user', JSON.stringify(userData));
  }, user);
}

/**
 * Navigates to a specific timeline, setting up authentication if needed
 *
 * @param page - Playwright page object
 * @param timelineId - Timeline ID to navigate to
 * @param ownerId - Owner user ID (defaults to 'cynacons')
 *
 * @example
 * // Navigate to Napoleon timeline
 * await openTimeline(page, TEST_TIMELINES.NAPOLEON);
 *
 * // Navigate to a specific user's timeline
 * await openTimeline(page, 'my-timeline-id', 'alice');
 *
 * TODO(v0.5.1): When Firebase Auth is implemented, this function may need to:
 * 1. Check if user is already authenticated
 * 2. If not, call setupMockUser() to authenticate
 * 3. Then navigate to timeline
 */
export async function openTimeline(
  page: Page,
  timelineId: string,
  ownerId: string = 'cynacons'
): Promise<void> {
  const url = `/user/${ownerId}/timeline/${timelineId}`;

  // Navigate to timeline first to establish origin for localStorage
  await page.goto(url);

  // Set up mock user after navigation (when localStorage is accessible)
  await setupMockUser(page, ownerId);

  // Reload page to apply localStorage changes and wait for full load
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Give React time to render the editor
  await page.waitForLoadState('networkidle');
}

/**
 * Opens a timeline for a specific user (explicit owner)
 *
 * @param page - Playwright page object
 * @param username - Owner username
 * @param timelineId - Timeline ID to navigate to
 *
 * @example
 * await openTimelineForUser(page, 'alice', 'my-timeline');
 */
export async function openTimelineForUser(
  page: Page,
  username: string,
  timelineId: string
): Promise<void> {
  await openTimeline(page, timelineId, username);
}

/**
 * Waits for timeline to be fully loaded and ready for interaction
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 *
 * @example
 * await openTimeline(page, TEST_TIMELINES.NAPOLEON);
 * await waitForTimelineReady(page);
 * // Now safe to interact with timeline elements
 */
export async function waitForTimelineReady(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  // Wait for timeline axis to be visible
  await page.locator('[data-testid="timeline-axis"]').waitFor({
    state: 'visible',
    timeout,
  });

  // Wait for at least one axis tick to ensure timeline is rendered
  await page.locator('[data-testid="timeline-axis-tick"]').first().waitFor({
    state: 'visible',
    timeout,
  });
}

/**
 * Returns a map of commonly used test timeline IDs
 * Useful for tests that need to iterate over multiple timelines
 *
 * @returns Object with timeline IDs
 *
 * @example
 * const timelines = getDefaultTestTimelines();
 * for (const timeline of Object.values(timelines)) {
 *   await openTimeline(page, timeline);
 *   // ... test logic
 * }
 */
export function getDefaultTestTimelines() {
  return TEST_TIMELINES;
}

/**
 * Helper to navigate to home page with authenticated user
 *
 * @param page - Playwright page object
 * @param userId - User ID to authenticate as (defaults to 'cynacons')
 *
 * @example
 * await navigateToHome(page, 'alice');
 */
export async function navigateToHome(page: Page, userId: string = 'cynacons'): Promise<void> {
  await setupMockUser(page, userId);
  await page.goto('/');
}
