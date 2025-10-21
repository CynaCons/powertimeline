import { useCallback, useEffect, useRef, useState } from 'react';

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const setNode = useCallback((node: T | null) => {
    // Cleanup previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    ref.current = node;
    if (!node) {
      setSize({ width: 0, height: 0 });
      return;
    }

    // Create new observer for the new node
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    observerRef.current = ro;
    ro.observe(node);

    // Initialize immediately
    const cr = node.getBoundingClientRect();
    setSize({ width: cr.width, height: cr.height });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return { ref: setNode, size } as const;
}
