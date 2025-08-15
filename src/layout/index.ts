// Core layout system exports
export { LayoutEngine } from './LayoutEngine';
export { SlotGrid } from './SlotGrid';
export { EventClustering } from './clustering';
export { SingleColumnLayout } from './SingleColumnLayout';

// Configuration and utilities
export { 
  createLayoutConfig, 
  updateLayoutConfigForViewport,
  getAdaptiveCardConfigs,
  calculateMaxSlotsPerCluster,
  getViewportCategory,
  getViewportSpecificConfig,
  VIEWPORT_BREAKPOINTS
} from './config';

// React components
export { CardRenderer, CardConnector } from './CardRenderer';
export { AnchorBadge, AnchorBadgeHtml } from './AnchorBadge';

// React hooks
export { useSlotBasedLayout, useSimpleSlotLayout } from './useSlotBasedLayout';

// Type definitions
export type {
  Slot,
  Anchor,
  EventCluster,
  CardType,
  CardConfig,
  PositionedCard,
  LayoutConfig,
  LayoutResult
} from './types';