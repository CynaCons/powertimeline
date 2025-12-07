/**
 * Event Sources - Stream View E2E Tests
 * v0.6.3 - Tests for sources indicator in Stream View
 *
 * Tests the Event Sources Stream View functionality:
 * - Sources indicator badge visibility
 * - Source count display
 * - Clicking indicator navigates to editor
 *
 * Strategy: Create a test timeline, add events with sources, verify display in stream view
 *
 * SRS: docs/SRS_EVENT_SOURCES.md
 * Requirements: CC-REQ-SOURCES-060 through CC-REQ-SOURCES-072
 */

import { test, expect, type Page } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

/**
 * Helper: Create a timeline with test events
 */
async function createTestTimelineWithEvents(page: Page): Promise<string> {
  // After sign-in, we should already be on browse/home page
  // Wait for page to be ready
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // If we're on landing page, navigate to home (shouldn't happen if logged in)
  if (page.url().endsWith('/') || page.url().includes('localhost:5175/#')) {
    // Click "Explore Public Timelines" or navigate to browse
    await page.goto('/browse');
    await page.waitForTimeout(1000);
  }

  // Click "+ Create New" button
  const createButton = page.getByTestId('create-timeline-button');
  await createButton.click();

  // Wait for dialog
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

  // Fill in timeline details
  const uniqueSuffix = Date.now().toString().slice(-6);
  await page.getByLabel('Title').fill(`Event Sources Test ${uniqueSuffix}`);
  await page.getByLabel('Description').fill('Test timeline for event sources E2E tests');

  // Create timeline
  await page.getByRole('button', { name: /create timeline/i }).click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Get the timeline ID from URL
  const url = page.url();
  const match = url.match(/timeline\/([^/]+)/);
  return match ? match[1] : '';
}

/**
 * Helper: Add an event with sources
 */
async function addEventWithSources(page: Page, title: string, sources: string[]): Promise<void> {
  // Open event creation via nav button
  const navCreate = page.getByTestId('nav-create');
  await navCreate.click();

  // Wait for authoring overlay
  await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible({ timeout: 5000 });

  // Fill event details
  await page.getByLabel(/^title/i).fill(title);

  // Set date via calendar picker
  const dateButton = page.getByRole('button', { name: 'Choose date' });
  if (await dateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dateButton.click();
    await page.waitForSelector('.MuiPickersDay-root', { timeout: 5000 });
    await page.locator('.MuiPickersDay-root').filter({ hasText: /^15$/ }).first().click();
    await page.waitForTimeout(500);
  }

  // Add sources if any
  if (sources.length > 0) {
    // Find and click the Sources section header to expand it
    const sourcesHeader = page.locator('button').filter({ hasText: /^Sources/i }).first();
    if (await sourcesHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sourcesHeader.click();
      await page.waitForTimeout(300);
    }

    // Add each source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      // Check if input is already visible (stays open after adding source)
      const sourceInput = page.locator('input[placeholder*="URL"]').or(
        page.locator('input[placeholder*="text"]')
      ).first();

      if (!await sourceInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Click "Add Source" button to open input
        const addSourceBtn = page.locator('button').filter({ hasText: /add source/i }).first();
        await expect(addSourceBtn).toBeVisible({ timeout: 5000 });
        await addSourceBtn.click();
        await page.waitForTimeout(300);
      }

      // Fill the input
      await expect(sourceInput).toBeVisible({ timeout: 3000 });
      await sourceInput.fill(source);

      // Press Enter to save (input stays open for next source)
      await sourceInput.press('Enter');
      await page.waitForTimeout(500);
    }

    // Close input by pressing Escape if still open (now safe with stopPropagation fix)
    const sourceInput = page.locator('input[placeholder*="URL"]').first();
    if (await sourceInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await sourceInput.press('Escape');
      await page.waitForTimeout(200);
    }
  }

  // Save the event - MUI Button with type="submit" and text "Save"
  const saveButton = page.locator('[data-testid="authoring-overlay"] button[type="submit"]').filter({ hasText: 'Save' });
  await expect(saveButton).toBeVisible({ timeout: 5000 });
  await saveButton.click();

  // Wait for overlay to close
  await expect(page.locator('[data-testid="authoring-overlay"]')).not.toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
}

