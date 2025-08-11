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

  return { viewStart, viewEnd, setWindow, nudge, zoom, animateTo };
}
