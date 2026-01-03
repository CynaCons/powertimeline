/**
 * useDebounce - Custom hook for debouncing values
 * Performance optimization for search and filter inputs (P1-2)
 */

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the input value.
 * The returned value only updates after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
