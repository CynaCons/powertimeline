import { test, expect } from '@playwright/test';

test.describe('Tool-intent marketing pages', () => {
  test('timeline-maker renders outline, CTAs, and demo link', async ({ page }) => {
    await page.goto('/timeline-maker');
    await expect(page.locator('[data-testid="tool-intent-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-intent-h1"]')).toHaveText(
      'Free timeline maker for timelines people can explore'
    );
    await expect(page).toHaveTitle(/Free Timeline Maker/i);
    await expect(page.getByRole('link', { name: 'iPhone Milestones' })).toHaveAttribute(
      'href',
      'https://powertimeline.com/cynacons/timeline/iphone-milestones'
    );
    await expect(page.getByTestId('tool-intent-cta-create')).toBeVisible();
    await expect(page.getByTestId('tool-intent-cta-fork')).toBeVisible();
    await expect(page.getByRole('link', { name: 'TimelineJS alternative' })).toBeVisible();
    await expect(page.getByText('TODO: product truth — auth')).toBeVisible();
  });

  test('timelinejs-alternative includes compare table and React demo', async ({ page }) => {
    await page.goto('/timelinejs-alternative');
    await expect(page.locator('[data-testid="tool-intent-h1"]')).toHaveText(
      'A TimelineJS alternative built for denser, living timelines'
    );
    await expect(page.getByRole('table', { name: /TimelineJS vs PowerTimeline/i })).toBeVisible();
    await expect(page.getByTestId('tool-intent-demo-link')).toHaveAttribute(
      'href',
      'https://powertimeline.com/cynacons/timeline/react-versions'
    );
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });

  test('frise-chronologique is French and links WC2022 without FIFA branding', async ({ page }) => {
    await page.goto('/frise-chronologique');
    await expect(page.locator('[data-testid="tool-intent-h1"]')).toHaveText(
      /Frise chronologique en ligne/
    );
    await expect(page.getByTestId('tool-intent-demo-link')).toHaveAttribute(
      'href',
      'https://powertimeline.com/cynacons/timeline/world-cup-2022'
    );
    await expect(page.getByRole('link', { name: 'Timeline maker' })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toContain('fifa');
  });
});
