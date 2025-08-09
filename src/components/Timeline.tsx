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
    <div className="w-full flex items-center justify-center" style={{ minHeight: 160 }}>
      <svg
        viewBox="0 0 100 10"
        width="100%"
        height="160"
        preserveAspectRatio="none"
        className="max-w-3xl"
      >
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <line x1="0" y1="5" x2="100" y2="5" stroke="url(#timelineGradient)" strokeWidth="3" strokeLinecap="round" />
        {sorted.map((ev) => {
          const x = ((new Date(ev.date).getTime() - min) / range) * 100;
          return <rect key={ev.id} x={x - 1} y={4} width={2} height={2} fill="#fff" stroke="#6d28d9" strokeWidth={0.5} />;
        })}
      </svg>
    </div>
  );
};

export default Timeline;
