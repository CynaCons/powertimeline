import { useState, useEffect } from 'react';
import type { Event } from '../types';

interface SimpleSlotTestProps {
  events: Event[];
}

// Simple test component to verify the slot-based concept works
export function SimpleSlotTest({ events }: SimpleSlotTestProps) {

  // Use dynamic viewport size
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

  const timelineY = viewportSize.height / 2;
  
  // Calculate date range for positioning
  const dateRange = events.length > 0 ? (() => {
    const dates = events.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const range = maxDate - minDate || 1; // Avoid division by zero
    return { minDate, maxDate, range };
  })() : { minDate: Date.now(), maxDate: Date.now(), range: 1 };
  
  // Position events based on actual dates
  const cards = events.map((event, index) => {
    // Position based on date within timeline
    const eventTime = new Date(event.date).getTime();
    const timeProgress = (eventTime - dateRange.minDate) / dateRange.range;
    const x = 80 + timeProgress * (viewportSize.width - 160); // 80px margins
    
    // Alternate above/below timeline
    const y = timelineY + (index % 2 === 0 ? -80 : 80);
    
    return {
      ...event,
      x,
      y,
      width: 200,
      height: 60
    };
  });

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      {/* Timeline */}
      <div 
        className="absolute w-full h-0.5 bg-gray-800"
        style={{ top: timelineY }}
      />
      
      {/* Cards */}
      {cards.map((card) => (
        <div
          key={card.id}
          className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-md"
          style={{
            left: card.x - card.width / 2,
            top: card.y - card.height / 2,
            width: card.width,
            height: card.height
          }}
        >
          <h3 className="font-bold text-sm">{card.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{card.description}</p>
          <div className="text-xs text-gray-500 mt-1">{card.date}</div>
          
          {/* Connector line */}
          <svg 
            className="absolute pointer-events-none"
            style={{
              left: card.width / 2,
              top: card.height / 2,
              width: 20,
              height: Math.abs(timelineY - card.y),
              transform: 'translate(-50%, -50%)'
            }}
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={timelineY - card.y}
              stroke="#9ca3af"
              strokeWidth={1}
            />
          </svg>
        </div>
      ))}
      
      {/* Anchors */}
      {cards.map((card) => (
        <div
          key={`anchor-${card.id}`}
          className="absolute w-2 h-2 bg-gray-700 border border-white"
          style={{
            left: card.x - 4,
            top: timelineY - 4
          }}
        />
      ))}
      
      {/* Info */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow">
        <h2 className="font-bold">Simple Slot Layout Test</h2>
        <p className="text-sm text-gray-600">
          {events.length} events positioned in simple slots
        </p>
        <p className="text-xs text-gray-500 mt-2">
          This demonstrates the basic slot-based positioning concept
        </p>
      </div>
    </div>
  );
}