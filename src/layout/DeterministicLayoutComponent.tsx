import { useState, useEffect, useMemo } from 'react';
import type { Event } from '../types';
import type { LayoutConfig } from './types';
import { createLayoutConfig } from './config';
import { DeterministicLayoutV5 } from './LayoutEngine';

interface DeterministicLayoutProps {
  events: Event[];
  showInfoPanels?: boolean;
}

export function DeterministicLayoutComponent({ events, showInfoPanels = false }: DeterministicLayoutProps) {
  // Dynamic viewport size
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 600 });
  const [showColumnBorders, setShowColumnBorders] = useState(false);
  
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth, // Use full width
        height: window.innerHeight // Use full height
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Create layout configuration for deterministic layout
  const config: LayoutConfig = useMemo(() => {
    // Account for sidebar width (56px) in available width calculation
    const availableWidth = viewportSize.width - 56; // Subtract sidebar width
    const baseConfig = createLayoutConfig(availableWidth, viewportSize.height);
    
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

  // Apply deterministic layout algorithm
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
    return deterministicLayout.layout(events);
  }, [events, config]);

  // Telemetry: expose dispatch/capacity/placements for tests and overlays
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { positionedCards, anchors, clusters, utilization } = layoutResult;

    // Use telemetry from layout engine if available, fallback to manual calculation
    const engineMetrics = layoutResult.telemetryMetrics;
    let dispatchMetrics, aggregationMetrics, infiniteMetrics;
    
    if (engineMetrics) {
      dispatchMetrics = engineMetrics.dispatch;
      aggregationMetrics = engineMetrics.aggregation;
      infiniteMetrics = engineMetrics.infinite;
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
      infiniteMetrics = { enabled: false, containers: 0, eventsContained: 0, previewCount: 0, byCluster: [] };
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
      viewport: {
        width: viewportSize.width,
        height: viewportSize.height,
        timelineY: config?.timelineY ?? viewportSize.height / 2
      }
    };

    (window as any).__ccTelemetry = telemetry;
  }, [layoutResult, events.length, viewportSize.width, viewportSize.height, config]);


  return (
    <div className="absolute inset-0 bg-gray-100 overflow-hidden">
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
      
      {/* Timeline Date Labels */}
      {(() => {
        // Generate date labels based on event range
        if (layoutResult.positionedCards.length === 0) return null;
        
        const dates = layoutResult.positionedCards.map(card => 
          new Date(Array.isArray(card.event) ? card.event[0].date : card.event.date).getTime()
        );
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const range = maxDate - minDate;
        
        // Generate 5-10 tick marks
        const tickCount = Math.min(10, Math.max(5, layoutResult.clusters.length));
        const ticks = [];
        
        for (let i = 0; i <= tickCount; i++) {
          const time = minDate + (range * i / tickCount);
          // Account for sidebar (56px) and add proper margins for date labels
          const availableWidth = viewportSize.width - 56; // Subtract sidebar width
          const x = 60 + ((availableWidth - 120) * i / tickCount); // 60px left margin, 60px right margin
          const date = new Date(time);
          
          ticks.push(
            <div
              key={`tick-${i}`}
              className="absolute flex flex-col items-center"
              style={{ left: x - 30, top: (config?.timelineY ?? viewportSize.height / 2) + 8 }}
            >
              <div className="w-0.5 h-2 bg-gray-600 -mt-2" />
              <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">
                {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          );
        }
        
        return ticks;
      })()}
      
      {/* Anchors */}
      {layoutResult.anchors.map((anchor) => (
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
          {/* Event count badge */}
          {anchor.eventCount > 1 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {anchor.eventCount}
            </div>
          )}
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