/**
 * Helper: Open Stream View overlay
 */
async function openStreamView(page: Page): Promise<void> {
  const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
    page.locator('.material-symbols-rounded').filter({ hasText: 'view_stream' }).locator('..')
  ).first();

  await streamButton.click();
  await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('stream-scroll-container')).toBeVisible({ timeout: 10000 });
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Event Sources - Stream View', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('T-SRC-S1: Sources indicator appears for events with sources', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-060, CC-REQ-SOURCES-062' });

    // Sign in and create a test timeline
    await signInWithEmail(page);
    await createTestTimelineWithEvents(page);

    // Add an event with 2 sources
    await addEventWithSources(page, 'Test Event With Sources', [
      'https://example.com/source1',
      'Test reference note'
    ]);

    // Open stream view
    await openStreamView(page);

    // Find the event card
    const eventCard = page.getByTestId('stream-scroll-container')
      .locator('[data-event-id]')
      .filter({ hasText: 'Test Event With Sources' })
      .first();

    await expect(eventCard).toBeVisible({ timeout: 5000 });

    // Verify sources indicator badge is visible (has title with source count)
    const indicatorBadge = eventCard.locator('[title*="source"]');
    await expect(indicatorBadge).toBeVisible({ timeout: 3000 });

    // Verify count shows "2" - the badge title should say "2 sources"
    await expect(indicatorBadge).toHaveAttribute('title', /2 source/);
  });

  test('T-SRC-S2: Sources indicator shows correct count', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-061' });

    await signInWithEmail(page);
    await createTestTimelineWithEvents(page);

    // Add event with 3 sources
    await addEventWithSources(page, 'Event With Three Sources', [
      'https://example.com/1',
      'https://example.com/2',
      'Third source note'
    ]);

    await openStreamView(page);

    const eventCard = page.getByTestId('stream-scroll-container')
      .locator('[data-event-id]')
      .filter({ hasText: 'Event With Three Sources' })
      .first();

    await expect(eventCard).toBeVisible();

    // Check count shows "3" - verify via badge title attribute
    const indicatorBadge = eventCard.locator('[title*="source"]');
    await expect(indicatorBadge).toHaveAttribute('title', /3 source/);
  });

  test('T-SRC-S3: Events without sources have no indicator', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-060' });

    await signInWithEmail(page);
    await createTestTimelineWithEvents(page);

    // Add event WITHOUT sources
    await addEventWithSources(page, 'Event Without Sources', []);

    await openStreamView(page);

    const eventCard = page.getByTestId('stream-scroll-container')
      .locator('[data-event-id]')
      .filter({ hasText: 'Event Without Sources' })
      .first();

    await expect(eventCard).toBeVisible();

    // Verify NO sources indicator
    const indicator = eventCard.locator('.material-symbols-rounded').filter({ hasText: 'source' });
    await expect(indicator).not.toBeVisible();
  });

  test('T-SRC-S4: Clicking sources indicator opens editor', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-070, CC-REQ-SOURCES-072' });

    await signInWithEmail(page);
    await createTestTimelineWithEvents(page);

    // Add event with sources
    await addEventWithSources(page, 'Clickable Sources Event', ['https://example.com/test']);

    await openStreamView(page);

    const eventCard = page.getByTestId('stream-scroll-container')
      .locator('[data-event-id]')
      .filter({ hasText: 'Clickable Sources Event' })
      .first();

    // Click the sources indicator badge (not just the icon)
    const indicatorBadge = eventCard.locator('.material-symbols-rounded').filter({ hasText: 'source' }).locator('..');
    await indicatorBadge.click();

    // Stream view should close
    await expect(page.getByTestId('stream-viewer-overlay')).not.toBeVisible({ timeout: 3000 });

    // Editor should open
    await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible({ timeout: 5000 });
  });
});
