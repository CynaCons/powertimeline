/**
 * v0.5.27 - Timeline YAML Import/Export Tests
 * Tests the import/export functionality from HomePage
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('v0.5.27 YAML Import/Export', () => {
  test.describe('Import Button Visibility', () => {
    test('import button is visible for authenticated users', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-001' });

      // Login first
      await signInWithEmail(page);

      // Go to browse page
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');

      // Wait for My Timelines section to appear (indicates auth is complete)
      await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

      // Check Import button exists
      const importButton = page.locator('[data-testid="import-timeline-button"]');
      await expect(importButton).toBeVisible();
      await expect(importButton).toContainText('Import');
    });

    test('import dialog opens when clicking import button', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-002' });

      await signInWithEmail(page);
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');

      // Wait for the page to load
      await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

      // Click Import button
      await page.locator('[data-testid="import-timeline-button"]').click();

      // Verify dialog opens
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText('Import Timeline from YAML');
    });

    test('import dialog has file upload zone', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-003' });

      await signInWithEmail(page);
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

      // Open import dialog
      await page.locator('[data-testid="import-timeline-button"]').click();

      // Check for file input
      const fileInput = page.locator('[data-testid="yaml-file-input"]');
      await expect(fileInput).toBeAttached();

      // Check for drag-drop zone text
      await expect(page.getByText('Drag and drop a YAML file here')).toBeVisible();
      await expect(page.getByText('or click to browse')).toBeVisible();
    });
  });

  test.describe('Export Menu Option', () => {
    test('export option appears in timeline card kebab menu', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-EXPORT-001' });

      await signInWithEmail(page);
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');

      // Wait for My Timelines section
      const myTimelinesSection = page.getByTestId('my-timelines-section');
      await expect(myTimelinesSection).toBeVisible({ timeout: 5000 });

      // Find timeline cards with kebab menu buttons
      const menuButtons = myTimelinesSection.locator('.timeline-menu-button');
      const count = await menuButtons.count();

      // Skip if user has no timelines
      if (count === 0) {
        test.skip(true, 'User has no timelines to export');
        return;
      }

      // Click the first kebab menu
      await menuButtons.first().click();

      // Wait for menu to appear and check for Export option
      await page.waitForSelector('[role="menu"]', { timeout: 5000 });
      const exportOption = page.getByRole('menuitem', { name: /Export YAML/i });
      await expect(exportOption).toBeVisible();
    });
  });

  test.describe('YAML Validation', () => {
    test('shows error for invalid YAML syntax', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-VALIDATE-001' });

      await signInWithEmail(page);
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

      // Open import dialog
      await page.locator('[data-testid="import-timeline-button"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Upload invalid YAML file
      const invalidYaml = `
invalid yaml content
  - this is broken
    - indentation: wrong
`;

      const fileInput = page.locator('[data-testid="yaml-file-input"]');
      await fileInput.setInputFiles({
        name: 'invalid.yaml',
        mimeType: 'text/yaml',
        buffer: Buffer.from(invalidYaml),
      });

      // Should show error alert
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    });

    test('shows preview for valid YAML', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-VALIDATE-002' });

      await signInWithEmail(page);
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

      // Open import dialog
      await page.locator('[data-testid="import-timeline-button"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Upload valid YAML file
      const validYaml = `
version: 1
timeline:
  title: "Test Import Timeline"
  description: "A test timeline for import"
  visibility: private
events:
  - date: "2024-01-15"
    title: "First Event"
    description: "Description of first event"
  - date: "2024-03-20"
    title: "Second Event"
    time: "14:30"
`;

      const fileInput = page.locator('[data-testid="yaml-file-input"]');
      await fileInput.setInputFiles({
        name: 'valid.yaml',
        mimeType: 'text/yaml',
        buffer: Buffer.from(validYaml),
      });

      // Should show preview step
      await expect(page.getByText('Review Import')).toBeVisible({ timeout: 5000 });

      // Check events count is shown
      await expect(page.getByText('2 events')).toBeVisible();
    });

    test('validates required fields in YAML', async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-VALIDATE-003' });

      await signInWithEmail(page);
      await page.goto('/browse');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

      // Open import dialog
      await page.locator('[data-testid="import-timeline-button"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // YAML missing required timeline.title
      const invalidYaml = `
version: 1
timeline:
  description: "Missing title"
events:
  - date: "2024-01-15"
    title: "Event"
`;

      const fileInput = page.locator('[data-testid="yaml-file-input"]');
      await fileInput.setInputFiles({
        name: 'missing-title.yaml',
        mimeType: 'text/yaml',
        buffer: Buffer.from(invalidYaml),
      });

      // Should show validation error about title
      await expect(page.getByText(/title.*required/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
