/**
 * AI Chat Migration Design Demo (v0.9.5)
 *
 * This test runs in headed mode to visually demonstrate:
 * - AI suggesting events via ChatPanel
 * - Events routing to ReviewPanel for approval
 * - Accept/Reject workflow with unified UI
 * - Commit to timeline via ImportSession
 *
 * Run: npx playwright test tests/ai/103-ai-chat-demo.spec.ts --headed
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';
import * as fs from 'fs';

const CHECKMARK = '✓';
const SCREENSHOT_DIR = 'screenshots/ai-demo';

// Mock AI response using Gemini's functionCall format (matches aiService.ts parsing)
const MOCK_AI_RESPONSE = {
  candidates: [{
    content: {
      parts: [
        { text: "I'll help you add some events to your timeline." },
        {
          functionCall: {
            name: 'create_event',
            args: {
              title: 'JFK Assassination',
              date: '1963-11-22',
              description: 'President Kennedy was assassinated in Dallas, Texas.',
              sources: ['https://en.wikipedia.org/wiki/Assassination_of_John_F._Kennedy']
            }
          }
        },
        {
          functionCall: {
            name: 'create_event',
            args: {
              title: 'Warren Commission Report',
              date: '1964-09-24',
              description: 'The Warren Commission released its report on the assassination.'
            }
          }
        }
      ],
      role: 'model'
    }
  }],
  usageMetadata: {
    promptTokenCount: 150,
    candidatesTokenCount: 75,
    totalTokenCount: 225
  }
};

test.describe('AI Chat Migration - Design Demo', () => {
  test('Complete AI Chat → ReviewPanel → Commit Flow', async ({ page }, testInfo) => {
    // Skip tablet/mobile - this demo is designed for desktop visual testing
    test.skip(testInfo.project.name === 'mobile' || testInfo.project.name === 'tablet',
      'Demo test only runs on desktop viewports');
    test.slow(); // Extended timeout for visual demo

    // Create screenshots directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    console.log('\n=== AI Chat Migration Design Demo (v0.9.5) ===\n');

    // Intercept Gemini API to provide mock response
    await page.route('https://generativelanguage.googleapis.com/**', async route => {
      await new Promise(r => setTimeout(r, 1500)); // Simulate thinking
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AI_RESPONSE)
      });
    });

    // ========================================
    // STEP 1: Sign in
    // ========================================
    console.log('Step 1: Sign in');
    await signInWithEmail(page);
    console.log(`  ${CHECKMARK} Signed in`);

    // ========================================
    // STEP 2: Create a new timeline
    // ========================================
    console.log('\nStep 2: Create a new timeline');
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click create timeline button
    const createBtn = page.getByTestId('create-timeline-button');
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    // Fill in the dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    const uniqueId = Date.now().toString(36);
    await page.getByLabel(/title/i).fill(`AI Demo Timeline ${uniqueId}`);
    await page.waitForTimeout(300);
    console.log(`  ${CHECKMARK} Filled timeline title`);

    // Submit
    await page.locator('[role="dialog"]').getByRole('button', { name: /create timeline/i }).click();
    await page.waitForTimeout(3000); // Wait for creation and page refresh

    // Click on the newly created timeline
    const timelineLink = page.getByRole('link', { name: /AI Demo Timeline/ }).first();
    await expect(timelineLink).toBeVisible({ timeout: 10000 });
    await timelineLink.click();

    // Wait for timeline to load
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 15000 });
    await page.waitForTimeout(1000);
    console.log(`  ${CHECKMARK} Created and opened new timeline`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-new-timeline.png` });

    // ========================================
    // STEP 3: Open AI Chat Panel
    // ========================================
    console.log('\nStep 3: Open AI Chat Panel');
    const aiButton = page.locator('button[aria-label="Open AI chat"]');
    await expect(aiButton).toBeVisible({ timeout: 5000 });
    console.log(`  ${CHECKMARK} AI button visible`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-ai-button.png` });

    await aiButton.click();
    const chatPanel = page.locator('[data-testid="chat-panel"]');
    await expect(chatPanel).toBeVisible({ timeout: 5000 });
    console.log(`  ${CHECKMARK} ChatPanel opened`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-chat-panel-open.png` });

    // ========================================
    // STEP 4: Enter API Key
    // ========================================
    console.log('\nStep 4: Enter API Key');
    const apiKeyInput = page.locator('input[type="password"]');
    await expect(apiKeyInput).toBeVisible();
    await apiKeyInput.fill('demo-api-key-for-testing');
    console.log(`  ${CHECKMARK} API key entered`);

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();
    await page.waitForTimeout(500);
    console.log(`  ${CHECKMARK} Connected`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-api-key-connected.png` });

    // ========================================
    // STEP 5: Send Message to AI
    // ========================================
    console.log('\nStep 5: Send Message to AI');
    const messageInput = page.getByPlaceholder(/ask/i);
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Add events about JFK assassination and Warren Commission');
    console.log(`  ${CHECKMARK} Message typed`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-message-typed.png` });

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    console.log(`  ${CHECKMARK} Message sent, waiting for AI response...`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-ai-response.png` });

    // ========================================
    // STEP 6: Click Review Events
    // ========================================
    console.log('\nStep 6: Open ReviewPanel');
    const reviewButton = page.getByRole('button', { name: /review events/i });
    await expect(reviewButton).toBeVisible({ timeout: 5000 });
    console.log(`  ${CHECKMARK} "Review Events" button visible`);

    await reviewButton.click();
    const reviewPanel = page.locator('[data-testid="review-panel"]');
    await expect(reviewPanel).toBeVisible({ timeout: 5000 });
    console.log(`  ${CHECKMARK} ReviewPanel opened`);

    // Check for AI Chat source label
    await expect(page.getByText('AI Chat')).toBeVisible();
    console.log(`  ${CHECKMARK} Source shows "AI Chat"`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-review-panel.png` });

    // ========================================
    // STEP 7: Accept/Reject Events
    // ========================================
    console.log('\nStep 7: Accept/Reject Events');
    const eventItems = page.locator('[data-testid="review-event-item"]');
    const count = await eventItems.count();
    console.log(`  ${CHECKMARK} Found ${count} events to review`);

    // Accept first event
    const firstAccept = eventItems.first().getByRole('button', { name: /accept/i });
    await firstAccept.click();
    console.log(`  ${CHECKMARK} Accepted first event`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-first-accepted.png` });

    // Reject second event (if exists)
    if (count > 1) {
      const secondReject = eventItems.nth(1).getByRole('button', { name: /reject/i });
      await secondReject.click();
      console.log(`  ${CHECKMARK} Rejected second event`);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-decisions-made.png` });

    // ========================================
    // STEP 8: Commit to Timeline
    // ========================================
    console.log('\nStep 8: Commit to Timeline');
    // Note: "Accept All Remaining" only enabled if there are pending events
    // Since we accepted/rejected all in Step 7, check if button is enabled
    const acceptAllBtn = page.getByRole('button', { name: /accept all/i });
    const isAcceptAllEnabled = await acceptAllBtn.isEnabled({ timeout: 1000 }).catch(() => false);
    if (isAcceptAllEnabled) {
      await acceptAllBtn.click();
      console.log(`  ${CHECKMARK} Accepted all remaining events`);
    } else {
      console.log(`  ${CHECKMARK} All events already have decisions`);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-ready-to-commit.png` });

    const commitButton = page.getByRole('button', { name: /commit/i });
    await commitButton.click();
    await page.waitForTimeout(1500);
    console.log(`  ${CHECKMARK} Committed to timeline`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-committed.png` });

    console.log('\n=== Demo Complete ===\n');
  });
});
