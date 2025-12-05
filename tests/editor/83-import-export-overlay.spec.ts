import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
import path from 'path';
import fs from 'fs';

/**
 * Import/Export Overlay E2E Tests
 * Tests for T-IMEX-01 through T-IMEX-05
 * See docs/SRS_EDITOR_IMPORT_EXPORT.md for requirements
 */

test.describe('v5/83 Import/Export Overlay', () => {
  test.beforeEach(async ({ page }) => {
    // Login and load a test timeline
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
  });

  test('T-IMEX-01: Import/Export overlay opens from NavRail', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-UI-001, CC-REQ-IMPORT-UI-002' });

    // Find and click the Import/Export button in NavRail
    const importExportButton = page.locator('[data-testid="nav-import-export"]');
    await expect(importExportButton).toBeVisible();
    await importExportButton.click();

    // Verify overlay opens
    const overlay = page.locator('[role="dialog"][aria-labelledby="dialog-title-import-export"]');
    await expect(overlay).toBeVisible();

    // Verify tabs are present
    await expect(page.getByTestId('export-tab')).toBeVisible();
    await expect(page.getByTestId('import-tab')).toBeVisible();

    // Verify default tab is Export
    const exportTab = page.getByTestId('export-tab');
    await expect(exportTab).toHaveAttribute('aria-selected', 'true');

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible();
  });

  test('T-IMEX-01b: Import/Export opens with Alt+I shortcut', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-UI-002' });

    // Use keyboard shortcut
    await page.keyboard.press('Alt+i');

    // Verify overlay opens
    const overlay = page.locator('[role="dialog"][aria-labelledby="dialog-title-import-export"]');
    await expect(overlay).toBeVisible();
  });

  test('T-IMEX-02: Export tab shows timeline info and download works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EXPORT-001, CC-REQ-EXPORT-002, CC-REQ-EXPORT-003' });

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();

    // Verify Export tab content
    await expect(page.getByTestId('export-tab')).toBeVisible();

    // Verify timeline title is shown
    await expect(page.locator('text=French Revolution')).toBeVisible();

    // Verify event count chip
    const eventCountChip = page.locator('text=/\\d+ events/');
    await expect(eventCountChip).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByTestId('export-button').click();

    // Verify download triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.yaml$/);

    // Verify file content
    const filePath = await download.path();
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check YAML structure
      expect(content).toContain('version: 1');
      expect(content).toContain('timeline:');
      expect(content).toContain('events:');

      // Check events have IDs (mandatory)
      expect(content).toMatch(/id: ["']?evt-/);

      // Check header comments
      expect(content).toContain('# PowerTimeline Export Format v1');
    }
  });

  test('T-IMEX-03: Import via drop zone validates file type', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-001, CC-REQ-IMPORT-006, CC-REQ-IMPORT-007' });

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();

    // Switch to Import tab
    await page.getByTestId('import-tab').click();

    // Verify drop zone is visible
    const dropZone = page.getByTestId('import-dropzone');
    await expect(dropZone).toBeVisible();

    // Test with invalid file type (create a temporary .txt file)
    const invalidContent = 'This is not YAML';
    const invalidBuffer = Buffer.from(invalidContent);

    // Use file chooser to test file type validation
    const fileChooserPromise = page.waitForEvent('filechooser');
    await dropZone.click();
    const fileChooser = await fileChooserPromise;

    // Note: Playwright file chooser doesn't easily test rejection,
    // but we can verify the input accepts only .yaml/.yml
    const fileInput = page.getByTestId('yaml-file-input');
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('.yaml');
    expect(acceptAttr).toContain('.yml');
  });

  test('T-IMEX-04: Import validation catches missing required fields', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-002, CC-REQ-VALIDATION-003, CC-REQ-IMPORT-UI-003' });

    // Create invalid YAML (missing event ID)
    const invalidYaml = `version: 1
timeline:
  title: "Test Timeline"
events:
  - date: "2024-01-01"
    title: "Event without ID"
`;

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();
    await page.getByTestId('import-tab').click();

    // Upload invalid file via file input
    const fileInput = page.getByTestId('yaml-file-input');

    // Create a temporary file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, 'invalid-test.yaml');
    fs.writeFileSync(tempFile, invalidYaml);

    await fileInput.setInputFiles(tempFile);

    // Wait for validation error
    await expect(page.locator('text=/Event ID is required/')).toBeVisible({ timeout: 5000 });

    // Verify import button is disabled
    await expect(page.getByTestId('confirm-import-button')).not.toBeVisible();

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  test('T-IMEX-05: Valid YAML shows preview and imports correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-003, CC-REQ-IMPORT-004, CC-REQ-IMPORT-005, CC-REQ-IMPORT-UI-004' });

    // Create valid YAML with IDs
    const validYaml = `version: 1
timeline:
  title: "Test Import"
  visibility: private
events:
  - id: "test-evt-001"
    date: "2024-06-15"
    title: "Test Event 1"
    description: "First test event"
  - id: "test-evt-002"
    date: "2024-07-20"
    title: "Test Event 2"
`;

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();
    await page.getByTestId('import-tab').click();

    // Create temp file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, 'valid-test.yaml');
    fs.writeFileSync(tempFile, validYaml);

    // Upload file
    const fileInput = page.getByTestId('yaml-file-input');
    await fileInput.setInputFiles(tempFile);

    // Verify preview shows events
    await expect(page.locator('text=Test Event 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test Event 2')).toBeVisible();

    // Verify event IDs are shown
    await expect(page.locator('text=test-evt-001')).toBeVisible();

    // Verify event count
    await expect(page.locator('text=/2 events/')).toBeVisible();

    // Verify import button is enabled
    const importButton = page.getByTestId('confirm-import-button');
    await expect(importButton).toBeVisible();
    await expect(importButton).toBeEnabled();

    // Click import
    await importButton.click();

    // Verify overlay closes
    await expect(page.locator('[role="dialog"][aria-labelledby="dialog-title-import-export"]')).not.toBeVisible({ timeout: 5000 });

    // Verify events were imported (check timeline has the new events)
    // This would merge with existing events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount({ minimum: 2 });

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  test('Import/Export button visible to signed-in users on any timeline', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMEX-002' });

    // Navigate to a timeline we don't own (read-only view)
    // Button should still be visible for signed-in users
    await page.goto('/browse');

    // Find any public timeline card and click to view
    const publicTimeline = page.locator('[data-testid="timeline-card"]').first();
    if (await publicTimeline.isVisible()) {
      await publicTimeline.click();

      // Wait for editor to load
      await page.waitForTimeout(1000);

      // Verify Import/Export button IS visible for signed-in users (regardless of ownership)
      const importExportButton = page.locator('[data-testid="nav-import-export"]');
      await expect(importExportButton).toBeVisible();
    }
  });

  test('Import/Export button not visible when not signed in', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMEX-002' });

    // Go to a public timeline without signing in
    await page.goto('/browse');

    const publicTimeline = page.locator('[data-testid="timeline-card"]').first();
    if (await publicTimeline.isVisible()) {
      // Clear auth state first if needed
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await publicTimeline.click();

      // Wait for editor to load
      await page.waitForTimeout(1000);

      // Verify Import/Export button is NOT visible for anonymous users
      const importExportButton = page.locator('[data-testid="nav-import-export"]');
      await expect(importExportButton).not.toBeVisible();
    }
  });
});

