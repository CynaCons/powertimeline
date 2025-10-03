import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { Event } from '../types';
import type { LayoutConfig, PositionedCard, Anchor, EventCluster } from './types';

interface TelemetryData {
  placements?: {
    items?: Array<{
      id: string;
      x: number;
      y: number;
      clusterId: string;
    }>;
  };
}

interface WindowWithTelemetry extends Window {
  __ccTelemetry?: TelemetryData;
}
import { createLayoutConfig } from './config';
import { DeterministicLayoutV5, type DispatchMetrics } from './LayoutEngine';
import { useAxisTicks, type Tick } from '../timeline/hooks/useAxisTicks';
import { EnhancedTimelineAxis } from '../components/EnhancedTimelineAxis';
import { getEventTimestamp, formatEventDateTime } from '../lib/time';
import { environment } from '../config/environment';
import { performanceMonitor } from '../utils/performanceMonitor';

const monitoringEnabled = environment.flags.enableTelemetry || environment.isDevelopment;

interface DeterministicLayoutProps {
  events: Event[];
  showInfoPanels?: boolean;
  viewStart?: number;
  viewEnd?: number;
  hoveredEventId?: string;
  onCardDoubleClick?: (id: string) => void;
  onCardMouseEnter?: (id: string) => void;
  onCardMouseLeave?: () => void;
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
}

