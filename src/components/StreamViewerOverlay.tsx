/**
 * StreamViewerOverlay - Modal wrapper for StreamViewer
 * v0.5.26.4 - Simplified: existing minimap/breadcrumbs lifted above via z-index
 *
 * Features:
 * - Transparent header gap allowing existing minimap/breadcrumbs to show through
 * - Proper mouse wheel scrolling (minHeight: 0 fix)
 * - Desktop: Centered modal (85% viewport, max 900px width)
 * - Mobile: Full-screen overlay (100vw x 100vh)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Typography, useMediaQuery, useTheme, TextField, InputAdornment } from '@mui/material';
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

  // Handle Escape key - use capturing phase to catch before any input handlers
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Use capture: true to intercept before input elements can handle it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

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

  if (!open) return null;

  return (
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
  );
}
