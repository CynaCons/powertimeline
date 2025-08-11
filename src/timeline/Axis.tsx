import React from 'react';
import type { Tick } from './hooks/useAxisTicks';

interface AxisProps {
  ticks: Tick[];
  tickStart: number;
  tickEnd: number;
  viewMin: number;
  viewMax: number;
}

export const Axis: React.FC<AxisProps> = ({ ticks, tickStart, tickEnd }) => {
  return (
    <g data-component="Axis">
      <line x1={tickStart} x2={tickEnd} y1={10} y2={10} stroke="#fff8" strokeWidth={0.25} />
      {ticks.map(t => (
        <g key={t.t} transform={`translate(${t.x},0)`}>
          <line data-testid="axis-tick" x1={0} x2={0} y1={9.3} y2={10.7} stroke="#fff8" strokeWidth={0.25} />
          <text data-testid="axis-label" x={0} y={12.2} fontSize={1.6} fill="#fff9" textAnchor="middle" style={{ pointerEvents: 'none', fontWeight: 300 }}>{t.label}</text>
        </g>
      ))}
    </g>
  );
};
