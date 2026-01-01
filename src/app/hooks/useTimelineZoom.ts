import { useEffect, useRef, useState } from 'react';

interface UseTimelineZoomProps {
  zoomAtCursor: (zoomFactor: number, cursorX: number, windowWidth: number, containerLeft?: number, containerWidth?: number) => void;
  hoveredEventId?: string;
  viewStart?: number;
  viewEnd?: number;
  setWindow?: (start: number, end: number) => void;
}

export function useTimelineZoom({ zoomAtCursor, hoveredEventId, viewStart, viewEnd, setWindow }: UseTimelineZoomProps) {
  // Baseline refs for smooth Shift+scroll panning (updated immediately on each event)
  const panBaselineStartRef = useRef(viewStart);
  const panBaselineEndRef = useRef(viewEnd);
  const rafIdRef = useRef<number | null>(null);
  const setWindowRef = useRef(setWindow);
  // Track when we're actively panning to ignore stale React updates
  const lastWheelTimeRef = useRef<number>(0);
  const PAN_ACTIVE_WINDOW = 150; // ms to ignore syncs after last wheel event
  // Expose panning state for UI (e.g., hide hover previews during pan)
  const [isPanning, setIsPanning] = useState(false);
  const panningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep setWindow ref in sync
  useEffect(() => {
    setWindowRef.current = setWindow;
  }, [setWindow]);

  // Sync baseline when view window changes externally (e.g., from zoom or other pan)
  // FIX: During active panning, ignore React state updates to prevent rollback bug.
  // React's batched/async updates can arrive with stale values during rapid scrolling,
  // which would overwrite our ref-based position tracking and cause visual rollback.
  useEffect(() => {
    const timeSinceLastWheel = Date.now() - lastWheelTimeRef.current;

    // During active panning, refs are source of truth - ignore stale React updates
    if (timeSinceLastWheel < PAN_ACTIVE_WINDOW) {
      return;
    }

    panBaselineStartRef.current = viewStart;
    panBaselineEndRef.current = viewEnd;
  }, [viewStart, viewEnd]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Skip if user is scrolling in input fields or panels
      const target = e.target as Element;
      if (target?.closest('input, textarea, select, .panel, .overlay, .dev-panel')) {
        return; // Allow normal scrolling in UI elements
      }

      e.preventDefault();

      // If Shift is held during scroll, pan horizontally instead of zoom
      if (e.shiftKey && viewStart !== undefined && viewEnd !== undefined && setWindow &&
          panBaselineStartRef.current !== undefined && panBaselineEndRef.current !== undefined) {
        const currentWidth = panBaselineEndRef.current - panBaselineStartRef.current;
        // Scale factor to match drag-pan feel (~50px drag equivalent per scroll tick)
        const panDelta = (e.deltaY / 2000) * currentWidth;

        // Mark that we're actively panning - this prevents stale React syncs
        lastWheelTimeRef.current = Date.now();

        // Update isPanning state (debounced to avoid excessive re-renders)
        if (!isPanning) setIsPanning(true);
        if (panningTimeoutRef.current) clearTimeout(panningTimeoutRef.current);
        panningTimeoutRef.current = setTimeout(() => setIsPanning(false), PAN_ACTIVE_WINDOW);

        // Calculate new position immediately using current baseline
        // This avoids stale closure issues - each event sees the latest state
        const newStart = Math.max(0, Math.min(1 - currentWidth, panBaselineStartRef.current + panDelta));
        const newEnd = newStart + currentWidth;

        // Update baseline immediately for next event (no race condition)
        panBaselineStartRef.current = newStart;
        panBaselineEndRef.current = newEnd;

        // Cancel any pending animation frame (we'll schedule a new one)
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        // Schedule update on next frame - RAF just applies the latest ref values
        rafIdRef.current = requestAnimationFrame(() => {
          // Read final position from refs (may have been updated by more events)
          const finalStart = panBaselineStartRef.current!;
          const finalEnd = panBaselineEndRef.current!;

          // Clear RAF ID AFTER reading refs to avoid race window
          rafIdRef.current = null;

          setWindowRef.current?.(finalStart, finalEnd);
        });
        return;
      }

      // Get cursor position
      const cursorX = e.clientX;

      const container = document.querySelector('.absolute.inset-0.ml-14 > .w-full.h-full.relative') as HTMLElement | null;
      const rect = container?.getBoundingClientRect();

      // Determine zoom direction
      const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;

      // Check if we should use hover-centered zoom
      if (hoveredEventId) {
        // Find the hovered card element and use its screen position for zoom
        const cardElement = document.querySelector(`[data-event-id="${hoveredEventId}"]`) as HTMLElement;
        if (cardElement) {
          const cardRect = cardElement.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;

          // Use the card's visual position for zoom (keep it stable under cursor)
          if (rect) {
            zoomAtCursor(zoomFactor, cardCenterX, window.innerWidth, rect.left, rect.width);
            return;
          } else {
            zoomAtCursor(zoomFactor, cardCenterX, window.innerWidth);
            return;
          }
        }
      }

      // Fall back to cursor-centered zoom
      if (rect) {
        zoomAtCursor(zoomFactor, cursorX, window.innerWidth, rect.left, rect.width);
      } else {
        zoomAtCursor(zoomFactor, cursorX, window.innerWidth);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [zoomAtCursor, hoveredEventId, isPanning]); // viewStart, viewEnd, setWindow are accessed via refs

  return { isPanning };
}