import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Mobile - Navigation Rail', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip on non-mobile viewports
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only');
  });

  test('Navigation Rail is present and functional on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-005' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Verify NavRail is present (may be collapsed or bottom nav on mobile)
    const navRail = page.locator('[data-testid="nav-rail"]').or(page.locator('nav'));
    await expect(navRail.first()).toBeVisible({ timeout: 5000 });

    // Verify navigation buttons are present and accessible
    const homeButton = page.locator('[data-testid="nav-home"]').or(
      page.locator('nav').locator('button, a').filter({ hasText: /home/i })
    );
    await expect(homeButton.first()).toBeVisible({ timeout: 3000 });

    // Test navigation functionality
    await homeButton.first().click();
    await page.waitForLoadState('domcontentloaded');

    // Verify navigation worked (should be on home page)
    expect(page.url()).toMatch(/\/(home)?$/);
  });

  test('Navigation Rail does not block timeline content', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-005' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline to render
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible({ timeout: 10000 });

    // Verify timeline axis is not obscured by nav rail
    const axisBox = await axis.boundingBox();
    const navRail = page.locator('[data-testid="nav-rail"]').or(page.locator('nav'));
    const navBox = await navRail.first().boundingBox();

    if (axisBox && navBox) {
      // Check if they overlap significantly
      const overlap = !(
        axisBox.x + axisBox.width < navBox.x ||
        navBox.x + navBox.width < axisBox.x ||
        axisBox.y + axisBox.height < navBox.y ||
        navBox.y + navBox.height < axisBox.y
      );

      // If they overlap, ensure nav is transparent or timeline has appropriate padding
      if (overlap) {
        const navOpacity = await navRail.first().evaluate((el) => {
          return window.getComputedStyle(el).opacity;
        });

        // Nav should either be semi-transparent or positioned at bottom
        const isBottomNav = navBox.y > axisBox.y + axisBox.height / 2;
        expect(
          parseFloat(navOpacity) < 1 || isBottomNav
        ).toBeTruthy();
      }
    }
  });
});
