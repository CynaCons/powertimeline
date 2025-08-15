import { useCallback, useEffect, useRef, useState } from 'react';

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const setNode = useCallback((node: T | null) => {
    ref.current = node;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(node);
    // Initialize immediately
    const cr = node.getBoundingClientRect();
    setSize({ width: cr.width, height: cr.height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // no-op; hook lifecycle managed by callback ref
  }, []);

  return { ref: setNode, size } as const;
}
