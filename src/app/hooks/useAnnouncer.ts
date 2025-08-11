import { useCallback, useRef, createElement } from 'react';

export function useAnnouncer() {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const announce = useCallback((msg: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = '';
      requestAnimationFrame(() => { if (regionRef.current) regionRef.current.textContent = msg; });
    }
  }, []);
  const renderLiveRegion = () => createElement('div', { 'aria-live': 'polite', className: 'sr-only', ref: regionRef });
  return { announce, renderLiveRegion };
}
