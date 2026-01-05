/**
 * StreamViewer - Mobile-friendly timeline viewer with git-style vertical layout
 * v0.8.9 - Performance optimized with react-window virtualization
 *
 * Design inspiration: Landing page roadmap component
 * - Vertical line with dots (git commit style)
 * - Dates on left, content on right
 * - Chronologically sorted events
 *
 * Performance optimizations (v0.8.9):
 * - P0-5: react-window virtualization for large event lists
 * - P2-7: CSS-only line clamping (removed JS truncation detection)
 * - P2-8: Ref-based swipe animation (no state updates during touchmove)
 */

import { useMemo, useState, useRef, useEffect, memo, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import type { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
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
  /** Called when user taps edit action (owner only) */
  onEdit?: (event: Event) => void;
  /** Called when user taps delete action (owner only) */
  onDelete?: (eventId: string) => void;
  /** Whether the current user owns the timeline (enables swipe actions) */
  isOwner?: boolean;
  /** Called when user clicks "view on canvas" icon (desktop hover action) */
  onViewOnCanvas?: (event: Event) => void;
  /** Called when user clicks "edit in editor" icon (desktop hover action) */
  onEditInEditor?: (event: Event) => void;
  /** Called when mouse enters an event card (for minimap highlighting) */
  onEventMouseEnter?: (eventId: string) => void;
  /** Called when mouse leaves an event card (for minimap highlighting) */
  onEventMouseLeave?: () => void;
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
interface StreamEventCardProps {
  event: Event;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  lineClamp: number;
  onClick: (event: Event) => void;
  onToggleExpand: (eventId: string) => void;
  isOwner: boolean;
  swipedEventId: string | null;
  swipeDirection: 'left' | 'right' | null;
  onSwipeAction: (eventId: string, direction: 'left' | 'right' | null) => void;  // P2-8: Simplified callback
  onDelete?: (eventId: string) => void;
  onEdit?: (event: Event) => void;
  onViewOnCanvas?: (event: Event) => void;
  onEditInEditor?: (event: Event) => void;
  onMouseEnter?: (eventId: string) => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;  // P0-5: For react-window positioning
}

const StreamEventCard = memo(function StreamEventCard({
  event,
  index,
  isLast,
  isSelected,
  isExpanded,
  lineClamp,
  onClick,
  onToggleExpand,
  isOwner,
  swipedEventId,
  swipeDirection,
  onSwipeAction,
  onDelete,
  onEdit,
  onViewOnCanvas,
  onEditInEditor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMouseEnter: _onMouseEnter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMouseLeave: _onMouseLeave,
  style,
}: StreamEventCardProps) {
  const { line1, line2 } = formatEventDate(event.date);
  const dotColor = getEventColor(event, index);
  const isSwiped = swipedEventId === event.id;
  const swipeClass = isSwiped && swipeDirection ? ` swiped-${swipeDirection}` : '';

  // P2-8: Refs for swipe animation - no state updates during touchmove
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const currentSwipeDirection = useRef<'left' | 'right' | null>(null);

  // P2-7: Show "expand" button based on character-per-line heuristic
  // Average ~70 chars per line, with lineClamp lines visible, so threshold = lineClamp * 70
  // Only show if description exceeds what would fit in the clamped area
  const estimatedVisibleChars = lineClamp * 70;
  const showExpandButton = event.description && (isExpanded || event.description.length > estimatedVisibleChars);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // If clicking the expand button, don't trigger the main onClick
    if ((e.target as HTMLElement).closest('[data-expand-button]')) {
      return;
    }
    if (isSwiped && swipeDirection) {
      return;
    }
    onClick(event);  // Pass event to callback
  }, [onClick, event, isSwiped, swipeDirection]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(event.id);  // Pass eventId to callback
  }, [onToggleExpand, event.id]);

  // Stable callbacks for mouse events - dispatch custom events for instant DOM updates
  // Completely bypasses React state for O(1) hover response time
  const handleMouseEnter = useCallback(() => {
    // Dispatch custom event for instant minimap/canvas highlight (bypasses React entirely)
    document.dispatchEvent(new CustomEvent('timeline:hover', { detail: { eventId: event.id } }));
  }, [event.id]);

  const handleMouseLeave = useCallback(() => {
    // Dispatch custom event to clear hover (bypasses React entirely)
    document.dispatchEvent(new CustomEvent('timeline:hover', { detail: { eventId: null } }));
  }, []);

  // P2-8: Optimized swipe handlers using refs and direct DOM manipulation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isOwner) return;
    touchStartX.current = e.touches[0].clientX;
    currentSwipeDirection.current = null;
  }, [isOwner]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isOwner || touchStartX.current === null || !cardRef.current) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;

    // Direct DOM manipulation - no React state updates during animation
    if (cardRef.current) {
      // Clamp the transform to avoid over-swiping
      const clampedDelta = Math.max(-100, Math.min(100, deltaX));
      cardRef.current.style.transform = `translateX(${clampedDelta}px)`;
      cardRef.current.style.transition = 'none';
    }

    // Track direction in ref, not state
    if (deltaX < -50) {
      currentSwipeDirection.current = 'left';
    } else if (deltaX > 50) {
      currentSwipeDirection.current = 'right';
    } else {
      currentSwipeDirection.current = null;
    }
  }, [isOwner]);

  const handleTouchEnd = useCallback(() => {
    if (!isOwner || !cardRef.current) return;

    // Reset transform with animation
    cardRef.current.style.transition = 'transform 200ms ease-out';
    cardRef.current.style.transform = 'translateX(0)';

    // Only update React state on touchEnd with final direction
    if (currentSwipeDirection.current) {
      onSwipeAction(event.id, currentSwipeDirection.current);
    }

    touchStartX.current = null;
    currentSwipeDirection.current = null;
  }, [isOwner, event.id, onSwipeAction]);

  return (
    <div style={{ ...style, paddingTop: 16 }}>
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
        ref={cardRef}
        className={`stream-event-card${swipeClass}`}
        onTouchStart={isOwner ? handleTouchStart : undefined}
        onTouchMove={isOwner ? handleTouchMove : undefined}
        onTouchEnd={isOwner ? handleTouchEnd : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="stream-event-card"
        sx={{
          position: 'relative',
          flex: 1,
          bgcolor: isSelected ? 'var(--stream-card-bg)' : 'transparent',
          border: `1px solid ${isSelected ? dotColor : 'rgba(255, 255, 255, 0.08)'}`,
          borderRadius: '10px',
          p: 1.5,
          mb: isLast ? 0 : 'var(--stream-card-gap)',
          overflow: 'visible',
          // Note: transform transition handled by JS in handleTouchEnd for swipe
          transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          // Desktop hover effect
          '@media (hover: hover)': {
            '&:hover': {
              bgcolor: 'var(--stream-card-bg)',
              borderColor: 'var(--stream-dot-color)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              // Show hover icons
              '& .stream-hover-icons': {
                opacity: 1,
                pointerEvents: 'auto',
              },
            },
          },
        }}
      >
        {/* Desktop hover icons - top-right boundary */}
        <Box
          className="stream-hover-icons"
          sx={{
            position: 'absolute',
            top: -12,
            right: -8,
            display: 'flex',
            gap: 0.5,
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.15s ease',
            zIndex: 10,
            // Hide on mobile (touch devices)
            '@media (hover: none)': {
              display: 'none',
            },
          }}
        >
          {/* View on canvas (eye) icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewOnCanvas?.(event);
            }}
            title="View on canvas"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid var(--stream-border)',
              background: 'var(--stream-bg)',
              color: 'var(--stream-text-secondary)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--stream-dot-color)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'var(--stream-dot-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--stream-bg)';
              e.currentTarget.style.color = 'var(--stream-text-secondary)';
              e.currentTarget.style.borderColor = 'var(--stream-border)';
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>visibility</span>
          </button>
          {/* Edit in editor icon */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditInEditor?.(event);
              }}
              title="Edit event"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid var(--stream-border)',
                background: 'var(--stream-bg)',
                color: 'var(--stream-text-secondary)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--stream-dot-color)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'var(--stream-dot-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--stream-bg)';
                e.currentTarget.style.color = 'var(--stream-text-secondary)';
                e.currentTarget.style.borderColor = 'var(--stream-border)';
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
            </button>
          )}
        </Box>

        {isOwner && isSwiped && swipeDirection === 'left' && (
          <button
            className="swipe-action delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(event.id);
            }}
          >
            <span className="material-symbols-rounded">delete</span>
            Delete
          </button>
        )}

        <Box className="card-content">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: event.description ? 0.5 : 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'var(--stream-text-primary)',
                fontWeight: 600,
                fontSize: '1.05rem',
                lineHeight: 1.3,
              }}
            >
              {event.title}
            </Typography>
            {/* Sources indicator badge */}
            {event.sources && event.sources.length > 0 && (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  onEditInEditor?.(event);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  px: 0.6,
                  py: 0.2,
                  borderRadius: '4px',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'var(--stream-dot-color)',
                  },
                }}
                title={`${event.sources.length} source${event.sources.length !== 1 ? 's' : ''} - click to view`}
              >
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: 16,
                    color: 'var(--stream-text-secondary)',
                  }}
                >
                  source
                </span>
                <Typography
                  sx={{
                    color: 'var(--stream-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {event.sources.length}
                </Typography>
              </Box>
            )}
          </Box>
          {event.description && (
            <>
              <Typography
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
              {/* Show more/less button - P2-7: Uses length heuristic instead of JS measurement */}
              {showExpandButton && (
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
                  {isExpanded ? 'Show less' : 'Show more'}
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

        {isOwner && isSwiped && swipeDirection === 'right' && (
          <button
            className="swipe-action edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(event);
            }}
          >
            <span className="material-symbols-rounded">edit</span>
            Edit
          </button>
        )}
      </Box>
    </Box>
    </div>
  );
});

