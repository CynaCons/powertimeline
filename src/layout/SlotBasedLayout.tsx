import { useState, useEffect, useMemo } from 'react';
import type { Event } from '../types';
import type { LayoutConfig, PositionedCard } from './types';
import { createLayoutConfig } from './config';
import { clusterEvents, calculateDateRange, getClusterSummary } from './EventClustering';
import { SlotGrid } from './SlotGrid';
import { DegradationEngine } from './DegradationEngine';
import { CardRenderer } from './CardRenderer';

interface SlotBasedLayoutProps {
  events: Event[];
}

export function SlotBasedLayout({ events }: SlotBasedLayoutProps) {
  // Dynamic viewport size
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 600 });
  
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth - 56, // Account for sidebar
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Create layout configuration
  const config: LayoutConfig = useMemo(() => 
    createLayoutConfig(viewportSize.width, viewportSize.height),
    [viewportSize.width, viewportSize.height]
  );

  // Calculate date range and clusters
  const { clusters } = useMemo(() => {
    const dateRange = calculateDateRange(events);
    const clusters = clusterEvents(events, config, dateRange);
    return { clusters };
  }, [events, config]);

  // Generate slots and position cards with degradation
  const positionedCards: PositionedCard[] = useMemo(() => {
    if (clusters.length === 0) return [];

    const slotGrid = new SlotGrid(config);
    const degradationEngine = new DegradationEngine(config);
    const allCards: PositionedCard[] = [];

    for (const cluster of clusters) {
      // Generate slots for this cluster's anchor
      const slots = slotGrid.generateSlotsForAnchor(cluster.anchor);
      
      // Use degradation engine to position cluster events
      const clusterCards = degradationEngine.positionClusterWithDegradation(cluster, slots);
      allCards.push(...clusterCards);
    }

    return allCards;
  }, [clusters, config]);

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      {/* Timeline */}
      <div 
        className="absolute w-full h-0.5 bg-gray-800"
        style={{ top: config.timelineY }}
      />
      
      {/* Anchors */}
      {clusters.map((cluster) => (
        <div
          key={`anchor-${cluster.id}`}
          className="absolute w-3 h-3 bg-gray-700 border-2 border-white rounded-full"
          style={{
            left: cluster.anchor.x - 6,
            top: config.timelineY - 6
          }}
        />
      ))}
      
      {/* Cards */}
      {positionedCards.map((card) => (
        <CardRenderer
          key={card.id}
          card={card}
        />
      ))}
      
      {/* Debug Info */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow max-w-sm">
        <h2 className="font-bold">Slot-Based Layout</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{events.length} events</p>
          <p>{getClusterSummary(clusters)}</p>
          <p>{positionedCards.length} positioned cards</p>
          <p>Threshold: {config.clusterThreshold}px</p>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Events are clustered when closer than {config.clusterThreshold}px, then positioned in slots with progressive degradation.
        </div>
      </div>

      {/* Card Type Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded shadow">
        <h3 className="font-bold text-sm mb-2">Card Types</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Full Cards</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Compact Cards</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Title-Only Cards</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Multi-Event Cards</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Infinite Cards</span>
          </div>
        </div>
      </div>
    </div>
  );
}