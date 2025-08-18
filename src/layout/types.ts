import type { Event } from '../types';

// Core slot-based positioning types
export interface Slot {
  x: number;        // Horizontal position (absolute pixels)
  y: number;        // Vertical position (absolute pixels)
  column: number;   // Column index (0=center, -1=left, +1=right, etc.)
  side: 'above' | 'below';  // Above or below timeline
  occupied: boolean;
  clusterId?: string;
}

export interface Anchor {
  id: string;
  x: number;        // Horizontal position on timeline
  y: number;        // Timeline y position
  eventIds: string[];
  eventCount: number;
}

export interface EventCluster {
  id: string;
  anchor: Anchor;
  events: Event[];
  slots?: Slot[];
}

export type CardType = 'full' | 'compact' | 'title-only' | 'multi-event' | 'infinite';

export interface CardConfig {
  type: CardType;
  width: number;
  height: number;
  maxEvents?: number; // For multi-event cards
}

export interface PositionedCard {
  id: string;
  event: Event | Event[]; // Single event or array for multi-event cards
  x: number;           // Card center x
  y: number;           // Card center y
  cardWidth: number;
  cardHeight: number;
  anchorX: number;     // Associated anchor position
  anchorY: number;
  cardType: CardType;
  isMultiEvent: boolean;
  isSummaryCard: boolean;
  clusterId: string;
  eventCount?: number; // For infinite cards
}

export interface LayoutConfig {
  viewportWidth: number;
  viewportHeight: number;
  timelineY: number;    // Timeline vertical position
  clusterThreshold: number; // Pixel distance for clustering
  cardConfigs: Record<CardType, CardConfig>;
  columnSpacing: number;    // Horizontal spacing between columns
  rowSpacing: number;       // Vertical spacing between rows
}

export interface ColumnBounds {
  x: number;
  width: number;
  minY: number;
  maxY: number;
}

export interface LayoutResult {
  positionedCards: PositionedCard[];
  clusters: EventCluster[];
  anchors: Anchor[];
  columnBounds?: ColumnBounds[];
  utilization: {
    totalSlots: number;
    usedSlots: number;
    percentage: number;
  };
}