import React from 'react';
import type { Anchor } from './types';

interface AnchorBadgeProps {
  anchor: Anchor;
  showBadge?: boolean;
  onClick?: (anchor: Anchor) => void;
}

export function AnchorBadge({ anchor, showBadge = true, onClick }: AnchorBadgeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(anchor);
  };

  return (
    <g data-testid={`anchor-${anchor.id}`} data-event-count={anchor.eventCount}>
      {/* Anchor square */}
      <rect
        x={anchor.x - 4}
        y={anchor.y - 4}
        width={8}
        height={8}
        fill="#374151"
        stroke="#f3f4f6"
        strokeWidth={1}
        className="cursor-pointer hover:fill-gray-600 transition-colors"
        onClick={handleClick}
      />
      
      {/* Event count badge (only show if > 1 event) */}
      {showBadge && anchor.eventCount > 1 && (
        <g>
          {/* Badge circle */}
          <circle
            cx={anchor.x + 6}
            cy={anchor.y - 6}
            r={8}
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth={1}
            className="cursor-pointer"
            onClick={handleClick}
          />
          
          {/* Badge text */}
          <text
            x={anchor.x + 6}
            y={anchor.y - 6}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill="white"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            {anchor.eventCount > 99 ? '99+' : anchor.eventCount}
          </text>
        </g>
      )}
    </g>
  );
}

export function AnchorBadgeHtml({ anchor, showBadge = true, onClick }: AnchorBadgeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(anchor);
  };

  return (
    <div
      data-testid={`anchor-${anchor.id}`}
      data-event-count={anchor.eventCount}
      className="absolute cursor-pointer"
      style={{
        left: anchor.x - 4,
        top: anchor.y - 4,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={handleClick}
    >
      {/* Anchor square */}
      <div
        className="w-2 h-2 bg-gray-700 border border-gray-100 hover:bg-gray-600 transition-colors"
        style={{ width: 8, height: 8 }}
      />
      
      {/* Event count badge */}
      {showBadge && anchor.eventCount > 1 && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border border-white rounded-full flex items-center justify-center"
          style={{
            width: 16,
            height: 16,
            fontSize: 10,
            lineHeight: 1
          }}
        >
          <span className="text-white font-bold text-xs leading-none">
            {anchor.eventCount > 99 ? '99+' : anchor.eventCount}
          </span>
        </div>
      )}
    </div>
  );
}