/**
 * StreamViewer - Main component
 */
export function StreamViewer({
  events,
  totalEvents,
  searchQuery,
  onEventClick,
  selectedEventId,
  onEdit,
  onDelete,
  isOwner = false,
  onViewOnCanvas,
  onEditInEditor,
  onEventMouseEnter,
  onEventMouseLeave,
}: StreamViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px

  // Track which events are expanded
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  // P2-8: Simplified swipe state - only updated on touchEnd, not during animation
  const [swipedEventId, setSwipedEventId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Responsive line clamp: 3 on mobile, 5 on desktop - memoized to prevent re-renders
  const lineClamp = useMemo(() => isMobile ? 3 : 5, [isMobile]);

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  // Handle click - just call the callback
  const handleClick = useCallback((event: Event) => {
    setSwipedEventId(null);
    setSwipeDirection(null);
    onEventClick?.(event);
  }, [onEventClick]);

  // Toggle expand state for an event
  const toggleExpand = useCallback((eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // P2-8: Simplified swipe action handler - only called on touchEnd
  const handleSwipeAction = useCallback((eventId: string, direction: 'left' | 'right' | null) => {
    if (!isOwner) return;

    if (direction) {
      setSwipedEventId(eventId);
      setSwipeDirection(direction);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setSwipedEventId(null);
        setSwipeDirection(null);
      }, 3000);
    } else {
      setSwipedEventId(null);
      setSwipeDirection(null);
    }
  }, [isOwner]);

  useEffect(() => {
    if (!isOwner) {
      setSwipedEventId(null);
      setSwipeDirection(null);
    }
  }, [isOwner]);

  useEffect(() => {
    if (swipedEventId && !events.some(ev => ev.id === swipedEventId)) {
      setSwipedEventId(null);
      setSwipeDirection(null);
    }
  }, [events, swipedEventId]);

  const total = totalEvents ?? events.length;
  const isFiltered = searchQuery && searchQuery.trim().length > 0;

  // P0-5: Dynamic item sizes for VariableSizeList (v0.8.13)
  // Add 16px for top padding (space for hover icons above cards)
  const COLLAPSED_HEIGHT = 136; // 120 + 16
  const EXPANDED_HEIGHT = 216; // 200 + 16
  const listRef = useRef<VariableSizeList>(null);

  // Calculate dynamic item size based on expanded state
  const getItemSize = useCallback((index: number) => {
    const event = sortedEvents[index];
    return expandedEvents.has(event.id) ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
  }, [sortedEvents, expandedEvents]);

  // Reset list when expandedEvents changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expandedEvents]);

  // P0-5: itemData pattern for react-window - all data passed via itemData prop
  // This avoids closure issues and allows Row callback to have empty deps
  const itemData = useMemo(() => ({
    sortedEvents,
    selectedEventId,
    expandedEvents,
    swipedEventId,
    swipeDirection,
    lineClamp,
    handleClick,
    toggleExpand,
    isOwner,
    handleSwipeAction,
    onDelete,
    onEdit,
    onViewOnCanvas,
    onEditInEditor,
    onEventMouseEnter,
    onEventMouseLeave,
  }), [
    sortedEvents, selectedEventId, expandedEvents, swipedEventId, swipeDirection,
    lineClamp, handleClick, toggleExpand, isOwner, handleSwipeAction,
    onDelete, onEdit, onViewOnCanvas, onEditInEditor, onEventMouseEnter, onEventMouseLeave
  ]);

  // Type for itemData to use in Row component
  type ItemData = typeof itemData;

  // P0-5: Row renderer for react-window virtualization
  // Note: Must be defined before early returns to comply with Rules of Hooks
  // All data comes via itemData prop - empty deps array to avoid recreating callback
  const Row = useCallback(({ index, style, data }: {
    index: number;
    style: React.CSSProperties;
    data: ItemData;
  }) => {
    const event = data.sortedEvents[index];
    return (
      <StreamEventCard
        key={event.id}
        event={event}
        index={index}
        isLast={index === data.sortedEvents.length - 1}
        isSelected={data.selectedEventId === event.id}
        isExpanded={data.expandedEvents.has(event.id)}
        lineClamp={data.lineClamp}
        onClick={data.handleClick}
        onToggleExpand={data.toggleExpand}
        isOwner={data.isOwner}
        swipedEventId={data.swipedEventId}
        swipeDirection={data.swipeDirection}
        onSwipeAction={data.handleSwipeAction}
        onDelete={data.onDelete}
        onEdit={data.onEdit}
        onViewOnCanvas={data.onViewOnCanvas}
        onEditInEditor={data.onEditInEditor}
        onMouseEnter={data.onEventMouseEnter}
        onMouseLeave={data.onEventMouseLeave}
        style={style}
      />
    );
  }, []);

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Event list */}
      <Box sx={{ p: 2, flex: 1, minHeight: 0 }} data-testid="stream-scroll-container">
        {/* Events */}
        {sortedEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'var(--stream-text-muted)' }}>
              No events match "{searchQuery}"
            </Typography>
          </Box>
        ) : (
          /* P0-5: Virtualized list for performance with large event lists */
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => (
              <List
                ref={listRef}
                height={height - 60} /* Account for footer */
                width={width}
                itemCount={sortedEvents.length}
                itemSize={getItemSize}
                itemData={itemData}
                overscanCount={5}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </Box>

      {/* Event count footer */}
      <Box
        sx={{
          py: 2,
          px: 2,
          borderTop: '1px solid var(--stream-rail-color)',
          textAlign: 'center',
          flexShrink: 0,
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
  );
}
