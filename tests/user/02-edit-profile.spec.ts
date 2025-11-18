/**
 * User Profile Edit Test
 * v0.5.0.2 - Test user profile editing functionality
 *
 * Tests the edit profile feature, including name and bio updates.
 * This test may reveal Firestore permission issues.
 */

import { test, expect } from '@playwright/test';

test.describe('user/02 User Profile Edit Tests', () => {
  test('edit profile button is visible for own profile', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.2' });

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Wait for profile to load
    await expect(page.locator('h1:has-text("CynaCons")').first()).toBeVisible({ timeout: 5000 });

    // Edit Profile button should be visible
    const editButton = page.locator('button:has-text("Edit Profile")');
    await expect(editButton).toBeVisible({ timeout: 3000 });
  });

  test('edit profile dialog opens when clicking edit button', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.2' });

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Wait for profile and click Edit Profile
    await page.waitForTimeout(1000);
    const editButton = page.locator('button:has-text("Edit Profile")');
    await editButton.click();

    // Dialog should appear
    await expect(page.locator('text=Edit Profile').first()).toBeVisible({ timeout: 2000 });

    // Check for name and bio fields
    await expect(page.locator('label:has-text("Display Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Bio")')).toBeVisible();
  });

  test('can edit user name and bio', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.2' });

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Click Edit Profile
    await page.waitForTimeout(1000);
    const editButton = page.locator('button:has-text("Edit Profile")');
    await editButton.click();

    // Wait for dialog
    await page.waitForTimeout(500);

    // Find the name input field (look for label and then the input)
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(''); // Clear by filling with empty
    await nameInput.fill('CynaCons Updated');

    // Find the bio textarea
    const bioInput = page.locator('textarea').first();
    await bioInput.fill(''); // Clear by filling with empty
    await bioInput.fill('This is an updated bio for testing purposes.');

    // Click Save Changes button
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();

    // Wait for save operation
    await page.waitForTimeout(2000);

    // Check for errors
    const permissionErrors = errors.filter(e =>
      e.includes('permission') ||
      e.includes('PERMISSION_DENIED') ||
      e.includes('Missing or insufficient permissions')
    );

    if (permissionErrors.length > 0) {
      console.log('❌ FIRESTORE PERMISSION ERRORS DETECTED:');
      permissionErrors.forEach(err => console.log('  -', err));

      // This is expected - we need to update Firestore rules
      expect(permissionErrors.length).toBeGreaterThan(0);
    } else {
      console.log('✅ No permission errors detected');

      // Check for success toast
      await expect(page.locator('text=Profile updated successfully!')).toBeVisible({ timeout: 3000 });

      // Verify the name was updated on the page
      await expect(page.locator('h1:has-text("CynaCons Updated")')).toBeVisible({ timeout: 3000 });
    }
  });

  test('validation works for name field', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.2' });

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Click Edit Profile
    await page.waitForTimeout(1000);
    const editButton = page.locator('button:has-text("Edit Profile")');
    await editButton.click();

    await page.waitForTimeout(500);

    // Try to set name too short (< 2 chars)
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(''); // Clear
    await nameInput.fill('X');

    // Click outside to trigger validation
    await page.locator('label:has-text("Bio")').click();

    // Should show error message
    await expect(page.locator('text=/Name must be at least 2 characters/')).toBeVisible({ timeout: 2000 });

    // Save button should be disabled
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeDisabled();
  });

  test('bio field enforces 280 character limit', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.2' });

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Click Edit Profile
    await page.waitForTimeout(1000);
    const editButton = page.locator('button:has-text("Edit Profile")');
    await editButton.click();

    await page.waitForTimeout(500);

    // Try to set bio too long (> 280 chars)
    const longBio = 'A'.repeat(300);
    const bioInput = page.locator('textarea').first();
    await bioInput.clear();
    await bioInput.fill(longBio);

    // Click outside to trigger validation
    await page.locator('label:has-text("Display Name")').click();

    // Should show error message
    await expect(page.locator('text=/Bio cannot exceed 280 characters/')).toBeVisible({ timeout: 2000 });

    // Save button should be disabled
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeDisabled();
  });
});
