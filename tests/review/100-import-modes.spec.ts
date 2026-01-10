/**
 * E2E Tests for Import Mode feature (Merge vs Overwrite)
 * v0.9.6 - Import Modes
 */

import { test, expect, type Page } from '@playwright/test';
import { skipIfNoCredentials } from '../utils/timelineTestUtils';
import { signInWithEmail } from '../utils/authTestUtils';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

function generateTestYaml(): string {
  const runId = Date.now().toString(36);
  return `version: 1
timeline:
  title: "Import Mode Test"
events:
  - id: "test-${runId}"
    date: "1963-11-22"
    title: "Test Event for Import Mode"
    description: "Generated for import mode E2E test"
`;
}

/**
 * Navigate to timeline and ensure user is logged in
 */
async function navigateToTimelineWithAuth(page: Page): Promise<void> {
  await page.goto(`/${TEST_OWNER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Give Firebase Auth time to restore

  // Check if logged in (Import/Export button visible = editor mode)
  const importExportVisible = await page.locator('[data-testid="nav-import-export"]')
    .isVisible({ timeout: 5000 }).catch(() => false);

  if (!importExportVisible) {
    const success = await signInWithEmail(page);
    if (!success) {
      throw new Error('[Auth] Sign in failed - check .env.test credentials');
    }
    await page.goto(`/${TEST_OWNER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  }
}

async function openImportOverlay(page: Page) {
  const navButton = page.locator('[data-testid="nav-import-export"]');
  await expect(navButton).toBeVisible({ timeout: 5000 });
  await navButton.click();
  await page.waitForTimeout(400);
  await page.click('[data-testid="import-tab"]');
  await expect(page.locator('[data-testid="import-dropzone"]')).toBeVisible({ timeout: 5000 });
}

async function ensureReviewPanelOpen(page: Page) {
  const panel = page.locator('[data-testid="review-panel"]');
  const isVisible = await panel.isVisible({ timeout: 2000 }).catch(() => false);
  if (!isVisible) {
    // Click the review nav button to open the panel
    const reviewButton = page.locator('[data-testid="nav-review"]');
    await expect(reviewButton).toBeEnabled({ timeout: 5000 });
    await reviewButton.click();
  }
  await expect(panel).toBeVisible({ timeout: 5000 });
  return panel;
}

test.describe('Import Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await navigateToTimelineWithAuth(page);
  });

  test('default mode is Merge', async ({ page }) => {
    await openImportOverlay(page);

    // Check that merge mode is selected by default
    const mergeButton = page.locator('[data-testid="import-mode-merge"]');
    await expect(mergeButton).toBeVisible();
    await expect(mergeButton).toHaveClass(/Mui-selected/);
  });

  test('can switch to Overwrite mode', async ({ page }) => {
    await openImportOverlay(page);

    // Click overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Check that overwrite mode is now selected
    const overwriteButton = page.locator('[data-testid="import-mode-overwrite"]');
    await expect(overwriteButton).toHaveClass(/Mui-selected/);
  });

  test('shows warning when overwrite mode selected with existing events', async ({ page }) => {
    await openImportOverlay(page);

    // Switch to overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Check for warning message
    const warning = page.locator('[data-testid="overwrite-warning"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Warning');
  });

  test('mode toggle shows proper labels', async ({ page }) => {
    await openImportOverlay(page);

    // Check labels exist
    await expect(page.locator('[data-testid="import-mode-merge"]')).toContainText('Merge');
    await expect(page.locator('[data-testid="import-mode-overwrite"]')).toContainText('Overwrite');
  });
});

test.describe('Overwrite Mode Confirmation', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await navigateToTimelineWithAuth(page);
  });

  test('shows confirmation dialog before overwrite import', async ({ page }) => {
    await openImportOverlay(page);

    // Switch to overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Paste valid YAML
    const yamlContent = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);

    // Click import button
    await page.click('[data-testid="yaml-paste-import"]');

    // Check confirmation dialog appears
    const dialog = page.locator('[data-testid="overwrite-confirm-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('can cancel overwrite confirmation', async ({ page }) => {
    await openImportOverlay(page);

    // Switch to overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Paste valid YAML
    const yamlContent = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);

    // Click import button
    await page.click('[data-testid="yaml-paste-import"]');

    // Wait for dialog
    await page.waitForSelector('[data-testid="overwrite-confirm-dialog"]');

    // Click cancel
    await page.click('[data-testid="overwrite-cancel"]');

    // Dialog should close
    await expect(page.locator('[data-testid="overwrite-confirm-dialog"]')).not.toBeVisible();
  });

  test('proceeding with overwrite opens review panel', async ({ page }) => {
    await openImportOverlay(page);

    // Switch to overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Paste valid YAML
    const yamlContent = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);

    // Click import button
    await page.click('[data-testid="yaml-paste-import"]');

    // Wait for dialog and confirm
    await page.waitForSelector('[data-testid="overwrite-confirm-dialog"]');
    await page.click('[data-testid="overwrite-confirm"]');

    // Wait for overlay to close then ensure review panel is open
    await page.waitForTimeout(500);
    await ensureReviewPanelOpen(page);
  });
});

test.describe('Review Panel Mode Indicator', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await navigateToTimelineWithAuth(page);
  });

  test('shows overwrite mode indicator in review panel', async ({ page }) => {
    await openImportOverlay(page);

    // Switch to overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Paste valid YAML
    const yamlContent = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);

    // Click import and confirm
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForSelector('[data-testid="overwrite-confirm-dialog"]');
    await page.click('[data-testid="overwrite-confirm"]');

    // Wait for overlay to close then open review panel
    await page.waitForTimeout(500);
    await ensureReviewPanelOpen(page);

    // Check for overwrite mode indicator
    await expect(page.locator('[data-testid="overwrite-mode-indicator"]')).toBeVisible({ timeout: 5000 });
  });

  test('shows deletion warning in review panel for overwrite mode', async ({ page }) => {
    await openImportOverlay(page);

    // Switch to overwrite mode
    await page.click('[data-testid="import-mode-overwrite"]');

    // Paste valid YAML
    const yamlContent = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);

    // Click import and confirm
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForSelector('[data-testid="overwrite-confirm-dialog"]');
    await page.click('[data-testid="overwrite-confirm"]');

    // Wait for overlay to close then open review panel
    await page.waitForTimeout(500);
    await ensureReviewPanelOpen(page);

    // Check for deletion warning
    await expect(page.locator('[data-testid="overwrite-delete-warning"]')).toBeVisible({ timeout: 5000 });
  });

  test('does not show overwrite indicator for merge mode', async ({ page }) => {
    await openImportOverlay(page);

    // Keep default merge mode, paste YAML
    const yamlContent = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);
    await page.click('[data-testid="yaml-paste-import"]');

    // Wait for overlay to close then open review panel
    await page.waitForTimeout(500);
    await ensureReviewPanelOpen(page);

    // Review panel should not show overwrite indicator
    await expect(page.locator('[data-testid="overwrite-mode-indicator"]')).not.toBeVisible();
  });
});
