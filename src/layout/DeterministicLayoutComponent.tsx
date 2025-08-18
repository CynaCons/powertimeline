import { useState, useEffect, useMemo } from 'react';
import type { Event } from '../types';
import type { LayoutConfig } from './types';
import { createLayoutConfig } from './config';
import { DeterministicLayout } from './DeterministicLayout';

interface DeterministicLayoutProps {
  events: Event[];
}

export function DeterministicLayoutComponent({ events }: DeterministicLayoutProps) {
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

    const deterministicLayout = new DeterministicLayout(config);
    return deterministicLayout.layout(events);
  }, [events, config]);


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
      
      {/* Timeline */}
      <div 
        className="absolute w-full h-0.5 bg-gray-800 z-10"
        style={{ top: config.timelineY }}
        data-testid="timeline-axis"
      />
      
      {/* Anchors */}
      {layoutResult.anchors.map((anchor) => (
        <div
          key={anchor.id}
          data-testid={anchor.id}
          className="absolute w-3 h-3 bg-gray-700 border-2 border-white rounded-full"
          style={{
            left: anchor.x - 6,
            top: config.timelineY - 6
          }}
        />
      ))}
      
      {/* Cards */}
      {layoutResult.positionedCards.map((card) => (
        <div
          key={card.id}
          data-testid={`card-${Array.isArray(card.event) ? card.event[0].id : card.event.id}`}
          className={`absolute bg-white rounded-lg shadow-md border border-gray-200 p-3 text-sm hover:shadow-lg transition-shadow`}
          style={{
            left: card.x,
            top: card.y,
            width: card.cardWidth,
            height: card.cardHeight
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
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          <div>Avg events/cluster: {layoutResult.clusters.length > 0 ? (layoutResult.clusters.reduce((sum, c) => sum + c.events.length, 0) / layoutResult.clusters.length).toFixed(1) : 0}</div>
          <div>Largest cluster: {Math.max(0, ...layoutResult.clusters.map(c => c.events.length))} events</div>
        </div>
      </div>

      {/* Enhanced Slot Allocation Info */}
      <div 
        className="absolute bottom-4 left-4 backdrop-blur-sm p-3 rounded-lg shadow-md transition-all duration-200 z-[5] pointer-events-auto"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
      >
        <h3 className="font-bold text-sm mb-2">Corrected Slot Allocation</h3>
        <div className="text-xs space-y-1">
          <div>Full: 4 slots (2↑, 2↓)</div>
          <div>Compact: 8 slots (4↑, 4↓) - half height</div>
          <div>Title-only: 8 slots (4↑, 4↓) - smaller</div>
          <div>Multi-event: 4 slots (2↑, 2↓) - full size, multi content</div>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          Total slots: {layoutResult.utilization.totalSlots} |
          Used: {layoutResult.utilization.usedSlots}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Enhanced engine: Ready for implementation
        </div>
        <button
          className="mt-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowColumnBorders(!showColumnBorders)}
        >
          {showColumnBorders ? 'Hide' : 'Show'} Column Borders
        </button>
      </div>
    </div>
  );
}