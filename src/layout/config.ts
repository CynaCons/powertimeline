import type { LayoutConfig, CardConfig, CardType } from './types';

// Default card configurations
const DEFAULT_CARD_CONFIGS: Record<CardType, CardConfig> = {
  full: {
    type: 'full',
    width: 260, // Reduced from 280px to 260px
    height: 169
  },
  compact: {
    type: 'compact',
    width: 260,
    height: 82  // Height for 2-line titles: 82px content + 16px padding. 3 cards fit in half-column (3 × 82px + 2 × 12px = 270px)
  },
  'title-only': {
    type: 'title-only',
    width: 260,
    height: 32
  },
};

// Card height in cells for capacity tracking (mixed card type support)
// Used by DegradationEngine for greedy packing algorithm
export const CARD_HEIGHT_CELLS: Record<CardType, number> = {
  'full': 4,
  'compact': 2,
  'title-only': 1
} as const;

// Timeline margin constant (used in capacity calculations)
const TIMELINE_MARGIN = 80; // pixels reserved for timeline axis and spacing

// Safe zone at top of screen to prevent overlap with minimap and breadcrumbs
const HEADER_SAFE_ZONE = 100; // minimap (50px) + breadcrumb (40px) + padding (10px)

export function createLayoutConfig(
  viewportWidth: number,
  viewportHeight: number,
  customConfig?: Partial<LayoutConfig>
): LayoutConfig {
  // Calculate timeline Y with safe zone at top
  const availableHeight = viewportHeight - HEADER_SAFE_ZONE;
  const timelineY = HEADER_SAFE_ZONE + (availableHeight / 2);

  return {
    viewportWidth,
    viewportHeight,
    timelineY,
    clusterThreshold: 120, // Pixel distance for clustering events
    cardConfigs: DEFAULT_CARD_CONFIGS,
    columnSpacing: 20,     // Space between dual columns
    rowSpacing: 20,        // Space between card rows
    ...customConfig
  };
}

export function updateLayoutConfigForViewport(
  config: LayoutConfig,
  newWidth: number,
  newHeight: number
): LayoutConfig {
  // Recalculate timeline Y with safe zone
  const availableHeight = newHeight - HEADER_SAFE_ZONE;
  const timelineY = HEADER_SAFE_ZONE + (availableHeight / 2);

  return {
    ...config,
    viewportWidth: newWidth,
    viewportHeight: newHeight,
    timelineY
  };
}

// Adaptive card sizing based on viewport
export function getAdaptiveCardConfigs(viewportWidth: number, viewportHeight: number): Record<CardType, CardConfig> {
  const scale = Math.min(viewportWidth / 1200, viewportHeight / 800); // Scale factor
  const clampedScale = Math.max(0.7, Math.min(1.2, scale)); // Clamp between 70% and 120%

  const configs = { ...DEFAULT_CARD_CONFIGS };
  
  // Scale all card sizes
  Object.values(configs).forEach(config => {
    config.width = Math.round(config.width * clampedScale);
    config.height = Math.round(config.height * clampedScale);
  });

  return configs;
}

// Calculate maximum slots per cluster based on viewport
export function calculateMaxSlotsPerCluster(config: LayoutConfig): {
  singleColumn: number;
  dualColumn: number;
} {
  const availableHeightPerSide = (config.viewportHeight / 2) - 50; // Leave margin for timeline
  const slotsPerSide = Math.floor(availableHeightPerSide / (config.cardConfigs.full.height + config.rowSpacing));

  return {
    singleColumn: slotsPerSide * 2, // Above + below
    dualColumn: slotsPerSide * 4    // (Above + below) * 2 columns
  };
}

/**
 * Calculate maximum cells available in a semi-column for mixed card types
 * Uses title-only card height as the base cell unit
 *
 * @param viewportHeight - Current viewport height in pixels
 * @param rowSpacing - Spacing between cards in pixels
 * @returns Maximum number of cells (title-only card height units) per semi-column
 */
export function calculateMaxCellsPerSemiColumn(
  viewportHeight: number,
  rowSpacing: number
): number {
  const availableHeight = (viewportHeight / 2) - TIMELINE_MARGIN;
  const cellHeight = DEFAULT_CARD_CONFIGS['title-only'].height;

  // Calculate how many cells fit, accounting for spacing between cards
  // We can fit roughly: availableHeight / (cellHeight + rowSpacing)
  const maxCards = Math.floor(availableHeight / (cellHeight + rowSpacing));

  // Each title-only card = 1 cell, so max cells ≈ max title-only cards
  // Add some buffer for spacing variations
  return Math.max(8, maxCards); // Minimum 8 cells, typically 10-12 for standard viewport
}

// Viewport breakpoints for different behaviors
export const VIEWPORT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  ultrawide: 2560
} as const;

export function getViewportCategory(width: number): keyof typeof VIEWPORT_BREAKPOINTS {
  if (width >= VIEWPORT_BREAKPOINTS.ultrawide) return 'ultrawide';
  if (width >= VIEWPORT_BREAKPOINTS.desktop) return 'desktop';
  if (width >= VIEWPORT_BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

export function getViewportSpecificConfig(width: number, height: number): Partial<LayoutConfig> {
  const category = getViewportCategory(width);

  switch (category) {
    case 'mobile':
      return {
        clusterThreshold: 80,
        columnSpacing: 12,
        rowSpacing: 8,
        cardConfigs: getAdaptiveCardConfigs(width, height)
      };
    case 'tablet':
      return {
        clusterThreshold: 100,
        columnSpacing: 16,
        rowSpacing: 10,
        cardConfigs: getAdaptiveCardConfigs(width, height)
      };
    case 'desktop':
      return {
        clusterThreshold: 120,
        columnSpacing: 20,
        rowSpacing: 20,
        cardConfigs: DEFAULT_CARD_CONFIGS
      };
    case 'ultrawide':
      return {
        clusterThreshold: 140,
        columnSpacing: 24,
        rowSpacing: 20,
        cardConfigs: DEFAULT_CARD_CONFIGS
      };
    default:
      return {};
  }
}

/**
 * Feature Flags for gradual rollout of new features
 *
 * ENABLE_CLUSTER_COORDINATION: Enables spatial cluster coordination for degradation
 * ENABLE_MIXED_CARD_TYPES: Enables mixed card types within clusters (re-enabled with correct math)
 *   - Compact card height reduced to 75px so 4 compact cards fit (4 × 75px + 3 × 12px = 336px)
 *   - Allows mixing full + compact + title-only with chronological priority
 *   - Only enabled when spatial cluster has NO overflow
 *
 * Can be disabled via environment variables:
 *   - VITE_ENABLE_CLUSTER_COORDINATION=false
 *   - VITE_ENABLE_MIXED_CARD_TYPES=false
 */
export const FEATURE_FLAGS = {
  ENABLE_CLUSTER_COORDINATION:
    import.meta.env.VITE_ENABLE_CLUSTER_COORDINATION !== 'false',
  ENABLE_MIXED_CARD_TYPES:
    import.meta.env.VITE_ENABLE_MIXED_CARD_TYPES !== 'false',
} as const;
