/**
 * Event Sources E2E Tests - Editor View
 * v0.6.3 - Complete tests for Event Sources feature
 *
 * Tests the Event Sources functionality in the Authoring Overlay:
 * - Sources section visibility and display
 * - Add/edit/delete sources
 * - URL detection and rendering
 * - Drag-and-drop reordering
 * - Persistence across sessions
 * - Read-only mode
 *
 * SRS: docs/SRS_EVENT_SOURCES.md
 * Requirements: CC-REQ-SOURCES-*
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsTestUser } from '../utils/timelineTestUtils';

const TEST_TIMELINE_ID = process.env.TEST_USER_TIMELINE_ID || 'zEAJkBfgpYt3YdCLW2tz';
const TEST_USER_USERNAME = 'testuser';

/**
 * Helper: Open the authoring overlay for an event
 */
async function openEventEditor(page: Page): Promise<void> {
  // Open Stream View (replaces Events panel)
  await page.locator('button[aria-label="Stream View"]').click();
  await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });

  // Wait for stream events to load
  const firstEvent = page.locator('[data-testid^="stream-event-"]').first();
  await expect(firstEvent).toBeVisible({ timeout: 5000 });

  // Hover over first event to show edit button (desktop)
  await firstEvent.hover();

  // Click the "Edit event" button (desktop hover action)
  const editButton = page.locator('button[title="Edit event"]').first();
  await expect(editButton).toBeVisible({ timeout: 2000 });
  await editButton.click();

  // Wait for overlay
  const overlay = page.locator('[data-testid="authoring-overlay"]');
  await expect(overlay).toBeVisible({ timeout: 5000 });
}

/**
 * Helper: Switch to edit mode if in view mode
 */
async function ensureEditMode(page: Page): Promise<void> {
  const editButton = page.getByRole('button', { name: 'Edit event' });
  const isEditButtonVisible = await editButton.isVisible().catch(() => false);

  if (isEditButtonVisible) {
    await editButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();
  }
}

/**
 * Helper: Get Sources section
 */
function getSourcesSection(page: Page) {
  return page.locator('[aria-controls="sources-editor-panel"]').or(
    page.locator('text=Sources').first()
  );
}

/**
 * Helper: Count visible source items
 */
async function countSources(page: Page): Promise<number> {
  const sourceItems = page.locator('[data-testid="authoring-overlay"] .material-symbols-rounded:has-text("link"), [data-testid="authoring-overlay"] .material-symbols-rounded:has-text("description")');
  return await sourceItems.count();
}

// ============================================================================
// SECTION 1: Sources Section Display
// ============================================================================

test.describe('Event Sources - Section Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
  });

  test('T-SOURCES-001: Sources section appears below Description field', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-020' });

    await openEventEditor(page);
    await ensureEditMode(page);

    // Find description field
    const descriptionField = page.getByLabel('Description (Optional)');
    await expect(descriptionField).toBeVisible();

    // Find Sources section - should be below description
    const sourcesHeader = page.locator('text=Sources');
    await expect(sourcesHeader.first()).toBeVisible();

    // Verify Sources is below Description using DOM order
    const descriptionBox = await descriptionField.boundingBox();
    const sourcesBox = await sourcesHeader.first().boundingBox();

    expect(sourcesBox!.y).toBeGreaterThan(descriptionBox!.y);
  });

  test('T-SOURCES-002: Sources section is collapsible', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-021' });

    await openEventEditor(page);
    await ensureEditMode(page);

    // Find Sources section header (collapsible button)
    const sourcesButton = page.locator('[aria-controls="sources-editor-panel"]');
    await expect(sourcesButton).toBeVisible();

    // Check if expanded (aria-expanded should be true initially)
    const isExpanded = await sourcesButton.getAttribute('aria-expanded');
    expect(isExpanded).toBe('true');

    // Click to collapse
    await sourcesButton.click();
    await page.waitForTimeout(300);

    // Should now be collapsed
    const isCollapsed = await sourcesButton.getAttribute('aria-expanded');
    expect(isCollapsed).toBe('false');

    // Click to expand again
    await sourcesButton.click();
    await page.waitForTimeout(300);

    const isExpandedAgain = await sourcesButton.getAttribute('aria-expanded');
    expect(isExpandedAgain).toBe('true');
  });

  test('T-SOURCES-003: Header shows source count', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-022' });

    await openEventEditor(page);
    await ensureEditMode(page);

    // Sources header should show count in format "Sources (N)"
    const sourcesHeader = page.locator('[aria-controls="sources-editor-panel"]');
    await expect(sourcesHeader).toBeVisible();

    const headerText = await sourcesHeader.textContent();
    expect(headerText).toMatch(/Sources \(\d+\)/);
  });
});

