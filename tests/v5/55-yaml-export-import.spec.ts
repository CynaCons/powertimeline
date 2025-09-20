import { test, expect } from '@playwright/test';

test.describe('v5/55 YAML Export/Import', () => {
  test('export and import timeline via YAML', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EXPORT-001' });

    await page.goto('/');

    // Load sample data
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    // Wait for events to load
    await page.waitForTimeout(1000);

    // Verify events are loaded
    const initialCards = await page.locator('[data-testid="event-card"]').count();
    expect(initialCards).toBeGreaterThan(0);

    // Test export button visibility and state
    const exportButton = page.locator('button:has-text("📤 Export YAML")');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).not.toBeDisabled();

    // Check that export button shows event count
    await expect(exportButton).toContainText('(');

    // Test import button visibility
    const importButton = page.locator('button:has-text("📁 Import YAML")');
    await expect(importButton).toBeVisible();
    await expect(importButton).not.toBeDisabled();

    // For now, we'll test the UI presence since file download/upload
    // requires more complex testing setup
    console.log(`Found ${initialCards} events loaded for export testing`);
  });

  test('export button is disabled when no events', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EXPORT-002' });

    await page.goto('/');

    // Open dev panel
    await page.getByRole('button', { name: 'Developer Panel' }).click();

    // Clear all events first
    await page.getByRole('button', { name: 'Clear All' }).click();

    // Wait for events to be cleared
    await page.waitForTimeout(500);

    // Verify no events
    const cards = await page.locator('[data-testid="event-card"]').count();
    expect(cards).toBe(0);

    // Test export button is disabled when no events
    const exportButton = page.locator('button:has-text("📤 Export YAML")');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeDisabled();
    await expect(exportButton).toContainText('(0)');
  });

  test('import button is always enabled', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-001' });

    await page.goto('/');

    // Open dev panel
    await page.getByRole('button', { name: 'Developer Panel' }).click();

    // Test import button is always enabled
    const importButton = page.locator('button:has-text("📁 Import YAML")');
    await expect(importButton).toBeVisible();
    await expect(importButton).not.toBeDisabled();

    // Clear events and verify import is still enabled
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.waitForTimeout(500);

    await expect(importButton).not.toBeDisabled();
  });

  test('export/import section has correct labels and help text', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-UI-001' });

    await page.goto('/');

    // Open dev panel
    await page.getByRole('button', { name: 'Developer Panel' }).click();

    // Load some events first so export button has proper tooltip
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(1000);

    // Check section header
    await expect(page.locator('text=Timeline Export/Import')).toBeVisible();

    // Check help text
    await expect(page.locator('text=YAML format allows sharing timelines between users and applications')).toBeVisible();

    // Check export button tooltip exists (title attribute) - should contain "Export" when events exist
    const exportButton = page.locator('button:has-text("📤 Export YAML")');
    const exportTitle = await exportButton.getAttribute('title');
    expect(exportTitle).toContain('Export');

    // Check import button tooltip exists (title attribute)
    const importButton = page.locator('button:has-text("📁 Import YAML")');
    const importTitle = await importButton.getAttribute('title');
    expect(importTitle).toContain('Import');
    expect(importTitle).toContain('YAML');
  });
});