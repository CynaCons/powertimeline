import React, { useState, useEffect, useRef } from 'react';
import type { Event } from '../types';
import { useSlotBasedLayout } from './useSlotBasedLayout';
import { CardRenderer } from './CardRenderer';
import { AnchorBadge } from './AnchorBadge';
import type { PositionedCard, Anchor } from './types';

interface TimelineWithSlotsProps {
  events: Event[];
  className?: string;
}

export function TimelineWithSlots({ events, className = '' }: TimelineWithSlotsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [_hoveredCard, _setHoveredCard] = useState<string | null>(null);

  // Calculate view window from events
  const { viewStart, viewEnd } = React.useMemo(() => {
    if (events.length === 0) {
      return { viewStart: new Date(), viewEnd: new Date() };
    }
    
    const dates = events.map(e => new Date(e.date));
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding (10% on each side)
    const range = end.getTime() - start.getTime();
    const padding = range * 0.1;
    
    return {
      viewStart: new Date(start.getTime() - padding),
      viewEnd: new Date(end.getTime() + padding)
    };
  }, [events]);

  // Use slot-based layout
  const {
    positionedCards,
    anchors,
    isLayouting,
    layoutError,
    layoutStats,
    utilization
  } = useSlotBasedLayout({
    events,
    viewStart,
    viewEnd,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height
  });

  // Update viewport size when container resizes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleCardClick = (card: PositionedCard) => {
    setSelectedCard(selectedCard === card.id ? null : card.id);
  };

  const handleCardDoubleClick = (card: PositionedCard) => {
    console.log('Card double-clicked:', card);
  };

  const handleAnchorClick = (anchor: Anchor) => {
    console.log('Anchor clicked:', anchor);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-gray-50 overflow-hidden ${className}`}
    >
      {/* Timeline line */}
      <div
        className="absolute w-full h-0.5 bg-gray-800"
        style={{ top: viewportSize.height / 2 }}
      />

      {/* Loading overlay */}
      {isLayouting && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-sm text-gray-600">Calculating layout...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {layoutError && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-40">
          <strong>Layout Error:</strong> {layoutError}
        </div>
      )}

      {/* Anchors */}
      {anchors.map(anchor => (
        <div
          key={anchor.id}
          className="absolute"
          style={{
            left: anchor.x,
            top: anchor.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <AnchorBadge
            anchor={anchor}
            onClick={handleAnchorClick}
          />
        </div>
      ))}

      {/* Cards */}
      {positionedCards.map(card => (
        <CardRenderer
          key={card.id}
          card={card}
          isSelected={selectedCard === card.id}
          isHovered={_hoveredCard === card.id}
          onClick={handleCardClick}
          onDoubleClick={handleCardDoubleClick}
        />
      ))}

      {/* Debug HUD */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-xs font-mono">
        <div><strong>Events:</strong> {events.length}</div>
        <div><strong>Cards:</strong> {positionedCards.length}</div>
        <div><strong>Clusters:</strong> {anchors.length}</div>
        <div><strong>Utilization:</strong> {utilization.percentage.toFixed(1)}%</div>
        {layoutStats && (
          <>
            <div><strong>Card Types:</strong></div>
            {Object.entries(layoutStats.degradationStats.cardTypeCounts).map(([type, count]) => (
              <div key={type} className="ml-2">
                {type}: {String(count)}
              </div>
            ))}
            {layoutStats.hasOverlaps && (
              <div className="text-red-600 font-bold">⚠ Overlaps detected</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}