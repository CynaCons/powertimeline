import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('timeline visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for timeline to load (use SVG selector)
    await page.waitForSelector('svg');
    
    // Take screenshot of the entire timeline
    await expect(page.locator('svg')).toHaveScreenshot('timeline-baseline.png');
  });

  test('timeline with events visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for timeline to load
    await page.waitForSelector('svg');
    
    // Add some test events for visual comparison
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByLabel('Title').fill('Test Event 1');
    await page.getByLabel('Description').fill('This is a test event for visual regression testing');
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Wait for event to appear
    await page.waitForSelector('[data-event-id]');
    
    // Take screenshot with events
    await expect(page.locator('svg')).toHaveScreenshot('timeline-with-events.png');
  });

  test('dark theme visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for timeline to load
    await page.waitForSelector('svg');
    
    // Toggle to dark theme if available
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    }
    
    // Take screenshot of dark theme
    await expect(page.locator('svg')).toHaveScreenshot('timeline-dark-theme.png');
  });

  test('expanded card visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for timeline to load
    await page.waitForSelector('svg');
    
    // Create an event
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByLabel('Title').fill('Long Title Event for Testing Expansion');
    await page.getByLabel('Description').fill('This is a longer description that should demonstrate the card expansion functionality when the event is selected or in edit mode. It contains multiple lines of text to test the dynamic height calculation.');
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Wait for event to appear and select it
    const eventNode = page.locator('[data-event-id]').first();
    await eventNode.click();
    
    // Take screenshot of expanded card
    await expect(page.locator('svg')).toHaveScreenshot('timeline-expanded-card.png');
  });

  test('multi-lane layout visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for timeline to load
    await page.waitForSelector('svg');
    
    // Create multiple overlapping events to trigger lane system
    const events = [
      { title: 'Event A', date: '2024-01-15', desc: 'Description A' },
      { title: 'Event B', date: '2024-01-16', desc: 'Description B' },
      { title: 'Event C', date: '2024-01-17', desc: 'Description C' },
      { title: 'Event D', date: '2024-01-18', desc: 'Description D' },
    ];
    
    for (const event of events) {
      await page.getByRole('button', { name: 'Create' }).click();
      await page.getByLabel('Title').fill(event.title);
      await page.getByLabel('Date').fill(event.date);
      await page.getByLabel('Description').fill(event.desc);
      await page.getByRole('button', { name: 'Add' }).click();
      await page.waitForTimeout(100); // Small delay between creations
    }
    
    // Wait for all events to render
    await page.waitForFunction(() => document.querySelectorAll('[data-event-id]').length >= 4);
    
    // Take screenshot of multi-lane layout
    await expect(page.locator('svg')).toHaveScreenshot('timeline-multi-lane.png');
  });

  test('grid lines visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for timeline to load
    await page.waitForSelector('svg');
    
    // Zoom in to make grid lines more visible
    await page.keyboard.press('Equal'); // Zoom in
    await page.keyboard.press('Equal'); // Zoom in more
    
    // Take screenshot showing grid lines
    await expect(page.locator('svg')).toHaveScreenshot('timeline-grid-lines.png');
  });
});
