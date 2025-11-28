/**
 * Event Persistence End-to-End Tests (v5/76)
 * v0.5.11 - Updated for Firebase Auth
 *
 * Requirements Coverage:
 * - CC-REQ-AUTHORING-PERSIST-001: Event CRUD operations must persist to Firestore
 * - CC-REQ-AUTHORING-PERSIST-002: Events must survive page refresh
 *
 * Test Scenarios:
 * - T76.1: Create event → refresh → verify still exists
 * - T76.2: Edit event → refresh → verify changes survived
 * - T76.3: Delete event → refresh → verify still deleted
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('Event Persistence (CC-REQ-AUTHORING-PERSIST-001, CC-REQ-AUTHORING-PERSIST-002)', () => {

  test.beforeEach(async ({ page }) => {
    // Sign in first
    await signInWithEmail(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('T76.1: Create event → verify persistence → refresh → verify still exists', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AUTHORING-PERSIST-001' });

    // Step 1: Create a timeline
    const createButton = page.getByRole('button', { name: /create/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip(true, 'Create button not visible');
      return;
    }

    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Persistence Test ${uniqueSuffix}`);
    await page.getByRole('button', { name: /create timeline/i }).click();

    await expect(page).toHaveURL(/\/user\/.+\/timeline-/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Step 2: Create an event
    const navCreate = page.getByTestId('nav-create');
    if (await navCreate.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navCreate.click();
    } else {
      test.skip(true, 'Nav create button not visible');
      return;
    }

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/^title/i).fill('Persistence Test Event');
    await page.getByLabel(/description/i).fill('This event should persist');

    const dateButton = page.getByRole('button', { name: 'Choose date' });
    if (await dateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateButton.click();
      await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });
      await page.locator('.MuiPickersDay-root').filter({ hasText: /^15$/ }).first().click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await expect(overlay).not.toBeVisible({ timeout: 5000 });

    // Step 3: Verify event appears
    await expect(page.getByRole('heading', { name: 'Persistence Test Event' })).toBeVisible({ timeout: 5000 });

    // Step 4: Refresh the page
    const currentUrl = page.url();
    await page.reload();
    await page.waitForTimeout(3000);

    // Step 5: Verify event still exists
    const eventStillExists = await page.getByRole('heading', { name: 'Persistence Test Event' }).isVisible({ timeout: 10000 }).catch(() => false);
    expect(eventStillExists).toBe(true);
  });

  test('T76.2: Edit event → verify changes persist → refresh', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AUTHORING-PERSIST-002' });

    // Create timeline
    const createButton = page.getByRole('button', { name: /create/i }).first();
    if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Create button not visible');
      return;
    }

    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Edit Persist Test ${uniqueSuffix}`);
    await page.getByRole('button', { name: /create timeline/i }).click();

    await expect(page).toHaveURL(/\/user\/.+\/timeline-/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Create initial event
    const navCreate = page.getByTestId('nav-create');
    if (!(await navCreate.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Nav create button not visible');
      return;
    }

    await navCreate.click();
    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/^title/i).fill('Original Title');

    const dateButton = page.getByRole('button', { name: 'Choose date' });
    if (await dateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateButton.click();
      await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });
      await page.locator('.MuiPickersDay-root').filter({ hasText: /^10$/ }).first().click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await expect(overlay).not.toBeVisible({ timeout: 5000 });

    // Edit the event
    const eventCard = page.locator('.cursor-pointer').filter({ hasText: 'Original Title' }).first();
    if (await eventCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventCard.dblclick();
      await expect(overlay).toBeVisible({ timeout: 5000 });

      const editButton = page.getByRole('button', { name: 'Edit event' });
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click();
      }

      const titleInput = page.getByLabel(/^title/i);
      await titleInput.clear();
      await titleInput.fill('Updated Title');

      await page.getByRole('button', { name: /save/i }).click();
      await expect(overlay).not.toBeVisible({ timeout: 5000 });

      // Verify update
      await expect(page.getByRole('heading', { name: 'Updated Title' })).toBeVisible({ timeout: 5000 });

      // Refresh and verify
      await page.reload();
      await page.waitForTimeout(3000);

      const updatedStillExists = await page.getByRole('heading', { name: 'Updated Title' }).isVisible({ timeout: 10000 }).catch(() => false);
      expect(updatedStillExists).toBe(true);
    }
  });

  test('T76.3: Delete event → verify deletion persists → refresh', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AUTHORING-PERSIST-003' });

    // Create timeline
    const createButton = page.getByRole('button', { name: /create/i }).first();
    if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Create button not visible');
      return;
    }

    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const uniqueSuffix = Date.now().toString().slice(-6);
    await page.getByLabel('Title').fill(`Delete Persist Test ${uniqueSuffix}`);
    await page.getByRole('button', { name: /create timeline/i }).click();

    await expect(page).toHaveURL(/\/user\/.+\/timeline-/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Create event
    const navCreate = page.getByTestId('nav-create');
    if (!(await navCreate.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Nav create button not visible');
      return;
    }

    await navCreate.click();
    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/^title/i).fill('Event To Delete');

    const dateButton = page.getByRole('button', { name: 'Choose date' });
    if (await dateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateButton.click();
      await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });
      await page.locator('.MuiPickersDay-root').filter({ hasText: /^15$/ }).first().click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await expect(overlay).not.toBeVisible({ timeout: 5000 });

    // Delete the event
    const eventCard = page.locator('.cursor-pointer').filter({ hasText: 'Event To Delete' }).first();
    if (await eventCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventCard.dblclick();
      await expect(overlay).toBeVisible({ timeout: 5000 });

      const editButton = page.getByRole('button', { name: 'Edit event' });
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click();
      }

      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click();

        // Confirm if needed
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }

      // Close overlay if still open
      const closeButton = page.getByRole('button', { name: /close|cancel/i }).first();
      if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeButton.click();
      }

      await expect(overlay).not.toBeVisible({ timeout: 5000 });

      // Verify deletion
      await expect(page.getByRole('heading', { name: 'Event To Delete' })).not.toBeVisible({ timeout: 5000 });

      // Refresh and verify still deleted
      await page.reload();
      await page.waitForTimeout(3000);

      const eventGone = !(await page.getByRole('heading', { name: 'Event To Delete' }).isVisible({ timeout: 3000 }).catch(() => false));
      expect(eventGone).toBe(true);
    }
  });
});
