import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer } from '../components/ToastContainer';

/**
 * Centralized toast notifications for async flows:
 * - Timeline save/update/delete
 * - Timeline forks
 * - Import/export pipelines
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
}

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, options?: ToastOptions) => string;
  showSuccess: (message: string, options?: ToastOptions) => string;
  showError: (message: string, options?: ToastOptions) => string;
  showWarning: (message: string, options?: ToastOptions) => string;
  showInfo: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION_MS = 4000;
const MIN_DURATION_MS = 3000;
const MAX_DURATION_MS = 5000;

function clampDuration(duration: number | undefined) {
  const fallback = duration ?? DEFAULT_DURATION_MS;
  return Math.min(Math.max(fallback, MIN_DURATION_MS), MAX_DURATION_MS);
}

function createToastId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timeouts.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', options?: ToastOptions) => {
    const id = createToastId();
    const duration = clampDuration(options?.duration);
    setToasts((prev) => [...prev, { id, message, variant, duration }]);

    const timeoutId = window.setTimeout(() => dismissToast(id), duration);
    timeouts.current.set(id, timeoutId);
    return id;
  }, [dismissToast]);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => showToast(message, 'success', options), [showToast]);
  const showError = useCallback((message: string, options?: ToastOptions) => showToast(message, 'error', options), [showToast]);
  const showWarning = useCallback((message: string, options?: ToastOptions) => showToast(message, 'warning', options), [showToast]);
  const showInfo = useCallback((message: string, options?: ToastOptions) => showToast(message, 'info', options), [showToast]);

  useEffect(() => () => {
    timeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeouts.current.clear();
  }, []);

  const value = useMemo(() => ({
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
  }), [dismissToast, showError, showInfo, showSuccess, showToast, showWarning]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
