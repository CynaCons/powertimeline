/**
 * StreamViewerOverlay - Modal wrapper for StreamViewer
 * v0.5.26 - Overlay popup for desktop, full-screen for mobile
 *
 * Access:
 * - Desktop: Centered modal (80% viewport, max 800px width)
 * - Mobile: Full-screen overlay (100vw x 100vh)
 * - No separate route - overlay within existing editor page
 */

import { Dialog, DialogContent, DialogTitle, IconButton, useMediaQuery, useTheme, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StreamViewer } from './StreamViewer';
import type { Event } from '../types';

interface StreamViewerOverlayProps {
  open: boolean;
  onClose: () => void;
  events: Event[];
  timelineTitle: string;
}

export function StreamViewerOverlay({
  open,
  onClose,
  events,
  timelineTitle
}: StreamViewerOverlayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: 'var(--stream-bg)',
          backgroundImage: 'none',
          // Desktop: 80% viewport, max 800px
          // Mobile: full screen (handled by fullScreen prop)
          ...(isMobile ? {} : {
            width: '80vw',
            maxWidth: 800,
            height: '80vh',
            maxHeight: '80vh',
            borderRadius: 3,
          }),
          // Custom scrollbar for the dialog
          '& ::-webkit-scrollbar': {
            width: 8,
          },
          '& ::-webkit-scrollbar-track': {
            bgcolor: 'var(--stream-bg)',
          },
          '& ::-webkit-scrollbar-thumb': {
            bgcolor: 'var(--stream-rail-color)',
            borderRadius: 4,
          },
        },
      }}
      // Keyboard handling
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'var(--stream-card-bg)',
          borderBottom: '1px solid var(--stream-card-border)',
          py: 1.5,
          px: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: 24,
              color: 'var(--stream-dot-color)',
            }}
          >
            view_stream
          </span>
          <Box
            component="span"
            sx={{
              color: 'var(--stream-text-primary)',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}
          >
            Stream View
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close stream view"
          sx={{
            color: 'var(--stream-text-secondary)',
            '&:hover': {
              color: 'var(--stream-text-primary)',
              bgcolor: 'var(--stream-card-border)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content - scrollable */}
      <DialogContent
        sx={{
          p: 0,
          overflow: 'auto',
          // Mobile: account for safe area (notch, home indicator)
          ...(isMobile && {
            pb: 'env(safe-area-inset-bottom, 16px)',
          }),
        }}
      >
        <StreamViewer
          events={events}
          timelineTitle={timelineTitle}
        />
      </DialogContent>
    </Dialog>
  );
}
