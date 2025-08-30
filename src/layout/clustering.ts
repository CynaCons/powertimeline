import type { Event } from '../types';
import type { EventCluster, Anchor, LayoutConfig } from './types';

export class EventClustering {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  // Main clustering algorithm - groups events by proximity
  clusterEvents(events: Event[], viewStart: Date, viewEnd: Date): EventCluster[] {
    if (events.length === 0) return [];

    // Sort events chronologically 
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const clusters: EventCluster[] = [];
    // View range available if needed: viewEnd.getTime() - viewStart.getTime()

    for (const event of sortedEvents) {
      const eventDate = new Date(event.date);
      const eventX = this.calculateTimelinePosition(eventDate, viewStart, viewEnd);
      
      // Find existing cluster within threshold
      const existingCluster = this.findNearbyCluster(clusters, eventX);
      
      if (existingCluster) {
        // Add to existing cluster
        existingCluster.events.push(event);
        existingCluster.anchor.eventIds.push(event.id);
        existingCluster.anchor.eventCount++;
        
        // Recalculate anchor position (centroid)
        this.updateAnchorPosition(existingCluster, viewStart, viewEnd);
      } else {
        // Create new cluster
        const clusterId = `cluster-${clusters.length}`;
        const anchor: Anchor = {
          id: clusterId,
          x: eventX,
          y: this.config.timelineY,
          eventIds: [event.id],
          eventCount: 1,
          visibleCount: 1,
          overflowCount: 0
        };

        clusters.push({
          id: clusterId,
          anchor,
          events: [event],
          slots: [] // Will be populated later
        });
      }
    }

    return clusters;
  }

  private findNearbyCluster(clusters: EventCluster[], eventX: number): EventCluster | null {
    return clusters.find(cluster => 
      Math.abs(cluster.anchor.x - eventX) <= this.config.clusterThreshold
    ) || null;
  }

  private updateAnchorPosition(cluster: EventCluster, viewStart: Date, viewEnd: Date): void {
    // Calculate centroid of all events in cluster
    const totalX = cluster.events.reduce((sum, event) => {
      return sum + this.calculateTimelinePosition(new Date(event.date), viewStart, viewEnd);
    }, 0);
    
    cluster.anchor.x = totalX / cluster.events.length;
  }

  private calculateTimelinePosition(date: Date, viewStart: Date, viewEnd: Date): number {
    const viewRange = viewEnd.getTime() - viewStart.getTime();
    const dateOffset = date.getTime() - viewStart.getTime();
    const progress = dateOffset / viewRange;
    
    // Map to timeline width (with padding)
    const timelineWidth = this.config.viewportWidth * 0.9; // 90% of viewport
    const timelineStart = this.config.viewportWidth * 0.05; // 5% padding
    
    return timelineStart + (progress * timelineWidth);
  }

  // Split clusters when zooming in
  splitClustersOnZoom(clusters: EventCluster[], newViewStart: Date, newViewEnd: Date): EventCluster[] {
    const allEvents = clusters.flatMap(cluster => cluster.events);
    return this.clusterEvents(allEvents, newViewStart, newViewEnd);
  }

  // Merge clusters when zooming out  
  mergeClustersOnZoom(clusters: EventCluster[], newViewStart: Date, newViewEnd: Date): EventCluster[] {
    const allEvents = clusters.flatMap(cluster => cluster.events);
    return this.clusterEvents(allEvents, newViewStart, newViewEnd);
  }

  // Get cluster statistics
  getClusterStats(clusters: EventCluster[]) {
    return {
      totalClusters: clusters.length,
      totalEvents: clusters.reduce((sum, cluster) => sum + cluster.events.length, 0),
      averageEventsPerCluster: clusters.length > 0 
        ? clusters.reduce((sum, cluster) => sum + cluster.events.length, 0) / clusters.length 
        : 0,
      largestCluster: Math.max(...clusters.map(cluster => cluster.events.length), 0)
    };
  }
}