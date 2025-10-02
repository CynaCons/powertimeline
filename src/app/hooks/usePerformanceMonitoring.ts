import { useEffect } from 'react';
import { environment } from '../../config/environment';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { logger } from '../../utils/logger';

const monitoringEnabled = environment.flags.enableTelemetry || environment.isDevelopment;

const logMetrics = () => {
  const metrics = performanceMonitor.getMetrics();
  const latest = metrics[metrics.length - 1];
  let lastBundleLoad = 0;
  for (let i = metrics.length - 1; i >= 0; i -= 1) {
    if (metrics[i].bundleLoadTime > 0) {
      lastBundleLoad = metrics[i].bundleLoadTime;
      break;
    }
  }

  logger.debug('Performance metrics snapshot', {
    averageRenderMs: Number(performanceMonitor.getAverageRenderTime().toFixed(2)),
    averageLayoutMs: Number(performanceMonitor.getAverageLayoutTime().toFixed(2)),
    memoryUsageMb: Number(performanceMonitor.getMemoryUsage().toFixed(2)),
    lastBundleLoadMs: lastBundleLoad,
    lastRenderMs: latest?.renderTime ?? 0,
    lastLayoutMs: latest?.layoutTime ?? 0
  });
};

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (!monitoringEnabled || typeof window === 'undefined') {
      return;
    }

    const initialTimeout = window.setTimeout(logMetrics, 5000);
    const interval = window.setInterval(logMetrics, 60000);

    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(interval);
    };
  }, []);
};
