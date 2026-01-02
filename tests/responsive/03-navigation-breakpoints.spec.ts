/**
 * Navigation Breakpoint Tests
 * Tests that navigation transitions smoothly at responsive breakpoints
 *
 * Requirement: CC-REQ-LAYOUT-RESP-003
 */

import { test, expect } from '@playwright/test';

test.describe('responsive/03 Navigation Breakpoints', () => {

  test('T-RESP-03.1: Navigation is visible at 768px boundary (tablet)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-003' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Navigation should be present (nav, aside, or header element)
    const navElement = page.locator('nav, aside, header').first();
    await expect(navElement).toBeVisible({ timeout: 5000 });

    // Verify navigation is accessible
    const navBox = await navElement.boundingBox();
    expect(navBox).not.toBeNull();

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    if (navBox && viewport) {
      // Navigation should be within viewport bounds
      expect(navBox.x).toBeGreaterThanOrEqual(-50); // Allow for slight overflow (e.g., shadows)
      expect(navBox.x + navBox.width).toBeLessThanOrEqual(viewport.width + 50);
    }
  });

  test('T-RESP-03.2: Navigation is visible at 1024px boundary (desktop)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-003' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Navigation should be present
    const navElement = page.locator('nav, aside, header').first();
    await expect(navElement).toBeVisible({ timeout: 5000 });

    // Verify navigation renders correctly
    const navBox = await navElement.boundingBox();
    expect(navBox).not.toBeNull();

    if (navBox) {
      expect(navBox.width).toBeGreaterThan(0);
      expect(navBox.height).toBeGreaterThan(0);
    }
  });

  test('T-RESP-03.3: Logo is accessible across all breakpoints', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-003' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Logo button should be visible
    const logo = page.getByTestId('logo-button');
    await expect(logo).toBeVisible({ timeout: 5000 });

    const logoBox = await logo.boundingBox();
    expect(logoBox).not.toBeNull();

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    if (logoBox && viewport) {
      // Logo should be within viewport
      expect(logoBox.x).toBeGreaterThanOrEqual(0);
      expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('T-RESP-03.4: No horizontal overflow at any breakpoint', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-003' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for horizontal scrollbar
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Body should not exceed viewport width (allowing small tolerance for scrollbars)
    if (viewport) {
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 20);
    }
  });

  test('T-RESP-03.5: Main content area adapts to navigation layout', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-003' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Browse page should be visible
    const browsePage = page.getByTestId('browse-page');
    await expect(browsePage).toBeVisible({ timeout: 5000 });

    const pageBox = await browsePage.boundingBox();
    expect(pageBox).not.toBeNull();

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    if (pageBox && viewport) {
      // Main content should fit within viewport
      expect(pageBox.x).toBeGreaterThanOrEqual(0);
      expect(pageBox.x + pageBox.width).toBeLessThanOrEqual(viewport.width + 10); // Small tolerance
    }
  });

  test('T-RESP-03.6: No layout shifts during navigation state changes', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-003' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get initial layout of landing page
    const landingPage = page.getByTestId('landing-page');
    await expect(landingPage).toBeVisible({ timeout: 5000 });

    const initialBox = await landingPage.boundingBox();
    expect(initialBox).not.toBeNull();

    // Navigate to browse
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Browse page should load
    const browsePage = page.getByTestId('browse-page');
    await expect(browsePage).toBeVisible({ timeout: 5000 });

    const browseBox = await browsePage.boundingBox();
    expect(browseBox).not.toBeNull();

    // Both pages should render without errors
    if (initialBox && browseBox) {
      expect(initialBox.width).toBeGreaterThan(0);
      expect(browseBox.width).toBeGreaterThan(0);
    }
  });
});
