import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/index.css'
import App from './App.tsx'
import { environment } from './config/environment'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performanceMonitor'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from './styles/theme'
import { ChronoThemeProvider, useTheme } from './contexts/ThemeContext'
// Firebase disabled for now - will be enabled in v0.4.x when needed
// import './lib/firebase'

// App wrapper to provide dynamic theme based on context
function AppWithTheme() {
  const { isDarkMode } = useTheme();
  const theme = createAppTheme(isDarkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

if (typeof document !== 'undefined') {
  const rootElement = document.documentElement;
  rootElement.dataset.mode = environment.mode;
  rootElement.dataset.version = environment.appVersion;
}

logger.initialize();

const monitoringEnabled = environment.flags.enableTelemetry || environment.isDevelopment;

if (monitoringEnabled && typeof window !== 'undefined') {
  window.addEventListener('load', () => performanceMonitor.recordBundleLoadTime(), { once: true });
  performanceMonitor.startRenderMeasurement();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChronoThemeProvider>
      <AppWithTheme />
    </ChronoThemeProvider>
  </StrictMode>,
)

if (monitoringEnabled && typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    performanceMonitor.endRenderMeasurement();
    const metrics = performanceMonitor.getMetrics();
    const lastMetric = metrics[metrics.length - 1];
    let lastBundleLoad = 0;
    for (let i = metrics.length - 1; i >= 0; i -= 1) {
      if (metrics[i].bundleLoadTime > 0) {
        lastBundleLoad = metrics[i].bundleLoadTime;
        break;
      }
    }
    logger.debug('Initial render performance snapshot', {
      renderTimeMs: lastMetric?.renderTime ?? 0,
      layoutTimeMs: lastMetric?.layoutTime ?? 0,
      bundleLoadTimeMs: lastBundleLoad,
      memoryUsageMb: performanceMonitor.getMemoryUsage()
    });
  });
}
