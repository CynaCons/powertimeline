import React from 'react';

const Timeline: React.FC = () => {
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 100 10" className="w-11/12 h-2">
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <line x1="0" y1="5" x2="100" y2="5" stroke="url(#timelineGradient)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="50" cy="5" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
};

export default Timeline;
