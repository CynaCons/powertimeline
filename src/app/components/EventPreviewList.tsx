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
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="material-symbols-rounded text-base text-gray-500">
              {getDirectionIcon()}
            </span>
            {getDirectionLabel()}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 text-center">
            {direction === 'prev' ? 'No previous events' : 'No next events'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="material-symbols-rounded text-base text-gray-500">
            {getDirectionIcon()}
          </span>
          {getDirectionLabel()}
          <span className="text-xs text-gray-500 ml-auto">
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
              className={`w-full text-left p-3 border-b border-gray-100 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors ${
                isCurrentEvent
                  ? 'bg-blue-100 border-blue-200'
                  : 'hover:shadow-sm'
              }`}
              title={`Switch to: ${event.title}`}
            >
              {/* Event title */}
              <div className={`text-sm font-medium mb-1 ${
                isCurrentEvent ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {truncateText(event.title, 35)}
              </div>

              {/* Event date */}
              <div className={`text-xs mb-1 ${
                isCurrentEvent ? 'text-blue-700' : 'text-gray-600'
              }`}>
                {formatDate(event.date, event.time)}
              </div>

              {/* Event description snippet */}
              {event.description && (
                <div className={`text-xs ${
                  isCurrentEvent ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {truncateText(event.description, 60)}
                </div>
              )}

              {/* Current event indicator */}
              {isCurrentEvent && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="material-symbols-rounded text-xs text-blue-600">
                    radio_button_checked
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    Current
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer with navigation hint */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {direction === 'prev' ? 'Earlier' : 'Later'} events
        </p>
      </div>
    </div>
  );
};