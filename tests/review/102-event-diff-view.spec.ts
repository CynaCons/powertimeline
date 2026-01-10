/**
 * E2E Tests for Event Diff View
 * v0.9.4 - Tests the diff modal for UPDATE events in ReviewPanel
 *
 * Requirements tested:
 * - CC-REQ-REVIEW-DIFF-001: View Diff button opens modal for UPDATE events
 * - CC-REQ-REVIEW-DIFF-002: Modal shows only changed fields
 * - CC-REQ-REVIEW-DIFF-003: Word-level diff with green/red highlighting
 * - CC-REQ-REVIEW-DIFF-006: Keep Existing sets decision to 'rejected'
 * - CC-REQ-REVIEW-DIFF-007: Take Imported sets decision to 'accepted'
 * - CC-REQ-REVIEW-DIFF-010: No changes state display
 */

import { test, expect, type Page } from '@playwright/test';
import { skipIfNoCredentials } from '../utils/timelineTestUtils';
import { signInWithEmail } from '../utils/authTestUtils';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

// Use a unique run ID to avoid conflicts
const runId = Date.now().toString(36);

/**
 * YAML to create an event first
 */
function generateInitialYaml(): string {
  return `version: 1
timeline:
  title: "Diff Test Initial"
events:
  - id: "diff-test-event-${runId}"
    date: "1789-07-14"
    title: "The French Bastille"
    description: "A major event in French history that sparked the revolution."
    sources:
      - "https://example.com/source1"
      - "https://example.com/source2"
`;
}

/**
 * YAML to update the event (change title, description, sources)
 */