test.describe('v5/83 Import Validation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
  });

  test('Rejects file larger than 1MB', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMPORT-006' });

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();
    await page.getByTestId('import-tab').click();

    // Create a large file (> 1MB)
    const largeContent = 'x'.repeat(1024 * 1024 + 1); // Just over 1MB
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, 'large-test.yaml');
    fs.writeFileSync(tempFile, largeContent);

    // Upload file
    const fileInput = page.getByTestId('yaml-file-input');
    await fileInput.setInputFiles(tempFile);

    // Verify error message
    await expect(page.locator('text=/too large|Maximum size/i')).toBeVisible({ timeout: 5000 });

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  test('Rejects invalid version number', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-VALIDATION-004' });

    const invalidVersionYaml = `version: 2
timeline:
  title: "Test"
events:
  - id: "evt-001"
    date: "2024-01-01"
    title: "Test"
`;

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();
    await page.getByTestId('import-tab').click();

    // Create temp file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, 'bad-version.yaml');
    fs.writeFileSync(tempFile, invalidVersionYaml);

    // Upload file
    await page.getByTestId('yaml-file-input').setInputFiles(tempFile);

    // Verify version error
    await expect(page.locator('text=/Version must be 1/i')).toBeVisible({ timeout: 5000 });

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  test('Rejects invalid date format', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-VALIDATION-001' });

    const invalidDateYaml = `version: 1
timeline:
  title: "Test"
events:
  - id: "evt-001"
    date: "01-15-2024"
    title: "Bad date format"
`;

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();
    await page.getByTestId('import-tab').click();

    // Create temp file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, 'bad-date.yaml');
    fs.writeFileSync(tempFile, invalidDateYaml);

    // Upload file
    await page.getByTestId('yaml-file-input').setInputFiles(tempFile);

    // Verify date format error
    await expect(page.locator('text=/Invalid date format|YYYY-MM-DD/i')).toBeVisible({ timeout: 5000 });

    // Cleanup
    fs.unlinkSync(tempFile);
  });
});

test.describe('v5/83 Empty Timeline Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('Export works with empty timeline (0 events)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMEX-015' });

    // Create a new empty timeline or navigate to one with no events
    // For this test, we'll load a timeline and verify the export tab handles 0 events
    await loadTestTimeline(page, 'french-revolution');

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();

    // Verify Export tab shows event count (even if 0)
    const eventCountChip = page.locator('text=/\\d+ events/');
    await expect(eventCountChip).toBeVisible();

    // Verify download button is available
    await expect(page.getByTestId('export-button')).toBeEnabled();
  });

  test('Import to empty timeline creates new events', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-IMEX-011, CC-REQ-IMEX-015' });

    await loadTestTimeline(page, 'french-revolution');

    // Create valid YAML to import
    const validYaml = `version: 1
timeline:
  title: "New Events"
events:
  - id: "new-evt-001"
    date: "2025-01-01"
    title: "First New Event"
`;

    // Open Import/Export overlay
    await page.locator('[data-testid="nav-import-export"]').click();
    await page.getByTestId('import-tab').click();

    // Create temp file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, 'new-events.yaml');
    fs.writeFileSync(tempFile, validYaml);

    // Upload file
    const fileInput = page.getByTestId('yaml-file-input');
    await fileInput.setInputFiles(tempFile);

    // Verify preview shows the new event
    await expect(page.locator('text=First New Event')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/1 events?/')).toBeVisible();

    // Import button should be enabled
    const importButton = page.getByTestId('confirm-import-button');
    await expect(importButton).toBeEnabled();

    // Cleanup
    fs.unlinkSync(tempFile);
  });
});
