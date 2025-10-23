import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './styles/index.css'
import { HomePage } from './pages/HomePage'
import { UserProfilePage } from './pages/UserProfilePage'
import { EditorPage } from './pages/EditorPage'
import { environment } from './config/environment'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performanceMonitor'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from './styles/theme'
import { ChronoThemeProvider, useTheme } from './contexts/ThemeContext'
import { initializeUsers, getTimelines, saveTimelines, migrateEventsToTimeline } from './lib/homePageStorage'
import { EventStorage } from './lib/storage'
// Firebase disabled for now - will be enabled in v0.4.x when needed
// import './lib/firebase'

// Initialize users and migrate existing timeline data on first load
function initializeHomePageData() {
  // Initialize demo users
  initializeUsers();

  // Check if we need to migrate existing timeline data
  const timelines = getTimelines();
  if (timelines.length === 0) {
    // Check if there's existing Event[] data in localStorage
    const storage = new EventStorage();
    const events = storage.load();

    if (events.length > 0) {
      // Migrate existing events to Timeline format
      const migratedTimeline = migrateEventsToTimeline(
        events,
        'RFK Timeline',
        'cynacons'
      );
      saveTimelines([migratedTimeline]);
      logger.info('Migrated existing events to Timeline format', {
        eventCount: events.length,
        timelineId: migratedTimeline.id
      });
    }
  }
}

// App wrapper to provide dynamic theme based on context and routing
function AppWithTheme() {
  const { isDarkMode } = useTheme();
  const theme = createAppTheme(isDarkMode);

  // Initialize home page data on mount
  useEffect(() => {
    initializeHomePageData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
          <Route path="/user/:userId/timeline/:timelineId" element={<EditorPage />} />
          {/* Fallback for legacy direct editor access */}
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </BrowserRouter>
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
