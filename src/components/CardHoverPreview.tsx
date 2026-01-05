import { useEffect, useState, useRef } from 'react';
import type { Event } from '../types';

interface CardHoverPreviewProps {
  event: Event;
  position: { x: number; y: number };
  onClose?: () => void;
}

/**
 * CardHoverPreview - Floating preview that shows full card content when hovering over degraded cards
 * Positioned intelligently to avoid screen edges with fade-in animation
 */
export default function CardHoverPreview({ event, position }: CardHoverPreviewProps) {
  const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x, y: position.y });
  const previewRef = useRef<HTMLDivElement>(null);
  const GAP = 10; // Gap from source card

  useEffect(() => {
    if (!previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x + GAP;
    let y = position.y + GAP;

    // Adjust horizontal position if near right edge
    if (x + rect.width > viewportWidth) {
      x = position.x - rect.width - GAP;
    }

    // Adjust vertical position if near bottom edge
    if (y + rect.height > viewportHeight) {
      y = position.y - rect.height - GAP;
    }

    // Ensure we don't go off-screen on the left or top
    if (x < 0) x = GAP;
    if (y < 0) y = GAP;

    setAdjustedPosition({ x, y });
  }, [position]);

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      ref={previewRef}
      className="card-hover-preview"
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        zIndex: 1000,
        maxWidth: '320px',
        backgroundColor: 'var(--page-bg-elevated)',
        border: '1px solid var(--page-border)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-xl)',
        padding: '16px',
        opacity: 0,
        animation: 'fadeIn 150ms ease-out forwards',
        pointerEvents: 'none'
      }}
    >
      {/* Event Title */}
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--page-text-primary)',
          wordWrap: 'break-word'
        }}
      >
        {event.title}
      </h3>

      {/* Event Date */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--page-text-secondary)',
          marginBottom: '12px'
        }}
      >
        {formatDate(event.date)}
        {event.endDate && ` - ${formatDate(event.endDate)}`}
        {event.time && ` at ${event.time}`}
      </div>

      {/* Event Description */}
      {event.description && (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--page-text-primary)',
            lineHeight: '1.5',
            marginBottom: '12px',
            maxHeight: '200px',
            overflowY: 'auto',
            wordWrap: 'break-word'
          }}
        >
          {event.description}
        </div>
      )}

      {/* Sources */}
      {event.sources && event.sources.length > 0 && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--page-text-secondary)',
            marginBottom: '12px',
            borderTop: '1px solid var(--page-border)',
            paddingTop: '8px'
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>Sources:</div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {event.sources.map((source, idx) => (
              <li key={idx} style={{ marginBottom: '2px', wordWrap: 'break-word' }}>
                {source}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hint */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--page-text-secondary)',
          opacity: 0.7,
          fontStyle: 'italic',
          borderTop: '1px solid var(--page-border)',
          paddingTop: '8px'
        }}
      >
        Double-click to edit
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            div[style*="animation: 'fadeIn"] {
              animation: none !important;
              opacity: 1 !important;
            }
          }
        `}
      </style>
    </div>
  );
}
