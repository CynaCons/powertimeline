import { useEffect, useRef } from 'react';

interface UseTimelineZoomProps {
  zoomAtCursor: (zoomFactor: number, cursorX: number, windowWidth: number, containerLeft?: number, containerWidth?: number) => void;
  hoveredEventId?: string;
  viewStart?: number;
  viewEnd?: number;
  setWindow?: (start: number, end: number) => void;
}

export function useTimelineZoom({ zoomAtCursor, hoveredEventId, viewStart, viewEnd, setWindow }: UseTimelineZoomProps) {
  // Pan accumulator for smooth Shift+scroll panning
  const panAccumulatorRef = useRef(0);
  const panBaselineStartRef = useRef(viewStart);
  const panBaselineEndRef = useRef(viewEnd);
  const rafIdRef = useRef<number | null>(null);
  const setWindowRef = useRef(setWindow);

  // Keep setWindow ref in sync
  useEffect(() => {
    setWindowRef.current = setWindow;
  }, [setWindow]);

  // Sync baseline when view window changes externally (e.g., from other interactions)
  useEffect(() => {
    // Only update baseline if we're not in the middle of a pan operation
    if (rafIdRef.current === null) {
      panBaselineStartRef.current = viewStart;
      panBaselineEndRef.current = viewEnd;
      panAccumulatorRef.current = 0;
    }
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

        // Accumulate the delta instead of applying immediately
        panAccumulatorRef.current += panDelta;

        // Cancel any pending animation frame
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        // Capture baseline for closure
        const baselineStart = panBaselineStartRef.current;

        // Schedule update on next frame to batch rapid scroll events
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;

          // Apply accumulated delta to baseline
          const totalDelta = panAccumulatorRef.current;
          const newStart = Math.max(0, Math.min(1 - currentWidth, baselineStart + totalDelta));
          const newEnd = newStart + currentWidth;

          // Update baseline for next batch of events
          panBaselineStartRef.current = newStart;
          panBaselineEndRef.current = newEnd;
          panAccumulatorRef.current = 0;

          setWindowRef.current?.(newStart, newEnd);
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
  }, [zoomAtCursor, hoveredEventId]); // viewStart, viewEnd, setWindow are accessed via refs
}