export function DeterministicLayoutComponent({
  events,
  showInfoPanels = false,
  viewStart = 0,
  viewEnd = 1,
  hoveredEventId,
  onCardDoubleClick,
  onCardMouseEnter,
  onCardMouseLeave,
  selectedEventId,
  onEventSelect
}: DeterministicLayoutProps) {
  // Container ref for proper sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 600 });

  // State for anchor-card pair highlighting
  const [hoveredPairEventId, setHoveredPairEventId] = useState<string | null>(null);
  
  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setViewportSize({
        width: rect.width,
        height: rect.height
      });
    }
  }, []);
  
  useEffect(() => {
    updateSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateSize]);

  // Calculate timeline date range for axis ticks
  const timelineRange = useMemo(() => {
    if (events.length === 0) return null;

    const dates = events.map(event => getEventTimestamp(event));
    const rawMinDate = Math.min(...dates);
    const rawMaxDate = Math.max(...dates);
    const rawDateRange = rawMaxDate - rawMinDate;

    // Add 2% padding to match LayoutEngine's time range calculation (lines 898-904)
    // This ensures hover dates align with anchor positions
    const padding = rawDateRange * 0.02;
    const fullMinDate = rawMinDate - padding;
    const fullMaxDate = rawMaxDate + padding;
    const fullDateRange = rawDateRange + (padding * 2);

    // If zoomed (viewStart and viewEnd are not 0,1), calculate the visible time window
    if (viewStart !== 0 || viewEnd !== 1) {
      const visibleMinDate = fullMinDate + (viewStart * fullDateRange);
      const visibleMaxDate = fullMinDate + (viewEnd * fullDateRange);
      const visibleDateRange = visibleMaxDate - visibleMinDate;

      return {
        minDate: visibleMinDate,
        maxDate: visibleMaxDate,
        dateRange: visibleDateRange,
        fullMinDate,
        fullMaxDate,
        fullDateRange,
        isZoomed: true
      };
    }

    return {
      minDate: fullMinDate,
      maxDate: fullMaxDate,
      dateRange: fullDateRange,
      fullMinDate,
      fullMaxDate,
      fullDateRange,
      isZoomed: false
    };
  }, [events, viewStart, viewEnd]);

  // Create function for useAxisTicks
  const timestampToPixel = useMemo(() => {
    if (!timelineRange) return () => 0;

    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = Math.max(1, viewportSize.width - leftMargin - rightMargin);
    const effectiveRange = timelineRange.dateRange > 0 ? timelineRange.dateRange : 1;

    return (timestamp: number): number => {
      if (!Number.isFinite(timestamp)) return leftMargin;
      const ratio = (timestamp - timelineRange.minDate) / effectiveRange;
      return leftMargin + ratio * usableWidth;
    };
  }, [timelineRange, viewportSize.width]);

  // Use the enhanced useAxisTicks hook - this must be at component level
  const timelineTicks = useAxisTicks(
    timelineRange?.minDate || 0,
    timelineRange?.maxDate || 1,
    timelineRange?.dateRange || 1,
    timestampToPixel
  );

  // Responsive timeline ticks based on actual viewport width - using margined coordinate system
  const fallbackTicks: Tick[] = timelineRange && viewportSize.width > 200 ? (() => {
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = viewportSize.width - leftMargin - rightMargin;

    const makeYearTick = (time: number, x: number): Tick => ({
      t: time,
      label: new Date(time).getFullYear().toString(),
      x,
      scale: 'year'
    });

    return [
      makeYearTick(timelineRange.minDate, leftMargin + usableWidth * 0.05),
      makeYearTick(timelineRange.minDate + timelineRange.dateRange * 0.25, leftMargin + usableWidth * 0.25),
      makeYearTick(timelineRange.minDate + timelineRange.dateRange * 0.5, leftMargin + usableWidth * 0.5),
      makeYearTick(timelineRange.minDate + timelineRange.dateRange * 0.75, leftMargin + usableWidth * 0.75),
      makeYearTick(timelineRange.maxDate, leftMargin + usableWidth * 0.95)
    ];
  })() : [];

  // Timeline scales use responsive positioning based on viewport width
  
  // Timeline scales now working with proper pixel-based coordinates
  // Convert percentage-based ticks to pixel coordinates using the SAME coordinate system as cards/anchors
  const finalTicks = timelineTicks.length > 0 ? timelineTicks : fallbackTicks;


  // Debug function for browser console
  const DEBUG_LAYOUT = typeof window !== 'undefined' && ((window as Window & { __CC_DEBUG_LAYOUT?: boolean }).__CC_DEBUG_LAYOUT || (import.meta as ImportMeta & { env?: { DEV?: boolean } })?.env?.DEV);

  useEffect(() => {
    (window as Window & { debugTimelineScales?: () => unknown }).debugTimelineScales = () => {
      const container = document.querySelector('[data-testid="timeline-scales-container"]') as HTMLElement;
      const svg = document.querySelector('[data-testid="timeline-scales-svg"]') as SVGElement;
      const texts = document.querySelectorAll('[data-testid="timeline-scales-svg"] text');
      
      if (DEBUG_LAYOUT) {
        console.log('Timeline Scales Debug Results:');
        console.log('1. Container exists:', !!container);
        console.log('2. Container position:', container?.getBoundingClientRect());
        console.log('3. Container styles:', container ? getComputedStyle(container) : 'N/A');
        console.log('4. SVG exists:', !!svg);
        console.log('5. SVG position:', svg?.getBoundingClientRect());
        console.log('6. Text elements found:', texts.length);
      }
      texts.forEach((text, i) => {
        const rect = text.getBoundingClientRect();
        if (DEBUG_LAYOUT) console.log(`   Text ${i}:`, text.textContent, 'Position:', rect, 'Visible:', rect.width > 0 && rect.height > 0);
      });
      if (DEBUG_LAYOUT) {
        console.log('7. Current viewport size:', viewportSize);
        console.log('8. Timeline ticks data:', finalTicks);
      }
      
      return {
        containerExists: !!container,
        svgExists: !!svg,
        textCount: texts.length,
        viewport: viewportSize,
        ticks: finalTicks
      };
    };
    
    if (DEBUG_LAYOUT) console.log('Debug function available: window.debugTimelineScales()');
  }, [viewportSize, finalTicks, DEBUG_LAYOUT]);

  // TODO: Fix useAxisTicks hook - currently using fallback system



  // Create layout configuration for deterministic layout
  const config: LayoutConfig = useMemo(() => {
    // Pass full viewport width to LayoutEngine - it will handle sidebar margins internally
    const baseConfig = createLayoutConfig(viewportSize.width, viewportSize.height);
    
    // Add time range calculation for proper X positioning
    if (events.length > 0) {
      const dates = events.map(e => getEventTimestamp(e));
      const minTime = Math.min(...dates);
      const maxTime = Math.max(...dates);
      const padding = (maxTime - minTime) * 0.1; // 10% padding
      
      return {
        ...baseConfig,
        startTime: minTime - padding,
        endTime: maxTime + padding
      };
    }
    
    return baseConfig;
  }, [viewportSize.width, viewportSize.height, events]);

  // Calculate view window time range for later card filtering
  const viewTimeWindow = useMemo(() => {
    if (events.length === 0 || (viewStart === 0 && viewEnd === 1)) {
      return null; // No filtering when showing full timeline
    }

    // Calculate time range with same 2% padding as LayoutEngine and timelineRange
    const dates = events.map(e => getEventTimestamp(e));
    const rawMinDate = Math.min(...dates);
    const rawMaxDate = Math.max(...dates);
    const rawDateRange = rawMaxDate - rawMinDate;

    // Add 2% padding to match other time range calculations
    const padding = rawDateRange * 0.02;
    const paddedMinDate = rawMinDate - padding;
    // const paddedMaxDate = rawMaxDate + padding;
    const paddedDateRange = rawDateRange + (padding * 2);

    // Calculate visible time window using padded dates
    const visibleStartTime = paddedMinDate + (paddedDateRange * viewStart);
    const visibleEndTime = paddedMinDate + (paddedDateRange * viewEnd);

    return { visibleStartTime, visibleEndTime };
  }, [events, viewStart, viewEnd]);

  // Apply deterministic layout algorithm with view window context
  const layoutResult = useMemo(() => {
    if (events.length === 0) {
      return {
        positionedCards: [],
        anchors: [],
        clusters: [],
        utilization: { totalSlots: 0, usedSlots: 0, percentage: 0 }
      };
    }

    const deterministicLayout = new DeterministicLayoutV5(config);

    const shouldMeasureLayout = monitoringEnabled && typeof performance !== 'undefined';

    if (shouldMeasureLayout) {
      performanceMonitor.startLayoutMeasurement();
    }

    try {
      // Pass view window to layout algorithm for proper filtering with overflow context
      const viewWindow = viewTimeWindow ? { viewStart, viewEnd } : undefined;
      return deterministicLayout.layout(events, viewWindow);
    } finally {
      if (shouldMeasureLayout) {
        performanceMonitor.endLayoutMeasurement();
      }
    }
  }, [events, config, viewStart, viewEnd, viewTimeWindow]);

  // Always show all anchors - they should persist even during card degradation
  const filteredAnchors = useMemo(() => {
    if (DEBUG_LAYOUT) console.log(`ANCHOR PERSISTENCE: Showing all ${layoutResult.anchors.length} anchors regardless of card visibility`);

    // Return all anchors without filtering - anchors should always be visible
    // even when cards are degraded or hidden. This ensures timeline reference points
    // remain consistent and anchor-timeline alignment is preserved.
    return layoutResult.anchors;
  }, [layoutResult.anchors, DEBUG_LAYOUT]);

  // Merge nearby overflow badges to prevent overlaps (Badge Merging Strategy)
  const mergedOverflowBadges = useMemo(() => {
    const anchors = filteredAnchors; // Use filtered anchors to prevent leftover merged badges
    if (!anchors || anchors.length === 0) return [];
    
    const MERGE_THRESHOLD = 200; // Merge anchors within 200px for aggressive spacing
    const overflowAnchors = anchors.filter((anchor: Anchor) => anchor.overflowCount > 0);
    const mergedBadges: Array<{
      x: number;
      y: number;
      totalOverflow: number;
      anchorIds: string[];
    }> = [];
    const processedAnchors = new Set<string>();
    
    // Sort anchors by X position for left-to-right processing
    const sortedAnchors = [...overflowAnchors].sort((a: Anchor, b: Anchor) => a.x - b.x);
    
    for (const anchor of sortedAnchors) {
      if (processedAnchors.has(anchor.id)) continue;
      
      // Find all nearby anchors within merge threshold (including current anchor)
      const nearbyAnchors = sortedAnchors.filter((other: Anchor) =>
        !processedAnchors.has(other.id) && 
        Math.abs(other.x - anchor.x) <= MERGE_THRESHOLD
      );
      
      if (nearbyAnchors.length > 1) {
        // Merge overflow counts from multiple anchors
        const totalOverflow = nearbyAnchors.reduce((sum: number, a: Anchor) => sum + a.overflowCount, 0);
        const centroidX = nearbyAnchors.reduce((sum: number, a: Anchor) => sum + a.x, 0) / nearbyAnchors.length;
        
        mergedBadges.push({
          x: centroidX,
          y: config.timelineY,
          totalOverflow,
          anchorIds: nearbyAnchors.map((a: Anchor) => a.id)
        });
        
        // Mark all anchors in group as processed
        nearbyAnchors.forEach((a: Anchor) => processedAnchors.add(a.id));
      } else if (nearbyAnchors.length === 1) {
        // Single anchor - keep individual badge but mark as processed
        processedAnchors.add(anchor.id);
      }
    }
    
    return mergedBadges;
  }, [filteredAnchors, config.timelineY]);

  // Telemetry: expose dispatch/capacity/placements for tests and overlays
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { positionedCards, anchors, clusters, utilization } = layoutResult;

    // Use telemetry from layout engine if available, fallback to manual calculation
    const engineMetrics = layoutResult.telemetryMetrics;
    let dispatchMetrics: DispatchMetrics | undefined;

    if (engineMetrics) {
      dispatchMetrics = engineMetrics.dispatch;
    } else {
      // Fallback: calculate manually if engine metrics not available
      const groupsCount = clusters.length;
      const clusterSizes = clusters.map((c: EventCluster) => c.events.length || 0);
      const avgEventsPerCluster = groupsCount > 0 ? (clusterSizes.reduce((a: number, b: number) => a + b, 0) / groupsCount) : 0;
      const largestCluster = Math.max(0, ...clusterSizes);
      const xs = anchors.map((a: Anchor) => a.x).sort((a: number, b: number) => a - b);
      const pitches = xs.length > 1 ? xs.slice(1).map((x: number, i: number) => Math.abs(x - xs[i])) : [];
      dispatchMetrics = {
        groupCount: groupsCount,
        avgEventsPerCluster,
        largestCluster,
        groupPitchPx: {
          min: pitches.length ? Math.min(...pitches) : 0,
          max: pitches.length ? Math.max(...pitches) : 0,
          avg: pitches.length ? pitches.reduce((a: number, b: number) => a + b, 0) / pitches.length : 0
        },
        horizontalSpaceUsage: 0 // Placeholder
      };
    }

    // Capacity model from layoutResult.utilization
    const totalCells = Math.max(0, utilization.totalSlots || 0);
    const usedCells = Math.max(0, utilization.usedSlots || 0);
    const utilPct = Math.max(0, Math.min(100, utilization.percentage || 0));

    // Placements for stability
    const placements = positionedCards.map((p: PositionedCard) => ({
      id: String(p.event?.id ?? p.id),
      x: Math.round(p.x),
      y: Math.round(p.y),
      clusterId: String(p.clusterId ?? ''),
      isAbove: Boolean(p.y < (config?.timelineY ?? viewportSize.height / 2))
    }));

    // Compare with previous snapshot to compute migrations
    const prev = (window as WindowWithTelemetry).__ccTelemetry;
    let migrations = 0;
    if (prev && Array.isArray(prev.placements?.items)) {
      const prevMap = new Map(prev.placements!.items!.map(it => [String(it.id), it]));
      for (const cur of placements) {
        const old = prevMap.get(String(cur.id));
        if (!old) continue;
        const movedFar = Math.abs((old.x ?? 0) - cur.x) > 40 || Math.abs((old.y ?? 0) - cur.y) > 32;
        const clusterChanged = String(old.clusterId) !== String(cur.clusterId);
        if (movedFar || clusterChanged) migrations++;
      }
    }

    // Card type counts and degradation metrics
    const byTypeCounts: Record<string, number> = positionedCards.reduce((acc: Record<string, number>, c: PositionedCard) => {
      const t = String(c.cardType);
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const totalAggregations = 0;
    const eventsAggregated = 0;
    const singleEventsShown = positionedCards.length;
    const summaryContained = 0;
    const degradationsCount = (byTypeCounts['compact'] || 0) + (byTypeCounts['title-only'] || 0);
    const promotionsCount = 0; // Placeholder: promotion logic not implemented yet

    // Half-column analysis for Stage 3 telemetry
    const timelineY = config?.timelineY ?? viewportSize.height / 2;
    const aboveCards = positionedCards.filter((c: PositionedCard) => c.y < timelineY);
    const belowCards = positionedCards.filter((c: PositionedCard) => c.y >= timelineY);
    
    // Group cards by cluster/column for half-column analysis
    const clusterMap = new Map<string, { above: PositionedCard[], below: PositionedCard[] }>();
    positionedCards.forEach((card: PositionedCard) => {
      const clusterId = String(card.clusterId ?? 'default');
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, { above: [], below: [] });
      }
      const cluster = clusterMap.get(clusterId)!;
      if (card.y < timelineY) {
        cluster.above.push(card);
      } else {
        cluster.below.push(card);
      }
    });

    // Calculate half-column metrics
    const aboveHalfColumns = Array.from(clusterMap.values()).filter(c => c.above.length > 0);
    const belowHalfColumns = Array.from(clusterMap.values()).filter(c => c.below.length > 0);
    
    const aboveEventsPerHalfColumn = aboveHalfColumns.map(c => c.above.length);
    const belowEventsPerHalfColumn = belowHalfColumns.map(c => c.below.length);
    
    // Calculate temporal distribution (percentage of timeline width used)
    const viewportWidth = viewportSize.width;
    const temporalDistribution = anchors.length > 1 ? (() => {
      const positions = anchors.map((a: Anchor) => a.x).sort((a: number, b: number) => a - b);
      const minX = Math.min(...positions);
      const maxX = Math.max(...positions);
      return ((maxX - minX) / viewportWidth) * 100;
    })() : 0;

    // Placement pattern validation
    const sortedEvents = events.slice().sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
    const sortedPlacements = sortedEvents.map(event => 
      positionedCards.find(card => 
        card.event?.id === event.id
      )
    ).filter(Boolean);
    
    // Check alternating pattern: Event 1→above, Event 2→below, etc.
    let alternatingPattern = true;
    for (let i = 0; i < sortedPlacements.length && alternatingPattern; i++) {
      const card = sortedPlacements[i];
      if (!card) continue;
      const shouldBeAbove = (i % 2) === 0; // Even index (0,2,4...) should be above
      const isAbove = card.y < timelineY;
      if (shouldBeAbove !== isAbove) {
        alternatingPattern = false;
      }
    }

    // Check spatial clustering (events are clustered based on horizontal overlap, not artificial limits)
    const spatialClustering = clusterMap.size > 1 || (clusterMap.size === 1 && positionedCards.length <= 4);

    const telemetry = {
      version: 'v5',
      events: { total: events.length },
      groups: { count: dispatchMetrics?.groupCount || clusters.length },
      dispatch: {
        ...(dispatchMetrics || {}),
        targetAvgEventsPerClusterBand: [4, 6] as [number, number]
      },
      capacity: {
        totalCells,
        usedCells,
        utilization: utilPct
      },
      promotions: {
        count: promotionsCount
      },
      degradations: {
        count: degradationsCount,
        byType: {
          compact: byTypeCounts['compact'] || 0,
          'title-only': byTypeCounts['title-only'] || 0
        }
      },
      aggregation: {
        totalAggregations: totalAggregations,
        eventsAggregated: eventsAggregated,
        clustersAffected: 0
      },
      cards: {
        single: singleEventsShown,
        multiContained: eventsAggregated,
        summaryContained
      },
      placements: {
        items: placements,
        migrations
      },
      halfColumns: {
        above: {
          count: aboveHalfColumns.length,
          totalSlots: aboveHalfColumns.length * 2, // 2 slots per half-column
          usedSlots: aboveCards.length,
          utilization: aboveHalfColumns.length > 0 ? (aboveCards.length / (aboveHalfColumns.length * 2)) * 100 : 0,
          events: aboveCards.length,
          eventsPerHalfColumn: aboveEventsPerHalfColumn
        },
        below: {
          count: belowHalfColumns.length,
          totalSlots: belowHalfColumns.length * 2, // 2 slots per half-column
          usedSlots: belowCards.length,
          utilization: belowHalfColumns.length > 0 ? (belowCards.length / (belowHalfColumns.length * 2)) * 100 : 0,
          events: belowCards.length,
          eventsPerHalfColumn: belowEventsPerHalfColumn
        }
      },
      placement: {
        alternatingPattern,
        spatialClustering,
        temporalDistribution
      },
      viewport: {
        width: viewportSize.width,
        height: viewportSize.height,
        timelineY: config?.timelineY ?? viewportSize.height / 2
      },
      adaptive: layoutResult.telemetryMetrics?.adaptive,
      degradation: layoutResult.telemetryMetrics?.degradation
    };

    (window as WindowWithTelemetry).__ccTelemetry = telemetry;
  }, [layoutResult, events, viewportSize.width, viewportSize.height, config]);


  return (
    <div 
      key={`vw-${Number.isFinite(viewStart) ? viewStart.toFixed(3) : '0.000'}-${Number.isFinite(viewEnd) ? viewEnd.toFixed(3) : '1.000'}`}
      ref={containerRef}
      className="absolute inset-0 bg-gray-100 overflow-hidden"
    >
      {/* Column Borders removed - was a development visualization feature */}
      
      {/* Enhanced Timeline Axis with multi-level labels and visual improvements */}
      {events.length > 0 && timelineRange && finalTicks && finalTicks.length > 0 && (
        <EnhancedTimelineAxis
          timelineRange={timelineRange}
          viewportSize={viewportSize}
          timelineY={config?.timelineY ?? viewportSize.height / 2}
          baseTicks={finalTicks}
          onDateHover={(date) => {
            // Optional: Add date hover functionality
            if (DEBUG_LAYOUT && date) {
              console.log('Timeline hover:', date.toLocaleDateString());
            }
          }}
          onTimelineClick={(date) => {
            // Optional: Add timeline click functionality
            if (DEBUG_LAYOUT) {
              console.log('Timeline clicked at:', date.toLocaleDateString());
            }
          }}
        />
      )}

      {/* Fallback timeline axis when EnhancedTimelineAxis conditions aren't met but events exist */}
      {events.length > 0 && (!timelineRange || !finalTicks || finalTicks.length === 0) && (
        <div
          data-testid="timeline-axis"
          style={{
            position: 'absolute',
            top: config?.timelineY ?? viewportSize.height / 2,
            left: 0,
            width: viewportSize.width,
            height: 2,
            backgroundColor: '#374151',
            zIndex: 10
          }}
        />
      )}

      {/* Fallback timeline axis for tests when no events loaded */}
      {events.length === 0 && (
        <div
          data-testid="timeline-axis"
          style={{
            position: 'absolute',
            top: config?.timelineY ?? viewportSize.height / 2,
            left: 0,
            width: viewportSize.width,
            height: 2,
            backgroundColor: '#e5e7eb',
            zIndex: 10
          }}
        />
      )}

      {/* Anchors - filtered by view window to prevent leftover overflow badges */}
      {filteredAnchors.map((anchor) => {
        // Check if this anchor is part of a merged badge group
        const isMerged = mergedOverflowBadges.some(badge => badge.anchorIds.includes(anchor.id));
        
        // Determine if anchor's events are above or below timeline
        // const timelineY = config?.timelineY ?? viewportSize.height / 2;
        const anchorCards = layoutResult.positionedCards.filter(card => {
          const cardEventIds = [card.event.id];
          return cardEventIds.some(id => anchor.eventIds?.includes(id));
        });
        // If no matching cards, suppress this anchor entirely (belt-and-suspenders)
        if (anchorCards.length === 0) return null;

        const anchorEventIds = [
          ...(anchor.eventIds ?? []),
          ...(anchor.eventId ? [anchor.eventId] : [])
        ];
        const primaryAnchorEventId = anchor.eventId ?? anchor.eventIds?.[0] ?? null;
        const isAnchorHovered = (hoveredEventId && anchorEventIds.includes(hoveredEventId)) ||
                                (hoveredPairEventId && anchorEventIds.includes(hoveredPairEventId));
        const isAnchorSelected = selectedEventId ? anchorEventIds.includes(selectedEventId) : false;

        const anchorVisualStyle: CSSProperties = isAnchorSelected
          ? {
              background: 'linear-gradient(135deg, #fcd34d 0%, #d97706 100%)',
              borderColor: '#fbbf24',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.35)'
            }
          : isAnchorHovered
            ? {
                background: 'linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-primary-600) 100%)',
                borderColor: 'var(--color-primary-400)',
                boxShadow: '0 0 8px rgba(66, 165, 245, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }
            : {
                background: 'linear-gradient(135deg, var(--color-neutral-700) 0%, var(--color-neutral-800) 50%, var(--color-neutral-700) 100%)',
                borderColor: 'var(--color-neutral-600)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              };
        anchorVisualStyle.borderRadius = '1px';

        // Determine connector direction based on card positions
        // const hasCardsAbove = anchorCards.some(card => card.y < timelineY);
        // const hasCardsBelow = anchorCards.some(card => card.y >= timelineY);
        // const connectsUp = hasCardsAbove;
        // const connectsDown = hasCardsBelow;
        
        return (
          <div
            key={anchor.id}
            data-testid={anchor.id}
            className="absolute"
            style={{ left: anchor.x - 8, top: anchor.y - 8 }}
          >
            <div
              data-testid="timeline-anchor"
              className="flex flex-col items-center cursor-pointer"
              aria-selected={isAnchorSelected}
              data-selected={isAnchorSelected || undefined}
              onMouseEnter={() => {
                if (primaryAnchorEventId) {
                  setHoveredPairEventId(primaryAnchorEventId);
                  if (onCardMouseEnter) onCardMouseEnter(primaryAnchorEventId);
                }
              }}
              onMouseLeave={() => {
                setHoveredPairEventId(null);
                if (onCardMouseLeave) onCardMouseLeave();
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (primaryAnchorEventId && onEventSelect) {
                  onEventSelect(primaryAnchorEventId);
                }
              }}
            >
              {/* Dark-metallic diamond anchor icon with coherent highlighting */}
              <div
                className={`w-3 h-3 border shadow-md z-20 transform rotate-45 transition-all duration-200 ${
                  isAnchorSelected ? 'scale-125' : isAnchorHovered ? 'scale-110' : ''
                }`}
                style={anchorVisualStyle}
              />

              {/* Individual overflow badge - only show if NOT part of merged group */}
              {anchor.overflowCount > 0 && !isMerged && (
                <div 
                  data-testid={`overflow-badge-${anchor.id}`}
                  className="absolute -top-4 -right-4 bg-red-500 text-white text-sm rounded-full min-w-8 h-8 px-2 flex items-center justify-center font-bold shadow-lg border-2 border-white z-30"
                >
                  +{anchor.overflowCount}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Render merged overflow badges at centroids */}
      {mergedOverflowBadges.map((badge, index) => (
        <div
          key={`merged-badge-${index}`}
          data-testid={`merged-overflow-badge-${index}`}
          className="absolute flex flex-col items-center"
          style={{
            left: badge.x - 8,
            top: (config?.timelineY ?? viewportSize.height / 2) - 8
          }}
        >
          {/* Merged overflow badge */}
          <div className="absolute -top-4 -right-4 bg-red-500 text-white text-sm rounded-full min-w-8 h-8 px-2 flex items-center justify-center font-bold shadow-lg border-2 border-white z-30">
            +{badge.totalOverflow}
          </div>
        </div>
      ))}
      
      {/* Cards */}
      {layoutResult.positionedCards.map(card => {
        const primaryCardEventId = card.event?.id ?? card.id;
        const isCardSelected = selectedEventId ? primaryCardEventId === selectedEventId : false;
        const isCardHovered = hoveredEventId ? primaryCardEventId === hoveredEventId : false;
        const isCardPairHovered = hoveredPairEventId ? primaryCardEventId === hoveredPairEventId : false;

        const cardTypeClass =
          card.cardType === 'full'
            ? 'border-l-4 border-l-blue-500 border-gray-200 p-3'
            : card.cardType === 'compact'
            ? 'border-l-4 border-l-green-500 border-gray-200 p-2'
            : 'border-l-4 border-l-yellow-500 border-gray-200 p-1';

        const cardHighlightClasses = isCardSelected
          ? 'ring-2 ring-amber-400 ring-opacity-80 outline outline-2 outline-offset-2 outline-amber-300 shadow-xl'
          : isCardHovered
          ? 'ring-1 ring-blue-300 ring-opacity-30 shadow-lg'
          : isCardPairHovered
          ? 'ring-2 ring-blue-400 ring-opacity-60 shadow-blue-400/30 shadow-lg'
          : '';

        const cardStyle: CSSProperties = {
          left: card.x,
          top: card.y,
          width: card.width,
          height: card.height,
          zIndex: isCardSelected ? 25 : isCardHovered ? 22 : isCardPairHovered ? 21 : 10,
          backgroundColor: isCardSelected ? 'rgba(254, 243, 199, 0.45)' : undefined,
          boxShadow: isCardSelected ? '0 12px 24px rgba(251, 191, 36, 0.25)' : undefined
        };

        const content =
          card.cardType === 'compact'
            ? <CompactCardContent event={card.event} />
            : card.cardType === 'title-only'
            ? <TitleOnlyCardContent event={card.event} />
            : <FullCardContent event={card.event} />;

        return (
          <div
            key={card.id}
            data-testid="event-card"
            data-event-id={primaryCardEventId}
            data-card-type={card.cardType}
            data-cluster-id={card.clusterId}
            className={`absolute bg-white rounded-lg shadow-md border hover:shadow-lg transition-all cursor-pointer ${cardTypeClass} ${cardHighlightClasses} text-sm`}
            style={cardStyle}
            aria-selected={isCardSelected}
            data-selected={isCardSelected || undefined}
            onClick={event => {
              event.stopPropagation();
              if (primaryCardEventId && onEventSelect) {
                onEventSelect(primaryCardEventId);
              }
            }}
            onDoubleClick={() => {
              if (primaryCardEventId && onCardDoubleClick) {
                onCardDoubleClick(primaryCardEventId);
              }
            }}
            onMouseEnter={() => {
              if (primaryCardEventId) {
                setHoveredPairEventId(primaryCardEventId);
              }
              if (primaryCardEventId && onCardMouseEnter) {
                onCardMouseEnter(primaryCardEventId);
              }
            }}
            onMouseLeave={() => {
              setHoveredPairEventId(null);
              if (onCardMouseLeave) {
                onCardMouseLeave();
              }
            }}
          >
            {content}
          </div>
        );
      })}

      {/* Info Panels - Only show when enabled */}
      {showInfoPanels && (
        <div
          className="absolute top-4 left-4 backdrop-blur-sm p-3 rounded-lg shadow-md max-w-sm transition-all duration-200 z-[5] pointer-events-auto"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <h2 className="font-bold text-sm mb-1">Layout Summary</h2>
          <p className="text-xs text-gray-600">{layoutResult.positionedCards.length} events</p>
          <p className="text-xs text-gray-600">{layoutResult.clusters.length} column groups</p>
          <p className="text-xs text-gray-600">Slot utilisation {layoutResult.utilization.percentage.toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}

function FullCardContent({ event }: { event: Event }) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="card-title text-primary line-clamp-2 mb-1">{event.title}</h3>
      {event.description ? (
        <p className="card-description text-secondary flex-1 line-clamp-3">{event.description}</p>
      ) : (
        <div className="flex-1" />
      )}
      <div className="card-date text-tertiary">{formatEventDateTime(event)}</div>
    </div>
  );
}

function CompactCardContent({ event }: { event: Event }) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="card-title text-primary line-clamp-2 mb-1">{event.title}</h3>
      {event.description ? (
        <p className="card-description text-secondary line-clamp-1">{event.description}</p>
      ) : (
        <div className="flex-1" />
      )}
      <div className="card-date text-tertiary">{formatEventDateTime(event)}</div>
    </div>
  );
}

function TitleOnlyCardContent({ event }: { event: Event }) {
  return (
    <div className="h-full flex items-center">
      <h3 className="card-title text-primary line-clamp-1">{event.title}</h3>
    </div>
  );
}
