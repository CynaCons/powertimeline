import { useState } from 'react';

// Simple test component to verify the slot-based concept works
export function SimpleSlotTest() {
  const [events] = useState([
    { id: '1', date: '2024-01-15', title: 'Event 1', description: 'First event' },
    { id: '2', date: '2024-01-20', title: 'Event 2', description: 'Second event' },
    { id: '3', date: '2024-01-25', title: 'Event 3', description: 'Third event' }
  ]);

  // Simple slot layout calculation
  const viewportWidth = 1200;
  const viewportHeight = 600;
  const timelineY = viewportHeight / 2;
  
  // Position events in simple slots
  const cards = events.map((event, index) => {
    const x = (index + 1) * (viewportWidth / (events.length + 1));
    const y = timelineY + (index % 2 === 0 ? -80 : 80); // Alternate above/below
    
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