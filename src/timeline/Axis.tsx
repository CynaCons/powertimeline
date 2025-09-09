import React, { useMemo } from 'react';
import type { Tick } from './hooks/useAxisTicks';

interface AxisProps {
  ticks: Tick[];
  tickStart: number;
  tickEnd: number;
  viewMin: number;
  viewMax: number;
}

export const Axis: React.FC<AxisProps> = ({ ticks, tickStart, tickEnd }) => {
  // Derive minor ticks (unlabeled) between major ticks for additional temporal context.
  // Memoize to avoid recomputation every render and guard against dense scenarios.
  const minor = useMemo(() => {
    if (!ticks.length) return [] as number[];
    // Skip minor subdivision if already very dense
    if (ticks.length > 40) return [] as number[];
    const out: number[] = [];
    for (let i = 0; i < ticks.length - 1; i++) {
      const a = ticks[i];
      const b = ticks[i + 1];
      const gap = b.x - a.x;
      if (gap > 6) { // only subdivide sufficiently large gaps (in viewBox percent units)
        const parts = 4; // produces 3 interior minor ticks
        for (let p = 1; p < parts; p++) {
          const x = a.x + (gap * p) / parts;
          if (x > tickStart && x < tickEnd) out.push(x);
        }
      }
      // Cap minors to a reasonable number to prevent perf spikes
      if (out.length > 120) break;
    }
    return out;
  }, [ticks, tickStart, tickEnd]);

  return (
    <g data-component="Axis">
      {/* Major grid lines */}
      {ticks.map(t => (
        <line key={`g-${t.t}`} data-testid="grid-major" x1={t.x} x2={t.x} y1={5} y2={55} stroke="#ffffff" strokeWidth={3} opacity="0.6" />
      ))}
      {/* Minor grid lines */}
      {minor.map((x, i) => (
        <line key={`gm-${i}-${x}`} data-testid="grid-minor" x1={x} x2={x} y1={3} y2={17} stroke="var(--cc-color-grid-minor)" strokeWidth={0.06} />
      ))}
      {/* Main axis line (stroke width driven by CSS variable, fallback inline) */}
      <line
        x1={tickStart}
        x2={tickEnd}
        y1={30}
        y2={30}
        stroke="#ffffff"
        strokeWidth="4"
        opacity="0.8"
      />
      {/* Minor tick marks */}
      {minor.map((x, i) => (
        <line key={`m-${i}-${x}`} x1={x} x2={x} y1={9.55} y2={10.45} stroke="var(--cc-color-axis-line-strong)" strokeWidth={0.14} />
      ))}
      {ticks.map(t => (
        <g key={t.t} transform={`translate(${t.x},0)`}>
          <line data-testid="axis-tick" x1={0} x2={0} y1={9.3} y2={10.7} stroke="var(--cc-color-axis-line-strong)" strokeWidth={0.16} />
          <text data-testid="axis-label" x={0} y={20} fontSize={18} fill="#ffffff" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">{t.label}</text>
        </g>
      ))}
    </g>
  );
};
