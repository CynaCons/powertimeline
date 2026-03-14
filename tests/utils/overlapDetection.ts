/**
 * Shared overlap detection utilities for visual regression tests
 *
 * Requirements tested:
 * - CC-REQ-LAYOUT-001: Cards never overlap across zoom/view windows
 * - CC-REQ-CARD-TITLE-ONLY-001: No overlaps at maximum density
 * - CC-REQ-LAYOUT-002: Cards not obscured by nav rail
 */

export interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlapResult {
  cardAIndex: number;
  cardBIndex: number;
  overlapArea: number;
  overlapPercentage: number; // Of smaller card
}

/**
 * Detect overlaps between card rectangles using proper intersection math
 *
 * @param rects - Array of card bounding rectangles
 * @param minAreaThreshold - Minimum overlap area in pixels to count (default 100px²)
 * @returns Array of overlaps found
 */
export function detectCardOverlaps(
  rects: CardRect[],
  minAreaThreshold = 100
): OverlapResult[] {
  const overlaps: OverlapResult[] = [];

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];

      // Calculate rectangle boundaries
      const aRight = a.x + a.width;
      const aBottom = a.y + a.height;
      const bRight = b.x + b.width;
      const bBottom = b.y + b.height;

      // Rectangle intersection check
      const overlapping = !(
        aRight <= b.x ||
        bRight <= a.x ||
        aBottom <= b.y ||
        bBottom <= a.y
      );

      if (overlapping) {
        // Calculate overlap dimensions
        const xOverlap = Math.min(aRight, bRight) - Math.max(a.x, b.x);
        const yOverlap = Math.min(aBottom, bBottom) - Math.max(a.y, b.y);
        const area = xOverlap * yOverlap;

        if (area >= minAreaThreshold) {
          // Calculate percentage of smaller card
          const areaA = a.width * a.height;
          const areaB = b.width * b.height;
          const smallerArea = Math.min(areaA, areaB);
          const percentage = (area / smallerArea) * 100;

          overlaps.push({
            cardAIndex: i,
            cardBIndex: j,
            overlapArea: Math.round(area),
            overlapPercentage: Math.round(percentage * 10) / 10
          });
        }
      }
    }
  }

  return overlaps;
}

/**
 * Check if two rectangles overlap
 */
export function rectsOverlap(a: CardRect, b: CardRect): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  return !(
    aRight <= b.x ||
    bRight <= a.x ||
    aBottom <= b.y ||
    bBottom <= a.y
  );
}

/**
 * Calculate overlap ratio as percentage of smaller rectangle
 */
export function overlapRatio(a: CardRect, b: CardRect): number {
  if (!rectsOverlap(a, b)) return 0;

  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  const xOverlap = Math.min(aRight, bRight) - Math.max(a.x, b.x);
  const yOverlap = Math.min(aBottom, bBottom) - Math.max(a.y, b.y);
  const overlapArea = xOverlap * yOverlap;

  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const smallerArea = Math.min(areaA, areaB);

  return overlapArea / smallerArea;
}

/**
 * Detect card overlaps directly from page DOM
 *
 * Use in page.evaluate() context
 */
export const detectOverlapsInDOM = (minAreaThreshold = 100) => {
  const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]'));
  const overlaps: Array<{
    indexA: number;
    indexB: number;
    area: number;
    percentage: number;
  }> = [];

  const rects = cards.map(card => {
    const rect = card.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom
    };
  });

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];

      // Rectangle intersection check
      const overlapping = !(
        a.right <= b.x ||
        b.right <= a.x ||
        a.bottom <= b.y ||
        b.bottom <= a.y
      );

      if (overlapping) {
        const xOverlap = Math.min(a.right, b.right) - Math.max(a.x, b.x);
        const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
        const area = xOverlap * yOverlap;

        if (area >= minAreaThreshold) {
          const areaA = a.width * a.height;
          const areaB = b.width * b.height;
          const smallerArea = Math.min(areaA, areaB);
          const percentage = (area / smallerArea) * 100;

          overlaps.push({
            indexA: i,
            indexB: j,
            area: Math.round(area),
            percentage: Math.round(percentage * 10) / 10
          });
        }
      }
    }
  }

  return {
    totalCards: cards.length,
    overlapCount: overlaps.length,
    overlaps
  };
};
