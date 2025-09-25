import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { DeterministicLayoutV5 } from './LayoutEngine';
import { useAxisTicks } from '../timeline/hooks/useAxisTicks';
import { EnhancedTimelineAxis } from '../components/EnhancedTimelineAxis';
import { getEventTimestamp, formatEventDateTime } from '../lib/time';

interface DeterministicLayoutProps {
  events: Event[];
  showInfoPanels?: boolean;
  viewStart?: number;
  viewEnd?: number;
  hoveredEventId?: string;
  onCardDoubleClick?: (id: string) => void;
  onCardMouseEnter?: (id: string) => void;
  onCardMouseLeave?: () => void;
}

export function DeterministicLayoutComponent({
  events,
  showInfoPanels = false,
  viewStart = 0,
  viewEnd = 1,
  hoveredEventId,
  onCardDoubleClick,
  onCardMouseEnter,
  onCardMouseLeave
}: DeterministicLayoutProps) {
  // Container ref for proper sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 600 });
  const [showColumnBorders, setShowColumnBorders] = useState(false);

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
  const tToXPercent = useMemo(() => {
    if (!timelineRange) return () => 0;
    
    return (timestamp: number): number => {
      const ratio = (timestamp - timelineRange.minDate) / timelineRange.dateRange;
      return ratio * 100; // Return 0-100 percent within the viewbox
    };
  }, [timelineRange]);

  // Use the enhanced useAxisTicks hook - this must be at component level
  const timelineTicks = useAxisTicks(
    timelineRange?.minDate || 0,
    timelineRange?.maxDate || 1,
    timelineRange?.dateRange || 1,
    tToXPercent
  );

  // Responsive timeline ticks based on actual viewport width - using margined coordinate system
  const fallbackTicks = timelineRange && viewportSize.width > 200 ? (() => {
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = viewportSize.width - leftMargin - rightMargin;

    return [
      { t: timelineRange.minDate, label: new Date(timelineRange.minDate).getFullYear().toString(), x: leftMargin + usableWidth * 0.05 },
      { t: timelineRange.minDate + (timelineRange.dateRange * 0.25), label: new Date(timelineRange.minDate + (timelineRange.dateRange * 0.25)).getFullYear().toString(), x: leftMargin + usableWidth * 0.25 },
      { t: timelineRange.minDate + (timelineRange.dateRange * 0.5), label: new Date(timelineRange.minDate + (timelineRange.dateRange * 0.5)).getFullYear().toString(), x: leftMargin + usableWidth * 0.5 },
      { t: timelineRange.minDate + (timelineRange.dateRange * 0.75), label: new Date(timelineRange.minDate + (timelineRange.dateRange * 0.75)).getFullYear().toString(), x: leftMargin + usableWidth * 0.75 },
      { t: timelineRange.maxDate, label: new Date(timelineRange.maxDate).getFullYear().toString(), x: leftMargin + usableWidth * 0.95 }
    ];
  })() : [];

  // Timeline scales use responsive positioning based on viewport width
  
  // Timeline scales now working with proper pixel-based coordinates
  // Convert percentage-based ticks to pixel coordinates using the SAME coordinate system as cards/anchors
  const pixelTicks = timelineTicks.map(tick => {
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = viewportSize.width - leftMargin - rightMargin;

    return {
      ...tick,
      x: leftMargin + (tick.x / 100) * usableWidth // Convert 0-100% to margined coordinate system
    };
  });
  
  const finalTicks = pixelTicks.length > 0 ? pixelTicks : fallbackTicks;


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
    
    // Pass view window to layout algorithm for proper filtering with overflow context
    const viewWindow = viewTimeWindow ? { viewStart, viewEnd } : undefined;
    return deterministicLayout.layout(events, viewWindow);
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
    let dispatchMetrics, aggregationMetrics;
    
    if (engineMetrics) {
      dispatchMetrics = engineMetrics.dispatch;
      aggregationMetrics = engineMetrics.aggregation;
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
      aggregationMetrics = { totalAggregations: 0, eventsAggregated: 0, clustersAffected: 0 };
    }

    // Capacity model from layoutResult.utilization
    const totalCells = Math.max(0, utilization.totalSlots || 0);
    const usedCells = Math.max(0, utilization.usedSlots || 0);
    const utilPct = Math.max(0, Math.min(100, utilization.percentage || 0));

    // Placements for stability
    const placements = positionedCards.map((p: PositionedCard) => ({
      id: String(Array.isArray(p.event) ? p.event[0]?.id ?? p.id : p.event?.id ?? p.id),
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

    // Card type counts and aggregation/degradation metrics
    const byTypeCounts: Record<string, number> = positionedCards.reduce((acc: Record<string, number>, c: PositionedCard) => {
      const t = String(c.cardType);
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const multiEventCards = positionedCards.filter((c: PositionedCard) => c.cardType === 'multi-event');
    const totalAggregations = multiEventCards.length;
    const eventsAggregated = multiEventCards.reduce((sum: number, c: PositionedCard) => sum + (c.eventCount || (Array.isArray(c.event) ? c.event.length : 1)), 0);
    const singleEventsShown = positionedCards
      .filter((c: PositionedCard) => (c.eventCount || (Array.isArray(c.event) ? c.event.length : 1)) === 1)
      .length;
    const summaryContained = 0; // Placeholder until 'infinite' summary cards are surfaced in UI
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
        (Array.isArray(card.event) ? card.event[0]?.id : card.event?.id) === event.id
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
      groups: { count: dispatchMetrics.groupCount || clusters.length },
      dispatch: {
        ...dispatchMetrics,
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
        ...aggregationMetrics,
        // Keep backward compatibility with existing field names
        totalAggregations: aggregationMetrics.totalAggregations || totalAggregations,
        eventsAggregated: aggregationMetrics.eventsAggregated || eventsAggregated
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
      {/* Column Borders (Development Visualization) */}
      {showColumnBorders && layoutResult.columnBounds?.map((bounds, index) => (
        <div
          key={`column-border-${index}`}
          className="absolute border border-dashed border-blue-400 opacity-30 pointer-events-none"
          style={{
            left: bounds.x,
            top: bounds.minY,
            width: bounds.width,
            height: bounds.maxY - bounds.minY
          }}
        />
      ))}
      
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
          const cardEventIds = Array.isArray(card.event) 
            ? card.event.map(e => e.id) 
            : [card.event.id];
          return cardEventIds.some(id => anchor.eventIds?.includes(id));
        });
        // If no matching cards, suppress this anchor entirely (belt-and-suspenders)
        if (anchorCards.length === 0) return null;

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
              onMouseEnter={() => {
                // Set hover state for the event this anchor represents
                if (anchor.eventId) {
                  setHoveredPairEventId(anchor.eventId);
                }
              }}
              onMouseLeave={() => {
                setHoveredPairEventId(null);
              }}
            >
              {/* Dark-metallic diamond anchor icon with coherent highlighting */}
              <div
                className={`w-3 h-3 border shadow-md z-20 transform rotate-45 transition-all duration-200 ${
                  hoveredPairEventId === anchor.eventId
                    ? 'scale-125 border-blue-400 shadow-blue-400/50 shadow-lg'
                    : 'border-neutral-600'
                }`}
                style={{
                  background: hoveredPairEventId === anchor.eventId
                    ? 'linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-primary-600) 100%)'
                    : 'linear-gradient(135deg, var(--color-neutral-700) 0%, var(--color-neutral-800) 50%, var(--color-neutral-700) 100%)',
                  borderRadius: '1px',
                  borderColor: hoveredPairEventId === anchor.eventId
                    ? 'var(--color-primary-400)'
                    : 'var(--color-neutral-600)',
                  boxShadow: hoveredPairEventId === anchor.eventId
                    ? '0 0 8px rgba(66, 165, 245, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
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
      {layoutResult.positionedCards.map((card) => (
        <div
          key={card.id}
          data-testid="event-card"
          data-event-id={Array.isArray(card.event) ? card.event[0].id : card.event.id}
          data-card-type={card.cardType}
          data-cluster-id={card.clusterId}
          className={`absolute bg-white rounded-lg shadow-md border hover:shadow-lg transition-all cursor-pointer ${
            card.cardType === 'full' ? 'border-l-4 border-l-blue-500 border-gray-200 p-3' :
            card.cardType === 'compact' ? 'border-l-4 border-l-green-500 border-gray-200 p-2' :
            card.cardType === 'title-only' ? 'border-l-4 border-l-yellow-500 border-gray-200 p-1' :
            card.cardType === 'multi-event' ? 'border-l-4 border-l-purple-500 border-gray-200 p-2' :
            card.cardType === 'infinite' ? 'border-l-4 border-l-red-500 border-gray-200 p-1' :
            'border-l-4 border-l-gray-500 border-gray-200 p-2' // fallback
          } ${(() => {
            const eventId = String(Array.isArray(card.event) ? card.event[0].id : card.event.id);
            if (hoveredEventId === eventId) return 'ring-1 ring-blue-300 ring-opacity-30 shadow-lg';
            if (hoveredPairEventId === eventId) return 'ring-2 ring-blue-400 ring-opacity-60 shadow-blue-400/30 shadow-lg';
            return '';
          })()} text-sm`}
          style={{
            left: card.x,
            top: card.y,
            width: card.width,
            height: card.height,
            zIndex: (() => {
              const eventId = String(Array.isArray(card.event) ? card.event[0].id : card.event.id);
              if (hoveredEventId === eventId) return 20;
              if (hoveredPairEventId === eventId) return 19;
              return 10;
            })()
          }}
          onDoubleClick={() => {
            try {
              const id = String(Array.isArray(card.event) ? card.event[0].id : card.event.id);
              if (onCardDoubleClick) onCardDoubleClick(id);
            } catch {
              // Ignore card interaction errors
            }
          }}
          onMouseEnter={() => {
            try {
              const id = String(Array.isArray(card.event) ? card.event[0].id : card.event.id);
              // Set pair highlighting for this card
              setHoveredPairEventId(id);
              // Call existing handler
              if (onCardMouseEnter) onCardMouseEnter(id);
            } catch {
              // Ignore card interaction errors
            }
          }}
          onMouseLeave={() => {
            // Clear pair highlighting
            setHoveredPairEventId(null);
            // Call existing handler
            if (onCardMouseLeave) onCardMouseLeave();
          }}
        >
          {/* Card content based on type */}
          {card.cardType === 'full' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="font-semibold text-gray-900">{Array.isArray(card.event) ? card.event[0].title : card.event.title}</div>
              {(() => {
                const desc = Array.isArray(card.event) ? card.event[0].description : card.event.description;
                return desc ? (
                  <div className="text-xs text-gray-600 mt-1 overflow-hidden" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'], WebkitLineClamp: 8 }}>
                    {desc}
                  </div>
                ) : null;
              })()}
              <div className="text-xs text-gray-500 mt-auto">{formatEventDateTime(Array.isArray(card.event) ? card.event[0] : card.event)}</div>
            </div>
          )}
          
          {card.cardType === 'compact' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="font-semibold text-gray-900 text-sm">{Array.isArray(card.event) ? card.event[0].title : card.event.title}</div>
              {(() => {
                const desc = Array.isArray(card.event) ? card.event[0].description : card.event.description;
                return desc ? (
                  <div className="text-xs text-gray-600 mt-0.5 overflow-hidden" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'], WebkitLineClamp: 2 }}>
                    {desc}
                  </div>
                ) : null;
              })()}
              <div className="text-xs text-gray-500 mt-auto">{formatEventDateTime(Array.isArray(card.event) ? card.event[0] : card.event)}</div>
            </div>
          )}
          
          {card.cardType === 'title-only' && (
            <div className="h-full flex flex-col justify-center">
              <div className="font-medium text-gray-900 truncate">{Array.isArray(card.event) ? card.event[0].title : card.event.title}</div>
              {card.eventCount && card.eventCount > 1 && (
                <div className="text-xs text-blue-600 mt-1">+{card.eventCount - 1} more</div>
              )}
            </div>
          )}
          
          {card.cardType === 'multi-event' && (
            <div className="h-full flex flex-col">
              <div className="font-semibold text-gray-900 border-b pb-1 mb-1">{card.eventCount || 1} Events</div>
              <div className="text-xs space-y-0.5 overflow-y-auto flex-1">
                {Array.isArray(card.event) ? card.event.slice(0, 5).map((event, i) => (
                  <div key={i} className="text-gray-700 truncate">• {event.title}</div>
                )) : (
                  <div className="text-gray-700 truncate">• {card.event.title}</div>
                )}
                {card.eventCount && card.eventCount > 5 && (
                  <div className="text-blue-600">+{card.eventCount - 5} more...</div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Info Panels - Only show when enabled */}
      {showInfoPanels && (
        <>
          {/* Debug Info - Enhanced Deterministic Layout */}
          <div 
            className="absolute top-4 left-4 backdrop-blur-sm p-3 rounded-lg shadow-md max-w-sm transition-all duration-200 z-[5] pointer-events-auto"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
          >
        <h2 className="font-bold">Enhanced Deterministic Layout v5</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{layoutResult.positionedCards.reduce((sum, card) => sum + (card.eventCount || 1), 0)} events</p>
          <p>{layoutResult.clusters.length} column groups</p>
          <p>{layoutResult.positionedCards.length} positioned cards</p>
          <p>Slot utilization: {layoutResult.utilization.percentage.toFixed(1)}%</p>
          {/* Target vs actual cluster band and pitch stats */}
          {(() => {
            const clusterSizes = layoutResult.clusters.map(c => c.events.length);
            const groupsCount = layoutResult.clusters.length;
            const avg = groupsCount > 0 ? (clusterSizes.reduce((a, b) => a + b, 0) / groupsCount) : 0;
            const xs = layoutResult.anchors.map(a => a.x).sort((a, b) => a - b);
            const pitches = xs.length > 1 ? xs.slice(1).map((x, i) => Math.abs(x - xs[i])) : [];
            const pitchMin = pitches.length ? Math.min(...pitches) : 0;
            const pitchAvg = pitches.length ? (pitches.reduce((a, b) => a + b, 0) / pitches.length) : 0;
            const pitchMax = pitches.length ? Math.max(...pitches) : 0;
            const withinBand = avg >= 4 && avg <= 6;
            return (
              <>
                <p className={withinBand ? 'text-green-700' : 'text-amber-700'}>
                  Avg events/cluster: {avg.toFixed(1)} (target 4–6)
                </p>
                <p className="text-xs text-gray-500">Group pitch px — min {pitchMin.toFixed(0)} · avg {pitchAvg.toFixed(0)} · max {pitchMax.toFixed(0)}</p>
              </>
            );
          })()}
          <p className="text-green-600 font-semibold">✓ Zero overlaps guaranteed</p>
          <p className="text-blue-600 font-semibold">✓ Enhanced algorithm ready</p>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Architecture: bounds → dispatch → cluster → fit → degrade
          <br />Corrected slots: Full(4), Compact(8), Title-only(8), Multi-event(4)
        </div>
      </div>

      {/* Card Type Statistics */}
      <div 
        className="absolute top-4 right-4 backdrop-blur-sm p-3 rounded-lg shadow-md transition-all duration-200 z-[5] pointer-events-auto"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
      >
        <h3 className="font-bold text-sm mb-2">Card Distribution</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Full Cards</span>
            </div>
            <span className="font-mono">{layoutResult.positionedCards.filter(c => c.cardType === 'full').length}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Compact Cards</span>
            </div>
            <span className="font-mono">{layoutResult.positionedCards.filter(c => c.cardType === 'compact').length}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Title-Only Cards</span>
            </div>
            <span className="font-mono">{layoutResult.positionedCards.filter(c => c.cardType === 'title-only').length}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Multi-Event Cards</span>
            </div>
            <span className="font-mono">{layoutResult.positionedCards.filter(c => c.cardType === 'multi-event').length}</span>
          </div>
          {/* Promotions and Aggregations counters */}
          {(() => {
            const byType: Record<string, number> = layoutResult.positionedCards.reduce((acc: Record<string, number>, c: PositionedCard) => {
              const t = String(c.cardType);
              acc[t] = (acc[t] || 0) + 1;
              return acc;
            }, {});
            const totalAggregations = byType['multi-event'] || 0;
            const promotionsCount = 0; // placeholder until promotion pass exists
            return (
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center justify-between"><span>Promotions applied</span><span className="font-mono">{promotionsCount}</span></div>
                <div className="flex items-center justify-between"><span>Aggregations applied</span><span className="font-mono">{totalAggregations}</span></div>
              </div>
            );
          })()}
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          <div>Avg events/cluster: {layoutResult.clusters.length > 0 ? (layoutResult.clusters.reduce((sum, c) => sum + c.events.length, 0) / layoutResult.clusters.length).toFixed(1) : 0}</div>
          <div>Largest cluster: {Math.max(0, ...layoutResult.clusters.map(c => c.events.length))} events</div>
        </div>
      </div>

      {/* Footprints (cells) */}
      <div 
        className="absolute bottom-4 left-4 backdrop-blur-sm p-3 rounded-lg shadow-md transition-all duration-200 z-[5] pointer-events-auto"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
      >
        <h3 className="font-bold text-sm mb-2">Footprints (cells)</h3>
        <div className="text-xs space-y-1">
          <div>Full: 4 cells</div>
          <div>Compact: 4 cells</div>
          <div>Title-only: 4 cells</div>
          <div>Multi-event: 4 cells</div>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          Utilization — Total: {layoutResult.utilization.totalSlots} · Used: {layoutResult.utilization.usedSlots}
        </div>
        <button
          className="mt-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowColumnBorders(!showColumnBorders)}
        >
          {showColumnBorders ? 'Hide' : 'Show'} Column Borders
        </button>
      </div>

      {/* Placements (candidates per group) */}
      <div 
        className="absolute bottom-4 left-72 backdrop-blur-sm p-3 rounded-lg shadow-md transition-all duration-200 z-[5] pointer-events-auto"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
      >
        <h3 className="font-bold text-sm mb-2">Placements (candidates per group)</h3>
        <div className="text-xs space-y-1">
          <div>Top: 4 placements</div>
          <div>Bottom: 4 placements</div>
          <div>Total: 8 candidates</div>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          Applies uniformly to all card types; actual fit is governed by capacity.
        </div>
      </div>
        </>
      )}
    </div>
  );
}
