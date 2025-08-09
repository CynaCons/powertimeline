import React from 'react';
import type { Event } from '../types';

interface Props {
  events: Event[];
}

const Timeline: React.FC<Props> = ({ events }) => {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const min = sorted.length ? new Date(sorted[0].date).getTime() : 0;
  const max = sorted.length ? new Date(sorted[sorted.length - 1].date).getTime() : 0;
  const range = max - min || 1;

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 220 }}>
      <svg
        viewBox="0 0 100 20"
        width="100%"
        height="220"
        preserveAspectRatio="none"
        className="max-w-3xl"
      >
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <line x1="0" y1="10" x2="100" y2="10" stroke="url(#timelineGradient)" strokeWidth="3" strokeLinecap="round" />
        {sorted.map((ev, i) => {
          const t = new Date(ev.date).getTime();
          const x = ((t - min) / range) * 100;
          const above = i % 2 === 0;
          const stemY2 = above ? 4 : 16;
          const labelY = above ? 3 : 17.5;
          return (
            <g key={ev.id}>
              {/* node */}
              <rect x={x - 0.9} y={9.1} width={1.8} height={1.8} fill="#1f2937" stroke="#4b5563" strokeWidth={0.2} rx={0.2} />
              {/* stem */}
              <line x1={x} y1={10} x2={x} y2={stemY2} stroke="#64748b" strokeWidth={0.2} />
              {/* label */}
              <text x={x} y={labelY} textAnchor="middle" fontSize={1.8} fill="#e5e7eb">
                {ev.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Timeline;
