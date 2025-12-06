import { test, expect, type Locator, type Page } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';
import { skipIfNoCredentials } from '../utils/timelineTestUtils';

const startHomeTour = async (page: Page): Promise<Locator> => {
  await signInWithEmail(page);
  await page.goto('/browse');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('browse-page')).toBeVisible({ timeout: 15000 });

  // Ensure tour isn't suppressed by completion flag
  await page.evaluate(() => localStorage.removeItem('tour-completed-home-tour'));

  const helpButton = page.locator('[data-tour="help-button"]');
  await expect(helpButton).toBeVisible({ timeout: 15000 });
  await helpButton.click();

  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(tooltip).toBeVisible({ timeout: 10000 });
  return tooltip;
};

test.describe('onboarding/home tour', () => {
  skipIfNoCredentials(test);

  test('can start tour from Help button', async ({ page }) => {
    const tooltip = await startHomeTour(page);
    await expect(tooltip).toContainText(/Welcome/i);
  });

  test('tour can be skipped', async ({ page }) => {
    const tooltip = await startHomeTour(page);
    const skipButton = tooltip.getByRole('button', { name: /Skip/i });

    await expect(skipButton).toBeVisible({ timeout: 5000 });
    await skipButton.click();

    await expect(tooltip).toBeHidden({ timeout: 5000 });
    await expect(page.locator('.react-joyride__spotlight')).toBeHidden({ timeout: 5000 });
  });

  test('tour progresses through steps', async ({ page }) => {
    const tooltip = await startHomeTour(page);

    await expect(tooltip).toContainText(/Welcome/i);
    const nextButton = tooltip.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible({ timeout: 5000 });

    await nextButton.click();
    await expect(tooltip).toContainText(/My Timelines/i);
    await expect(page.locator('[data-tour="my-timelines"]')).toBeVisible({ timeout: 10000 });
  });
});
