/**
 * Search Functionality Tests
 * v0.5.15 - Home search validations for timelines and users
 *
 * Covers CC-REQ-SEARCH-001/002/003/004
 */

import { test, expect, type Page } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

const SEARCH_INPUT_TEST_ID = 'browse-search-input';
const DROPDOWN_SELECTOR = '[data-testid="browse-search-dropdown"]';

const KNOWN_TIMELINE_TITLE = 'French Revolution';
const SECONDARY_TIMELINE_TITLE = 'Napoleon Bonaparte';
const KNOWN_USERNAME = 'cynacons';
const EMAIL_FRAGMENT = 'powertimeline.dev';
const DESCRIPTION_QUERY = 'exile';

async function openBrowsePage(page: Page): Promise<void> {
  await page.goto('/browse');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId(SEARCH_INPUT_TEST_ID)).toBeVisible({ timeout: 10000 });
  // Allow Firestore-backed data to hydrate before searching
  await page.waitForTimeout(800);
}

async function typeAndWaitForDropdown(page: Page, query: string) {
  const input = page.getByTestId(SEARCH_INPUT_TEST_ID);
  await input.fill(query);

  if (query.trim().length < 2) {
    await page.waitForTimeout(300);
    return null;
  }

  const dropdown = page.locator(DROPDOWN_SELECTOR).first();
  await expect(dropdown).toBeVisible({ timeout: 5000 });
  return dropdown;
}

test.describe('v5/77 Home Search Functionality', () => {

  test('T77.1: Search finds timelines by title', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, 'French');
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for timeline title search');
    }

    await expect(dropdown.getByText(KNOWN_TIMELINE_TITLE, { exact: false })).toBeVisible();
  });

  test('T77.2: Search finds users by username', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, KNOWN_USERNAME.slice(0, 6));
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for user search');
    }

    await expect(dropdown.getByText(`@${KNOWN_USERNAME}`, { exact: false })).toBeVisible();
  });

  test('T77.3: Case-insensitive search', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, 'fReNcH reVoLuTiOn');
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for mixed-case query');
    }

    await expect(dropdown.getByText(KNOWN_TIMELINE_TITLE, { exact: false })).toBeVisible();
  });

  test('T77.4: Minimum 2 characters validation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, 'f');
    expect(dropdown).toBeNull();

    const visible = await page.locator(DROPDOWN_SELECTOR).first().isVisible().catch(() => false);
    expect(visible).toBe(false);
  });

  test('T77.5: Results categorized by Timelines and Users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-002' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, 'on');
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for category check');
    }

    await expect(dropdown.getByText(/Timelines/i)).toBeVisible();
    await expect(dropdown.getByText(/Users/i)).toBeVisible();
  });

  test('T77.6: Clicking a search result navigates to timeline', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-002' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, KNOWN_TIMELINE_TITLE);
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for navigation test');
    }

    await dropdown.getByText(KNOWN_TIMELINE_TITLE, { exact: false }).click();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toMatch(/\/timeline\/french-revolution/);
  });

  test('T77.7: No results message displayed when nothing matches', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-003' });

    await openBrowsePage(page);
    const query = 'zzzzqwertysearch';
    const dropdown = await typeAndWaitForDropdown(page, query);
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for no-results test');
    }

    await expect(dropdown.getByText(`No results found for "${query}"`, { exact: false })).toBeVisible();
  });

  test('T77.8: Clear button empties search and hides dropdown', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-004' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, KNOWN_TIMELINE_TITLE);
    if (!dropdown) {
      throw new Error('Search dropdown did not appear before clearing');
    }

    const clearButton = page.getByRole('button', { name: 'Clear search' });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await expect(page.getByTestId(SEARCH_INPUT_TEST_ID)).toHaveValue('');
    const visible = await page.locator(DROPDOWN_SELECTOR).first().isVisible().catch(() => false);
    expect(visible).toBe(false);
  });

  test('T77.9: Keyboard shortcut "/" focuses the search input', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const input = page.getByTestId(SEARCH_INPUT_TEST_ID);

    // Defocus input if it was auto-focused
    await page.getByTestId('browse-page').click({ position: { x: 10, y: 10 } });
    try {
      await expect(input).toBeFocused({ timeout: 0 });
      await page.keyboard.press('Tab');
    } catch {
      // Input not focused; nothing to blur
    }

    await page.keyboard.press('/');
    await expect(input).toBeFocused();
  });

  test('T77.10: Search works the same with or without authentication', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    // Unauthenticated search
    await openBrowsePage(page);
    const unauthDropdown = await typeAndWaitForDropdown(page, KNOWN_TIMELINE_TITLE);
    if (!unauthDropdown) {
      throw new Error('Unauthenticated search did not return results');
    }
    await expect(unauthDropdown.getByText(KNOWN_TIMELINE_TITLE, { exact: false })).toBeVisible();

    // Authenticated search
    await signInWithEmail(page);
    await openBrowsePage(page);
    const authDropdown = await typeAndWaitForDropdown(page, KNOWN_TIMELINE_TITLE);
    if (!authDropdown) {
      throw new Error('Authenticated search did not return results');
    }
    await expect(authDropdown.getByText(KNOWN_TIMELINE_TITLE, { exact: false })).toBeVisible();
  });

  test('T77.11: Search matches timeline descriptions', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, DESCRIPTION_QUERY);
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for description query');
    }

    await expect(dropdown.getByText(SECONDARY_TIMELINE_TITLE, { exact: false })).toBeVisible();
  });

  test('T77.12: Search matches user emails', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, EMAIL_FRAGMENT);
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for email query');
    }

    await expect(dropdown.getByText(EMAIL_FRAGMENT, { exact: false }).first()).toBeVisible();
  });

  test('T77.13: Result limits enforced (10 timelines / 5 users)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-002' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, 'on');
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for result limit check');
    }

    const timelineHeading = dropdown.locator('h3:has-text("Timelines")').first();
    const timelineButtons = timelineHeading.locator('xpath=../div//button');
    const timelineCount = (await timelineHeading.isVisible().catch(() => false))
      ? await timelineButtons.count()
      : 0;
    expect(timelineCount).toBeLessThanOrEqual(10);

    const userHeading = dropdown.locator('h3:has-text("Users")').first();
    const userButtons = userHeading.locator('xpath=../div//button');
    const userCount = (await userHeading.isVisible().catch(() => false))
      ? await userButtons.count()
      : 0;
    expect(userCount).toBeLessThanOrEqual(5);
  });

  test('T77.14: Dropdown shows for valid queries and hides when query is shortened', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-002' });

    await openBrowsePage(page);
    const dropdown = await typeAndWaitForDropdown(page, 'fr');
    if (!dropdown) {
      throw new Error('Search dropdown did not appear for initial valid query');
    }
    await expect(dropdown).toBeVisible();

    // Shorten query below 2 chars to hide results
    await page.getByTestId(SEARCH_INPUT_TEST_ID).press('Backspace');
    await page.waitForTimeout(200);

    const visible = await page.locator(DROPDOWN_SELECTOR).first().isVisible().catch(() => false);
    expect(visible).toBe(false);
  });
});
