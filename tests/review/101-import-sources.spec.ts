/**
 * E2E Tests for importing events with sources
 * Verifies that the sources field is preserved during YAML import
 */

import { test, expect, type Page } from '@playwright/test';
import { skipIfNoCredentials } from '../utils/timelineTestUtils';
import { signInWithEmail } from '../utils/authTestUtils';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

/**
 * Generate YAML with events that have sources
 */
function generateYamlWithSources(): string {
  const runId = Date.now().toString(36);
  return `version: 1
timeline:
  title: "Import Sources Test"
events:
  - id: "source-test-${runId}"
    date: "1969-07-20"
    title: "Moon Landing Test Event"
    description: "Apollo 11 lands on the Moon"
    sources:
      - "https://www.nasa.gov/mission_pages/apollo/apollo-11.html"
      - "https://en.wikipedia.org/wiki/Apollo_11"
`;
}

/**
 * Navigate to timeline and ensure user is logged in
 */
async function navigateToTimelineWithAuth(page: Page): Promise<void> {
  await page.goto(`/${TEST_OWNER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

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
    const reviewButton = page.locator('[data-testid="nav-review"]');
    await expect(reviewButton).toBeEnabled({ timeout: 5000 });
    await reviewButton.click();
  }
  await expect(panel).toBeVisible({ timeout: 5000 });
  return panel;
}

test.describe('Import Events with Sources', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await navigateToTimelineWithAuth(page);
  });

  test('sources field is preserved in imported events', async ({ page }) => {
    await openImportOverlay(page);

    // Paste YAML with sources
    const yamlContent = generateYamlWithSources();
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);
    await page.click('[data-testid="yaml-paste-import"]');

    // Wait for overlay to close and open review panel
    await page.waitForTimeout(500);
    await ensureReviewPanelOpen(page);

    // Find the imported event in the review panel
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Moon Landing Test Event'
    });
    await expect(eventItem).toBeVisible({ timeout: 5000 });

    // Click the edit button to open the event editor
    const editButton = eventItem.locator('[data-testid="review-event-edit"]');
    await editButton.click();

    // Wait for editor overlay to open (AuthoringOverlay)
    const editorOverlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(editorOverlay).toBeVisible({ timeout: 5000 });

    // Check that sources section exists and shows sources
    // The sources section should be visible with 2 sources
    // Look for text containing the URLs
    await expect(page.locator('text=nasa.gov').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=wikipedia.org').first()).toBeVisible({ timeout: 5000 });
  });

  test('YAML without sources imports successfully', async ({ page }) => {
    await openImportOverlay(page);

    // Paste YAML without sources
    const runId = Date.now().toString(36);
    const yamlContent = `version: 1
timeline:
  title: "No Sources Test"
events:
  - id: "no-source-${runId}"
    date: "2000-01-01"
    title: "Y2K Event"
    description: "Testing no sources"
`;
    await page.fill('[data-testid="yaml-paste-input"]', yamlContent);
    await page.click('[data-testid="yaml-paste-import"]');

    // Should import successfully
    await page.waitForTimeout(500);
    await ensureReviewPanelOpen(page);

    // Event should be in review panel
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Y2K Event'
    });
    await expect(eventItem).toBeVisible({ timeout: 5000 });
  });
});
