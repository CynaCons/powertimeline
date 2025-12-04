/**
 * StreamViewerOverlay - Modal wrapper for StreamViewer
 * v0.5.26.4 - Simplified: existing minimap/breadcrumbs lifted above via z-index
 *
 * Features:
 * - Transparent header gap allowing existing minimap/breadcrumbs to show through
 * - Proper mouse wheel scrolling (minHeight: 0 fix)
 * - Desktop: Centered modal (85% viewport, max 900px width)
 * - Mobile: Full-screen overlay (100vw x 100vh)
 * - Keyboard navigation (arrow keys between events)
 * - Focus trap when overlay opens
 * - Fade animation (150ms)
 * - Swipe to close on mobile
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Box, IconButton, Typography, useMediaQuery, useTheme, TextField, InputAdornment, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { StreamViewer } from './StreamViewer';
import type { Event } from '../types';

interface StreamViewerOverlayProps {
  open: boolean;
  onClose: () => void;
  events: Event[];
  timelineTitle: string;
  /** Called when user clicks an event (for timeline zoom/navigation) */
  onEventClick?: (event: Event) => void;
}

export function StreamViewerOverlay({
  open,
  onClose,
  events,
  onEventClick,
}: StreamViewerOverlayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Swipe gesture tracking for mobile
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.date.includes(query)
    );
  }, [events, searchQuery]);

  // Sort events chronologically (same as StreamViewer) for keyboard navigation
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredEvents]);

  const handleEventClick = (event: Event) => {
    setSelectedEventId(event.id);
    onEventClick?.(event);

    // Scroll to selected event in the list
    setTimeout(() => {
      const eventElement = scrollContainerRef.current?.querySelector(`[data-event-id="${event.id}"]`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // Scroll to selected event helper
  const scrollToEvent = useCallback((eventId: string) => {
    setTimeout(() => {
      const eventElement = scrollContainerRef.current?.querySelector(`[data-event-id="${eventId}"]`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, []);

  // Handle keyboard navigation - Escape, Arrow Up/Down
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Don't handle arrow keys if user is typing in search
      const isInSearchField = document.activeElement?.getAttribute('data-testid') === 'stream-search-input' ||
        document.activeElement?.closest('[data-testid="stream-search-input"]');
      if (isInSearchField) return;

      // Arrow Up/Down for event navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (sortedEvents.length === 0) return;

        const currentIndex = selectedEventId
          ? sortedEvents.findIndex(ev => ev.id === selectedEventId)
          : -1;

        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < sortedEvents.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : sortedEvents.length - 1;
        }

        const nextEvent = sortedEvents[nextIndex];
        setSelectedEventId(nextEvent.id);
        onEventClick?.(nextEvent);
        scrollToEvent(nextEvent.id);
      }
    };

    // Use capture: true to intercept before input elements can handle it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose, sortedEvents, selectedEventId, onEventClick, scrollToEvent]);

  // Focus trap - focus modal when opened, trap focus within
  useEffect(() => {
    if (!open || !modalRef.current) return;

    // Focus the search input when overlay opens (better UX)
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 150); // Wait for fade animation

    return () => clearTimeout(timer);
  }, [open]);

  // Swipe to close on mobile (swipe down from top)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, [isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || touchStartY.current === null || touchStartX.current === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchEndY - touchStartY.current;
    const deltaX = Math.abs(touchEndX - touchStartX.current);

    // Swipe down gesture: >100px vertical, less than 50px horizontal (not a horizontal swipe)
    // Only trigger if we're near the top of the scroll container
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    if (deltaY > 100 && deltaX < 50 && scrollTop < 20) {
      onClose();
    }

    touchStartY.current = null;
    touchStartX.current = null;
  }, [isMobile, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Block wheel events from reaching the canvas behind the overlay
  useEffect(() => {
    if (!open) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const blockWheelPropagation = (e: WheelEvent) => {
      // Stop wheel events from propagating to canvas behind overlay
      e.stopPropagation();
    };

    // Use capture phase to intercept before any other handlers
    overlay.addEventListener('wheel', blockWheelPropagation, { capture: true, passive: true });
    return () => overlay.removeEventListener('wheel', blockWheelPropagation, { capture: true });
  }, [open]);

  // Always render for Fade animation to work (open controls visibility)
  return (
    <Fade in={open} timeout={150} unmountOnExit>
      <Box
        ref={overlayRef}
        onClick={handleBackdropClick}
        data-testid="stream-viewer-overlay"
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Modal container */}
        <Box
          ref={modalRef}
          data-testid="stream-viewer-modal"
          sx={{
          bgcolor: 'var(--stream-bg)',
          color: 'var(--stream-text-primary)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Critical for flex scrolling
          // Desktop: 85% viewport, max 900px
          // Mobile: full screen
          ...(isMobile ? {
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            borderRadius: 0,
          } : {
            width: '85vw',
            maxWidth: 900,
            height: '85vh',
            maxHeight: '85vh',
            borderRadius: 2,
            border: '1px solid var(--stream-card-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }),
        }}
      >
        {/* Simplified header - just title and close button */}
        {/* The existing minimap/breadcrumbs appear ABOVE this overlay via z-index lift */}
        <Box
          data-testid="stream-viewer-header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'var(--stream-card-bg)',
            borderBottom: '1px solid var(--stream-card-border)',
            py: 1,
            px: 2,
            flexShrink: 0,
          }}
        >
          {/* Stream View title with icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 20, color: 'var(--stream-dot-color)' }}
            >
              view_stream
            </span>
            <Typography sx={{ color: 'var(--stream-text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
              Stream View
            </Typography>
            <Typography sx={{ color: 'var(--stream-text-muted)', fontSize: '0.8rem', ml: 0.5 }}>
              {searchQuery ? `${filteredEvents.length}/` : ''}{events.length}
            </Typography>
          </Box>

          {/* Search bar - in header */}
          <Box sx={{ flex: 1, mx: 2, maxWidth: 300 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputRef={searchInputRef}
              data-testid="stream-search-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--stream-text-muted)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ color: 'var(--stream-text-muted)', p: 0.25 }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'var(--stream-bg)',
                  borderRadius: 1,
                  height: 32,
                  '& fieldset': {
                    borderColor: 'var(--stream-card-border)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--stream-text-muted)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--stream-dot-color)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'var(--stream-text-primary)',
                  fontSize: '0.85rem',
                  py: 0.5,
                  '&::placeholder': {
                    color: 'var(--stream-text-muted)',
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Close button */}
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close (Escape)"
            data-testid="stream-close-button"
            sx={{
              color: 'var(--stream-text-secondary)',
              flexShrink: 0,
              '&:hover': {
                color: 'var(--stream-text-primary)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable Content - CRITICAL: minHeight: 0 allows flex child to scroll */}
        <Box
          ref={scrollContainerRef}
          data-testid="stream-scroll-container"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          sx={{
            flex: 1,
            minHeight: 0, // CRITICAL: Without this, flex child won't scroll
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            // Mobile: account for safe area
            ...(isMobile && {
              pb: 'env(safe-area-inset-bottom, 16px)',
            }),
          }}
        >
          <StreamViewer
            events={filteredEvents}
            totalEvents={events.length}
            searchQuery={searchQuery}
            onEventClick={handleEventClick}
            selectedEventId={selectedEventId}
          />
        </Box>
      </Box>
    </Box>
    </Fade>
  );
}
