import React from 'react';
import type { PositionedCard, CardType } from './types';
import type { Event } from '../types';

interface CardRendererProps {
  card: PositionedCard;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: (card: PositionedCard) => void;
  onDoubleClick?: (card: PositionedCard) => void;
}

export function CardRenderer({ 
  card, 
  isSelected = false, 
  isHovered = false, 
  onClick, 
  onDoubleClick 
}: CardRendererProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(card);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(card);
  };

  return (
    <div
      data-testid="event-card"
      data-event-id={card.id}
      data-card-type={card.cardType}
      data-cluster-id={card.clusterId}
      data-density={card.cardType}
      data-multi={card.isMultiEvent}
      data-summary={card.isSummaryCard}
      className={`
        absolute cursor-pointer transition-all duration-200 ease-in-out
        ${getCardTypeStyles(card.cardType)}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isHovered ? 'shadow-lg scale-105' : 'shadow-md'}
      `}
      style={{
        left: card.x - card.cardWidth / 2,
        top: card.y - card.cardHeight / 2,
        width: card.cardWidth,
        height: card.cardHeight,
        zIndex: isSelected ? 20 : (isHovered ? 15 : 10)
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {renderCardContent(card)}
      
      {/* Connector line to anchor */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: card.cardWidth / 2,
          top: card.cardHeight / 2,
          width: Math.abs(card.anchorX - card.x) + 20,
          height: Math.abs(card.anchorY - card.y) + 20,
          transform: `translate(-50%, -50%)`
        }}
      >
        <line
          x1={0}
          y1={0}
          x2={card.anchorX - card.x}
          y2={card.anchorY - card.y}
          stroke="#9ca3af"
          strokeWidth={1}
          opacity={0.6}
        />
      </svg>
    </div>
  );
}

function getCardTypeStyles(cardType: CardType): string {
  const baseStyles = 'bg-white border rounded-lg overflow-hidden';
  
  switch (cardType) {
    case 'full':
      return `${baseStyles} border-gray-200 p-4`;
    case 'compact':
      return `${baseStyles} border-gray-200 p-3`;
    case 'title-only':
      return `${baseStyles} border-gray-200 p-2`;
    case 'multi-event':
      return `${baseStyles} border-blue-200 bg-blue-50 p-3`;
    case 'infinite':
      return `${baseStyles} border-red-200 bg-red-50 p-2`;
    default:
      return baseStyles;
  }
}

function renderCardContent(card: PositionedCard): React.ReactNode {
  const event = Array.isArray(card.event) ? card.event[0] : card.event;
  
  switch (card.cardType) {
    case 'full':
      return <FullCardContent event={event} />;
    case 'compact':
      return <CompactCardContent event={event} />;
    case 'title-only':
      return <TitleOnlyCardContent event={event} />;
    case 'multi-event':
      return <MultiEventCardContent events={Array.isArray(card.event) ? card.event : [card.event]} />;
    case 'infinite':
      return <InfiniteCardContent count={card.eventCount || 0} />;
    default:
      return <FullCardContent event={event} />;
  }
}

function FullCardContent({ event }: { event: Event }) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">
        {event.title}
      </h3>
      <p className="text-xs text-gray-600 mb-2 flex-1 line-clamp-3">
        {event.description}
      </p>
      <div className="text-xs text-gray-500 font-medium">
        {formatDate(event.date)}
      </div>
    </div>
  );
}

function CompactCardContent({ event }: { event: Event }) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">
        {event.title}
      </h3>
      <p className="text-xs text-gray-600 line-clamp-1 flex-1">
        {event.description}
      </p>
      <div className="text-xs text-gray-500">
        {formatDate(event.date)}
      </div>
    </div>
  );
}

function TitleOnlyCardContent({ event }: { event: Event }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <h3 className="font-bold text-sm text-gray-900 line-clamp-1 mb-1">
        {event.title}
      </h3>
      <div className="text-xs text-gray-500">
        {formatDate(event.date)}
      </div>
    </div>
  );
}

function MultiEventCardContent({ events }: { events: Event[] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-1">
        {events.slice(0, 3).map((event, index) => (
          <div key={event.id} className="text-sm text-gray-900">
            <span className="font-medium">{event.title}</span>
            {index < events.length - 1 && index < 2 && (
              <hr className="my-1 border-gray-200" />
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-blue-600 font-medium mt-1">
        {events.length} events
      </div>
    </div>
  );
}

function InfiniteCardContent({ count }: { count: number }) {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <div className="text-lg font-bold text-red-600">
        {count}
      </div>
      <div className="text-xs text-red-600 font-medium">
        events
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Connector component for drawing lines from cards to anchors
export function CardConnector({ card }: { card: PositionedCard }) {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 5
      }}
    >
      <line
        x1={card.x}
        y1={card.y}
        x2={card.anchorX}
        y2={card.anchorY}
        stroke="#9ca3af"
        strokeWidth={1}
        opacity={0.4}
        className="drop-shadow-sm"
      />
    </svg>
  );
}