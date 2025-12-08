import React from 'react';
import type { Event } from '../../types';

export interface EventPreviewListProps {
  events: Event[];
  currentEventId?: string;
  onSelect: (id: string) => void;
  direction: 'prev' | 'next';
  className?: string;
}

export const EventPreviewList: React.FC<EventPreviewListProps> = ({
  events,
  currentEventId,
  onSelect,
  direction,
  className = ''
}) => {
  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (timeStr) {
      return `${dateFormatted} at ${timeStr}`;
    }
    return dateFormatted;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getDirectionLabel = () => {
    return direction === 'prev' ? 'Previous Events' : 'Next Events';
  };

  const getDirectionIcon = () => {
    return direction === 'prev' ? 'arrow_back' : 'arrow_forward';
  };

  if (events.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div
          className="p-4"
          style={{
            borderBottom: '1px solid var(--page-border)',
            backgroundColor: 'var(--page-bg)'
          }}
        >
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--page-text-primary)' }}>
            <span className="material-symbols-rounded text-base" style={{ color: 'var(--page-text-secondary)' }}>
              {getDirectionIcon()}
            </span>
            {getDirectionLabel()}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-center" style={{ color: 'var(--page-text-secondary)' }}>
            {direction === 'prev' ? 'No previous events' : 'No next events'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Event list - removed header and footer for cleaner look */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {events.map((event) => {
          // Only match if both IDs are defined AND equal (prevents undefined === undefined bug)
          const isCurrentEvent = currentEventId !== undefined && event.id === currentEventId;

          return (
            <button
              key={event.id}
              onClick={() => onSelect(event.id)}
              className="w-full text-left p-4 focus:outline-none transition-all duration-150"
              style={{
                borderBottom: '1px solid var(--page-border)',
                backgroundColor: isCurrentEvent ? 'var(--page-accent)' : 'transparent',
                color: isCurrentEvent ? '#ffffff' : 'var(--page-text-primary)'
              }}
              onMouseEnter={(e) => {
                if (!isCurrentEvent) {
                  e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                  e.currentTarget.style.borderLeftColor = 'var(--page-accent)';
                  e.currentTarget.style.borderLeftWidth = '3px';
                  e.currentTarget.style.paddingLeft = 'calc(1rem - 2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentEvent) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.borderLeftWidth = '0px';
                  e.currentTarget.style.paddingLeft = '1rem';
                }
              }}
              title={`Switch to: ${event.title}`}
            >
              {/* Event title with better typography */}
              <div
                className="text-sm font-semibold mb-2 leading-snug"
                style={{
                  color: isCurrentEvent ? '#ffffff' : 'var(--page-text-primary)'
                }}
              >
                {truncateText(event.title, 30)}
              </div>

              {/* Event date with icon */}
              <div
                className="flex items-center gap-1.5 text-xs mb-1.5"
                style={{
                  color: isCurrentEvent ? 'rgba(255, 255, 255, 0.9)' : 'var(--page-text-secondary)'
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>schedule</span>
                {formatDate(event.date, event.time)}
              </div>

              {/* Event description snippet */}
              {event.description && (
                <div
                  className="text-xs leading-relaxed line-clamp-2"
                  style={{
                    color: isCurrentEvent ? 'rgba(255, 255, 255, 0.8)' : 'var(--page-text-secondary)'
                  }}
                >
                  {truncateText(event.description, 70)}
                </div>
              )}

              {/* Current event indicator */}
              {isCurrentEvent && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-rounded" style={{ color: '#ffffff', fontSize: '14px' }}>
                    visibility
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#ffffff' }}>
                    Viewing
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};