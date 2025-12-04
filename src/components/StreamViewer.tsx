/**
 * StreamViewer - Mobile-friendly timeline viewer with git-style vertical layout
 * v0.5.26 - Read-only viewer for mobile access
 *
 * Design inspiration: Landing page roadmap component
 * - Vertical line with dots (git commit style)
 * - Dates on left, content on right
 * - Chronologically sorted events
 */

import { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import type { Event } from '../types';

interface StreamViewerProps {
  events: Event[];
  timelineTitle?: string;
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
  isLast
}: {
  event: Event;
  index: number;
  isLast: boolean;
}) {
  const { line1, line2 } = formatEventDate(event.date);
  const dotColor = getEventColor(event, index);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        position: 'relative',
        pl: 'calc(var(--stream-date-width) + 32px)',
        minHeight: 80,
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
          pr: 2,
        }}
      >
        <Typography
          sx={{
            color: 'var(--stream-text-secondary)',
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
          width: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Dot */}
        <Box
          sx={{
            width: 'var(--stream-dot-size)',
            height: 'var(--stream-dot-size)',
            borderRadius: '50%',
            bgcolor: dotColor,
            border: '2px solid var(--stream-bg)',
            boxShadow: `0 0 0 2px ${dotColor}40`,
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
          bgcolor: 'var(--stream-card-bg)',
          border: '1px solid var(--stream-card-border)',
          borderRadius: 2,
          p: 2,
          mb: isLast ? 0 : 'var(--stream-card-gap)',
          transition: 'border-color 0.2s',
          '&:hover': {
            borderColor: dotColor,
          },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: 'var(--stream-text-primary)',
            fontWeight: 600,
            fontSize: '1rem',
            mb: event.description ? 0.5 : 0,
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </Typography>
        {event.description && (
          <Typography
            variant="body2"
            sx={{
              color: 'var(--stream-text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              // Limit description to 3 lines
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.description}
          </Typography>
        )}
        {event.time && (
          <Typography
            sx={{
              color: 'var(--stream-text-muted)',
              fontSize: '0.75rem',
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
export function StreamViewer({ events, timelineTitle }: StreamViewerProps) {
  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  if (sortedEvents.length === 0) {
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
        p: 3,
        minHeight: '100%',
      }}
    >
      {/* Optional title */}
      {timelineTitle && (
        <Typography
          variant="h6"
          sx={{
            color: 'var(--stream-text-primary)',
            fontWeight: 700,
            fontSize: '1.25rem',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid var(--stream-rail-color)',
          }}
        >
          {timelineTitle}
        </Typography>
      )}

      {/* Event list */}
      <Stack spacing={0}>
        {sortedEvents.map((event, index) => (
          <StreamEventCard
            key={event.id}
            event={event}
            index={index}
            isLast={index === sortedEvents.length - 1}
          />
        ))}
      </Stack>

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
        </Typography>
      </Box>
    </Box>
  );
}
