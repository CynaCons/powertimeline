import { test, expect } from '@playwright/test';

test.describe('v5/51 Authoring overlay (centered, material-like)', () => {
  test('opens centered and large from Events selection', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    // Open Events and select the first item
    await page.locator('button[aria-label="Events"]').click();
    await expect(page.getByPlaceholder('Filter...')).toBeVisible();
    // Click first list item button
    const firstItem = page.locator('li >> role=button').first();
    await firstItem.click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    const box = await overlay.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) * 0.7);
    expect(box?.width || 0).toBeGreaterThanOrEqual((viewport?.width || 0) * 0.5);

    // Centered: left and right margins roughly equal (tolerance 40px)
    const leftMargin = (box?.x || 0);
    const rightMargin = (viewport!.width - (box!.x + box!.width));
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(40);

    // Backdrop visible
    await expect(page.locator('[data-testid="authoring-backdrop"]')).toBeVisible();
  });

  test('opens centered from timeline double-click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    // Toggle Dev closed so it does not intercept clicks
    await page.getByRole('button', { name: 'Developer Panel' }).click();

    // Double-click a card
    const card = page.locator('[data-testid="event-card"]').first();
    await card.dblclick();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();
  });

  test('opens in view mode for existing events and allows toggle to edit mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    // Open Events and select the first item
    await page.locator('button[aria-label="Events"]').click();
    await expect(page.getByPlaceholder('Filter...')).toBeVisible();
    const firstItem = page.locator('li >> role=button').first();
    await firstItem.click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    // Should open in view mode for existing events
    await expect(page.getByText('View Event')).toBeVisible();

    // Should show read-only content (calendar icon, formatted date)
    await expect(page.locator('.material-symbols-rounded:has-text("calendar_today")')).toBeVisible();

    // Should have edit button in header
    const editButton = page.getByRole('button', { name: 'Edit event' });
    await expect(editButton).toBeVisible();

    // Click edit button to switch to edit mode
    await editButton.click();

    // Should now show edit mode
    await expect(page.getByText('Edit Event')).toBeVisible();

    // Should show form fields
    await expect(page.getByLabel('Date *')).toBeVisible();
    await expect(page.getByLabel('Title *')).toBeVisible();
    await expect(page.getByLabel('Description (Optional)')).toBeVisible();

    // Should have Save and Cancel buttons
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('opens in edit mode for new events', async ({ page }) => {
    await page.goto('/');

    // Click create button
    await page.getByRole('button', { name: 'Create' }).click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    // Should open directly in edit mode for new events
    await expect(page.getByText('Create Event')).toBeVisible();

    // Should show form fields immediately
    await expect(page.getByLabel('Date *')).toBeVisible();
    await expect(page.getByLabel('Title *')).toBeVisible();
    await expect(page.getByLabel('Description (Optional)')).toBeVisible();

    // Should not have edit button (already in edit mode)
    await expect(page.getByRole('button', { name: 'Edit event' })).not.toBeVisible();
  });

  test('shows improved form fields with validation and enhancements', async ({ page }) => {
    await page.goto('/');

    // Click create button to open in edit mode
    await page.getByRole('button', { name: 'Create' }).click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    // Should show enhanced date field with calendar picker button
    const dateField = page.getByLabel('Date *');
    await expect(dateField).toBeVisible();
    await expect(page.getByRole('button', { name: /Choose date/ })).toBeVisible();

    // Should show title field with character counter
    const titleField = page.getByLabel('Title *');
    await expect(titleField).toBeVisible();
    await expect(page.getByText('0/100')).toBeVisible();

    // Should show description field with character counter
    const descriptionField = page.getByLabel('Description (Optional)');
    await expect(descriptionField).toBeVisible();
    await expect(page.getByText('0/500')).toBeVisible();

    // Test character counters update
    await titleField.fill('Test Event');
    await expect(page.getByText('10/100')).toBeVisible();

    await descriptionField.fill('Test description');
    await expect(page.getByText('16/500')).toBeVisible();

    // Should show enhanced save button with icon
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeVisible();
    await expect(page.locator('.material-symbols-rounded:has-text("save")')).toBeVisible();
  });

  test('validates required fields and shows error states', async ({ page }) => {
    await page.goto('/');

    // Click create button to open in edit mode
    await page.getByRole('button', { name: 'Create' }).click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    // Save button should be disabled initially (empty required fields)
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeDisabled();

    // Fill in date using DatePicker - try finding the actual input field
    const dateField = page.getByLabel('Date *');
    await dateField.click();
    await dateField.fill('12/25/2024');

    await page.getByLabel('Title *').fill('Christmas Day');

    // Save button should now be enabled
    await expect(saveButton).toBeEnabled();
  });
});
