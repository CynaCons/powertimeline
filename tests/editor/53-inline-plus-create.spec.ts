import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/53 Inline "+" affordances open Create overlay', () => {
  test('top and bottom add buttons open Create', async ({ page }) => {
    // Load timeline with events so list exists
    await loadTestTimeline(page, 'napoleon-bonaparte');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await expect(page.getByPlaceholder('Filter...')).toBeVisible();

    // Top add button
    await page.getByTestId('events-add-top').click();
    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();
    // Close authoring
    await page.getByRole('button', { name: /Close/i }).click();

    // Re-open Events panel
    await page.getByRole('button', { name: 'Events' }).click();

    // Bottom add button
    const didClick = await page.evaluate(() => {
      const aside = document.querySelector('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
      const btn = aside?.querySelector('[data-testid="events-add-bottom"]') as HTMLElement | null;
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); return true; }
      return false;
    });
    expect(didClick).toBeTruthy();
    await expect(overlay).toBeVisible();
  });
});
