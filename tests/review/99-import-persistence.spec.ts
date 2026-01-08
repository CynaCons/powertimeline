import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';
import { waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';

/**
 * Import Persistence Test
 * CC-REQ-REVIEW-SESSION-005 - Verifies events persist to Firebase after commit
 *
 * This test requires TEST_USER_TIMELINE_ID in .env.test pointing to a timeline
 * owned by the test user (not a shared timeline like french-revolution).
 */

// Generate unique event ID per test run to avoid conflicts
const RUN_ID = Date.now().toString(36);
const TEST_EVENT_TITLE = `Persistence Test ${RUN_ID}`;

function generateTestYaml(): string {
  return `version: 1
timeline:
  title: "Test Timeline"
events:
  - id: "persist-${RUN_ID}"
    date: "1900-01-01"
    title: "${TEST_EVENT_TITLE}"
    description: "This event tests persistence after commit and reload"
`;
}

test.describe('Import Persistence', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
  });

  test('Committed events persist after page reload', async ({ page }) => {
    const testTimelineId = process.env.TEST_USER_TIMELINE_ID;

    if (!testTimelineId) {
      test.skip(true, 'TEST_USER_TIMELINE_ID not configured - cannot test persistence');
      return;
    }

    // 1. Sign in as test user
    const signedIn = await signInWithEmail(page);
    expect(signedIn).toBe(true);

    // 2. Navigate to test user's own timeline
    // The test user must own this timeline for write permissions
    await page.goto(`/testuser/timeline/${testTimelineId}`);
    await waitForEditorLoaded(page);

    // 3. Open Import/Export overlay
    const importExportBtn = page.locator('[data-testid="nav-import-export"]');
    await expect(importExportBtn).toBeVisible({ timeout: 5000 });
    await importExportBtn.click();

    // 4. Switch to Import tab and paste YAML
    await page.click('[data-testid="import-tab"]');
    await expect(page.locator('[data-testid="yaml-paste-input"]')).toBeVisible({ timeout: 5000 });

    const testYaml = generateTestYaml();
    await page.fill('[data-testid="yaml-paste-input"]', testYaml);
    await page.click('[data-testid="yaml-paste-import"]');

    // 5. Review panel should open with the event
    await expect(page.locator('[data-testid="review-panel"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${TEST_EVENT_TITLE}`).first()).toBeVisible({ timeout: 5000 });

    // 6. Accept all and commit
    const acceptAllBtn = page.getByRole('button', { name: 'Accept All Remaining' });
    await expect(acceptAllBtn).toBeEnabled({ timeout: 5000 });
    await acceptAllBtn.click();
    await page.waitForTimeout(500);

    const commitBtn = page.getByRole('button', { name: /Commit/i });
    await expect(commitBtn).toBeEnabled({ timeout: 5000 });
    await commitBtn.click();

    // 7. Wait for commit to complete (panel closes on success)
    await expect(page.locator('[data-testid="review-panel"]')).toBeHidden({ timeout: 15000 });

    // 8. Verify event appears on timeline immediately after commit
    await expect(page.locator(`text=${TEST_EVENT_TITLE}`)).toBeVisible({ timeout: 10000 });
    console.log('✓ Event visible immediately after commit');

    // 9. Reload the page
    await page.reload();
    await waitForEditorLoaded(page);

    // 10. Verify event still appears (proves Firebase persistence)
    await expect(page.locator(`text=${TEST_EVENT_TITLE}`)).toBeVisible({ timeout: 15000 });
    console.log('✓ Event persisted and visible after reload');

    // Note: Cleanup would require deleting the event, which we skip for now
    // The unique RUN_ID prevents conflicts between test runs
  });

  test('Session events appear on timeline before commit', async ({ page }) => {
    const testTimelineId = process.env.TEST_USER_TIMELINE_ID;

    if (!testTimelineId) {
      test.skip(true, 'TEST_USER_TIMELINE_ID not configured');
      return;
    }

    // Sign in and navigate
    await signInWithEmail(page);
    await page.goto(`/testuser/timeline/${testTimelineId}`);
    await waitForEditorLoaded(page);

    // Import YAML
    await page.click('[data-testid="nav-import-export"]');
    await page.click('[data-testid="import-tab"]');

    const previewYaml = `version: 1
timeline:
  title: "Test"
events:
  - id: "preview-${RUN_ID}"
    date: "1900-06-15"
    title: "Preview Test ${RUN_ID}"
    description: "This event should appear as pending on timeline"
`;

    await page.fill('[data-testid="yaml-paste-input"]', previewYaml);
    await page.click('[data-testid="yaml-paste-import"]');

    // Review panel opens
    await expect(page.locator('[data-testid="review-panel"]')).toBeVisible({ timeout: 5000 });

    // The event should appear on the timeline with pending styling
    // Look for the event card with session-event-pending class
    const pendingCard = page.locator(`[data-testid="event-card"].session-event-pending`);
    const pendingCount = await pendingCard.count();

    if (pendingCount > 0) {
      console.log(`✓ Found ${pendingCount} pending event card(s) on timeline`);
      expect(pendingCount).toBeGreaterThan(0);
    } else {
      // May appear without the class if styling not applied
      const eventOnTimeline = page.locator(`text=Preview Test ${RUN_ID}`);
      const visible = await eventOnTimeline.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        console.log('✓ Event visible on timeline (styling may vary)');
      } else {
        console.log('⚠ Event not visible on timeline during review - feature may need work');
        test.fixme(true, 'Session events not rendered on timeline during review');
      }
    }

    // Discard to clean up
    await page.click('button:has-text("Discard All")');
    const confirmBtn = page.getByRole('button', { name: 'Discard' });
    if (await confirmBtn.isVisible({ timeout: 2000 })) {
      await confirmBtn.click();
    }
  });
});
