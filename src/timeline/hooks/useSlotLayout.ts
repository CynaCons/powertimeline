import { useMemo } from 'react';

export interface SlotPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slotRow: number;
  slotCol: number;
  above: boolean;
}

export interface SlotGrid {
  slotsAbove: number;
  slotsBelow: number;
  slotHeight: number;
  slotWidth: number;
  columns: number;
  positions: Map<string, SlotPosition>;
}

export interface UseSlotLayoutOptions {
  devMode?: boolean;
  densityCount?: number; // number of events in view, to scale rows
  maxColumns?: number;
  horizontalGap?: number; // gap inside each slot to avoid edge-to-edge touching
}

// Creates a slot-based layout system to prevent overlaps
export function useSlotLayout(
  events: { id: string; x: number; cardW: number; cardH: number }[],
  options?: UseSlotLayoutOptions
): SlotGrid {
  return useMemo(() => {
    const positions = new Map<string, SlotPosition>();
    const densityCount = options?.densityCount;
    const maxColumns = options?.maxColumns ?? 16;
    const gapX = Math.max(0, options?.horizontalGap ?? 0.5);

    if (events.length === 0) {
      return {
        slotsAbove: 0,
        slotsBelow: 0,
        slotHeight: 0,
        slotWidth: 0,
        columns: 0,
        positions
      };
    }

    // SVG viewBox dimensions - Expanded but compatible with Axis
    const svgHeight = 40; // Doubled from 20 to 40 for more vertical space while keeping Axis at Y=10 reasonable
    const svgWidth = 100;
    const timelineY = 20; // Center timeline in expanded 40-unit viewBox
    const margin = 1;

    // SIMPLIFIED: Fixed 3x3 grid
    const slotsAbove = 3;
    const slotsBelow = 3; 
    const columns = 3;

    // Calculate slot dimensions - FIXED: Use much more of the available SVG space
    const availableAbove = timelineY - 0.5; // Reduce margin to use more space
    const availableBelow = svgHeight - timelineY - 0.5; // Reduce margin to use more space

    const slotHeightAbove = availableAbove / Math.max(1, slotsAbove);
    const slotHeightBelow = availableBelow / Math.max(1, slotsBelow);
    const slotWidth = svgWidth / columns;

    // Create slot occupancy grid
    const occupiedSlots = new Set<string>();

    // Sort events by x position for left-to-right allocation
    const sortedEvents = [...events].sort((a, b) => a.x - b.x);

    for (const event of sortedEvents) {
      let assigned = false;

      // Find the nearest column to the event's x position
      const preferredCol = Math.floor(event.x / slotWidth);
      const clampedCol = Math.max(0, Math.min(columns - 1, preferredCol));

      // DISTRIBUTE events across rows instead of packing them at the timeline
      const searchOrder: Array<{row: number, above: boolean}> = [];

      // Distribute events by using a round-robin approach across all available rows
      const eventIndex = sortedEvents.indexOf(event);
      const totalRows = slotsAbove + slotsBelow;
      const preferredRowIndex = eventIndex % totalRows; // Round-robin distribution
      
      // Create search order starting from the preferred distributed row
      for (let i = 0; i < totalRows; i++) {
        const rowIndex = (preferredRowIndex + i) % totalRows;
        if (rowIndex < slotsAbove) {
          searchOrder.push({ row: rowIndex, above: true });
        } else {
          searchOrder.push({ row: rowIndex - slotsAbove, above: false });
        }
      }

      // Try to place in preferred column first, then expand outward
      for (const { row, above } of searchOrder) {
        for (let colOffset = 0; colOffset < columns; colOffset++) {
          // Try columns: preferred, preferred+1, preferred-1, preferred+2, preferred+2, etc.
          const cols = colOffset === 0 ? [clampedCol] : [
            clampedCol + colOffset,
            clampedCol - colOffset
          ].filter(col => col >= 0 && col < columns);

          for (const col of cols) {
            const slotKey = `${row}-${col}-${above}`;

            if (!occupiedSlots.has(slotKey)) {
              // Found an available slot!
              occupiedSlots.add(slotKey);

              const slotY = above 
                ? margin + 1 + (slotsAbove - 1 - row) * slotHeightAbove
                : timelineY + 1 + row * slotHeightBelow;

              // center within slot, with micro-gap margins
              const innerWidth = Math.max(0, slotWidth - (gapX * 2));
              const centered = (innerWidth - event.cardW) / 2;
              const slotX = (col * slotWidth) + gapX + Math.max(0, centered);

              positions.set(event.id, {
                id: event.id,
                x: Math.max(1, Math.min(svgWidth - event.cardW - 1, slotX)),
                y: Math.max(margin, Math.min(svgHeight - event.cardH - margin, slotY)),
                width: event.cardW,
                height: event.cardH,
                slotRow: row,
                slotCol: col,
                above
              });

              assigned = true;
              break;
            }
          }
          if (assigned) break;
        }
        if (assigned) break;
      }

      // Fallback if no slot available
      if (!assigned) {
        positions.set(event.id, {
          id: event.id,
          x: Math.max(1, Math.min(svgWidth - event.cardW - 1, event.x - event.cardW / 2)),
          y: 2,
          width: event.cardW,
          height: event.cardH,
          slotRow: 0,
          slotCol: 0,
          above: true
        });
      }
    }

    return {
      slotsAbove,
      slotsBelow,
      slotHeight: Math.min(slotHeightAbove, slotHeightBelow),
      slotWidth,
      columns,
      positions,
      svgHeight, // Expose svgHeight for Timeline component
      timelineY  // Expose timeline position
    };
  }, [events, options?.devMode, options?.densityCount, options?.maxColumns, options?.horizontalGap]);
}
