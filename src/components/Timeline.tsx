import React from 'react';
import type { Event } from '../types';
import { Node } from '../timeline/Node/Node';

interface Props {
  events: Event[];
  onSelect?: (id: string) => void;
  selectedId?: string;
  onDragDate?: (id: string, newISODate: string) => void;
  viewStart?: number;
  viewEnd?: number;
  onViewWindowChange?: (start: number, end: number) => void;
  onInlineEdit?: (id: string, updates: { title: string; description?: string }) => void;
  onCreateAt?: (isoDate: string) => void;
  onDragState?: (dragging: boolean) => void;
  onAnnounce?: (msg: string) => void;
  devEnabled?: boolean;
}

const Timeline: React.FC<Props> = ({ 
  events,
  onSelect,
  selectedId 
}) => {
  // Iteration 3: Add collision detection and vertical layering
  
  // Calculate card dimensions first
  const cardWidth = events.length > 20 ? 200 : 256; // Smaller cards for dense datasets
  const cardHeight = events.length > 20 ? 100 : 120; // Smaller cards for dense datasets
  
  // Calculate timeline dimensions dynamically based on container
  // Use full available width and height to fit within viewport
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 56 : 1200; // Account for 56px sidebar
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight - 20 : 700; // Minimal margin since bottom bar is now overlay
  
  // Calculate grid-based layout system
  // Grid should adapt to event count and provide functional slots
  const minGridCols = Math.max(8, Math.ceil(Math.sqrt(events.length * 2))); // Minimum columns based on event density
  const maxGridCols = Math.min(20, Math.floor(containerWidth / (cardWidth + 20))); // Maximum columns that fit
  const gridCols = Math.min(maxGridCols, minGridCols);
  
  const minGridRows = Math.max(4, Math.ceil(events.length / gridCols)); // Enough rows for all events
  const maxGridRows = Math.floor(containerHeight / (cardHeight + 20)); // Maximum rows that fit
  const gridRows = Math.min(maxGridRows, minGridRows);
  
  // Calculate cell dimensions
  const cellWidth = Math.floor(containerWidth / gridCols);
  const cellHeight = Math.floor(containerHeight / gridRows);
  
  // Timeline position within grid (center row)
  const timelineRowIndex = Math.floor(gridRows / 2);
  const timelineY = timelineRowIndex * cellHeight + cellHeight / 2;
  
  const timelineRect = { 
    width: containerWidth - cardWidth, // Leave space for cards at edges
    height: containerHeight, 
    left: cardWidth/2, // Start position accounting for card width
    top: timelineY 
  };
  
  // Sort events by date and calculate positions
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate actual date range for proper timeline scaling
  let minDate = new Date('2050-01-01').getTime();
  let maxDate = new Date('1900-01-01').getTime();
  
  if (sortedEvents.length > 0) {
    minDate = Math.min(...sortedEvents.map(e => new Date(e.date).getTime()));
    maxDate = Math.max(...sortedEvents.map(e => new Date(e.date).getTime()));
  }
  
  const dateRange = maxDate - minDate;
  
  // Grid-slot-based positioning - each card gets one grid slot
  const occupiedSlots = new Set<string>(); // Track occupied grid slots
  
  const eventPositions = sortedEvents.map((event, index) => {
    // Calculate chronological position for anchor
    let anchorX;
    if (dateRange > 0) {
      const eventDate = new Date(event.date).getTime();
      const dateProgress = (eventDate - minDate) / dateRange;
      anchorX = timelineRect.left + dateProgress * timelineRect.width;
    } else {
      anchorX = timelineRect.left + (index / Math.max(1, sortedEvents.length - 1)) * timelineRect.width;
    }
    
    // Find preferred column based on chronological position
    const preferredCol = Math.floor((anchorX / containerWidth) * gridCols);
    
    return {
      ...event,
      anchorX,
      anchorY: timelineY,
      preferredCol: Math.max(0, Math.min(gridCols - 1, preferredCol)),
      index
    };
  });

  // Grid-slot assignment - one card per slot, no overlaps
  const positionedEvents: any[] = [];
  
  eventPositions.forEach((event) => {
    const { anchorX, anchorY, preferredCol } = event;
    
    // Find the best available slot near the preferred column
    let bestSlot = null;
    let minDistance = Infinity;
    
    // Search for available slots, starting from preferred column
    for (let colOffset = 0; colOffset < gridCols; colOffset++) {
      for (const colDirection of [0, -1, 1]) { // Try preferred col first, then left, then right
        const col = preferredCol + (colDirection * colOffset);
        if (col < 0 || col >= gridCols) continue;
        
        // Try rows above and below timeline, alternating for balance
        const rowOffsets = [];
        for (let r = 1; r < Math.ceil(gridRows / 2); r++) {
          rowOffsets.push(-r, r); // Above, then below
        }
        
        for (const rowOffset of rowOffsets) {
          const row = timelineRowIndex + rowOffset;
          if (row < 0 || row >= gridRows) continue;
          if (row === timelineRowIndex) continue; // Skip timeline row
          
          const slotKey = `${col}-${row}`;
          if (!occupiedSlots.has(slotKey)) {
            const distance = Math.abs(col - preferredCol) + Math.abs(row - timelineRowIndex);
            if (distance < minDistance) {
              minDistance = distance;
              bestSlot = { col, row, slotKey };
            }
            if (colOffset === 0) break; // Prefer closest to preferred column
          }
        }
        if (bestSlot && colOffset === 0) break;
      }
      if (bestSlot) break;
    }
    
    if (bestSlot) {
      occupiedSlots.add(bestSlot.slotKey);
      
      // Calculate actual position from grid slot
      const x = bestSlot.col * cellWidth + cellWidth / 2;
      const y = bestSlot.row * cellHeight + cellHeight / 2;
      
      positionedEvents.push({
        ...event,
        x,
        y,
        gridCol: bestSlot.col,
        gridRow: bestSlot.row,
        slotKey: bestSlot.slotKey
      });
    }
  });
  
  return (
    <div className="w-full h-full bg-gray-50 relative">
      {/* Functional grid - shows actual card slots */}
      <div className="absolute inset-0">
        {Array.from({ length: gridRows }).map((_, row) => 
          Array.from({ length: gridCols }).map((_, col) => {
            const slotKey = `${col}-${row}`;
            const isOccupied = occupiedSlots.has(slotKey);
            const isTimelineRow = row === timelineRowIndex;
            
            return (
              <div
                key={slotKey}
                className={`absolute border ${
                  isTimelineRow 
                    ? 'border-gray-400 bg-gray-100' 
                    : isOccupied 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-transparent'
                }`}
                style={{
                  left: col * cellWidth,
                  top: row * cellHeight,
                  width: cellWidth,
                  height: cellHeight,
                }}
              />
            );
          })
        )}
      </div>
      
      {/* Horizontal timeline in center */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-0.5 bg-gray-600" />
      </div>
      
      {/* Timeline anchors - dark grey squares on the timeline */}
      {positionedEvents.map((event) => (
        <div
          key={`anchor-${event.id}`}
          className="absolute w-3 h-3 bg-gray-700"
          style={{
            left: `${event.anchorX}px`,
            top: `${event.anchorY}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
      
      {/* Event cards */}
      {positionedEvents.map((event) => (
        <Node
          key={event.id}
          id={event.id}
          title={event.title}
          description={event.description}
          date={event.date}
          x={event.x}
          y={event.y}
          isSelected={selectedId === event.id}
          onSelect={onSelect}
          compact={events.length > 20}
        />
      ))}
      
      {/* Connector lines from anchors to cards */}
      <svg className="absolute inset-0 pointer-events-none">
        {positionedEvents.map((event) => (
          <line
            key={`connector-${event.id}`}
            x1={event.anchorX}
            y1={event.anchorY}
            x2={event.x}
            y2={event.y}
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeDasharray="none"
            opacity={0.7}
          />
        ))}
      </svg>
    </div>
  );
};

export default Timeline;