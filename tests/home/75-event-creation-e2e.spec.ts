/**
 * Event Creation End-to-End Tests (v5/75)
 * Tests event creation workflow from timeline editor with form validation
 *
 * Test Coverage:
 * - T75.1: Create new event from scratch (happy path)
 * - T75.2: Form validation → all validation rules tested
 * - T75.3: Form persistence bug regression test (CRITICAL)
 * - T75.4: Edit existing event → verify changes persisted
 * - T75.5: Navigation between events → verify no data loss
 * - T75.6: Create new event while editing → verify form resets
 */

import { test, expect } from '@playwright/test';

test.describe('Event Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start from HomePage
    await page.goto('/');

    // Clear localStorage and initialize fresh demo data
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // Wait for HomePage to load
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();

    // Create a test timeline
    await page.getByRole('button', { name: /create new/i }).first().click();
    await page.getByLabel('Title').fill('Test Timeline for Events');
    await page.getByLabel('Description').fill('Timeline for testing event creation');
    await page.getByRole('button', { name: /create timeline/i }).click();

    // Should navigate to timeline editor
    await expect(page).toHaveURL(/\/user\/.+\/timeline\//);

    // Wait for editor to load
    await expect(page.getByTestId('timeline-axis')).toBeVisible({ timeout: 5000 });
  });

  test('T75.1: Create new event from scratch (happy path)', async ({ page }) => {
    // Open event creation (click "Create" navigation item or use keyboard shortcut)
    await page.keyboard.press('Alt+N'); // Assuming Alt+N for new event

    // If keyboard shortcut doesn't work, try clicking the Create button
    const createButton = page.getByRole('button', { name: /create/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    // Wait for authoring overlay to appear
    await expect(page.getByTestId('authoring-overlay')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Create Event')).toBeVisible();

    // Fill in date using the DatePicker
    // Click on the date input to open calendar
    const dateInput = page.getByLabel('Date *');
    await dateInput.click();

    // Select a date from the calendar (e.g., 15th of current month)
    await page.getByRole('button', { name: '15' }).first().click();

    // Fill in time (optional)
    await page.getByLabel(/time/i).fill('14:30');

    // Fill in title
    await page.getByLabel(/^title/i).fill('First Major Event');

    // Fill in description
    await page.getByLabel(/description/i).fill('This is a detailed description of the first event.');

    // Save the event
    await page.getByRole('button', { name: /save/i }).click();

    // Overlay should close
    await expect(page.getByTestId('authoring-overlay')).not.toBeVisible({ timeout: 3000 });

    // Event should appear in the timeline
    await expect(page.locator('text=First Major Event')).toBeVisible();
  });

  test('T75.2: Form validation → all validation rules tested', async ({ page }) => {
    // Open event creation
    await page.keyboard.press('Alt+N');
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();

    // Test 1: Empty title shows error
    const titleInput = page.getByLabel(/^title/i);
    await titleInput.fill('');
    await titleInput.blur();
    await expect(page.getByText(/title is required/i)).toBeVisible();

    // Test 2: Title too long (>100 chars) shows error
    const longTitle = 'A'.repeat(101);
    await titleInput.fill(longTitle);
    await titleInput.blur();
    await expect(page.getByText(/must be less than 100 characters/i)).toBeVisible();

    // Test 3: Invalid time format shows error
    const timeInput = page.getByLabel(/time/i);
    await timeInput.fill('25:99'); // Invalid time
    await timeInput.blur();
    await expect(page.getByText(/invalid time format/i)).toBeVisible();

    // Test 4: Valid time format accepted
    await timeInput.fill('14:30'); // Valid time
    await timeInput.blur();
    await expect(page.getByText(/invalid time format/i)).not.toBeVisible();

    // Test 5: Description too long (>500 chars) shows error
    const descInput = page.getByLabel(/description/i);
    const longDesc = 'B'.repeat(501);
    await descInput.fill(longDesc);
    await descInput.blur();
    await expect(page.getByText(/must be less than 500 characters/i)).toBeVisible();

    // Test 6: Save button disabled when errors present
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeDisabled();

    // Fix errors
    await titleInput.fill('Valid Title');
    await descInput.fill('Valid description');

    // Date is still required
    const dateInput = page.getByLabel('Date *');
    await dateInput.click();
    await page.getByRole('button', { name: '15' }).first().click();

    // Save button should be enabled now
    await expect(saveButton).toBeEnabled();
  });

  test('T75.3: Form persistence bug regression test (CRITICAL)', async ({ page }) => {
    // This test verifies that the useEffect dependency bug is fixed
    // Previously, editing title/description would clear the date field

    // Open event creation
    await page.keyboard.press('Alt+N');
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();

    // Step 1: Fill in date first
    const dateInput = page.getByLabel('Date *');
    await dateInput.click();
    await page.getByRole('button', { name: '15' }).first().click();

    // Verify date is set (check the input value contains a date)
    const dateValue1 = await dateInput.inputValue();
    expect(dateValue1).toBeTruthy();
    expect(dateValue1).toMatch(/\d{4}-\d{2}-\d{2}/); // YYYY-MM-DD format

    // Step 2: Type in title field
    const titleInput = page.getByLabel(/^title/i);
    await titleInput.fill('Testing Form Persistence');

    // CRITICAL: Verify date field still has value (not cleared)
    const dateValue2 = await dateInput.inputValue();
    expect(dateValue2).toBe(dateValue1);
    expect(dateValue2).toBeTruthy();

    // Step 3: Type in description field
    const descInput = page.getByLabel(/description/i);
    await descInput.fill('This tests that the date field does not get cleared when editing other fields');

    // CRITICAL: Verify both date and title still have values
    const dateValue3 = await dateInput.inputValue();
    const titleValue = await titleInput.inputValue();
    expect(dateValue3).toBe(dateValue1);
    expect(dateValue3).toBeTruthy();
    expect(titleValue).toBe('Testing Form Persistence');

    // Step 4: Add time field
    const timeInput = page.getByLabel(/time/i);
    await timeInput.fill('10:45');

    // CRITICAL: Verify all fields still have values
    const dateValue4 = await dateInput.inputValue();
    const titleValue2 = await titleInput.inputValue();
    const descValue = await descInput.inputValue();
    const timeValue = await timeInput.inputValue();

    expect(dateValue4).toBe(dateValue1);
    expect(titleValue2).toBe('Testing Form Persistence');
    expect(descValue).toContain('This tests that the date field');
    expect(timeValue).toBe('10:45');

    // Save event to verify all data persists
    await page.getByRole('button', { name: /save/i }).click();

    // Verify event created successfully
    await expect(page.locator('text=Testing Form Persistence')).toBeVisible();
  });

  test('T75.4: Edit existing event → verify changes persisted', async ({ page }) => {
    // First, create an event
    await page.keyboard.press('Alt+N');
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();

    const dateInput = page.getByLabel('Date *');
    await dateInput.click();
    await page.getByRole('button', { name: '10' }).first().click();

    await page.getByLabel(/^title/i).fill('Original Title');
    await page.getByLabel(/description/i).fill('Original description');
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for overlay to close
    await expect(page.getByTestId('authoring-overlay')).not.toBeVisible();

    // Find and click the event card to edit it
    await page.locator('text=Original Title').click({ clickCount: 2 }); // Double-click to edit

    // Wait for overlay to open in edit mode
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();
    await expect(page.getByText('Edit Event')).toBeVisible();

    // Modify the event
    const titleInput = page.getByLabel(/^title/i);
    await titleInput.fill('Updated Title');

    const descInput = page.getByLabel(/description/i);
    await descInput.fill('Updated description with new content');

    // Save changes
    await page.getByRole('button', { name: /save/i }).click();

    // Verify changes persisted
    await expect(page.locator('text=Updated Title')).toBeVisible();
    await expect(page.locator('text=Original Title')).not.toBeVisible();
  });

  test('T75.5: Navigation between events → verify no data loss', async ({ page }) => {
    // Create two events
    for (let i = 1; i <= 2; i++) {
      await page.keyboard.press('Alt+N');
      await expect(page.getByTestId('authoring-overlay')).toBeVisible();

      const dateInput = page.getByLabel('Date *');
      await dateInput.click();
      await page.getByRole('button', { name: `${i * 5}` }).first().click();

      await page.getByLabel(/^title/i).fill(`Event ${i}`);
      await page.getByLabel(/description/i).fill(`Description for event ${i}`);
      await page.getByRole('button', { name: /save/i }).click();

      await expect(page.getByTestId('authoring-overlay')).not.toBeVisible();
    }

    // Open first event
    await page.locator('text=Event 1').click({ clickCount: 2 });
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();

    // Navigate to next event using arrow key
    await page.keyboard.press('ArrowRight');

    // Should show Event 2
    await expect(page.getByLabel(/^title/i)).toHaveValue('Event 2');
    await expect(page.getByLabel(/description/i)).toHaveValue('Description for event 2');

    // Navigate back
    await page.keyboard.press('ArrowLeft');

    // Should show Event 1
    await expect(page.getByLabel(/^title/i)).toHaveValue('Event 1');
    await expect(page.getByLabel(/description/i)).toHaveValue('Description for event 1');
  });

  test('T75.6: Create new event while editing → verify form resets', async ({ page }) => {
    // Create an event first
    await page.keyboard.press('Alt+N');
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();

    const dateInput = page.getByLabel('Date *');
    await dateInput.click();
    await page.getByRole('button', { name: '12' }).first().click();

    await page.getByLabel(/^title/i).fill('Existing Event');
    await page.getByLabel(/description/i).fill('Existing description');
    await page.getByRole('button', { name: /save/i }).click();

    // Open the event for editing
    await page.locator('text=Existing Event').click({ clickCount: 2 });
    await expect(page.getByTestId('authoring-overlay')).toBeVisible();
    await expect(page.getByText('Edit Event')).toBeVisible();

    // Click "Create New" button while in edit mode
    const createNewButton = page.getByRole('button', { name: /create new/i, exact: false });
    if (await createNewButton.isVisible()) {
      await createNewButton.click();
    }

    // Form should reset to empty
    await expect(page.getByText('Create Event')).toBeVisible();
    await expect(page.getByLabel(/^title/i)).toHaveValue('');
    await expect(page.getByLabel(/description/i)).toHaveValue('');
  });
});
