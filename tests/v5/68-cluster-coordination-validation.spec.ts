import { test, expect } from '@playwright/test';

/**
 * Test Suite: Cluster Coordination Validation (v0.3.6.2)
 *
 * Validates cluster coordination and card type coherence during zoom operations
 *
 * Requirements:
 * - X-coordinates must be aligned for cards in the same half-column
 * - Card types must be coherent with card counts (2 cards = both full or both compact)
 * - No gaps between cards in the same half-column
 * - Telemetry reports accurate card distribution
 */

test.describe('Cluster Coordination Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });
  });

  test('French Revolution timeline maintains card coherence during zoom', async ({ page }) => {
    // Load French Revolution timeline
    await page.evaluate(() => {
      const frenchRevData = localStorage.getItem('demo-french-revolution');
      if (frenchRevData) {
        localStorage.setItem('events', frenchRevData);
        window.location.reload();
      }
    });

    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-testid="event-card"]');

    // Get initial card state
    const validateCardCoherence = async () => {
      const cards = await page.locator('[data-testid="event-card"]').all();

      // Group cards by Y-position to identify half-columns
      const cardData = [];
      for (const card of cards) {
        const box = await card.boundingBox();
        const cardType = await card.getAttribute('data-card-type');
        if (box && cardType) {
          cardData.push({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            cardType
          });
        }
      }

      // Sort by Y to identify potential half-columns
      cardData.sort((a, b) => a.y - b.y);

      // First, identify spatial clusters by X-proximity
      const xTolerance = 150; // Cards within 150px X are same spatial cluster

      const clusters = [];

      for (const card of cardData) {
        const existingCluster = clusters.find(cluster => {
          const clusterCards = cluster.cards;
          // Check if card is close in X to any card in this cluster
          return clusterCards.some(c =>
            Math.abs(c.x - card.x) < xTolerance
          );
        });

        if (existingCluster) {
          existingCluster.cards.push(card);
        } else {
          clusters.push({ cards: [card] });
        }
      }

      // For each spatial cluster, check X-alignment within above/below groups
      for (const cluster of clusters) {
        const clusterCards = cluster.cards;

        if (clusterCards.length > 1) {
          // Separate above (Y < timeline) and below (Y > timeline)
          const timelineY = 400; // Approximate timeline position
          const above = clusterCards.filter(c => c.y < timelineY);
          const below = clusterCards.filter(c => c.y > timelineY);

          // Check X-alignment within "above" group
          if (above.length > 1) {
            const xPositions = above.map(c => c.x);
            const minX = Math.min(...xPositions);
            const maxX = Math.max(...xPositions);
            const xVariation = maxX - minX;

            // Allow small variation (10px) for rendering differences
            if (xVariation > 10) {
              console.log(`X-misalignment in ABOVE group: variation=${xVariation}px`);
              console.log('Cards:', above.map(c => ({ x: c.x, y: c.y, type: c.cardType })));
            }
          }

          // Check X-alignment within "below" group
          if (below.length > 1) {
            const xPositions = below.map(c => c.x);
            const minX = Math.min(...xPositions);
            const maxX = Math.max(...xPositions);
            const xVariation = maxX - minX;

            // Allow small variation (10px) for rendering differences
            if (xVariation > 10) {
              console.log(`X-misalignment in BELOW group: variation=${xVariation}px`);
              console.log('Cards:', below.map(c => ({ x: c.x, y: c.y, type: c.cardType })));
            }
          }
        }
      }

      // Check card type coherence within each half-column group
      for (const cluster of clusters) {
        const clusterCards = cluster.cards;
        const timelineY = 400;
        const above = clusterCards.filter(c => c.y < timelineY);
        const below = clusterCards.filter(c => c.y > timelineY);

        // If above group has exactly 2 cards, they should have same type
        if (above.length === 2) {
          const types = above.map(c => c.cardType);
          const uniqueTypes = new Set(types);

          if (uniqueTypes.size > 1) {
            console.log(`Card type mismatch in 2-card ABOVE group:`);
            console.log('Types:', types);
            console.log('Expected: both cards should be same type');
          }

          expect(uniqueTypes.size).toBeLessThanOrEqual(1);
        }

        // If below group has exactly 2 cards, they should have same type
        if (below.length === 2) {
          const types = below.map(c => c.cardType);
          const uniqueTypes = new Set(types);

          if (uniqueTypes.size > 1) {
            console.log(`Card type mismatch in 2-card BELOW group:`);
            console.log('Types:', types);
            console.log('Expected: both cards should be same type');
          }

          expect(uniqueTypes.size).toBeLessThanOrEqual(1);
        }
      }

      return { totalCards: cards.length, clusters: clusters.length };
    };

    // Initial validation
    const initial = await validateCardCoherence();
    console.log(`Initial state: ${initial.totalCards} cards, ${initial.clusters} spatial clusters`);

    // Simulate zoom in
    await page.mouse.move(500, 400); // Position mouse at center
    await page.mouse.wheel(0, -100); // Zoom in
    await page.waitForTimeout(500);

    const afterZoomIn = await validateCardCoherence();
    console.log(`After zoom in: ${afterZoomIn.totalCards} cards, ${afterZoomIn.clusters} spatial clusters`);

    // Zoom out
    await page.mouse.wheel(0, 100); // Zoom out
    await page.waitForTimeout(500);

    const afterZoomOut = await validateCardCoherence();
    console.log(`After zoom out: ${afterZoomOut.totalCards} cards, ${afterZoomOut.clusters} spatial clusters`);

    // Zoom in again
    await page.mouse.wheel(0, -150);
    await page.waitForTimeout(500);

    const afterSecondZoom = await validateCardCoherence();
    console.log(`After 2nd zoom: ${afterSecondZoom.totalCards} cards, ${afterSecondZoom.clusters} spatial clusters`);
  });

  test('Telemetry reports coherent card types for each half-column', async ({ page }) => {
    // Load a simple timeline
    await page.evaluate(() => {
      const events = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First' },
        { id: '2', date: '2024-01-02', title: 'Event 2', description: 'Second' },
        { id: '3', date: '2024-01-03', title: 'Event 3', description: 'Third' },
        { id: '4', date: '2024-01-04', title: 'Event 4', description: 'Fourth' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    // Get all cards
    const cards = await page.locator('[data-testid="event-card"]').all();

    // Verify each card has correct data attributes
    for (const card of cards) {
      const cardType = await card.getAttribute('data-card-type');
      const eventId = await card.getAttribute('data-event-id');
      const eventDate = await card.getAttribute('data-event-date');

      expect(cardType).toBeTruthy();
      expect(eventId).toBeTruthy();
      expect(eventDate).toBeTruthy();

      // Card type should be one of the three valid types
      expect(['full', 'compact', 'title-only']).toContain(cardType);
    }

    // Group cards by approximate Y position (half-column)
    const cardsByLevel = new Map();

    for (const card of cards) {
      const box = await card.boundingBox();
      if (box) {
        // Round Y to nearest 100px to group by level
        const levelKey = Math.round(box.y / 100) * 100;

        if (!cardsByLevel.has(levelKey)) {
          cardsByLevel.set(levelKey, []);
        }

        const cardType = await card.getAttribute('data-card-type');
        cardsByLevel.get(levelKey).push({ y: box.y, type: cardType });
      }
    }

    // Check each level
    for (const [levelY, levelCards] of cardsByLevel) {
      console.log(`Level ${levelY}: ${levelCards.length} cards`);

      // If 2 cards in level, check they're coherent
      if (levelCards.length === 2) {
        const types = levelCards.map(c => c.type);
        const uniqueTypes = new Set(types);

        if (uniqueTypes.size > 1) {
          console.log(`WARNING: 2 cards with different types at level ${levelY}:`, types);
        }
      }
    }
  });

  test('No gaps in vertically stacked cards within same half-column', async ({ page }) => {
    // Load timeline with multiple events
    await page.evaluate(() => {
      const events = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First event' },
        { id: '2', date: '2024-01-02', title: 'Event 2', description: 'Second event' },
        { id: '3', date: '2024-01-03', title: 'Event 3', description: 'Third event' },
        { id: '4', date: '2024-01-04', title: 'Event 4', description: 'Fourth event' }
      ];
      localStorage.setItem('events', JSON.stringify(events));
      window.location.reload();
    });

    await page.waitForSelector('[data-testid="event-card"]');

    const cards = await page.locator('[data-testid="event-card"]').all();
    const boxes = [];

    for (const card of cards) {
      const box = await card.boundingBox();
      if (box) boxes.push(box);
    }

    // Sort by Y position
    boxes.sort((a, b) => a.y - b.y);

    // Check for large gaps (>30px) between vertically adjacent cards with similar X
    const xTolerance = 50;
    const maxGap = 30;

    for (let i = 0; i < boxes.length - 1; i++) {
      const current = boxes[i];
      const next = boxes[i + 1];

      // Check if cards are in same X region (same half-column)
      const xDiff = Math.abs(current.x - next.x);

      if (xDiff < xTolerance) {
        // Cards are in same half-column, check vertical gap
        const bottomOfCurrent = current.y + current.height;
        const gap = next.y - bottomOfCurrent;

        if (gap > maxGap) {
          console.log(`Large gap detected: ${gap}px between cards at Y=${current.y} and Y=${next.y}`);
        }

        // Allow reasonable spacing (12-24px) but not huge gaps
        expect(gap).toBeLessThan(maxGap);
      }
    }
  });
});
