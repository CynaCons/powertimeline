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
      {/* Header */}
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
          <span className="text-xs ml-auto" style={{ color: 'var(--page-text-secondary)' }}>
            ({events.length})
          </span>
        </h3>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto">
        {events.map((event) => {
          const isCurrentEvent = event.id === currentEventId;

          return (
            <button
              key={event.id}
              onClick={() => onSelect(event.id)}
              className="w-full text-left p-3 focus:outline-none transition-colors"
              style={{
                borderBottom: '1px solid var(--page-border)',
                backgroundColor: isCurrentEvent ? 'var(--page-accent)' : 'transparent',
                color: isCurrentEvent ? '#ffffff' : 'var(--page-text-primary)'
              }}
              onMouseEnter={(e) => {
                if (!isCurrentEvent) {
                  e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentEvent) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title={`Switch to: ${event.title}`}
            >
              {/* Event title */}
              <div
                className="text-sm font-medium mb-1"
                style={{
                  color: isCurrentEvent ? '#ffffff' : 'var(--page-text-primary)'
                }}
              >
                {truncateText(event.title, 35)}
              </div>

              {/* Event date */}
              <div
                className="text-xs mb-1"
                style={{
                  color: isCurrentEvent ? 'rgba(255, 255, 255, 0.9)' : 'var(--page-text-secondary)'
                }}
              >
                {formatDate(event.date, event.time)}
              </div>

              {/* Event description snippet */}
              {event.description && (
                <div
                  className="text-xs"
                  style={{
                    color: isCurrentEvent ? 'rgba(255, 255, 255, 0.8)' : 'var(--page-text-secondary)'
                  }}
                >
                  {truncateText(event.description, 60)}
                </div>
              )}

              {/* Current event indicator */}
              {isCurrentEvent && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="material-symbols-rounded text-xs" style={{ color: '#ffffff' }}>
                    radio_button_checked
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#ffffff' }}>
                    Current
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer with navigation hint */}
      <div
        className="p-2"
        style={{
          borderTop: '1px solid var(--page-border)',
          backgroundColor: 'var(--page-bg)'
        }}
      >
        <p className="text-xs text-center" style={{ color: 'var(--page-text-secondary)' }}>
          {direction === 'prev' ? 'Earlier' : 'Later'} events
        </p>
      </div>
    </div>
  );
};