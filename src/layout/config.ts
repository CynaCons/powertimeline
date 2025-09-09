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
    height: 78
  },
  'title-only': {
    type: 'title-only',
    width: 140,
    height: 32
  },
  'multi-event': {
    type: 'multi-event',
    width: 180,
    height: 80,
    maxEvents: 5
  },
  infinite: {
    type: 'infinite',
    width: 160,
    height: 40
  }
};

export function createLayoutConfig(
  viewportWidth: number,
  viewportHeight: number,
  customConfig?: Partial<LayoutConfig>
): LayoutConfig {
  const timelineY = viewportHeight / 2; // Center timeline vertically

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
  return {
    ...config,
    viewportWidth: newWidth,
    viewportHeight: newHeight,
    timelineY: newHeight / 2
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
