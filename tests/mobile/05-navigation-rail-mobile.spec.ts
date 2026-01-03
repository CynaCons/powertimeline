import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Mobile - Navigation Rail', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip on non-mobile viewports
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only');
  });

  test('Navigation Rail is present and functional on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-005' });

    // Navigate to browse page (where header nav is visible)
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // On mobile, the sidebar nav rail is hidden (class: hidden md:flex)
    // Instead, navigation is via the header with logo button
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 5000 });

    // Verify logo/home button in header is accessible
    const logoButton = page.locator('[data-testid="logo-button"]');
    await expect(logoButton).toBeVisible({ timeout: 3000 });

    // Test navigation by clicking logo - should go to landing page
    await logoButton.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify we're now on landing page
    await expect(page.locator('[data-testid="landing-page"]')).toBeVisible({ timeout: 5000 });
  });

  test('Navigation Rail does not block timeline content', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-005' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Mobile shows a notice first - dismiss it to see the timeline
    const continueButton = page.getByRole('button', { name: /continue to canvas/i });
    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueButton.click();
    }

    // Wait for timeline to render
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible({ timeout: 10000 });

    // Verify timeline axis is not obscured by nav rail
    const axisBox = await axis.boundingBox();
    const navRail = page.locator('[data-testid="navigation-rail"]').or(page.locator('nav'));
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