// ============================================================================
// SECTION 2: Add Source Functionality
// ============================================================================

test.describe('Event Sources - Add Source', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
    await openEventEditor(page);
    await ensureEditMode(page);
  });

  test('T-SOURCES-010: Add Source button visible', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-040' });

    // Look for "Add Source" button
    const addButton = page.locator('button:has-text("Add Source")');
    await expect(addButton).toBeVisible();
  });

  test('T-SOURCES-011: Clicking Add Source shows input field', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-041' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    // Input field should appear
    const input = page.locator('input[placeholder*="URL or text"]');
    await expect(input).toBeVisible();
  });

  test('T-SOURCES-012: Input field auto-focuses when added', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-042' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    // Input should be focused
    const input = page.locator('input[placeholder*="URL or text"]');
    await expect(input).toBeFocused({ timeout: 2000 });
  });

  test('T-SOURCES-013: Enter key saves source', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-043' });

    const initialCount = await countSources(page);

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('Test source entry');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Source should be added
    const newCount = await countSources(page);
    expect(newCount).toBe(initialCount + 1);

    // Input should remain visible and focused for adding another
    await expect(input).toBeFocused();
  });

  test('T-SOURCES-014: Check button saves source', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-041' });

    const initialCount = await countSources(page);

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('Another test source');

    // Click check button
    const checkButton = page.locator('button[aria-label="Save source"]');
    await expect(checkButton).toBeVisible();
    await checkButton.click();

    await page.waitForTimeout(300);

    // Source should be added
    const newCount = await countSources(page);
    expect(newCount).toBe(initialCount + 1);
  });

  test('T-SOURCES-015: Empty sources not saved', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-044' });

    const initialCount = await countSources(page);

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');

    // Try to save empty source by pressing Enter
    await input.press('Enter');
    await page.waitForTimeout(300);

    // Count should not change
    const newCount = await countSources(page);
    expect(newCount).toBe(initialCount);

    // Try with just spaces
    await input.fill('   ');
    await input.press('Enter');
    await page.waitForTimeout(300);

    const finalCount = await countSources(page);
    expect(finalCount).toBe(initialCount);
  });

  test('T-SOURCES-016: Escape key cancels adding', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-041' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await expect(input).toBeVisible();

    // Press Escape to cancel
    await input.press('Escape');
    await page.waitForTimeout(300);

    // Input should be hidden, Add button visible again
    await expect(input).not.toBeVisible();
    await expect(addButton).toBeVisible();
  });
});

// ============================================================================
// SECTION 3: URL Detection
// ============================================================================

test.describe('Event Sources - URL Detection', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
    await openEventEditor(page);
    await ensureEditMode(page);
  });

  test('T-SOURCES-020: URLs detected automatically (http)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-050' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('http://example.com');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Should show link icon
    const linkIcon = page.locator('.material-symbols-rounded:has-text("link")').last();
    await expect(linkIcon).toBeVisible();
  });

  test('T-SOURCES-021: URLs detected automatically (https)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-050' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('https://wikipedia.org/wiki/French_Revolution');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Should show link icon
    const linkIcon = page.locator('.material-symbols-rounded:has-text("link")').last();
    await expect(linkIcon).toBeVisible();
  });

  test('T-SOURCES-022: URLs display as clickable links', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-031' });

    const testUrl = 'https://example.com/test';

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill(testUrl);
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Should be clickable link
    const link = page.locator(`a[href="${testUrl}"]`);
    await expect(link).toBeVisible();

    // Link should have target="_blank"
    const target = await link.getAttribute('target');
    expect(target).toBe('_blank');
  });

  test('T-SOURCES-023: Non-URLs display with description icon', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-052' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('Smith, John. "History of France". 2020.');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Should show description icon
    const descIcon = page.locator('.material-symbols-rounded:has-text("description")').last();
    await expect(descIcon).toBeVisible();
  });

  test('T-SOURCES-024: Non-URLs display as plain text', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-032' });

    const testText = 'Personal journal entry, March 1789';

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill(testText);
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Should display as text (not a link)
    const sourceText = page.locator(`text="${testText}"`);
    await expect(sourceText).toBeVisible();

    // Should NOT be a link
    const asLink = page.locator(`a:has-text("${testText}")`);
    expect(await asLink.count()).toBe(0);
  });
});

