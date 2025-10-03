import React from 'react';
import type { CardType } from './types';

interface SkeletonCardProps {
  cardType: CardType;
  width: number;
  height: number;
  x: number;
  y: number;
}

export function SkeletonCard({ cardType, width, height, x, y }: SkeletonCardProps) {
  return (
    <div
      className="skeleton-card absolute card-enter"
      style={{
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        zIndex: 5
      }}
    >
      <div className="skeleton-shimmer"></div>

      <div className="h-full flex flex-col p-4">
        {renderSkeletonContent(cardType)}
      </div>
    </div>
  );
}

function renderSkeletonContent(cardType: CardType): React.ReactNode {
  switch (cardType) {
    case 'full':
      return (
        <>
          <div className="skeleton-text skeleton-title w-4/5"></div>
          <div className="skeleton-text skeleton-description w-full"></div>
          <div className="skeleton-text skeleton-description w-3/4"></div>
          <div className="flex-1"></div>
          <div className="skeleton-text skeleton-date"></div>
        </>
      );

    case 'compact':
      return (
        <>
          <div className="skeleton-text skeleton-title w-3/4"></div>
          <div className="skeleton-text skeleton-description w-full"></div>
          <div className="flex-1"></div>
          <div className="skeleton-text skeleton-date"></div>
        </>
      );

    case 'title-only':
      return (
        <>
          <div className="flex-1 flex items-center">
            <div className="skeleton-text skeleton-title w-3/4"></div>
          </div>
        </>
      );

    default:
      return renderSkeletonContent('full');
  }
}

interface SkeletonTimelineProps {
  count: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function SkeletonTimeline({
  count,
  minWidth = 200,
  maxWidth = 300,
  minHeight = 80,
  maxHeight = 160
}: SkeletonTimelineProps) {
  const cards = Array.from({ length: count }, (_, index) => {
    const width = minWidth + Math.random() * (maxWidth - minWidth);
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    const x = 100 + (index * 350) + Math.random() * 100;
    const y = 200 + Math.random() * 200;

    const cardTypes: CardType[] = ['full', 'compact', 'title-only'];
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];

    return {
      key: `skeleton-${index}`,
      cardType,
      width,
      height,
      x,
      y
    };
  });

  return (
    <div className="absolute inset-0">
      {cards.map((card) => (
        <SkeletonCard
          key={card.key}
          cardType={card.cardType}
          width={card.width}
          height={card.height}
          x={card.x}
          y={card.y}
        />
      ))}
    </div>
  );
}