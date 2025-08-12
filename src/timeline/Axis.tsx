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
  // Derive minor ticks (unlabeled) between major ticks for additional temporal context
  const minor: number[] = [];
  for (let i = 0; i < ticks.length - 1; i++) {
    const a = ticks[i];
    const b = ticks[i + 1];
    const gap = b.x - a.x;
    if (gap > 6) { // only subdivide sufficiently large gaps
      const parts = 4; // create 3 interior minor ticks
      for (let p = 1; p < parts; p++) {
        const x = a.x + (gap * p) / parts;
        if (x > tickStart && x < tickEnd) minor.push(x);
      }
    }
  }
  return (
    <g data-component="Axis">
      {/* Main axis line */}
      <line x1={tickStart} x2={tickEnd} y1={10} y2={10} stroke="var(--cc-color-axis-line)" strokeWidth={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cc-axis-line-width') || '0.18')} />
      {/* Minor tick marks */}
      {minor.map((x, i) => (
        <line key={`m-${i}-${x}`} x1={x} x2={x} y1={9.55} y2={10.45} stroke="var(--cc-color-axis-line-strong)" strokeWidth={0.14} />
      ))}
      {ticks.map(t => (
        <g key={t.t} transform={`translate(${t.x},0)`}>
          <line data-testid="axis-tick" x1={0} x2={0} y1={9.3} y2={10.7} stroke="var(--cc-color-axis-line-strong)" strokeWidth={0.16} />
          <text data-testid="axis-label" x={0} y={11.9} fontSize={1.2} fill="var(--cc-color-axis-label)" textAnchor="middle" style={{ pointerEvents: 'none', fontWeight: 400 }}>{t.label}</text>
        </g>
      ))}
    </g>
  );
};
