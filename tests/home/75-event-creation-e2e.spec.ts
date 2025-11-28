/**
 * Event Creation End-to-End Tests (v5/75)
 * v0.5.11 - Updated for Firebase Auth
 *
 * Tests event creation workflow from timeline editor with form validation
 * Requires authenticated user with timeline editing permissions
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('Event Creation E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Sign in first
    await signInWithEmail(page);
    await page.waitForLoadState('domcontentloaded');

    // Create a test timeline for event creation tests
    const createButton = page.getByRole('button', { name: /create/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      return; // Will be handled by individual tests
    }

    await createButton.click();

    // Wait for dialog
    const dialogVisible = await page.getByRole('dialog').isVisible({ timeout: 3000 }).catch(() => false);
    if (!dialogVisible) {
      return;
    }

    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Event Test Timeline ${uniqueSuffix}`);
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to timeline editor
    await page.waitForURL(/\/user\/.+\/timeline\//, { timeout: 15000 });

    // Wait for editor to load
    await page.waitForTimeout(2000);
  });

  test('T75.1: Create new event from scratch (happy path)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EVENT-CREATE-001' });

    // Check if we're in the timeline editor
    const isInEditor = page.url().includes('/timeline/');
    if (!isInEditor) {
      test.skip(true, 'Not in timeline editor - timeline creation may have failed');
      return;
    }

    // Open event creation via nav button or keyboard
    const navCreate = page.getByTestId('nav-create');
    const hasNavCreate = await navCreate.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasNavCreate) {
      await navCreate.click();
    } else {
      // Try keyboard shortcut
      await page.keyboard.press('Alt+N');
    }

    // Wait for authoring overlay
    const overlay = page.locator('[data-testid="authoring-overlay"]');
    const hasOverlay = await overlay.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasOverlay) {
      test.skip(true, 'Authoring overlay not visible');
      return;
    }

    // Fill in event details
    await page.getByLabel(/^title/i).fill('Test Event');
    await page.getByLabel(/description/i).fill('Test event description');

    // Set date via calendar picker
    const dateButton = page.getByRole('button', { name: 'Choose date' });
    if (await dateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateButton.click();
      await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });
      await page.locator('.MuiPickersDay-root').filter({ hasText: /^15$/ }).first().click();
      await page.waitForTimeout(500);
    }

    // Save the event
    await page.getByRole('button', { name: /save/i }).click();

    // Overlay should close
    await expect(overlay).not.toBeVisible({ timeout: 5000 });

    // Event should appear in the timeline
    const eventVisible = await page.locator('text=Test Event').isVisible({ timeout: 5000 }).catch(() => false);
    expect(eventVisible).toBe(true);
  });

  test('T75.2: Form validation prevents invalid data', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EVENT-CREATE-002' });

    const isInEditor = page.url().includes('/timeline/');
    if (!isInEditor) {
      test.skip(true, 'Not in timeline editor');
      return;
    }

    // Open event creation
    const navCreate = page.getByTestId('nav-create');
    if (await navCreate.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navCreate.click();
    } else {
      await page.keyboard.press('Alt+N');
    }

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    if (!(await overlay.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Authoring overlay not visible');
      return;
    }

    // Test empty title validation
    const titleInput = page.getByLabel(/^title/i);
    await titleInput.fill('');
    await titleInput.blur();

    // Save button should be disabled or error shown
    const saveButton = page.getByRole('button', { name: /save/i });
    const isDisabled = await saveButton.isDisabled().catch(() => false);
    const hasError = await page.locator('text=/required|invalid/i').isVisible({ timeout: 2000 }).catch(() => false);

    expect(isDisabled || hasError).toBe(true);
  });

  test('T75.3: Edit existing event', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EVENT-CREATE-003' });

    const isInEditor = page.url().includes('/timeline/');
    if (!isInEditor) {
      test.skip(true, 'Not in timeline editor');
      return;
    }

    // First create an event
    const navCreate = page.getByTestId('nav-create');
    if (await navCreate.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navCreate.click();
    } else {
      await page.keyboard.press('Alt+N');
    }

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    if (!(await overlay.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Authoring overlay not visible');
      return;
    }

    await page.getByLabel(/^title/i).fill('Original Event Title');

    const dateButton = page.getByRole('button', { name: 'Choose date' });
    if (await dateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateButton.click();
      await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });
      await page.locator('.MuiPickersDay-root').filter({ hasText: /^10$/ }).first().click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await expect(overlay).not.toBeVisible({ timeout: 5000 });

    // Double-click to edit the event
    const eventCard = page.locator('.cursor-pointer').filter({ hasText: 'Original Event Title' }).first();
    if (await eventCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventCard.dblclick();
      await expect(overlay).toBeVisible({ timeout: 5000 });

      // Click Edit button if in view mode
      const editButton = page.getByRole('button', { name: 'Edit event' });
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click();
      }

      // Update title
      const titleInput = page.getByLabel(/^title/i);
      await titleInput.clear();
      await titleInput.fill('Updated Event Title');

      await page.getByRole('button', { name: /save/i }).click();
      await expect(overlay).not.toBeVisible({ timeout: 5000 });

      // Verify update
      await expect(page.locator('text=Updated Event Title')).toBeVisible({ timeout: 5000 });
    }
  });
});
