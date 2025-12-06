import { test, expect, type Locator, type Page } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';
import { skipIfNoCredentials } from '../utils/timelineTestUtils';

/**
 * Navigate to the My Timelines empty state and skip if the test user already has timelines.
 */
const openEmptyState = async (page: Page): Promise<Locator> => {
  await signInWithEmail(page);
  await page.goto('/browse');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('browse-page')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 15000 });

  // Allow Firestore fetch to settle before checking for empty state
  await page.waitForTimeout(1000);

  const emptyState = page.getByTestId('empty-state-cta');
  const isEmptyVisible = await emptyState.isVisible().catch(() => false);
  if (!isEmptyVisible) {
    test.skip('Test user already has timelines; empty state CTA not rendered.');
  }

  return emptyState;
};

test.describe('onboarding/empty state CTA', () => {
  skipIfNoCredentials(test);

  test('shows empty state when user has no timelines', async ({ page }) => {
    const emptyState = await openEmptyState(page);
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Create your first timeline');
  });

  test('has Create Timeline button', async ({ page }) => {
    const emptyState = await openEmptyState(page);
    const createButton = emptyState.getByRole('button', { name: /Create Timeline/i });

    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    await createButton.click({ trial: true });
  });

  test('has Take a Tour button', async ({ page }) => {
    const emptyState = await openEmptyState(page);
    const tourButton = emptyState.getByRole('button', { name: /Take a Tour/i });

    await expect(tourButton).toBeVisible();
    await expect(tourButton).toBeEnabled();
    await tourButton.click({ trial: true });
  });
});