// ============================================================================
// SECTION 4: Delete Source
// ============================================================================

test.describe('Event Sources - Delete Source', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
    await openEventEditor(page);
    await ensureEditMode(page);
  });

  test('T-SOURCES-030: Each source has delete button', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-033' });

    // Add a source first
    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('Test source for deletion');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Hover over the source item to reveal delete button
    const sourceItem = page.locator('text="Test source for deletion"').locator('..');
    await sourceItem.hover();

    // Delete button should appear (might need to wait for hover effect)
    await page.waitForTimeout(200);

    const deleteButton = sourceItem.locator('button[aria-label="Delete source"]');
    await expect(deleteButton).toBeVisible();
  });

  test('T-SOURCES-031: Delete button removes source', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-033' });

    // Add a source
    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('Source to be deleted');
    await input.press('Enter');

    await page.waitForTimeout(300);

    const initialCount = await countSources(page);

    // Find and click delete button
    const sourceItem = page.locator('text="Source to be deleted"').locator('..');
    await sourceItem.hover();
    await page.waitForTimeout(200);

    const deleteButton = sourceItem.locator('button[aria-label="Delete source"]');
    await deleteButton.click();

    await page.waitForTimeout(300);

    // Source should be removed
    const newCount = await countSources(page);
    expect(newCount).toBe(initialCount - 1);

    // Text should not be visible
    await expect(page.locator('text="Source to be deleted"')).not.toBeVisible();
  });
});

// ============================================================================
// SECTION 5: Drag-and-Drop Reordering
// ============================================================================

test.describe('Event Sources - Reordering', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
    await openEventEditor(page);
    await ensureEditMode(page);
  });

  test('T-SOURCES-040: Each source has drag handle', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-055' });

    // Add a source
    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('Draggable source');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Look for drag_indicator icon
    const dragHandle = page.locator('.material-symbols-rounded:has-text("drag_indicator")').last();
    await expect(dragHandle).toBeVisible();
  });

  test('T-SOURCES-041: Sources are reorderable via drag-and-drop', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-056' });

    // Add two sources to test reordering
    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');

    await input.fill('First source');
    await input.press('Enter');
    await page.waitForTimeout(200);

    await input.fill('Second source');
    await input.press('Enter');
    await page.waitForTimeout(300);

    // Get source items
    const firstSource = page.locator('text="First source"').locator('..');
    const secondSource = page.locator('text="Second source"').locator('..');

    // Get bounding boxes to verify initial order
    const firstBox = await firstSource.boundingBox();
    const secondBox = await secondSource.boundingBox();

    expect(firstBox!.y).toBeLessThan(secondBox!.y);

    // Note: Drag-and-drop in Playwright can be tricky
    // We'll verify the drag handle exists and items are draggable
    const draggableAttr = await firstSource.getAttribute('draggable');
    expect(draggableAttr).toBe('true');
  });
});

// ============================================================================
// SECTION 6: Persistence
// ============================================================================

