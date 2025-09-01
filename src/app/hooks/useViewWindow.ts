import { useCallback, useRef, useState } from 'react';

export function useViewWindow(initialStart = 0, initialEnd = 1) {
  const [viewStart, setViewStart] = useState(initialStart);
  const [viewEnd, setViewEnd] = useState(initialEnd);
  const animRef = useRef<number | null>(null);

  const setWindow = useCallback((start: number, end: number) => {
    setViewStart(Math.max(0, Math.min(1, start)));
    setViewEnd(Math.max(0, Math.min(1, end)));
  }, []);

  const nudge = useCallback((delta: number) => {
    const width = Math.max(viewEnd - viewStart, 0.05);
    let start = viewStart + delta; let end = viewEnd + delta;
    if (start < 0) { end -= start; start = 0; }
    if (end > 1) { start -= end - 1; end = 1; }
    if (end - start < width) end = start + width;
    setWindow(start, end);
  }, [viewStart, viewEnd, setWindow]);

  const zoom = useCallback((factor: number) => {
    const center = (viewStart + viewEnd) / 2;
    let half = ((viewEnd - viewStart) / 2) * factor;
    half = Math.max(0.025, Math.min(0.5, half));
    setWindow(center - half, center + half);
  }, [viewStart, viewEnd, setWindow]);

  const zoomAtCursor = useCallback((factor: number, cursorX?: number, viewportWidth?: number) => {
    if (cursorX === undefined || viewportWidth === undefined) {
      // Fallback to center zoom if no cursor position provided
      return zoom(factor);
    }
    
    // Convert cursor X position to timeline ratio within CURRENT view window
    // Account for navigation rail (56px) and margins
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = viewportWidth - leftMargin - rightMargin;
    
    // Calculate cursor position as ratio of usable timeline width (0-1)
    const cursorRatioInViewport = Math.max(0, Math.min(1, (cursorX - leftMargin) / usableWidth));
    
    // Convert viewport ratio to absolute timeline position (accounting for current view window)
    const currentWindowWidth = viewEnd - viewStart;
    const cursorTimePosition = viewStart + (currentWindowWidth * cursorRatioInViewport);
    
    
    // Calculate new window width
    let newWindowWidth = currentWindowWidth * factor;
    newWindowWidth = Math.max(0.05, Math.min(1.0, newWindowWidth)); // Min 5%, max 100%
    
    // Calculate new bounds keeping cursor position stable
    const halfWidth = newWindowWidth / 2;
    let newStart = cursorTimePosition - halfWidth;
    let newEnd = cursorTimePosition + halfWidth;
    
    // Clamp to valid range [0, 1] while preserving cursor focus
    if (newStart < 0) {
      newStart = 0;
      newEnd = Math.min(1, newWindowWidth);
    } else if (newEnd > 1) {
      newEnd = 1;
      newStart = Math.max(0, 1 - newWindowWidth);
    }
    
    // Ensure minimum width is maintained
    const finalWidth = newEnd - newStart;
    if (finalWidth < 0.05) {
      const center = Math.max(0.025, Math.min(0.975, cursorTimePosition));
      newStart = center - 0.025;
      newEnd = center + 0.025;
    }
    
    console.log(`🔧 ZOOM RESULT: cursor=${cursorTimePosition.toFixed(3)}, window=[${newStart.toFixed(3)}, ${newEnd.toFixed(3)}]`);
    setWindow(newStart, newEnd);
  }, [viewStart, viewEnd, setWindow, zoom]);

  const animateTo = useCallback((targetStart: number, targetEnd: number, durationMs = 400) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const startStart = viewStart; const startEnd = viewEnd; const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / durationMs);
      const e = ease(t);
      const s = startStart + (targetStart - startStart) * e;
      const ee = startEnd + (targetEnd - startEnd) * e;
      setWindow(s, ee);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [viewStart, viewEnd, setWindow]);

  return { viewStart, viewEnd, setWindow, nudge, zoom, zoomAtCursor, animateTo };
}
