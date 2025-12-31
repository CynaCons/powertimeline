import { useEffect, useRef } from 'react';

interface UseTimelineZoomProps {
  zoomAtCursor: (zoomFactor: number, cursorX: number, windowWidth: number, containerLeft?: number, containerWidth?: number) => void;
  hoveredEventId?: string;
  viewStart?: number;
  viewEnd?: number;
  setWindow?: (start: number, end: number) => void;
}

export function useTimelineZoom({ zoomAtCursor, hoveredEventId, viewStart, viewEnd, setWindow }: UseTimelineZoomProps) {
  // Use refs to avoid stale closure values during rapid scroll events
  const viewStartRef = useRef(viewStart);
  const viewEndRef = useRef(viewEnd);
  const setWindowRef = useRef(setWindow);

  // Keep refs in sync with props
  useEffect(() => {
    viewStartRef.current = viewStart;
    viewEndRef.current = viewEnd;
    setWindowRef.current = setWindow;
  }, [viewStart, viewEnd, setWindow]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Skip if user is scrolling in input fields or panels
      const target = e.target as Element;
      if (target?.closest('input, textarea, select, .panel, .overlay, .dev-panel')) {
        return; // Allow normal scrolling in UI elements
      }

      e.preventDefault();

      // If Shift is held during scroll, pan horizontally instead of zoom
      // Use refs for current values to avoid stale closure during rapid scrolling
      const currentViewStart = viewStartRef.current;
      const currentViewEnd = viewEndRef.current;
      const currentSetWindow = setWindowRef.current;

      if (e.shiftKey && currentViewStart !== undefined && currentViewEnd !== undefined && currentSetWindow) {
        const currentWidth = currentViewEnd - currentViewStart;
        // Scale factor to match drag-pan feel (~50px drag equivalent per scroll tick)
        const panAmount = (e.deltaY / 2000) * currentWidth;
        const newStart = Math.max(0, Math.min(1 - currentWidth, currentViewStart + panAmount));
        const newEnd = newStart + currentWidth;
        currentSetWindow(newStart, newEnd);
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