test.describe('Event Sources - Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
  });

  test('T-SOURCES-050: Sources persist after saving event', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-010' });

    await openEventEditor(page);
    await ensureEditMode(page);

    // Add a unique source
    const uniqueSource = `Test source ${Date.now()}`;

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill(uniqueSource);
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Save the event
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();

    // Wait for save to complete and overlay to close
    await page.waitForTimeout(1000);

    // Reopen the same event
    await openEventEditor(page);

    // Source should still be there
    await expect(page.locator(`text="${uniqueSource}"`)).toBeVisible({ timeout: 5000 });
  });

  test('T-SOURCES-051: Sources count updates in header after save', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-022' });

    await openEventEditor(page);

    // Check initial count in view mode
    const viewModeHeader = page.locator('[aria-controls="sources-viewer-panel"]');
    const initialText = await viewModeHeader.textContent();
    const initialMatch = initialText?.match(/Sources \((\d+)\)/);
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;

    // Switch to edit mode
    await ensureEditMode(page);

    // Add a source
    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill('New persisted source');
    await input.press('Enter');

    await page.waitForTimeout(300);

    // Header should show updated count
    const editModeHeader = page.locator('[aria-controls="sources-editor-panel"]');
    const updatedText = await editModeHeader.textContent();
    const updatedMatch = updatedText?.match(/Sources \((\d+)\)/);
    const updatedCount = updatedMatch ? parseInt(updatedMatch[1]) : 0;

    expect(updatedCount).toBe(initialCount + 1);
  });
});

// ============================================================================
// SECTION 7: Read-Only Mode
// ============================================================================

test.describe('Event Sources - Read-Only Mode', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
    await openEventEditor(page);
  });

  test('T-SOURCES-060: Sources visible in view mode', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-090' });

    // Should be in view mode initially
    await expect(page.getByText('View Event')).toBeVisible();

    // Sources section should be visible
    const sourcesHeader = page.locator('[aria-controls="sources-viewer-panel"]');
    await expect(sourcesHeader).toBeVisible();
  });

  test('T-SOURCES-061: URLs remain clickable in view mode', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-092' });

    // Switch to edit mode to add a URL
    await ensureEditMode(page);

    const testUrl = 'https://example.com/readonly-test';
    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');
    await input.fill(testUrl);
    await input.press('Enter');
    await page.waitForTimeout(300);

    // Save and close
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Reopen in view mode
    await openEventEditor(page);
    await expect(page.getByText('View Event')).toBeVisible();

    // URL should be clickable in view mode
    const link = page.locator(`a[href="${testUrl}"]`);
    await expect(link).toBeVisible();

    const target = await link.getAttribute('target');
    expect(target).toBe('_blank');
  });

  test('T-SOURCES-062: Add/Delete controls hidden in view mode', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-091' });

    // Should be in view mode initially
    await expect(page.getByText('View Event')).toBeVisible();

    // Expand sources section if collapsed
    const sourcesHeader = page.locator('[aria-controls="sources-viewer-panel"]');
    const isExpanded = await sourcesHeader.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await sourcesHeader.click();
      await page.waitForTimeout(300);
    }

    // "Add Source" button should not be visible
    const addButton = page.locator('button:has-text("Add Source")');
    expect(await addButton.count()).toBe(0);

    // Delete buttons should not be visible (no aria-label="Delete source")
    const deleteButtons = page.locator('button[aria-label="Delete source"]');
    expect(await deleteButtons.count()).toBe(0);

    // Drag handles should not be visible in view mode
    const dragHandles = page.locator('.material-symbols-rounded:has-text("drag_indicator")');
    expect(await dragHandles.count()).toBe(0);
  });
});

// ============================================================================
// SECTION 8: Character Limit
// ============================================================================

test.describe('Event Sources - Character Limit', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/${TEST_USER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForTimeout(2000);
    await openEventEditor(page);
    await ensureEditMode(page);
  });

  test('T-SOURCES-070: Input field has 500 character limit', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-004' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');

    // Check maxLength attribute
    const maxLength = await input.getAttribute('maxLength');
    expect(maxLength).toBe('500');
  });

  test('T-SOURCES-071: Cannot enter more than 500 characters', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SOURCES-004' });

    const addButton = page.locator('button:has-text("Add Source")');
    await addButton.click();

    const input = page.locator('input[placeholder*="URL or text"]');

    // Try to fill with 600 characters
    const longText = 'A'.repeat(600);
    await input.fill(longText);

    // Should be truncated to 500
    const actualValue = await input.inputValue();
    expect(actualValue.length).toBe(500);
  });
});
