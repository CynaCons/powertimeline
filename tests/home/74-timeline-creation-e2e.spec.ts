/**
 * Timeline Creation End-to-End Tests (v5/74)
 * Tests timeline creation workflow from HomePage with slug generation validation
 *
 * Test Coverage:
 * - T74.1: Create timeline with English title → verify slug generation
 * - T74.2: Create timeline with accented title → verify accent removal
 * - T74.3: Create timeline with special characters → verify sanitization
 * - T74.4: Test ID uniqueness validation → duplicate slug shows error
 * - T74.5: Verify navigation to timeline editor after creation
 */

import { test, expect } from '@playwright/test';

test.describe('Timeline Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start from HomePage
    await page.goto('/');

    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to initialize demo data
    await page.reload();

    // Wait for page to be ready
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
  });

  test('T74.1: Create timeline with English title → verify slug generation', async ({ page }) => {
    // Click "Create New" button
    await page.getByRole('button', { name: /create new/i }).first().click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create New Timeline')).toBeVisible();

    // Fill in form
    await page.getByLabel('Title').fill('World War II Events');
    await page.getByLabel('Description').fill('Key events from World War II');

    // Verify ID field auto-populated
    const idField = page.getByLabel('Timeline ID');
    await expect(idField).toHaveValue('world-war-ii-events');

    // Click Create
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to timeline editor (toast may appear/disappear quickly)
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-world-war-ii-events/, { timeout: 15000 });
  });

  test('T74.2: Create timeline with accented title → verify accent removal', async ({ page }) => {
    // Click "Create New" button
    await page.getByRole('button', { name: /create new/i }).first().click();

    // Fill in form with accented characters
    await page.getByLabel('Title').fill('Révolution Française');
    await page.getByLabel('Description').fill('Histoire de la Révolution Française 1789-1799');

    // Verify ID field removes accents correctly
    const idField = page.getByLabel('Timeline ID');
    await expect(idField).toHaveValue('revolution-francaise');

    // Create timeline
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Verify navigation (toast may appear/disappear quickly)
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-revolution-francaise/, { timeout: 15000 });
  });

  test('T74.3: Create timeline with special characters → verify sanitization', async ({ page }) => {
    // Click "Create New" button
    await page.getByRole('button', { name: /create new/i }).first().click();

    // Fill in title with special characters
    await page.getByLabel('Title').fill('Napoleon\'s Rise & Fall (1799–1815)');
    await page.getByLabel('Description').fill('Story of Napoleon Bonaparte');

    // Verify ID sanitized correctly
    const idField = page.getByLabel('Timeline ID');
    await expect(idField).toHaveValue('napoleon-s-rise-fall-1799-1815');

    // Create timeline
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Verify timeline was created by checking URL navigation
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-napoleon-s-rise-fall-1799-1815/, { timeout: 15000 });
  });

  test('T74.4: Test ID uniqueness validation → duplicate slug shows error', async ({ page }) => {
    // Create first timeline
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('French Revolution');
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Wait for navigation to complete
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-french-revolution/);

    // Go back to home page
    await page.goto('/');
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Try to create timeline with same slug
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('French Revolution'); // Same title → same slug

    // Trigger blur to run validation
    await page.getByLabel('Timeline ID').blur();

    // Wait a moment for validation to run
    await page.waitForTimeout(500);

    // Should show error (ID already exists) in the dialog
    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 3000 });

    // Create button should be disabled
    await expect(page.getByRole('button', { name: /create timeline/i })).toBeDisabled();
  });

  test('T74.5: Verify timeline creation from empty state', async ({ page }) => {
    // Clear all timelines first
    await page.evaluate(() => {
      localStorage.setItem('powertimeline_timelines', JSON.stringify([]));
    });
    await page.reload();

    // Should show empty state
    await expect(page.getByText(/you haven't created any timelines yet/i)).toBeVisible();

    // Click "Create Your First Timeline" button from empty state
    await page.getByRole('button', { name: /create your first timeline/i }).click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Create timeline
    await page.getByLabel('Title').fill('My First Timeline');
    await page.getByLabel('Description').fill('Getting started with PowerTimeline');
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to editor
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-my-first-timeline/);
  });
});