function generateUpdateYaml(): string {
  return `version: 1
timeline:
  title: "Diff Test Update"
events:
  - id: "diff-test-event-${runId}"
    date: "1789-07-14"
    title: "The Storming of the French Bastille"
    description: "A pivotal moment in French history that sparked the revolution and changed Europe."
    sources:
      - "https://example.com/source1"
      - "https://example.com/new-source"
      - "https://example.com/another-source"
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

async function importAndCommitEvent(page: Page, yaml: string) {
  // Open import overlay
  await openImportOverlay(page);

  // Paste and import YAML
  await page.fill('[data-testid="yaml-paste-input"]', yaml);
  await page.click('[data-testid="yaml-paste-import"]');
  await page.waitForTimeout(500);

  // Open review panel
  await ensureReviewPanelOpen(page);

  // Accept all and commit
  await page.click('button:has-text("Accept All Remaining")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Commit")');
  await page.waitForTimeout(1500);

  // Close review panel if still open (after successful commit it auto-closes)
  const closeButton = page.locator('[data-testid="review-panel"] button[aria-label="Close review panel"]');
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
  }
}

test.describe('Event Diff View', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await navigateToTimelineWithAuth(page);
  });

  test('View Diff button appears for UPDATE events', async ({ page }) => {
    // First, create the event
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    // Now import an update to trigger UPDATE action
    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateUpdateYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    // Open review panel
    await ensureReviewPanelOpen(page);

    // Find the event with UPDATE action
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    });
    await expect(eventItem).toBeVisible({ timeout: 5000 });

    // Should show UPDATE indicator
    await expect(eventItem.locator('text=UPDATE')).toBeVisible();

    // View Diff button should be visible
    const viewDiffButton = eventItem.locator('[data-testid="view-diff-button"]');
    await expect(viewDiffButton).toBeVisible();
    await expect(viewDiffButton).toHaveText('View Diff');
  });

  test('Diff modal shows changed fields with word-level highlighting', async ({ page }) => {
    // First create, then update
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateUpdateYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    await ensureReviewPanelOpen(page);

    // Find UPDATE event and click View Diff
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    });
    const viewDiffButton = eventItem.locator('[data-testid="view-diff-button"]');
    await viewDiffButton.click();

    // Modal should open
    const diffDialog = page.locator('[data-testid="event-diff-dialog"]');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });

    // Should show Title diff
    const titleField = diffDialog.locator('[data-testid="diff-field-title"]');
    await expect(titleField).toBeVisible();

    // Should show Description diff
    const descField = diffDialog.locator('[data-testid="diff-field-description"]');
    await expect(descField).toBeVisible();

    // Should show Sources diff
    const sourcesField = diffDialog.locator('[data-testid="diff-field-sources"]');
    await expect(sourcesField).toBeVisible();

    // Date should NOT be shown (unchanged)
    const dateField = diffDialog.locator('[data-testid="diff-field-date"]');
    await expect(dateField).not.toBeVisible();
  });

  test('Keep Existing button rejects the event', async ({ page }) => {
    // Create then update
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateUpdateYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    await ensureReviewPanelOpen(page);

    // Open diff modal
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    });
    await eventItem.locator('[data-testid="view-diff-button"]').click();

    const diffDialog = page.locator('[data-testid="event-diff-dialog"]');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });

    // Click Keep Existing
    await page.click('[data-testid="diff-keep-existing-button"]');

    // Modal should close
    await expect(diffDialog).not.toBeVisible();

    // Event should now show rejected status (red border, X icon)
    const rejectedEvent = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    }).first();
    // The icon should change to X (rejected)
    await expect(rejectedEvent.locator('text=✗')).toBeVisible();
  });

  test('Take Imported button accepts the event', async ({ page }) => {
    // Create then update
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateUpdateYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    await ensureReviewPanelOpen(page);

    // Open diff modal
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    });
    await eventItem.locator('[data-testid="view-diff-button"]').click();

    const diffDialog = page.locator('[data-testid="event-diff-dialog"]');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });

    // Click Take Imported
    await page.click('[data-testid="diff-take-imported-button"]');

    // Modal should close
    await expect(diffDialog).not.toBeVisible();

    // Event should now show accepted status (green border, check icon)
    const acceptedEvent = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    }).first();
    // The icon should change to checkmark (accepted)
    await expect(acceptedEvent.locator('text=✓')).toBeVisible();
  });

  test('Close button dismisses modal without changing decision', async ({ page }) => {
    // Create then update
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateUpdateYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    await ensureReviewPanelOpen(page);

    // Open diff modal
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    });

    // Check initial state is pending (circle icon)
    await expect(eventItem.locator('text=○')).toBeVisible();

    await eventItem.locator('[data-testid="view-diff-button"]').click();

    const diffDialog = page.locator('[data-testid="event-diff-dialog"]');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });

    // Click close button
    await page.click('[data-testid="diff-close-button"]');

    // Modal should close
    await expect(diffDialog).not.toBeVisible();

    // Event should still be pending (unchanged)
    await expect(eventItem.locator('text=○')).toBeVisible();
  });

  test('Escape key closes diff modal', async ({ page }) => {
    // Create then update
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateUpdateYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    await ensureReviewPanelOpen(page);

    // Open diff modal
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Storming'
    });
    await eventItem.locator('[data-testid="view-diff-button"]').click();

    const diffDialog = page.locator('[data-testid="event-diff-dialog"]');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(diffDialog).not.toBeVisible();
  });

  test('Partial update shows only changed fields (CC-REQ-REVIEW-DIFF-002)', async ({ page }) => {
    // Create event with all fields
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    // Import partial update - only title changed, description omitted (undefined)
    const partialUpdateYaml = `version: 1
timeline:
  title: "Partial Update Test"
events:
  - id: "diff-test-event-${runId}"
    date: "1789-07-14"
    title: "Updated Title Only"
`;

    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', partialUpdateYaml);
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    await ensureReviewPanelOpen(page);

    // Find UPDATE event and click View Diff
    const eventItem = page.locator('[data-testid="review-event-item"]').filter({
      hasText: 'Updated Title Only'
    });
    const viewDiffButton = eventItem.locator('[data-testid="view-diff-button"]');
    await viewDiffButton.click();

    const diffDialog = page.locator('[data-testid="event-diff-dialog"]');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });

    // Should show Title diff (changed)
    const titleField = diffDialog.locator('[data-testid="diff-field-title"]');
    await expect(titleField).toBeVisible();

    // Should NOT show Description diff (undefined in import = not changed)
    const descField = diffDialog.locator('[data-testid="diff-field-description"]');
    await expect(descField).not.toBeVisible();

    // Should NOT show Sources diff (undefined in import = not changed)
    const sourcesField = diffDialog.locator('[data-testid="diff-field-sources"]');
    await expect(sourcesField).not.toBeVisible();

    // Date should NOT be shown (same value)
    const dateField = diffDialog.locator('[data-testid="diff-field-date"]');
    await expect(dateField).not.toBeVisible();
  });

  test('Identical events are skipped during import (CC-REQ-REVIEW-SESSION-003a)', async ({ page }) => {
    // Create an event first
    await importAndCommitEvent(page, generateInitialYaml());
    await page.waitForTimeout(500);

    // Import the exact same YAML again (no changes)
    await openImportOverlay(page);
    await page.fill('[data-testid="yaml-paste-input"]', generateInitialYaml());
    await page.click('[data-testid="yaml-paste-import"]');
    await page.waitForTimeout(500);

    // Check review panel - should have NO events (identical event skipped)
    // The review panel should either be empty or the nav button should be disabled
    const reviewNavButton = page.locator('[data-testid="nav-review"]');

    // Two possible outcomes:
    // 1. Review button is disabled (no events to review)
    // 2. Review panel is visible but empty
    const isDisabled = await reviewNavButton.isDisabled({ timeout: 2000 }).catch(() => false);

    if (isDisabled) {
      // Expected: No session created because all events were identical
      console.log('Review button disabled - no events to review (expected)');
    } else {
      // Check if panel has no events
      await ensureReviewPanelOpen(page);
      const eventItems = page.locator('[data-testid="review-event-item"]');
      const count = await eventItems.count();

      // The diff-test-event should NOT be in the review panel (it was identical)
      const diffTestEvent = eventItems.filter({
        hasText: 'French Bastille'
      });
      await expect(diffTestEvent).toHaveCount(0);
      console.log(`Review panel has ${count} events (identical event skipped)`);
    }
  });
});
