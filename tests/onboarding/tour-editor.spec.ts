import { test, expect, type Locator, type Page } from '@playwright/test';
import { loadTestTimeline, waitForEditorLoaded } from '../utils/timelineTestUtils';

const startEditorTour = async (page: Page): Promise<Locator> => {
  await loadTestTimeline(page, 'french-revolution');
  await waitForEditorLoaded(page, 15000);

  // Ensure the tour can run even if previously completed
  await page.evaluate(() => localStorage.removeItem('tour-completed-editor-tour'));

  const helpButton = page.locator('[data-tour="help-button"]');
  await expect(helpButton).toBeVisible({ timeout: 15000 });
  await helpButton.click();

  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(tooltip).toBeVisible({ timeout: 10000 });
  return tooltip;
};

test.describe('onboarding/editor tour', () => {
  test('can start editor tour from Help button', async ({ page }) => {
    const tooltip = await startEditorTour(page);
    await expect(tooltip).toContainText(/Timeline Editor/i);
  });

  test('tour highlights zoom controls', async ({ page }) => {
    const tooltip = await startEditorTour(page);

    await expect(tooltip).toContainText(/Timeline Editor/i);
    const nextButton = tooltip.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible({ timeout: 5000 });

    await nextButton.click();
    await expect(tooltip).toContainText(/zoom/i);

    const zoomControls = page.locator('[data-tour="zoom-controls"]');
    await expect(zoomControls).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.react-joyride__spotlight')).toBeVisible({ timeout: 5000 });
  });
});
