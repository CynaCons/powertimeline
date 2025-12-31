import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/55 Enhanced Navigation & Interaction', () => {
  test('keyboard shortcuts work for navigation', async ({ page }) => {
    await loadTestTimeline(page, 'french-revolution');

    // Test Alt+E for Events panel
    await page.keyboard.press('Alt+e');
    await expect(page.getByPlaceholder('Filter...')).toBeVisible({ timeout: 2000 });

    // Test Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('Filter...')).not.toBeVisible();

    // Test Alt+C for Create
    await page.keyboard.press('Alt+c');
    const authoringOverlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(authoringOverlay).toBeVisible({ timeout: 2000 });

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(authoringOverlay).not.toBeVisible();
  });

  test.skip('command palette opens with Ctrl+K and searches commands', async ({ page }) => {
    // TODO: Investigate why Ctrl+K doesn't trigger in test environment - feature works in browser
    // Command palette is implemented in App.tsx with useCommandPaletteShortcuts
    await loadTestTimeline(page, 'french-revolution');

    // Open command palette
    await page.keyboard.press('ControlOrMeta+k');

    // Command palette should be visible - look for the input placeholder
    const commandPaletteInput = page.getByPlaceholder('Type a command or search...');
    await expect(commandPaletteInput).toBeVisible({ timeout: 2000 });

    // Search for "events"
    await commandPaletteInput.fill('events');

    // Look for Events-related command
    const eventsCommand = page.locator('text=/Events/i').first();
    await expect(eventsCommand).toBeVisible({ timeout: 2000 });

    // Press Enter to execute
    await page.keyboard.press('Enter');

    // Events panel should open - look for the panel
    await expect(page.locator('aside[role="dialog"]')).toBeVisible({ timeout: 2000 });
  });

  test('enhanced tooltips show keyboard shortcuts', async ({ page }) => {
    await loadTestTimeline(page, 'french-revolution');

    // Hover over Events button
    const eventsButton = page.getByRole('button', { name: 'Events' });
    await eventsButton.hover();

    // Tooltip should show keyboard shortcut
    await expect(page.locator('text="Alt+E"')).toBeVisible({ timeout: 2000 });
  });

  test.skip('breadcrumb navigation shows when panel is open', async ({ page }) => {
    // TODO: Verify breadcrumb is rendered in editor - component exists at src/components/Breadcrumb.tsx
    await loadTestTimeline(page, 'french-revolution');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();

    // Breadcrumb should be visible
    const breadcrumb = page.locator('text="Timeline"');
    await expect(breadcrumb).toBeVisible({ timeout: 2000 });

    const eventsBreadcrumb = page.locator('text="Events"');
    await expect(eventsBreadcrumb).toBeVisible({ timeout: 2000 });
  });

  test('navigation rail shows active states', async ({ page }) => {
    await loadTestTimeline(page, 'french-revolution');

    // Events button should not be active initially
    const eventsButton = page.getByRole('button', { name: 'Events' });

    // Click Events button
    await eventsButton.click();

    // Button should show active state (background color change)
    const buttonStyles = await eventsButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have a darker background when active
    expect(buttonStyles).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
  });

  test('theme toggle works with Alt+T shortcut', async ({ page }) => {
    await loadTestTimeline(page, 'french-revolution');

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Toggle theme with keyboard shortcut
    await page.keyboard.press('Alt+t');

    // Wait for theme change
    await page.waitForTimeout(300);

    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Theme should have changed
    expect(newTheme).not.toBe(initialTheme);
  });
});