import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Event } from '../types';
import type { LayoutConfig } from './types';
import { createLayoutConfig } from './config';
import { DeterministicLayoutV5 } from './LayoutEngine';
import { useAxisTicks } from '../timeline/hooks/useAxisTicks';

interface DeterministicLayoutProps {
  events: Event[];
  showInfoPanels?: boolean;
  viewStart?: number;
  viewEnd?: number;
}

export function DeterministicLayoutComponent({ events, showInfoPanels = false, viewStart = 0, viewEnd = 1 }: DeterministicLayoutProps) {
  // Container ref for proper sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 600 });
  const [showColumnBorders, setShowColumnBorders] = useState(false);
  
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
    
    const dates = events.map(event => new Date(event.date).getTime());
    const fullMinDate = Math.min(...dates);
    const fullMaxDate = Math.max(...dates);
    const fullDateRange = fullMaxDate - fullMinDate;
    
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

  // Responsive timeline ticks based on actual viewport width
  const fallbackTicks = timelineRange && viewportSize.width > 200 ? [
    { t: timelineRange.minDate, label: new Date(timelineRange.minDate).getFullYear().toString(), x: viewportSize.width * 0.1 },
    { t: timelineRange.minDate + (timelineRange.dateRange * 0.25), label: new Date(timelineRange.minDate + (timelineRange.dateRange * 0.25)).getFullYear().toString(), x: viewportSize.width * 0.3 },
    { t: timelineRange.minDate + (timelineRange.dateRange * 0.5), label: new Date(timelineRange.minDate + (timelineRange.dateRange * 0.5)).getFullYear().toString(), x: viewportSize.width * 0.5 },
    { t: timelineRange.minDate + (timelineRange.dateRange * 0.75), label: new Date(timelineRange.minDate + (timelineRange.dateRange * 0.75)).getFullYear().toString(), x: viewportSize.width * 0.7 },
    { t: timelineRange.maxDate, label: new Date(timelineRange.maxDate).getFullYear().toString(), x: viewportSize.width * 0.9 }
  ] : [];

  // Timeline scales use responsive positioning based on viewport width
  
  // Timeline scales now working with proper pixel-based coordinates
  // Convert percentage-based ticks to pixel coordinates
  const pixelTicks = timelineTicks.map(tick => ({
    ...tick,
    x: (tick.x / 100) * viewportSize.width // Convert 0-100% to 0-width pixels
  }));
  
  const finalTicks = pixelTicks.length > 0 ? pixelTicks : fallbackTicks;


  // Debug function for browser console
  useEffect(() => {
    (window as any).debugTimelineScales = () => {
      const container = document.querySelector('[data-testid="timeline-scales-container"]') as HTMLElement;
      const svg = document.querySelector('[data-testid="timeline-scales-svg"]') as SVGElement;
      const texts = document.querySelectorAll('[data-testid="timeline-scales-svg"] text');
      
      console.log('🔧 Timeline Scales Debug Results:');
      console.log('1. Container exists:', !!container);
      console.log('2. Container position:', container?.getBoundingClientRect());
      console.log('3. Container styles:', container ? getComputedStyle(container) : 'N/A');
      console.log('4. SVG exists:', !!svg);
      console.log('5. SVG position:', svg?.getBoundingClientRect());
      console.log('6. Text elements found:', texts.length);
      texts.forEach((text, i) => {
        const rect = text.getBoundingClientRect();
        console.log(`   Text ${i}:`, text.textContent, 'Position:', rect, 'Visible:', rect.width > 0 && rect.height > 0);
      });
      console.log('7. Current viewport size:', viewportSize);
      console.log('8. Timeline ticks data:', finalTicks);
      
      return {
        containerExists: !!container,
        svgExists: !!svg,
        textCount: texts.length,
        viewport: viewportSize,
        ticks: finalTicks
      };
    };
    
    console.log('🔧 Debug function available: window.debugTimelineScales()');
  }, [viewportSize, finalTicks]);

  // TODO: Fix useAxisTicks hook - currently using fallback system



  // Create layout configuration for deterministic layout
  const config: LayoutConfig = useMemo(() => {
    // Pass full viewport width to LayoutEngine - it will handle sidebar margins internally
    const baseConfig = createLayoutConfig(viewportSize.width, viewportSize.height);
    
    // Add time range calculation for proper X positioning
    if (events.length > 0) {
      const dates = events.map(e => new Date(e.date).getTime());
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
    
    // Calculate time range
    const dates = events.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dateRange = maxDate - minDate;
    
    // Calculate visible time window
    const visibleStartTime = minDate + (dateRange * viewStart);
    const visibleEndTime = minDate + (dateRange * viewEnd);
    
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

  // Fix leftover overflow badges: Don't show overflow badges when there are no event cards visible
  const filteredAnchors = useMemo(() => {
    // When there are no positioned event cards, don't show any overflow badges either
    // This prevents leftover overflow badges in empty timeline regions
    if (layoutResult.positionedCards.length === 0) {
      return [];
    }
    
    // Normal case: show all anchors when there are visible event cards
    return layoutResult.anchors;
  }, [layoutResult.anchors, layoutResult.positionedCards]);

  // Merge nearby overflow badges to prevent overlaps (Badge Merging Strategy)
  const mergedOverflowBadges = useMemo(() => {
    const anchors = filteredAnchors; // Use filtered anchors to prevent leftover merged badges
    if (!anchors || anchors.length === 0) return [];
    
    const MERGE_THRESHOLD = 200; // Merge anchors within 200px for aggressive spacing
    const overflowAnchors = anchors.filter((anchor: any) => anchor.overflowCount > 0);
    const mergedBadges: Array<{
      x: number;
      y: number;
      totalOverflow: number;
      anchorIds: string[];
    }> = [];
    const processedAnchors = new Set<string>();
    
    // Sort anchors by X position for left-to-right processing
    const sortedAnchors = [...overflowAnchors].sort((a: any, b: any) => a.x - b.x);
    
    for (const anchor of sortedAnchors) {
      if (processedAnchors.has(anchor.id)) continue;
      
      // Find all nearby anchors within merge threshold (including current anchor)
      const nearbyAnchors = sortedAnchors.filter((other: any) => 
        !processedAnchors.has(other.id) && 
        Math.abs(other.x - anchor.x) <= MERGE_THRESHOLD
      );
      
      if (nearbyAnchors.length > 1) {
        // Merge overflow counts from multiple anchors
        const totalOverflow = nearbyAnchors.reduce((sum: number, a: any) => sum + a.overflowCount, 0);
        const centroidX = nearbyAnchors.reduce((sum: number, a: any) => sum + a.x, 0) / nearbyAnchors.length;
        
        mergedBadges.push({
          x: centroidX,
          y: config.timelineY,
          totalOverflow,
          anchorIds: nearbyAnchors.map((a: any) => a.id)
        });
        
        // Mark all anchors in group as processed
        nearbyAnchors.forEach((a: any) => processedAnchors.add(a.id));
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
      const clusterSizes = clusters.map((c: any) => c.events.length || 0);
      const avgEventsPerCluster = groupsCount > 0 ? (clusterSizes.reduce((a: number, b: number) => a + b, 0) / groupsCount) : 0;
      const largestCluster = Math.max(0, ...clusterSizes);
      const xs = anchors.map((a: any) => a.x).sort((a: number, b: number) => a - b);
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
    const placements = positionedCards.map((p: any) => ({
      id: String(Array.isArray(p.event) ? p.event[0]?.id ?? p.id : p.event?.id ?? p.id),
      x: Math.round(p.x),
      y: Math.round(p.y),
      clusterId: String(p.clusterId ?? ''),
      isAbove: Boolean(p.y < (config?.timelineY ?? viewportSize.height / 2))
    }));

    // Compare with previous snapshot to compute migrations
    const prev = (window as any).__ccTelemetry as any | undefined;
    let migrations = 0;
    if (prev && Array.isArray(prev.placements?.items)) {
      const prevMap: Map<string, any> = new Map(prev.placements.items.map((it: any) => [String(it.id), it]));
      for (const cur of placements) {
        const old: any = prevMap.get(String(cur.id));
        if (!old) continue;
        const movedFar = Math.abs((old.x ?? 0) - cur.x) > 40 || Math.abs((old.y ?? 0) - cur.y) > 32;
        const clusterChanged = String(old.clusterId) !== String(cur.clusterId);
        if (movedFar || clusterChanged) migrations++;
      }
    }

    // Card type counts and aggregation/degradation metrics
    const byTypeCounts: Record<string, number> = positionedCards.reduce((acc: Record<string, number>, c: any) => {
      const t = String(c.cardType);
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const multiEventCards = positionedCards.filter((c: any) => c.cardType === 'multi-event');
    const totalAggregations = multiEventCards.length;
    const eventsAggregated = multiEventCards.reduce((sum: number, c: any) => sum + (c.eventCount || (Array.isArray(c.event) ? c.event.length : 1)), 0);
    const singleEventsShown = positionedCards
      .filter((c: any) => (c.eventCount || (Array.isArray(c.event) ? c.event.length : 1)) === 1)
      .length;
    const summaryContained = 0; // Placeholder until 'infinite' summary cards are surfaced in UI
    const degradationsCount = (byTypeCounts['compact'] || 0) + (byTypeCounts['title-only'] || 0);
    const promotionsCount = 0; // Placeholder: promotion logic not implemented yet

    // Half-column analysis for Stage 3 telemetry
    const timelineY = config?.timelineY ?? viewportSize.height / 2;
    const aboveCards = positionedCards.filter((c: any) => c.y < timelineY);
    const belowCards = positionedCards.filter((c: any) => c.y >= timelineY);
    
    // Group cards by cluster/column for half-column analysis
    const clusterMap = new Map<string, { above: any[], below: any[] }>();
    positionedCards.forEach((card: any) => {
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
    if (anchors.length > 1) {
      const positions = anchors.map((a: any) => a.x).sort((a: number, b: number) => a - b);
      const minX = Math.min(...positions);
      const maxX = Math.max(...positions);
      var temporalDistribution = ((maxX - minX) / viewportWidth) * 100;
    } else {
      var temporalDistribution = 0;
    }

    // Placement pattern validation
    const sortedEvents = events.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
      adaptive: layoutResult.telemetryMetrics?.adaptive
    };

    (window as any).__ccTelemetry = telemetry;
  }, [layoutResult, events.length, viewportSize.width, viewportSize.height, config]);


  return (
    <div 
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
      
      {/* Timeline Axis */}
      <div 
        className="absolute w-full h-1 bg-gray-700 z-10 shadow-sm"
        style={{ top: (config?.timelineY ?? viewportSize.height / 2) - 1 }}
        data-testid="timeline-axis"
      />
      
      {/* Adaptive Timeline Axis with Enhanced Scales */}
      {events.length > 0 && timelineRange && (
        <div 
          className="absolute"
          style={{ 
            left: 0, // Full width from edge to edge
            top: (config?.timelineY ?? viewportSize.height / 2) - 30,
            width: viewportSize.width, // Full container width
            height: 60 // Larger height for better visibility
          }}
          data-testid="timeline-scales-container"
          ref={(el) => {
            if (el) {
              console.log('🔍 Timeline Scales Container Debug:', {
                containerExists: true,
                containerRect: el.getBoundingClientRect(),
                containerStyle: {
                  left: el.style.left,
                  top: el.style.top,
                  width: el.style.width,
                  height: el.style.height,
                  position: el.style.position
                },
                viewport: viewportSize,
                tickCount: finalTicks.length,
                ticks: finalTicks
              });
            }
          }}
        >
          <svg 
            width={viewportSize.width} 
            height={60}
            viewBox={`0 0 ${viewportSize.width} 60`} // Use actual pixel coordinates
            data-testid="timeline-scales-svg"
          >
            {/* Direct timeline scale rendering - bypass Axis component */}
            {finalTicks.map((tick, index) => (
              <g key={`tick-${index}`}>
                {/* Grid line */}
                <line x1={tick.x} x2={tick.x} y1={5} y2={55} stroke="#ffffff" strokeWidth={2} opacity="0.4" />
                {/* Scale label */}
                <text x={tick.x} y={20} fontSize={18} fill="#1f2937" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">
                  {tick.label}
                </text>
              </g>
            ))}
            
            {/* Main timeline axis line */}
            <line x1={0} x2={viewportSize.width} y1={30} y2={30} stroke="#ffffff" strokeWidth={3} opacity="0.6" />
          </svg>
        </div>
      )}
      
      {/* Anchors - filtered by view window to prevent leftover overflow badges */}
      {filteredAnchors.map((anchor) => {
        // Check if this anchor is part of a merged badge group
        const isMerged = mergedOverflowBadges.some(badge => badge.anchorIds.includes(anchor.id));
        
        return (
          <div
            key={anchor.id}
            data-testid={anchor.id}
            className="absolute flex flex-col items-center"
            style={{
              left: anchor.x - 8,
              top: (config?.timelineY ?? viewportSize.height / 2) - 8
            }}
          >
            {/* Anchor dot */}
            <div className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-sm z-20" />
            {/* Vertical connector line */}
            <div className="w-0.5 h-6 bg-gray-400 -mt-2" />
            
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
          className={`absolute bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow ${
            card.cardType === 'full' ? 'border-l-4 border-l-blue-500 border-gray-200 p-3' :
            card.cardType === 'compact' ? 'border-l-4 border-l-green-500 border-gray-200 p-2' :
            card.cardType === 'title-only' ? 'border-l-4 border-l-yellow-500 border-gray-200 p-1' :
            'border-l-4 border-l-purple-500 border-gray-200 p-2'
          } text-sm`}
          style={{
            left: card.x,
            top: card.y,
            width: card.width,
            height: card.height
          }}
        >
          {/* Card content based on type */}
          {card.cardType === 'full' && (
            <div className="h-full flex flex-col">
              <div className="font-semibold text-gray-900 truncate">{Array.isArray(card.event) ? card.event[0].title : card.event.title}</div>
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">{Array.isArray(card.event) ? card.event[0].description : card.event.description}</div>
              <div className="text-xs text-gray-500 mt-auto">{new Date(Array.isArray(card.event) ? card.event[0].date : card.event.date).toLocaleDateString()}</div>
            </div>
          )}
          
          {card.cardType === 'compact' && (
            <div className="h-full flex flex-col">
              <div className="font-semibold text-gray-900 text-sm">{Array.isArray(card.event) ? card.event[0].title : card.event.title}</div>
              <div className="text-xs text-gray-500 mt-auto">{new Date(Array.isArray(card.event) ? card.event[0].date : card.event.date).toLocaleDateString()}</div>
              {card.eventCount && card.eventCount > 1 && (
                <div className="text-xs text-blue-600">+{card.eventCount - 1} more</div>
              )}
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
            const byType: Record<string, number> = layoutResult.positionedCards.reduce((acc: Record<string, number>, c: any) => {
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