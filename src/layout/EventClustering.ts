import type { Event } from '../types';
import type { EventCluster, LayoutConfig } from './types';

/**
 * Groups events into clusters based on their proximity in pixels.
 * Events within clusterThreshold pixels are grouped together.
 */
export function clusterEvents(
  events: Event[],
  config: LayoutConfig,
  dateRange: { minDate: number; maxDate: number; range: number }
): EventCluster[] {
  if (events.length === 0) return [];

  // Sort events by date first
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const clusters: EventCluster[] = [];
  let currentCluster: EventCluster | null = null;

  for (const event of sortedEvents) {
    // Calculate pixel position for this event
    const eventTime = new Date(event.date).getTime();
    const timeProgress = (eventTime - dateRange.minDate) / dateRange.range;
    const pixelX = 80 + timeProgress * (config.viewportWidth - 160);

    if (!currentCluster) {
      // Start first cluster
      currentCluster = {
        id: `cluster-${clusters.length}`,
        events: [event],
        anchor: {
          x: pixelX,
          y: config.timelineY,
          id: `anchor-${clusters.length}`,
          eventIds: [event.id],
          eventCount: 1
        }
      };
    } else {
      // Check if this event is close enough to the current cluster
      const distanceToCluster = Math.abs(pixelX - currentCluster.anchor.x);
      
      if (distanceToCluster <= config.clusterThreshold) {
        // Add to current cluster and update anchor position (weighted average)
        const totalEvents = currentCluster.events.length + 1;
        const newAnchorX = (currentCluster.anchor.x * currentCluster.events.length + pixelX) / totalEvents;
        
        currentCluster.events.push(event);
        currentCluster.anchor.x = newAnchorX;
        currentCluster.anchor.eventIds.push(event.id);
        currentCluster.anchor.eventCount = totalEvents;
      } else {
        // Distance too far, close current cluster and start new one
        clusters.push(currentCluster);
        currentCluster = {
          id: `cluster-${clusters.length}`,
          events: [event],
          anchor: {
            x: pixelX,
            y: config.timelineY,
            id: `anchor-${clusters.length}`,
            eventIds: [event.id],
            eventCount: 1
          }
        };
      }
    }
  }

  // Don't forget the last cluster
  if (currentCluster) {
    clusters.push(currentCluster);
  }

  return clusters;
}

/**
 * Calculate date range from events for positioning
 */
export function calculateDateRange(events: Event[]): { minDate: number; maxDate: number; range: number } {
  if (events.length === 0) {
    const now = Date.now();
    return { minDate: now, maxDate: now, range: 1 };
  }

  const dates = events.map(e => new Date(e.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const range = Math.max(maxDate - minDate, 1); // Avoid division by zero

  return { minDate, maxDate, range };
}

/**
 * Get cluster summary info for debugging
 */
export function getClusterSummary(clusters: EventCluster[]): string {
  if (clusters.length === 0) return "No clusters";
  
  const totalEvents = clusters.reduce((sum, cluster) => sum + cluster.events.length, 0);
  const avgEventsPerCluster = (totalEvents / clusters.length).toFixed(1);
  
  return `${clusters.length} clusters, ${totalEvents} events (avg ${avgEventsPerCluster}/cluster)`;
}