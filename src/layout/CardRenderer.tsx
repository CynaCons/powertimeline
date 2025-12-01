import React from 'react';
import type { PositionedCard, CardType } from './types';
import type { Event } from '../types';
import { getEventIcon } from './cardIcons';

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
  // SRS_DB.md compliant - category field removed, use default gradient
  const gradientClass = getGradientClass(card.cardType);
  const elevationClass = getElevationClass(card.cardType, isSelected, isHovered);
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(card);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(card);
  };

  // Get the event date for data attribute
  const eventDate = card.event.date;

  return (
    <div
      data-testid="event-card"
      data-event-id={card.id}
      data-event-date={eventDate}
      data-card-type={card.cardType}
      data-cluster-id={card.clusterId}
      data-density={card.cardType}
      className={`
        absolute cursor-pointer card-hover-scale card-enter
        ${getCardTypeStyles(card.cardType)}
        ${gradientClass}
        ${elevationClass}
        ${isSelected ? 'card-selected' : ''}
      `}
      style={{
        left: card.x - card.width / 2,
        top: card.y - card.height / 2,
        width: card.width,
        height: card.height,
        zIndex: isSelected ? 20 : (isHovered ? 15 : 10)
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {renderCardContent(card)}
      
      {/* Curved connector line to anchor */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100px',
          transform: `translate(0, ${card.height}px)`,
          overflow: 'visible'
        }}
      >
        <defs>
          <linearGradient id={`connector-gradient-${card.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary-400)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--color-primary-500)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity="0.3" />
          </linearGradient>
          {isSelected && (
            <filter id={`connector-glow-${card.id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        <path
          d={generateConnectorPath(card)}
          stroke={`url(#connector-gradient-${card.id})`}
          strokeWidth={isSelected ? 2.5 : 1.5}
          fill="none"
          opacity={isSelected ? 0.9 : 0.6}
          filter={isSelected ? `url(#connector-glow-${card.id})` : undefined}
          className="transition-all duration-300 ease-out"
          strokeDasharray={isHovered ? "5,3" : undefined}
        />
      </svg>
    </div>
  );
}

function getCardTypeStyles(cardType: CardType): string {
  const baseStyles = 'border rounded-lg overflow-hidden transition-theme';

  switch (cardType) {
    case 'full':
      return `${baseStyles} border-primary p-4`;
    case 'compact':
      return `${baseStyles} border-primary p-3`;
    case 'title-only':
      return `${baseStyles} border-primary p-2`;
    default:
      return baseStyles;
  }
}

function getGradientClass(cardType: CardType, category?: string): string {
  if (category && ['milestone', 'meeting', 'deadline', 'launch', 'announcement'].includes(category)) {
    return `card-gradient-${category}`;
  }

  switch (cardType) {
    default:
      return 'card-gradient-default';
  }
}

function getElevationClass(cardType: CardType, isSelected: boolean, isHovered: boolean): string {
  if (isSelected) return 'card-elevation-3';
  if (isHovered) return 'card-elevation-2';

  switch (cardType) {
    default:
      return 'card-elevation-1';
  }
}

function generateConnectorPath(card: PositionedCard): string {
  const startX = card.width / 2;
  const startY = 0;
  const endX = startX;
  const endY = 80; // Reduced distance to match smaller timeline axis

  // Calculate control points for bezier curve
  const controlDistance = 30; // Reduced for smaller curve
  const horizontalOffset = Math.max(-20, Math.min(20, (card.x - 400) * 0.03)); // Subtle curve based on position

  const control1X = startX + horizontalOffset;
  const control1Y = startY + controlDistance;
  const control2X = endX - horizontalOffset;
  const control2Y = endY - controlDistance;

  return `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;
}

function renderCardContent(card: PositionedCard): React.ReactNode {
  const event = card.event;
  
  switch (card.cardType) {
    case 'full':
      return <FullCardContent event={event} />;
    case 'compact':
      return <CompactCardContent event={event} />;
    case 'title-only':
      return <TitleOnlyCardContent event={event} />;
    default:
      return <FullCardContent event={event} />;
  }
}

function FullCardContent({ event }: { event: Event }) {
  const eventIcon = getEventIcon(event);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <h3 className="card-title line-clamp-2 flex-1 pr-2" style={{ color: 'var(--color-text-primary)' }}>
          {event.title}
        </h3>
        <div className="flex items-center gap-1">
          <span
            className="card-icon material-symbols-rounded"
            style={{ color: eventIcon.color, fontSize: '0.875rem' }}
            title={eventIcon.description}
          >
            {eventIcon.icon}
          </span>
        </div>
      </div>
      <p className="card-description mb-2 flex-1 line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
        {event.description}
      </p>
      <div className="card-date" style={{ color: 'var(--color-text-tertiary)' }}>
        {formatDate(event.date)}
      </div>
    </div>
  );
}

function CompactCardContent({ event }: { event: Event }) {
  const eventIcon = getEventIcon(event);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <h3 className="card-title line-clamp-2 flex-1 pr-2" style={{ color: 'var(--color-text-primary)' }}>
          {event.title}
        </h3>
        <span
          className="card-icon material-symbols-rounded flex-shrink-0"
          style={{ color: eventIcon.color, fontSize: '0.75rem' }}
          title={eventIcon.description}
        >
          {eventIcon.icon}
        </span>
      </div>
      <p className="card-description line-clamp-1 flex-1" style={{ color: 'var(--color-text-secondary)' }}>
        {event.description}
      </p>
      <div className="card-date" style={{ color: 'var(--color-text-tertiary)' }}>
        {formatDate(event.date)}
      </div>
    </div>
  );
}

function TitleOnlyCardContent({ event }: { event: Event }) {
  const eventIcon = getEventIcon(event);

  return (
    <div className="h-full flex items-center justify-between">
      <h3 className="card-title line-clamp-1 flex-1 pr-2" style={{ color: 'var(--color-text-primary)' }}>
        {event.title}
      </h3>
      <span
        className="card-icon material-symbols-rounded flex-shrink-0"
        style={{ color: eventIcon.color, fontSize: '0.75rem' }}
        title={eventIcon.description}
      >
        {eventIcon.icon}
      </span>
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
export function CardConnector({ card, anchorX, anchorY }: { card: PositionedCard; anchorX: number; anchorY: number }) {
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
        x2={anchorX}
        y2={anchorY}
        stroke="#9ca3af"
        strokeWidth={1}
        opacity={0.4}
        className="drop-shadow-sm"
      />
    </svg>
  );
}