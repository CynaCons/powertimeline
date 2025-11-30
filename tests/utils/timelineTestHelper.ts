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
 * Firebase Auth test user for E2E testing
 * Created via scripts/create-test-user.ts with Firebase Admin SDK
 *
 * SECURITY: Credentials are loaded from environment variables
 * Create a .env.test file (never commit it!) with:
 *   TEST_USER_EMAIL=test@powertimeline.com
 *   TEST_USER_PASSWORD=your_password
 *   TEST_USER_UID=your_uid
 *   TEST_USER_TIMELINE_ID=your_timeline_id
 *
 * @see tests/e2e/01-full-user-journey.spec.ts for usage example
 * @see .env.test.example for template
 */
export const TEST_USERS = {
  E2E_TEST_USER: {
    uid: process.env.TEST_USER_UID || 'iTMZ9n0IuzUSbhWfCaR86WsB2AC3',
    email: process.env.TEST_USER_EMAIL || 'test@powertimeline.com',
    password: process.env.TEST_USER_PASSWORD || '', // MUST be set in .env.test
    timelineId: process.env.TEST_USER_TIMELINE_ID || 'zEAJkBfgpYt3YdCLW2tz',
  },
  // Legacy demo users (DEPRECATED - v0.5.6)
  // Use Firebase Auth E2E_TEST_USER for new tests
  CYNACONS: {
    id: 'cynacons',
    name: 'Cynacons',
    email: 'cynacons@example.com',
  },
} as const;

/**
 * Authenticates a test user using Firebase Auth
 *
 * @param page - Playwright page object
 * @param email - Email address (defaults to E2E test user)
 * @param password - Password (defaults to E2E test user password)
 *
 * @example
 * // Use default E2E test user
 * await loginWithFirebaseAuth(page);
 *
 * // Use custom credentials
 * await loginWithFirebaseAuth(page, 'custom@example.com', 'password123');
 *
 * v0.5.6: Updated to use Firebase Authentication instead of localStorage
 */
export async function loginWithFirebaseAuth(
  page: Page,
  email: string = TEST_USERS.E2E_TEST_USER.email,
  password: string = TEST_USERS.E2E_TEST_USER.password
): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit form using data-testid
  await page.getByTestId('sign-in-submit-button').click();

  // Wait for auth to complete and redirect
  await page.waitForURL('/');
  await page.waitForTimeout(1000); // Allow auth state to settle
}

/**
 * REMOVED (v0.5.6): setupMockUser() has been deleted
 * @deprecated Use loginWithFirebaseAuth() instead
 * Demo user system completely removed - Firebase Auth only
 */
export async function setupMockUser(page: Page, _userId: string = 'cynacons'): Promise<void> {
  throw new Error('setupMockUser() has been removed. Use loginWithFirebaseAuth() instead. Demo user system (Alice, Bob, Charlie) is no longer supported.');
}

/**
 * DEPRECATED (v0.5.6): Navigates to a specific timeline
 * @deprecated Demo users removed - timelines are publicly viewable without authentication
 *
 * For unauthenticated viewing: Just navigate to timeline URL
 * For authenticated editing: Use loginWithFirebaseAuth() first
 *
 * @param page - Playwright page object
 * @param timelineId - Timeline ID to navigate to
 * @param ownerUsername - Owner username (defaults to 'cynako')
 *
 * @example
 * // View timeline without auth (read-only)
 * await page.goto('/@cynako/timeline/timeline-napoleon');
 *
 * // Edit timeline (requires auth)
 * await loginWithFirebaseAuth(page);
 * await page.goto(`/@${username}/timeline/${timelineId}`);
 */
export async function openTimeline(
  page: Page,
  timelineId: string,
  ownerUsername: string = 'cynako'
): Promise<void> {
  console.warn('openTimeline() is deprecated. Just use page.goto() directly.');

  // v0.5.14: Use new username-based URL pattern
  const url = `/@${ownerUsername}/timeline/${timelineId}`;

  // Simply navigate - no authentication needed for public viewing
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
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
 * DEPRECATED (v0.5.6): Navigate to home page
 * @deprecated Use page.goto('/') or page.goto('/browse') directly
 *
 * For authenticated navigation: Use loginWithFirebaseAuth() first
 *
 * @param page - Playwright page object
 * @param userId - IGNORED - demo users removed
 *
 * @example
 * // Unauthenticated
 * await page.goto('/');
 *
 * // Authenticated
 * await loginWithFirebaseAuth(page);
 * await page.goto('/browse');
 */
export async function navigateToHome(page: Page, _userId: string = 'cynacons'): Promise<void> {
  console.warn('navigateToHome() is deprecated. Use page.goto() directly.');
  await page.goto('/');
}
