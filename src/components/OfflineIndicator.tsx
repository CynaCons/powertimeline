import { useCallback, useEffect, useRef, useState } from 'react';

const OFFLINE_SHOW_DELAY_MS = 800; // ensures banner appears within 2 seconds
const CONNECTIVITY_CHECK_TIMEOUT_MS = 4000;

function getOnlineStatus() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(getOnlineStatus());
  const [showBanner, setShowBanner] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const offlineTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const clearOfflineTimer = useCallback(() => {
    if (offlineTimerRef.current) {
      window.clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
    }
  }, []);

  const scheduleOfflineBanner = useCallback(() => {
    clearOfflineTimer();
    offlineTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setShowBanner(true);
      }
    }, OFFLINE_SHOW_DELAY_MS);
  }, [clearOfflineTimer]);

  useEffect(() => {
    mountedRef.current = true;

    const handleOnline = () => {
      setIsChecking(false);
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsChecking(false);
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!getOnlineStatus()) {
      setIsOnline(false);
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearOfflineTimer();
    };
  }, [clearOfflineTimer]);

  useEffect(() => {
    if (!isOnline) {
      scheduleOfflineBanner();
    } else {
      clearOfflineTimer();
      setShowBanner(false);
    }
  }, [isOnline, clearOfflineTimer, scheduleOfflineBanner]);

  const checkConnectivity = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), CONNECTIVITY_CHECK_TIMEOUT_MS);
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (!mountedRef.current) return;
      const online = response.ok;
      setIsOnline(online);
      setShowBanner(!online);
    } catch {
      if (!mountedRef.current) return;
      setIsOnline(false);
      setShowBanner(true);
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [isChecking]);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1200] drop-shadow-lg">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border max-w-xl w-[420px]"
        role="status"
        aria-live="polite"
        style={{
          backgroundColor: 'var(--color-warning-50)',
          borderColor: 'var(--color-warning-200)',
          color: 'var(--color-text-primary)',
        }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          style={{
            backgroundColor: 'var(--color-warning-100)',
            color: 'var(--color-warning-700)',
          }}
        >
          <span className="material-symbols-rounded" aria-hidden="true">wifi_off</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">You&apos;re offline.</p>
          <p className="text-xs text-left" style={{ color: 'var(--color-text-secondary)' }}>
            Some features may be unavailable.
          </p>
        </div>
        <button
          type="button"
          onClick={checkConnectivity}
          disabled={isChecking}
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--page-accent)',
            color: 'var(--color-neutral-0)',
            opacity: isChecking ? 0.8 : 1,
          }}
          aria-busy={isChecking}
        >
          {isChecking && (
            <span className="material-symbols-rounded animate-spin text-base" aria-hidden="true">
              progress_activity
            </span>
          )}
          Retry
        </button>
      </div>
    </div>
  );
}
