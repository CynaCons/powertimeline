import { test, expect } from '@playwright/test';

test.describe('Iteration 2: Event Cards', () => {
  test('should display events as HTML cards', async ({ page }) => {
    // Add test events to localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testEvents = [
        { id: '1', date: '2024-01-01', title: 'Test Event 1', description: 'First test event' },
        { id: '2', date: '2024-01-02', title: 'Test Event 2', description: 'Second test event' },
        { id: '3', date: '2024-01-03', title: 'Test Event 3', description: 'Third test event' }
      ];
      localStorage.setItem('chronochart-events', JSON.stringify(testEvents));
    });
    await page.reload();
    
    // Wait for events to load
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards).toHaveCount(3);
    
    // Each card should show title and description
    const firstCard = eventCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('p')).toBeVisible();
    await expect(firstCard.locator('time')).toBeVisible();
  });

  test('should position cards based on date', async ({ page }) => {
    // Add test events to localStorage 
    await page.goto('/');
    await page.evaluate(() => {
      const testEvents = [
        { id: '1', date: '2024-01-01', title: 'Test Event 1', description: 'First test event' },
        { id: '2', date: '2024-01-02', title: 'Test Event 2', description: 'Second test event' },
        { id: '3', date: '2024-01-03', title: 'Test Event 3', description: 'Third test event' }
      ];
      localStorage.setItem('chronochart-events', JSON.stringify(testEvents));
    });
    await page.reload();
    
    // Cards should be positioned horizontally by date
    const cards = page.locator('[data-testid="event-card"]');
    const positions = await cards.evaluateAll(elements => 
      elements.map(el => el.getBoundingClientRect().left)
    );
    
    // Positions should be in ascending order (left to right by date)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]);
    }
  });

  test('should display descriptions visibly', async ({ page }) => {
    // Add test events to localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testEvents = [
        { id: '1', date: '2024-01-01', title: 'Test Event 1', description: 'First test event' },
        { id: '2', date: '2024-01-02', title: 'Test Event 2', description: 'Second test event' },
        { id: '3', date: '2024-01-03', title: 'Test Event 3', description: 'Third test event' }
      ];
      localStorage.setItem('chronochart-events', JSON.stringify(testEvents));
    });
    await page.reload();
    
    // Each description should be actually visible and readable
    const descriptions = page.locator('[data-testid="event-card"] p');
    for (let i = 0; i < await descriptions.count(); i++) {
      const desc = descriptions.nth(i);
      await expect(desc).toBeVisible();
      
      // Text should not be empty
      const text = await desc.innerText();
      expect(text.length).toBeGreaterThan(0);
    }
  });
});