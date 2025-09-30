/**
 * MetricsCalculator - Telemetry and metrics calculation
 *
 * Handles all telemetry and performance metrics calculation:
 * - Dispatch metrics (group distribution, space usage)
 * - Degradation metrics (card type transitions)
 * - Aggregation metrics (event grouping statistics)
 * - Infinite metrics (overflow container usage)
 * - Adaptive metrics (temporal density calculations)
 */

import type { LayoutConfig, LayoutResult } from '../types';
import type { DispatchMetrics, AggregationMetrics, InfiniteMetrics, DegradationMetrics, AdaptiveMetrics } from '../LayoutEngine';

export class MetricsCalculator {
  private readonly TEMPORAL_GROUPING_FACTOR = 0.07; // 7% of timeline range for grouping window

  /**
   * Calculate comprehensive metrics from layout result
   */
  calculateMetrics(
    result: LayoutResult,
    config: LayoutConfig,
    aggregationMetrics: AggregationMetrics,
    infiniteMetrics: InfiniteMetrics,
    degradationMetrics: DegradationMetrics,
    adaptiveHalfColumnWidth?: number,
    timeRange?: { startTime: number; endTime: number; duration: number } | null
  ): {
    dispatch?: DispatchMetrics;
    aggregation?: AggregationMetrics;
    infinite?: InfiniteMetrics;
    degradation?: DegradationMetrics;
    adaptive?: AdaptiveMetrics;
  } {
    const groupXPositions = result.anchors.map(a => a.x).sort((a, b) => a - b);
    const pitches = groupXPositions.slice(1).map((x, i) => x - groupXPositions[i]);

    const dispatch: DispatchMetrics = {
      groupCount: result.clusters.length,
      avgEventsPerCluster: result.clusters.length > 0
        ? result.clusters.reduce((sum, cluster) => sum + (cluster.events?.length || 0), 0) / result.clusters.length
        : 0,
      largestCluster: result.clusters.length > 0
        ? Math.max(...result.clusters.map(c => c.events?.length || 0))
        : 0,
      groupPitchPx: {
        min: pitches.length > 0 ? Math.min(...pitches) : 0,
        max: pitches.length > 0 ? Math.max(...pitches) : 0,
        avg: pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0
      },
      horizontalSpaceUsage: this.calculateHorizontalSpaceUsage(result, config)
    };

    // Include aggregation metrics from Phase 0.5 implementation
    const aggregation: AggregationMetrics = {
      totalAggregations: aggregationMetrics.totalAggregations,
      eventsAggregated: aggregationMetrics.eventsAggregated,
      clustersAffected: aggregationMetrics.clustersAffected
    };

    // Include infinite metrics from Phase 0.5.1 implementation
    const infinite: InfiniteMetrics = {
      enabled: infiniteMetrics.enabled,
      containers: infiniteMetrics.containers,
      eventsContained: infiniteMetrics.eventsContained,
      previewCount: infiniteMetrics.previewCount,
      byCluster: infiniteMetrics.byCluster
    };

    // Stage 3i4: Add adaptive width telemetry
    let adaptive: { halfColumnWidth: number; temporalDensity: number; temporalWindow: number } | undefined;
    if (adaptiveHalfColumnWidth !== undefined && timeRange) {
      const usableWidth = config.viewportWidth - 80;
      const temporalDensity = timeRange.duration > 0 ? usableWidth / timeRange.duration : 0;
      const temporalWindow = timeRange.duration * this.TEMPORAL_GROUPING_FACTOR;

      adaptive = {
        halfColumnWidth: adaptiveHalfColumnWidth,
        temporalDensity,
        temporalWindow
      };
    }

    // Add degradation metrics
    const degradation = {
      totalGroups: degradationMetrics.totalGroups,
      fullCardGroups: degradationMetrics.fullCardGroups,
      compactCardGroups: degradationMetrics.compactCardGroups,
      titleOnlyCardGroups: degradationMetrics.titleOnlyCardGroups,
      degradationRate: degradationMetrics.totalGroups > 0
        ? degradationMetrics.compactCardGroups / degradationMetrics.totalGroups
        : 0,
      spaceReclaimed: degradationMetrics.spaceReclaimed,
      degradationTriggers: degradationMetrics.degradationTriggers
    };

    return { dispatch, aggregation, infinite, degradation, adaptive };
  }

  /**
   * Calculate horizontal space utilization as percentage of viewport width
   */
  private calculateHorizontalSpaceUsage(result: LayoutResult, config: LayoutConfig): number {
    if (result.positionedCards.length === 0) return 0;

    // Find leftmost and rightmost card positions
  const leftmostX = Math.min(...result.positionedCards.map(c => c.x - (c.width / 2)));
  const rightmostX = Math.max(...result.positionedCards.map(c => c.x + (c.width / 2)));

    // Calculate used width
    const usedWidth = rightmostX - leftmostX;

    // Available width is viewport width minus margins (80px each side now)
    const margins = 160; // 80px left + 80px right
    const availableWidth = config.viewportWidth - margins;

    // Return percentage usage
    if (availableWidth <= 0) {
      return 0;
    }

    const usage = (usedWidth / availableWidth) * 100;
    return Math.max(0, Math.min(100, usage));
  }
}