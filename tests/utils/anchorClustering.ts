/**
 * Utility to compute expected anchor count based on event clustering logic.
 * Mirrors the clustering logic from DeterministicLayoutComponent.tsx
 */

interface Event {
  id: string;
  date: string;
}

interface TimelineRange {
  minDate: number;
  maxDate: number;
  dateRange: number;
}

interface ViewportConfig {
  width: number;
  navRailWidth?: number;
  additionalMargin?: number;
  rightMargin?: number;
}

/**
 * Calculate expected number of anchors based on event clustering.
 * Events within CLUSTER_THRESHOLD pixels share the same anchor.
 */
export function calculateExpectedAnchorCount(
  events: Event[],
  timelineRange: TimelineRange,
  viewportConfig: ViewportConfig
): number {
  if (events.length === 0) return 0;

  const navRailWidth = viewportConfig.navRailWidth ?? 56;
  const additionalMargin = viewportConfig.additionalMargin ?? 80;
  const leftMargin = navRailWidth + additionalMargin; // 136px total
  const rightMargin = viewportConfig.rightMargin ?? 40;
  const usableWidth = Math.max(1, viewportConfig.width - leftMargin - rightMargin);
  const viewRange = timelineRange.dateRange;
  const viewMin = timelineRange.minDate;

  // Calculate X position for each event
  const eventPositions = events.map(event => {
    const timestamp = new Date(event.date).getTime();
    const ratio = (timestamp - viewMin) / viewRange;
    const x = leftMargin + ratio * usableWidth;
    return { event, x };
  });

  // Group by 10px threshold (same as CLUSTER_THRESHOLD in DeterministicLayoutComponent)
  const CLUSTER_THRESHOLD = 10;
  const anchorGroups: Array<{ x: number; events: Event[] }> = [];

  eventPositions.forEach(({ event, x }) => {
    // Find existing group within threshold
    let foundGroup = false;
    for (const group of anchorGroups) {
      if (Math.abs(x - group.x) < CLUSTER_THRESHOLD) {
        group.events.push(event);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      anchorGroups.push({ x, events: [event] });
    }
  });

  return anchorGroups.length;
}

/**
 * Extract event data and timeline range from page context.
 * Requires window.__ccTelemetry to be available.
 */
export async function getAnchorClusteringDataFromPage(page: any): Promise<{
  events: Event[];
  timelineRange: TimelineRange;
  viewportWidth: number;
} | null> {
  return await page.evaluate(() => {
    const telemetry = (window as any).__ccTelemetry;
    if (!telemetry) return null;

    // Extract events (need id and date)
    const events = telemetry.events || [];

    // Extract timeline range
    const timelineRange = telemetry.timelineRange || {
      minDate: 0,
      maxDate: 0,
      dateRange: 0
    };

    // Get viewport width
    const viewportWidth = window.innerWidth;

    return {
      events: events.map((e: any) => ({ id: e.id, date: e.date })),
      timelineRange,
      viewportWidth
    };
  });
}
