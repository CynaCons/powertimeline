import { Event } from '../types';
import { LayoutConfig, LayoutResult, EventCluster, PositionedCard } from './types';
import { EventClustering } from './clustering';
import { DegradationEngine } from './DegradationEngine';
import { SlotGrid } from './SlotGrid';

export class LayoutEngine {
  private config: LayoutConfig;
  private clustering: EventClustering;
  private degradationEngine: DegradationEngine;
  private slotGrid: SlotGrid;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.clustering = new EventClustering(config);
    this.degradationEngine = new DegradationEngine(config);
    this.slotGrid = new SlotGrid(config);
  }

  // Main layout function - processes events and returns positioned cards
  layoutEvents(
    events: Event[], 
    viewStart: Date, 
    viewEnd: Date
  ): LayoutResult {
    // Clear previous layout
    this.singleColumnLayout.clear();
    
    // Step 1: Cluster events by time proximity
    const clusters = this.clustering.clusterEvents(events, viewStart, viewEnd);
    
    // Step 2: Position events in each cluster with degradation
    const allPositionedCards: PositionedCard[] = [];
    
    for (const cluster of clusters) {
      // Use degradation engine for complete layout handling
      const positioned = this.degradationEngine.positionClusterWithDegradation(cluster);
      allPositionedCards.push(...positioned);
    }

    // Step 3: Validate layout
    const hasOverlaps = !this.degradationEngine.validateNoOverlaps(allPositionedCards);
    if (hasOverlaps) {
      console.warn('Layout contains overlaps - will be resolved in dual column/degradation phases');
    }

    // Step 4: Calculate utilization
    const utilization = this.slotGrid.getUtilization();

    return {
      positionedCards: allPositionedCards,
      clusters,
      anchors: clusters.map(cluster => cluster.anchor),
      utilization
    };
  }

  // Update layout when viewport changes
  updateViewport(newWidth: number, newHeight: number): void {
    this.config.viewportWidth = newWidth;
    this.config.viewportHeight = newHeight;
    this.config.timelineY = newHeight / 2;
    
    // Recreate layout components with new config
    this.clustering = new EventClustering(this.config);
    this.degradationEngine = new DegradationEngine(this.config);
    this.slotGrid = new SlotGrid(this.config);
  }

  // Handle zoom changes - may split or merge clusters
  handleZoom(
    events: Event[], 
    newViewStart: Date, 
    newViewEnd: Date,
    currentClusters: EventCluster[]
  ): LayoutResult {
    // Recalculate clusters based on new zoom level
    const newClusters = this.clustering.clusterEvents(events, newViewStart, newViewEnd);
    
    // Layout with new clusters
    return this.layoutEvents(events, newViewStart, newViewEnd);
  }

  // Get layout statistics
  getLayoutStats(result: LayoutResult) {
    return {
      totalEvents: result.positionedCards.length,
      totalClusters: result.clusters.length,
      utilization: result.utilization,
      clusterStats: this.clustering.getClusterStats(result.clusters),
      degradationStats: this.degradationEngine.getDegradationStats(result.positionedCards),
      hasOverlaps: !this.degradationEngine.validateNoOverlaps(result.positionedCards)
    };
  }

  // Check if layout is valid (no overlaps, all events positioned)
  validateLayout(result: LayoutResult, originalEvents: Event[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for overlaps
    if (!this.degradationEngine.validateNoOverlaps(result.positionedCards)) {
      issues.push('Layout contains overlapping cards');
    }
    
    // Check all events are positioned
    const positionedEventIds = new Set(
      result.positionedCards
        .filter(card => !Array.isArray(card.event))
        .map(card => (card.event as Event).id)
    );
    
    const missingEvents = originalEvents.filter(event => !positionedEventIds.has(event.id));
    if (missingEvents.length > 0) {
      issues.push(`${missingEvents.length} events not positioned: ${missingEvents.map(e => e.id).join(', ')}`);
    }
    
    // Check cards are within viewport bounds
    const outOfBounds = result.positionedCards.filter(card => 
      card.x - card.cardWidth/2 < 0 || 
      card.x + card.cardWidth/2 > this.config.viewportWidth ||
      card.y - card.cardHeight/2 < 0 || 
      card.y + card.cardHeight/2 > this.config.viewportHeight
    );
    
    if (outOfBounds.length > 0) {
      issues.push(`${outOfBounds.length} cards are outside viewport bounds`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Get current configuration
  getConfig(): LayoutConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate components with updated config
    this.clustering = new EventClustering(this.config);
    this.degradationEngine = new DegradationEngine(this.config);
    this.slotGrid = new SlotGrid(this.config);
  }
}