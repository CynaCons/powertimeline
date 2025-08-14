import React from 'react';
import type { SlotGrid } from './hooks/useSlotLayout';

interface SlotGridVisualizerProps {
  slotGrid: SlotGrid;
  visible: boolean;
}

export const SlotGridVisualizer: React.FC<SlotGridVisualizerProps> = ({ slotGrid, visible }) => {
  if (!visible) return null;

  const timelineY = 10;
  const margin = 1;
  const availableAbove = timelineY - margin - 1;
  const availableBelow = 20 - timelineY - margin - 1;
  
  const slotHeightAbove = availableAbove / slotGrid.slotsAbove;
  const slotHeightBelow = availableBelow / slotGrid.slotsBelow;

  const slots: React.ReactElement[] = [];

  // Draw slots above timeline
  for (let row = 0; row < slotGrid.slotsAbove; row++) {
    for (let col = 0; col < slotGrid.columns; col++) {
      const x = col * slotGrid.slotWidth;
      const y = margin + 1 + (slotGrid.slotsAbove - 1 - row) * slotHeightAbove;
      
      slots.push(
        <rect
          key={`above-${row}-${col}`}
          x={x}
          y={y}
          width={slotGrid.slotWidth}
          height={slotHeightAbove}
          fill="none"
          stroke="#00ff00"
          strokeWidth={0.1}
          strokeDasharray="0.5,0.5"
          opacity={0.5}
        />
      );
    }
  }

  // Draw slots below timeline
  for (let row = 0; row < slotGrid.slotsBelow; row++) {
    for (let col = 0; col < slotGrid.columns; col++) {
      const x = col * slotGrid.slotWidth;
      const y = timelineY + 1 + row * slotHeightBelow;
      
      slots.push(
        <rect
          key={`below-${row}-${col}`}
          x={x}
          y={y}
          width={slotGrid.slotWidth}
          height={slotHeightBelow}
          fill="none"
          stroke="#00ff00"
          strokeWidth={0.1}
          strokeDasharray="0.5,0.5"
          opacity={0.5}
        />
      );
    }
  }

  return <g data-testid="slot-grid-visualizer">{slots}</g>;
};
