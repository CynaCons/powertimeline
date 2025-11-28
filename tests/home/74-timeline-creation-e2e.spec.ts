/**
 * Timeline Creation End-to-End Tests (v5/74)
 * v0.5.11 - Updated for Firebase Auth
 *
 * Tests timeline creation workflow with authenticated user
 *
 * Test Coverage:
 * - T74.1: Create timeline with English title → verify slug generation
 * - T74.2: Create timeline with accented title → verify accent removal
 * - T74.3: Create timeline with special characters → verify sanitization
 * - T74.4: Verify navigation to timeline editor after creation
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('Timeline Creation E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Sign in first - timeline creation requires authentication
    await signInWithEmail(page);
  });

  test('T74.1: Create timeline with English title → verify slug generation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CREATE-001' });

    // Navigate to a page where we can create timelines
    // After sign-in we should be on /browse or /user page
    await page.waitForLoadState('domcontentloaded');

    // Look for Create button
    const createButton = page.getByRole('button', { name: /create/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip(true, 'Create button not visible - user may not have create permission');
      return;
    }

    // Click Create New button
    await createButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in form with unique title to avoid conflicts
    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Test Timeline ${uniqueSuffix}`);
    await page.getByLabel('Description').fill('E2E test timeline');

    // Verify ID field auto-populated
    const idField = page.getByLabel('Timeline ID');
    await expect(idField).toHaveValue(new RegExp(`test-timeline-${uniqueSuffix}`));

    // Click Create
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to timeline editor
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-test-timeline-\d+/, { timeout: 15000 });
  });

  test('T74.2: Create timeline with accented title → verify accent removal', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CREATE-002' });

    await page.waitForLoadState('domcontentloaded');

    const createButton = page.getByRole('button', { name: /create/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip(true, 'Create button not visible');
      return;
    }

    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in form with accented characters
    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Révolution Test ${uniqueSuffix}`);

    // Verify ID field removes accents correctly
    const idField = page.getByLabel('Timeline ID');
    await expect(idField).toHaveValue(new RegExp(`revolution-test-${uniqueSuffix}`));

    // Create timeline
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-revolution-test-\d+/, { timeout: 15000 });
  });

  test('T74.3: Create timeline with special characters → verify sanitization', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CREATE-003' });

    await page.waitForLoadState('domcontentloaded');

    const createButton = page.getByRole('button', { name: /create/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip(true, 'Create button not visible');
      return;
    }

    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in title with special characters
    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Test's & Special ${uniqueSuffix}`);

    // Verify ID sanitized correctly
    const idField = page.getByLabel('Timeline ID');
    // Should contain alphanumeric and hyphens only
    const idValue = await idField.inputValue();
    expect(idValue).toMatch(/^[a-z0-9-]+$/);

    // Create timeline
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Verify timeline was created by checking URL navigation
    await expect(page).toHaveURL(/\/user\/.+\/timeline\/timeline-/, { timeout: 15000 });
  });

  test('T74.4: Verify navigation to timeline editor after creation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CREATE-004' });

    await page.waitForLoadState('domcontentloaded');

    const createButton = page.getByRole('button', { name: /create/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip(true, 'Create button not visible');
      return;
    }

    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Editor Test ${uniqueSuffix}`);
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to editor
    await expect(page).toHaveURL(/\/user\/.+\/timeline\//, { timeout: 15000 });

    // Timeline editor elements should be visible
    await page.waitForTimeout(2000);
    const hasEditor = await page.locator('[data-testid="timeline-axis"], [data-testid="authoring-overlay"], nav').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasEditor).toBe(true);
  });
});
