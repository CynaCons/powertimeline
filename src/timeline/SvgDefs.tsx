import React from 'react';

export const SvgDefs: React.FC = () => (
  <defs>
    <linearGradient id="rangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#0ff" stopOpacity={0.0} />
      <stop offset="50%" stopColor="#0ff" stopOpacity={0.7} />
      <stop offset="100%" stopColor="#0ff" stopOpacity={0.0} />
    </linearGradient>
    <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0.2" stdDeviation="0.4" floodColor="#000" floodOpacity="0.5" />
    </filter>
  </defs>
);
