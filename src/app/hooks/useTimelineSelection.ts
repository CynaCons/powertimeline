import { useState, useCallback, useEffect, useRef } from 'react';

interface TimelineSelection {
  isSelecting: boolean;
  isPanning: boolean;
  startX: number;
  currentX: number;
  containerLeft: number;
  containerWidth: number;
  initialViewStart: number;
  initialViewEnd: number;
}

interface UseTimelineSelectionProps {
  viewStart: number;
  viewEnd: number;
  setWindow: (start: number, end: number) => void;
  snapBackToBounds: () => void;
}

export function useTimelineSelection({ viewStart, viewEnd, setWindow, snapBackToBounds }: UseTimelineSelectionProps) {
  const [timelineSelection, setTimelineSelection] = useState<TimelineSelection | null>(null);
  const spaceKeyHeldRef = useRef(false);
  const [spaceKeyHeld, setSpaceKeyHeld] = useState(false);

  // Track Space key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceKeyHeldRef.current = true;
        setSpaceKeyHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceKeyHeldRef.current = false;
        setSpaceKeyHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on the timeline area, not on cards or other elements
    const target = e.target as Element;
    if (
      target?.closest('[data-testid="event-card"]') ||
      target?.closest('[data-testid="timeline-anchor"]') ||
      target?.closest('.panel') ||
      target?.closest('.overlay')
    ) {
      return; // Don't start selection if clicking on cards or UI elements
    }

    const container = document.querySelector('.absolute.inset-0.ml-14 > .w-full.h-full.relative') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left;

    // Default is selection-zoom mode (double-cursor zoom)
    // Space+Click enables pan mode
    const isSelectionMode = !spaceKeyHeldRef.current;

    setTimelineSelection({
      isSelecting: isSelectionMode,
      isPanning: !isSelectionMode,
      startX,
      currentX: startX,
      containerLeft: rect.left,
      containerWidth: rect.width,
      initialViewStart: viewStart,
      initialViewEnd: viewEnd,
    });

    e.preventDefault();
  }, [viewStart, viewEnd]);

  const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
    if (!timelineSelection || (!timelineSelection.isSelecting && !timelineSelection.isPanning)) return;

    const currentX = e.clientX - timelineSelection.containerLeft;

    if (timelineSelection.isPanning) {
      // Calculate pan delta
      const leftMargin = 96;
      const rightMargin = 40;
      const usableWidth = timelineSelection.containerWidth - leftMargin - rightMargin;

      const deltaX = currentX - timelineSelection.startX;
      const timelineDelta = -(deltaX / usableWidth) * (timelineSelection.initialViewEnd - timelineSelection.initialViewStart);

      const newStart = timelineSelection.initialViewStart + timelineDelta;
      const newEnd = timelineSelection.initialViewEnd + timelineDelta;

      // Clamp panning to valid bounds
      const width = newEnd - newStart;
      let clampedStart = newStart;
      let clampedEnd = newEnd;

      if (clampedStart < 0) {
        clampedStart = 0;
        clampedEnd = width;
      }
      if (clampedEnd > 1) {
        clampedEnd = 1;
        clampedStart = 1 - width;
      }

      setWindow(clampedStart, clampedEnd);
    } else {
      // Selection mode - just track cursor
      setTimelineSelection(prev => prev ? {
        ...prev,
        currentX: Math.max(0, Math.min(timelineSelection.containerWidth, currentX))
      } : null);
    }
  }, [timelineSelection, setWindow]);

  const handleTimelineMouseUp = useCallback(() => {
    if (!timelineSelection || (!timelineSelection.isSelecting && !timelineSelection.isPanning)) return;

    if (timelineSelection.isPanning) {
      // Snap back to valid bounds if out of bounds
      snapBackToBounds();
      setTimelineSelection(null);
      return;
    }

    // Selection mode - zoom to selection
    const { startX, currentX, containerWidth } = timelineSelection;

    // Calculate timeline positions (0-1) for the selection
    const leftMargin = 96; // rail + padding
    const rightMargin = 40;
    const usableWidth = containerWidth - leftMargin - rightMargin;

    const minX = Math.min(startX, currentX);
    const maxX = Math.max(startX, currentX);

    // Convert screen coordinates to timeline positions
    const startPos = Math.max(0, Math.min(1, (minX - leftMargin) / usableWidth));
    const endPos = Math.max(0, Math.min(1, (maxX - leftMargin) / usableWidth));

    // Convert view positions to actual timeline positions
    const currentWindowWidth = viewEnd - viewStart;
    const selectionStart = viewStart + (startPos * currentWindowWidth);
    const selectionEnd = viewStart + (endPos * currentWindowWidth);

    // Only zoom if selection is meaningful (at least 20px wide)
    if (Math.abs(maxX - minX) > 20) {
      setWindow(
        Math.max(0, Math.min(1, selectionStart)),
        Math.max(0, Math.min(1, selectionEnd))
      );
    }

    setTimelineSelection(null);
  }, [timelineSelection, viewStart, viewEnd, setWindow, snapBackToBounds]);

  // Add global mouse listeners for drag
  useEffect(() => {
    const isActive = timelineSelection?.isSelecting || timelineSelection?.isPanning;
    if (!isActive) return;

    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
    };
  }, [handleTimelineMouseMove, handleTimelineMouseUp, timelineSelection?.isSelecting, timelineSelection?.isPanning]);

  return {
    timelineSelection,
    handleTimelineMouseDown,
    spaceKeyHeld
  };
}