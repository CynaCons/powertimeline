import React from 'react';

const Timeline: React.FC = () => {
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
        <circle cx="50" cy="5" r="4" fill="#ffffff" stroke="#6d28d9" strokeWidth="1" />
      </svg>
    </div>
  );
};

export default Timeline;
