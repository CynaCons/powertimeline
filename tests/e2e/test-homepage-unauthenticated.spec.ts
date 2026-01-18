import { test, expect } from '@playwright/test';

test('HomePage should not show "My Timelines" when unauthenticated', async ({ page }) => {
  // Navigate to browse page without authentication
  await page.goto('/browse', { waitUntil: 'load' });

  // Wait a bit for content to render
  await page.waitForTimeout(3000);

  console.log('Page loaded');

  // Check if "My Timelines" text is present in the page
  const myTimelinesText = await page.locator('text=My Timelines').count();
  console.log(`Found ${myTimelinesText} instances of "My Timelines" text`);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/homepage-unauthenticated.png', fullPage: true });

  // Check that "My Timelines" heading is NOT visible
  const myTimelinesHeader = page.getByText('My Timelines', { exact: false });
  const isVisible = await myTimelinesHeader.isVisible().catch(() => false);

  console.log(`"My Timelines" is visible: ${isVisible}`);

  if (isVisible) {
    console.log('❌ FAIL: "My Timelines" should be hidden when unauthenticated');
  } else {
    console.log('✅ PASS: "My Timelines" is correctly hidden when unauthenticated');
  }

  expect(isVisible).toBe(false);
});
