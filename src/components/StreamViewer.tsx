/**
 * StreamViewer - Mobile-friendly timeline viewer with git-style vertical layout
 * v0.5.26.1 - Enhanced with search, hover sync, and click-to-navigate
 *
 * Design inspiration: Landing page roadmap component
 * - Vertical line with dots (git commit style)
 * - Dates on left, content on right
 * - Chronologically sorted events
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { Box, Typography, Stack, useMediaQuery, useTheme } from '@mui/material';
import type { Event } from '../types';

interface StreamViewerProps {
  events: Event[];
  /** Total events before filtering (for footer display) */
  totalEvents?: number;
  /** Current search query (for "no results" message) */
  searchQuery?: string;
  /** Called when user clicks an event (for timeline zoom/navigation) */
  onEventClick?: (event: Event) => void;
  /** Currently selected event ID */
  selectedEventId?: string;
}

/**
 * Format a date string for display
 * Shows month + day on first line, year on second line
 */
function formatEventDate(dateStr: string): { line1: string; line2: string } {
  try {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure local timezone
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return {
      line1: `${month} ${day}`,
      line2: `${year}`
    };
  } catch {
    return { line1: dateStr, line2: '' };
  }
}

/**
 * Get a color for an event (use event's color or generate from index)
 */
function getEventColor(_event: Event, index: number): string {
  // Default color palette for events without explicit colors
  const defaultColors = [
    '#8b5cf6', // Purple (primary accent)
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#3fb950', // Green
    '#f472b6', // Pink
    '#fbbf24', // Amber
  ];

  // Future: If the event has a color field, use it
  // For now, cycle through default colors
  return defaultColors[index % defaultColors.length];
}

/**
 * Single event card in the stream
 */
function StreamEventCard({
  event,
  index,
  isLast,
  isSelected,
  isExpanded,
  lineClamp,
  onClick,
  onToggleExpand,
}: {
  event: Event;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  lineClamp: number;
  onClick: () => void;
  onToggleExpand: () => void;
}) {
  const { line1, line2 } = formatEventDate(event.date);
  const dotColor = getEventColor(event, index);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Check if description is truncated (needs "show more")
  useEffect(() => {
    if (descriptionRef.current && event.description) {
      const el = descriptionRef.current;
      // Compare scrollHeight to clientHeight to detect truncation
      setIsTruncated(el.scrollHeight > el.clientHeight + 2);
    }
  }, [event.description, isExpanded, lineClamp]);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking the expand button, don't trigger the main onClick
    if ((e.target as HTMLElement).closest('[data-expand-button]')) {
      return;
    }
    onClick();
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <Box
      data-event-id={event.id}
      onClick={handleCardClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        position: 'relative',
        pl: 'calc(var(--stream-date-width) + 40px)',
        minHeight: 90,
        cursor: 'pointer',
      }}
    >
      {/* Date column - absolute positioned on left */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 'var(--stream-date-width)',
          textAlign: 'right',
          pr: 1,
        }}
      >
        <Typography
          sx={{
            color: isSelected ? 'var(--stream-text-primary)' : 'var(--stream-text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {line1}
        </Typography>
        <Typography
          sx={{
            color: 'var(--stream-text-muted)',
            fontSize: '0.8rem',
            fontWeight: 400,
          }}
        >
          {line2}
        </Typography>
      </Box>

      {/* Vertical rail with dot */}
      <Box
        sx={{
          position: 'absolute',
          left: 'var(--stream-date-width)',
          top: 0,
          bottom: isLast ? 'auto' : 0,
          width: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Dot */}
        <Box
          sx={{
            width: isSelected ? 16 : 12,
            height: isSelected ? 16 : 12,
            borderRadius: '50%',
            bgcolor: dotColor,
            border: '2px solid var(--stream-bg)',
            boxShadow: isSelected ? `0 0 0 2px ${dotColor}` : 'none',
            flexShrink: 0,
            mt: '4px',
            zIndex: 1,
          }}
        />
        {/* Vertical line (connecting to next event) */}
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: 'var(--stream-rail-color)',
              mt: 1,
            }}
          />
        )}
      </Box>

      {/* Event content card */}
      <Box
        sx={{
          flex: 1,
          bgcolor: isSelected ? 'var(--stream-card-bg)' : 'transparent',
          border: `1px solid ${isSelected ? dotColor : 'rgba(255, 255, 255, 0.08)'}`,
          borderRadius: '10px',
          p: 1.5,
          mb: isLast ? 0 : 'var(--stream-card-gap)',
          transition: 'all 0.15s ease',
          // Desktop hover effect
          '@media (hover: hover)': {
            '&:hover': {
              bgcolor: 'var(--stream-card-bg)',
              borderColor: 'var(--stream-dot-color)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            },
          },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: 'var(--stream-text-primary)',
            fontWeight: 600,
            fontSize: '1.05rem',
            mb: event.description ? 0.5 : 0,
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </Typography>
        {event.description && (
          <>
            <Typography
              ref={descriptionRef}
              component="span"
              variant="body2"
              sx={{
                color: 'var(--stream-text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : lineClamp,
                WebkitBoxOrient: 'vertical',
                overflow: isExpanded ? 'visible' : 'hidden',
              }}
            >
              {event.description}
            </Typography>
            {/* Show more/less button */}
            {(isTruncated || isExpanded) && (
              <Typography
                component="button"
                data-expand-button
                onClick={handleExpandClick}
                sx={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--stream-dot-color)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  mt: 0.5,
                  display: 'block',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {isExpanded ? '← Show less' : 'Show more →'}
              </Typography>
            )}
          </>
        )}
        {event.time && (
          <Typography
            sx={{
              color: 'var(--stream-text-muted)',
              fontSize: '0.8rem',
              mt: 1,
            }}
          >
            {event.time}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/**
 * StreamViewer - Main component
 */
export function StreamViewer({
  events,
  totalEvents,
  searchQuery,
  onEventClick,
  selectedEventId,
}: StreamViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px

  // Track which events are expanded
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Responsive line clamp: 3 on mobile, 5 on desktop
  const lineClamp = isMobile ? 3 : 5;

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  // Handle click - just call the callback
  const handleClick = (event: Event) => {
    onEventClick?.(event);
  };

  // Toggle expand state for an event
  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const total = totalEvents ?? events.length;
  const isFiltered = searchQuery && searchQuery.trim().length > 0;

  if (total === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          color: 'var(--stream-text-muted)',
        }}
      >
        <Typography>No events to display</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'var(--stream-bg)',
      }}
    >
      {/* Event list */}
      <Box sx={{ p: 2 }}>
        {/* Events */}
        {sortedEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'var(--stream-text-muted)' }}>
              No events match "{searchQuery}"
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0}>
            {sortedEvents.map((event, index) => (
              <StreamEventCard
                key={event.id}
                event={event}
                index={index}
                isLast={index === sortedEvents.length - 1}
                isSelected={selectedEventId === event.id}
                isExpanded={expandedEvents.has(event.id)}
                lineClamp={lineClamp}
                onClick={() => handleClick(event)}
                onToggleExpand={() => toggleExpand(event.id)}
              />
            ))}
          </Stack>
        )}

        {/* Event count footer */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid var(--stream-rail-color)',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              color: 'var(--stream-text-muted)',
              fontSize: '0.85rem',
            }}
          >
            {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
            {isFiltered && ` (filtered)`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
