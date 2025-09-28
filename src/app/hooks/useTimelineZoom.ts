import { useEffect } from 'react';

interface UseTimelineZoomProps {
  zoomAtCursor: (zoomFactor: number, cursorX: number, windowWidth: number, containerLeft?: number, containerWidth?: number) => void;
  hoveredEventId?: string;
}

export function useTimelineZoom({ zoomAtCursor, hoveredEventId }: UseTimelineZoomProps) {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Skip if user is scrolling in input fields or panels
      const target = e.target as Element;
      if (target?.closest('input, textarea, select, .panel, .overlay, .dev-panel')) {
        return; // Allow normal scrolling in UI elements
      }

      e.preventDefault();

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
  }, [zoomAtCursor, hoveredEventId]);
}