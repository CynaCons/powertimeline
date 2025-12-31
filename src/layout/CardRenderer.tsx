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
  isFirstCard?: boolean;
}

export function CardRenderer({
  card,
  isSelected = false,
  isHovered = false,
  onClick,
  onDoubleClick,
  isFirstCard = false
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
  const isPreview = card.event.isPreview === true;

  return (
    <div
      data-testid="event-card"
      data-event-id={card.id}
      data-event-date={eventDate}
      data-card-type={card.cardType}
      data-cluster-id={card.clusterId}
      data-density={card.cardType}
      data-tour={isFirstCard ? 'event-card' : undefined}
      data-preview={isPreview || undefined}
      className={`
        absolute cursor-pointer card-hover-scale card-enter
        ${getCardTypeStyles(card.cardType)}
        ${gradientClass}
        ${elevationClass}
        ${isSelected ? 'card-selected' : ''}
        ${isPreview ? 'card-preview' : ''}
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