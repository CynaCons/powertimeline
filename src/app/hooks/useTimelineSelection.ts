import { useState, useCallback, useEffect } from 'react';

interface TimelineSelection {
  isSelecting: boolean;
  startX: number;
  currentX: number;
  containerLeft: number;
  containerWidth: number;
}

interface UseTimelineSelectionProps {
  viewStart: number;
  viewEnd: number;
  setWindow: (start: number, end: number) => void;
}

export function useTimelineSelection({ viewStart, viewEnd, setWindow }: UseTimelineSelectionProps) {
  const [timelineSelection, setTimelineSelection] = useState<TimelineSelection | null>(null);

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

    setTimelineSelection({
      isSelecting: true,
      startX,
      currentX: startX,
      containerLeft: rect.left,
      containerWidth: rect.width
    });

    e.preventDefault();
  }, []);

  const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
    if (!timelineSelection?.isSelecting) return;

    const currentX = e.clientX - timelineSelection.containerLeft;
    setTimelineSelection(prev => prev ? {
      ...prev,
      currentX: Math.max(0, Math.min(timelineSelection.containerWidth, currentX))
    } : null);
  }, [timelineSelection]);

  const handleTimelineMouseUp = useCallback(() => {
    if (!timelineSelection?.isSelecting) return;

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
  }, [timelineSelection, viewStart, viewEnd, setWindow]);

  // Add global mouse listeners for drag
  useEffect(() => {
    if (!timelineSelection?.isSelecting) return;

    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
    };
  }, [handleTimelineMouseMove, handleTimelineMouseUp, timelineSelection?.isSelecting]);

  return {
    timelineSelection,
    handleTimelineMouseDown
  };
}