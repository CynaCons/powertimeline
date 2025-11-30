import { test, expect, Page } from '@playwright/test';

/**
 * Wait for timeline events to render - fails if no events appear within timeout
 */
const waitForEvents = async (page: Page) => {
  const eventCards = page.getByTestId('event-card');
  await expect(eventCards.first()).toBeVisible({ timeout: 10000 });
  const eventCount = await eventCards.count();
  expect(eventCount).toBeGreaterThan(0);
};

test.describe('v5/01 Foundation', () => {
  test('app loads and shows timeline axis', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-FOUND-001' });

    // Load a public timeline (no auth required for viewing)
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Check URL loaded correctly (not 404)
    expect(page.url()).toContain('french-revolution');
    expect(page.url()).not.toContain('/login');

    // Check for 404 page - should NOT be visible
    const has404 = await page.getByRole('heading', { name: '404' }).isVisible().catch(() => false);
    expect(has404).toBe(false);

    // Require at least one event to render from the timeline dataset
    await waitForEvents(page);

    // Axis should render from the Firestore dataset
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible({ timeout: 10000 });

    const firstTick = page.locator('[data-testid="timeline-axis-tick"]').first();
    await expect(firstTick).toBeVisible({ timeout: 5000 });
  });
});
