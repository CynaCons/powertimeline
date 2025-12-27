import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2" style={{ backgroundColor: 'var(--color-warning-500, #f59e0b)' }}>
      <span className="material-symbols-rounded text-sm" aria-hidden="true">wifi_off</span>
      <span className="text-sm font-medium">You're offline</span>
    </div>
  );
}
