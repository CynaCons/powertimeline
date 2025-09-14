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
      <defs>
        {/* Gradient definitions for enhanced visuals */}
        <linearGradient id="majorTickGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary-300)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="var(--color-primary-400)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="axisLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary-400)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="var(--color-primary-500)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-primary-400)" stopOpacity="0.8" />
        </linearGradient>
        <filter id="tickGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Major grid lines with gradient and glow */}
      {ticks.map(t => (
        <g key={`g-${t.t}`} className="timeline-major-tick">
          <line
            data-testid="grid-major"
            x1={t.x}
            x2={t.x}
            y1={8}
            y2={22}
            stroke="url(#majorTickGradient)"
            strokeWidth={2.5}
            filter="url(#tickGlow)"
            className="transition-all duration-300 ease-out"
          />
        </g>
      ))}

      {/* Minor grid lines */}
      {minor.map((x, i) => (
        <line
          key={`gm-${i}-${x}`}
          data-testid="grid-minor"
          x1={x}
          x2={x}
          y1={12}
          y2={18}
          stroke="var(--color-border-primary)"
          strokeWidth={0.8}
          opacity={0.4}
          className="transition-all duration-300 ease-out"
        />
      ))}

      {/* Main axis line with gradient */}
      <line
        x1={tickStart}
        x2={tickEnd}
        y1={15}
        y2={15}
        stroke="url(#axisLineGradient)"
        strokeWidth="3"
        filter="url(#tickGlow)"
        className="transition-all duration-300 ease-out"
      />

      {/* Minor tick marks */}
      {minor.map((x, i) => (
        <line
          key={`m-${i}-${x}`}
          x1={x}
          x2={x}
          y1={14}
          y2={16}
          stroke="var(--color-primary-600)"
          strokeWidth={1}
          opacity={0.6}
          className="transition-all duration-300 ease-out"
        />
      ))}

      {/* Major tick marks and labels with enhanced styling */}
      {ticks.map(t => (
        <g key={t.t} transform={`translate(${t.x},0)`} className="timeline-tick-group">
          <line
            data-testid="axis-tick"
            x1={0}
            x2={0}
            y1={12}
            y2={18}
            stroke="var(--color-primary-500)"
            strokeWidth={2.5}
            filter="url(#tickGlow)"
            className="transition-all duration-300 ease-out"
          />
          <text
            data-testid="axis-label"
            x={0}
            y={10}
            fontSize={16}
            fill="var(--color-text-primary)"
            textAnchor="middle"
            fontFamily="var(--font-sans, system-ui, sans-serif)"
            fontWeight="600"
            className="timeline-label transition-all duration-300 ease-out select-none"
            style={{ letterSpacing: '0.025em' }}
          >
            {t.label}
          </text>
        </g>
      ))}
    </g>
  );
};
