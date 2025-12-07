/**
 * AI Chat Panel - E2E Tests
 * v0.7.0 - Tests for AI assistant chat functionality
 *
 * Tests the AI chat panel:
 * - Panel visibility and access control
 * - API key input and validation
 * - Message sending and display
 * - Action confirmation workflow
 *
 * SRS: docs/SRS_AI_INTEGRATION.md
 * Requirements: CC-REQ-AI-001 through CC-REQ-AI-040
 */

import { test, expect, type Page } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

/**
 * Helper: Navigate to a timeline editor
 */
async function navigateToTimeline(page: Page): Promise<void> {
  await page.goto('/browse');
  await page.waitForTimeout(1000);

  // Click on first available timeline or create one
  const timelineCard = page.locator('[data-testid="timeline-card"]').first();
  if (await timelineCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await timelineCard.click();
  } else {
    // Create a test timeline
    const createBtn = page.getByTestId('create-timeline-button');
    await createBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Title').fill('AI Test Timeline');
    await page.getByRole('button', { name: /create timeline/i }).click();
  }

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/**
 * Helper: Open AI chat panel
 */
async function openChatPanel(page: Page): Promise<void> {
  const chatButton = page.locator('[data-testid="nav-ai-chat"]').or(
    page.locator('.material-symbols-rounded').filter({ hasText: 'smart_toy' }).locator('..')
  ).first();

  await chatButton.click();
  await expect(page.locator('[data-testid="chat-panel"]').or(
    page.locator('#dialog-title-chat')
  )).toBeVisible({ timeout: 5000 });
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('AI Chat Panel', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('T-AI-01: Chat panel is only visible to signed-in users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-001' });

    // Visit timeline without signing in (read-only mode)
    await page.goto('/');
    await page.waitForTimeout(1000);

    // AI chat button should NOT be visible when not signed in
    const chatButton = page.locator('.material-symbols-rounded').filter({ hasText: 'smart_toy' });
    await expect(chatButton).not.toBeVisible({ timeout: 3000 });
  });

  test('T-AI-02: Chat panel opens for signed-in users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-020' });

    await signInWithEmail(page);
    await navigateToTimeline(page);

    // Find and click AI chat button
    const chatButton = page.locator('.material-symbols-rounded').filter({ hasText: 'smart_toy' }).locator('..').first();
    await expect(chatButton).toBeVisible({ timeout: 5000 });
    await chatButton.click();

    // Chat panel should open
    await expect(page.locator('#dialog-title-chat')).toBeVisible({ timeout: 5000 });
  });

  test('T-AI-03: API key input is required before chatting', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-002, CC-REQ-AI-003' });

    await signInWithEmail(page);
    await navigateToTimeline(page);
    await openChatPanel(page);

    // Should show API key input
    const keyInput = page.locator('input[type="password"]').first();
    await expect(keyInput).toBeVisible({ timeout: 3000 });

    // Should have link to Google AI
    const googleLink = page.locator('a[href*="ai.google.dev"]');
    await expect(googleLink).toBeVisible();

    // Connect button should be present
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
  });

  test('T-AI-04: Invalid API key shows error', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-004, CC-REQ-AI-170' });

    await signInWithEmail(page);
    await navigateToTimeline(page);
    await openChatPanel(page);

    // Enter invalid API key
    const keyInput = page.locator('input[type="password"]').first();
    await keyInput.fill('invalid-key-12345');

    // Click connect
    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Should show error
    await expect(page.locator('.MuiAlert-standardError').or(
      page.getByText(/invalid/i)
    )).toBeVisible({ timeout: 10000 });
  });

  test('T-AI-05: Chat panel can be closed', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-025' });

    await signInWithEmail(page);
    await navigateToTimeline(page);
    await openChatPanel(page);

    // Close button should work
    const closeButton = page.locator('button[aria-label="Close panel"]').or(
      page.locator('button').filter({ hasText: '×' })
    ).first();
    await closeButton.click();

    // Panel should close
    await expect(page.locator('#dialog-title-chat')).not.toBeVisible({ timeout: 3000 });
  });

  test('T-AI-06: Keyboard shortcut Alt+A opens chat panel', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-021' });

    await signInWithEmail(page);
    await navigateToTimeline(page);

    // Use keyboard shortcut
    await page.keyboard.press('Alt+A');

    // Chat panel should open
    await expect(page.locator('#dialog-title-chat')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('AI Chat Panel - With Valid API Key', () => {
  // Note: These tests require a valid API key environment variable
  // They will be skipped in CI without GEMINI_API_KEY

  test.beforeEach(async ({ page }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    test.skip(!apiKey, 'Requires GEMINI_API_KEY environment variable');
  });

  test('T-AI-10: Valid API key enables chat interface', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AI-005' });

    const apiKey = process.env.GEMINI_API_KEY!;

    await signInWithEmail(page);
    await navigateToTimeline(page);
    await openChatPanel(page);

    // Enter valid API key
    const keyInput = page.locator('input[type="password"]').first();
    await keyInput.fill(apiKey);

    // Click connect
    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Should show chat interface (message input)
    await expect(page.locator('input[placeholder*="Ask"]').or(
      page.getByPlaceholder(/ask/i)
    )).toBeVisible({ timeout: 10000 });
  });
});
