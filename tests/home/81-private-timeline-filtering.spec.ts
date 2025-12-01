/**
 * Private Timeline Filtering Security Tests (v5/81)
 * v0.5.15 - Ensures private timelines never leak to public discovery feeds
 *
 * Coverage:
 * - T81.1: Private timelines excluded from Recently Edited (unauthenticated)
 * - T81.2: Private timelines excluded from Popular (unauthenticated)
 * - T81.3: Private timelines appear in My Timelines for owner
 * - T81.4: Private timelines not in search results (unauthenticated)
 * - T81.5: Public timelines visible to all users
 * - T81.6: Comprehensive security check across all public feeds
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe.serial('v5/81 Private Timeline Filtering', () => {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const privateTimelineTitle = `Private Filter ${uniqueSuffix}`;
  const publicTimelineTitle = `Public Filter ${uniqueSuffix}`;
  const privateTimelineSlug = `private-filter-${uniqueSuffix}`;
  const publicTimelineSlug = `public-filter-${uniqueSuffix}`;

  const expectHidden = async (locator: Locator, title: string, message: string) => {
    const visible = await locator
      .getByText(title, { exact: false })
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(visible, message).toBe(false);
  };

  const createTimelineFromBrowse = async (
    page: Page,
    title: string,
    slug: string,
    visibility: 'public' | 'private' | 'unlisted'
  ): Promise<void> => {
    await page.getByTestId('create-timeline-button').click();
    await expect(page.getByRole('dialog', { name: /create new timeline/i })).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Description').fill('Security filtering regression coverage');
    await page.getByLabel('Timeline ID').fill(slug);

    if (visibility !== 'public') {
      await page.getByRole('combobox', { name: /public - visible to everyone/i }).click();
      const optionText =
        visibility === 'private'
          ? /Private - Only you can see this/i
          : /Unlisted/i;
      await page.getByRole('option', { name: optionText }).click();
    }

    const submitButton = page.getByRole('button', { name: /create timeline/i });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    await expect(page).toHaveURL(/\/timeline\//, { timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  };

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:5175' });
    const page = await context.newPage();

    await signInWithEmail(page);
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Create a private timeline owned by the test user
    await createTimelineFromBrowse(page, privateTimelineTitle, privateTimelineSlug, 'private');
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Create a public timeline for positive visibility assertions
    await createTimelineFromBrowse(page, publicTimelineTitle, publicTimelineSlug, 'public');

    await context.close();
  });

  test('T81.1: Private timelines excluded from Recently Edited (unauthenticated)', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    const recentSection = page.getByTestId('recently-edited-section');
    await expect(recentSection).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    await expectHidden(
      recentSection,
      privateTimelineTitle,
      `SECURITY FAILURE: Private timeline "${privateTimelineTitle}" leaked in Recently Edited feed`
    );
  });

  test('T81.2: Private timelines excluded from Popular (unauthenticated)', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    const popularSection = page.getByTestId('popular-timelines-section');
    await expect(popularSection).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    await expectHidden(
      popularSection,
      privateTimelineTitle,
      `SECURITY FAILURE: Private timeline "${privateTimelineTitle}" leaked in Popular feed`
    );
  });

  test('T81.3: Private timelines appear in My Timelines for owner', async ({ page }) => {
    await signInWithEmail(page);
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const mySection = page.getByTestId('my-timelines-section');
    await expect(mySection).toBeVisible({ timeout: 15000 });

    const privateCard = mySection.locator('div').filter({ hasText: privateTimelineTitle }).first();
    await expect(privateCard).toBeVisible({ timeout: 10000 });

    const badgeVisible = await privateCard.getByText(/Private/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(badgeVisible, 'Private timeline should be labeled as private for the owner').toBe(true);
  });

  test('T81.4: Private timelines not in search results (unauthenticated)', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.getByTestId('browse-search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const searchTerm = privateTimelineTitle.slice(0, Math.min(12, privateTimelineTitle.length));
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(1200);

    const leakCount = await page.locator(`text=${privateTimelineTitle}`).count();
    expect(leakCount, `SECURITY FAILURE: Private timeline "${privateTimelineTitle}" surfaced in search results`).toBe(0);
  });

  test('T81.5: Public timelines visible to all users', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const recentSection = page.getByTestId('recently-edited-section');
    const popularSection = page.getByTestId('popular-timelines-section');
    await expect(recentSection).toBeVisible({ timeout: 15000 });
    await expect(popularSection).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    const publicVisible =
      (await recentSection.getByText(publicTimelineTitle, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await popularSection.getByText(publicTimelineTitle, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false));

    expect(publicVisible, `Public timeline "${publicTimelineTitle}" should be visible in discovery feeds for all users`).toBe(true);
  });

  test('T81.6: Comprehensive security check across all public feeds', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const sections = [
      { name: 'Recently Edited', locator: page.getByTestId('recently-edited-section') },
      { name: 'Popular', locator: page.getByTestId('popular-timelines-section') },
    ];

    for (const section of sections) {
      await expect(section.locator).toBeVisible({ timeout: 15000 });
      await expectHidden(
        section.locator,
        privateTimelineTitle,
        `SECURITY FAILURE: Private timeline "${privateTimelineTitle}" visible in ${section.name}`
      );
    }

    const discoveryHasPublic =
      (await sections[0].locator.getByText(publicTimelineTitle, { exact: false }).isVisible({ timeout: 4000 }).catch(() => false)) ||
      (await sections[1].locator.getByText(publicTimelineTitle, { exact: false }).isVisible({ timeout: 4000 }).catch(() => false));

    expect(discoveryHasPublic, 'Public discovery feeds should include the public timeline created for this suite').toBe(true);
  });
});
