import React from 'react';

interface RangeBarProps {
  hasEvents: boolean;
  firstX: number;
  lastX: number;
}

export const RangeBar: React.FC<RangeBarProps> = ({ hasEvents, firstX, lastX }) => {
  if (!hasEvents) return null;
  return (
    <g data-component="RangeBar">
      <rect data-testid="range-bar" x={Math.min(firstX, lastX)} y={9.7} width={Math.max(0.3, Math.abs(lastX - firstX))} height={0.6} fill="url(#rangeGradient)" opacity={0.7} rx={0.1} />
      <rect data-testid="range-start" x={Math.min(firstX, lastX)-0.6} y={9.4} width={0.6} height={1.2} fill="#0ff" opacity={0.7} />
      <rect data-testid="range-end" x={Math.max(firstX, lastX)} y={9.4} width={0.6} height={1.2} fill="#0ff" opacity={0.7} />
    </g>
  );
};
