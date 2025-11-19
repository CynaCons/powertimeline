import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

/**
 * Test Suite: Mixed Card Types in Semi-Columns (v0.3.6.2)
 *
 * Validates that semi-columns can mix different card types (full, compact, title-only)
 * to optimize space usage and reduce unnecessary degradation.
 *
 * Requirements:
 * - CC-REQ-MIXED-CARDS-001: Semi-columns support mixed card types
 * - CC-REQ-MIXED-CARDS-002: Chronological priority (earliest events get full cards)
 * - CC-REQ-MIXED-CARDS-003: No unnecessary degradation (use full cards when space allows)
 * - CC-REQ-MIXED-CARDS-004: Visual alignment correct with mixed heights
 */

test.describe('Mixed Card Types in Semi-Columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });
  });

  test('3-event scenario shows 1 full + 2 compact cards (not 3 compact)', async ({ page }) => {
    // Open dev panel and load a scenario with exactly 3 events in a semi-column
    await page.click('button[aria-label="Open developer panel"]');
    await page.waitForSelector('aside[role="dialog"]');

    // Create a custom seed with 3 closely spaced events
    await page.evaluate(() => {
      const events = [
        { id: '1', date: '2024-01-01', title: 'First Event with longer description for testing', description: 'This is the first event that should get a full card' },
        { id: '2', date: '2024-01-02', title: 'Second Event', description: 'This should be compact' },
        { id: '3', date: '2024-01-03', title: 'Third Event', description: 'This should also be compact' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    // Get all cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    expect(cards.length).toBe(3);

    // Check card types: first should be full, others compact
    const card1Type = await cards[0].getAttribute('data-card-type');
    const card2Type = await cards[1].getAttribute('data-card-type');
    const card3Type = await cards[2].getAttribute('data-card-type');

    expect(card1Type).toBe('full');
    expect(card2Type).toBe('compact');
    expect(card3Type).toBe('compact');
  });

  test('5-event scenario shows mix of full/compact/title-only (not all title-only)', async ({ page }) => {
    // Create a scenario with 5 events
    await page.evaluate(() => {
      const events = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First event' },
        { id: '2', date: '2024-01-02', title: 'Event 2', description: 'Second event' },
        { id: '3', date: '2024-01-03', title: 'Event 3', description: 'Third event' },
        { id: '4', date: '2024-01-04', title: 'Event 4', description: 'Fourth event' },
        { id: '5', date: '2024-01-05', title: 'Event 5', description: 'Fifth event' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    const cards = await page.locator('[data-testid="event-card"]').all();
    expect(cards.length).toBeGreaterThanOrEqual(5);

    // Collect all card types
    const cardTypes: string[] = [];
    for (const card of cards) {
      const type = await card.getAttribute('data-card-type');
      if (type) cardTypes.push(type);
    }

    // Should have a mix of types (not all the same)
    const uniqueTypes = new Set(cardTypes);
    expect(uniqueTypes.size).toBeGreaterThan(1);

    // First event should be full or compact (not immediately degraded to title-only)
    expect(['full', 'compact']).toContain(cardTypes[0]);
  });

  test('Chronological priority: earliest events get full cards', async ({ page }) => {
    await page.evaluate(() => {
      const events = [
        { id: 'early1', date: '2024-01-01', title: 'Earliest Event', description: 'Should get full card' },
        { id: 'early2', date: '2024-01-02', title: 'Second Earliest', description: 'Should get full card' },
        { id: 'late1', date: '2024-01-10', title: 'Later Event', description: 'May degrade' },
        { id: 'late2', date: '2024-01-11', title: 'Latest Event', description: 'May degrade' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    // Get cards and their dates
    const cards = await page.locator('[data-testid="event-card"]').all();
    const cardInfo = [];

    for (const card of cards) {
      const date = await card.getAttribute('data-event-date');
      const type = await card.getAttribute('data-card-type');
      cardInfo.push({ date, type });
    }

    // Sort by date to verify chronological priority
    cardInfo.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Earlier events should have equal or better card types than later ones
    // full > compact > title-only
    const typeRank: Record<string, number> = { 'full': 3, 'compact': 2, 'title-only': 1 };

    for (let i = 0; i < cardInfo.length - 1; i++) {
      const currentRank = typeRank[cardInfo[i].type || 'title-only'];
      const nextRank = typeRank[cardInfo[i + 1].type || 'title-only'];

      // Current (earlier) card should have >= rank of next (later) card
      expect(currentRank).toBeGreaterThanOrEqual(nextRank);
    }
  });

  test('No unnecessary degradation: use full cards when space available', async ({ page }) => {
    // Single event should always be full card
    await page.evaluate(() => {
      const events = [
        { id: '1', date: '2024-01-01', title: 'Single Event', description: 'Should be full card with plenty of space' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    const cards = await page.locator('[data-testid="event-card"]').all();
    expect(cards.length).toBe(1);

    const cardType = await cards[0].getAttribute('data-card-type');
    expect(cardType).toBe('full');
  });

  test('Visual alignment is correct with mixed card heights', async ({ page }) => {
    await page.evaluate(() => {
      const events = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First' },
        { id: '2', date: '2024-01-02', title: 'Event 2', description: 'Second' },
        { id: '3', date: '2024-01-03', title: 'Event 3', description: 'Third' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    // Get all cards
    const cards = await page.locator('[data-testid="event-card"]').all();

    // Check that cards don't overlap by verifying their bounding boxes
    const boxes = [];
    for (const card of cards) {
      const box = await card.boundingBox();
      if (box) boxes.push(box);
    }

    // Check for overlaps: each pair of cards should not intersect
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i];
        const box2 = boxes[j];

        const overlapsX = box1.x < box2.x + box2.width && box1.x + box1.width > box2.x;
        const overlapsY = box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;

        const overlaps = overlapsX && overlapsY;
        expect(overlaps).toBe(false);
      }
    }

    // Verify cards are properly spaced (minimum 8px spacing)
    const minSpacing = 8;
    for (let i = 0; i < boxes.length - 1; i++) {
      const box1 = boxes[i];
      const box2 = boxes[i + 1];

      // Calculate spacing (assuming vertical stacking)
      const spacing = Math.abs((box1.y + box1.height) - box2.y);

      // Allow cards to be side-by-side OR vertically spaced
      const isSideBySide = Math.abs(box1.y - box2.y) < 5;
      const isVerticallySpaced = spacing >= minSpacing - 2; // Allow 2px tolerance

      expect(isSideBySide || isVerticallySpaced).toBe(true);
    }
  });

  test('Telemetry reports accurate card type distribution', async ({ page }) => {
    // Open dev panel to access telemetry
    await page.click('button[aria-label="Open developer panel"]');
    await page.waitForSelector('aside[role="dialog"]');

    // Load RFK timeline (known dataset)
    await page.click('button:has-text("RFK")');
    await page.waitForTimeout(1000);

    // Check telemetry section exists
    const telemetrySection = page.locator('text=Layout Telemetry');
    await expect(telemetrySection).toBeVisible();

    // Verify degradation metrics are displayed
    const degradationMetrics = page.locator('text=/Degradation:/');
    await expect(degradationMetrics).toBeVisible();

    // Check that metrics report card type counts
    const metricsText = await page.locator('aside[role="dialog"]').textContent();

    // Should contain references to card types
    expect(metricsText).toMatch(/full|compact|title-only/i);
  });

  test('Dense timeline optimizes space with mixed card types', async ({ page }) => {
    // Load French Revolution timeline (150+ events, very dense)
    await page.click('button[aria-label="Open developer panel"]');
    await page.waitForSelector('aside[role="dialog"]');
    await page.click('button:has-text("French Revolution")');
    await page.waitForTimeout(2000);

    // Get all visible cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    expect(cards.length).toBeGreaterThan(10); // Should have many cards

    // Collect card type distribution
    const typeCount: Record<string, number> = { full: 0, compact: 0, 'title-only': 0 };

    for (const card of cards) {
      const type = await card.getAttribute('data-card-type');
      if (type && type in typeCount) {
        typeCount[type]++;
      }
    }

    // In a dense timeline, we should see a mix of all three types
    // Full cards for earliest/important events, degradation for later ones
    expect(typeCount.full).toBeGreaterThan(0);
    expect(typeCount.compact + typeCount['title-only']).toBeGreaterThan(0);

    console.log('Dense timeline card distribution:', typeCount);
  });
});
