import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './styles/index.css'
import { LandingPage } from './pages/LandingPage'
import { HomePage } from './pages/HomePage'
import { UserProfilePage } from './pages/UserProfilePage'
import { EditorPage } from './pages/EditorPage'
import { AdminPage } from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { environment } from './config/environment'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performanceMonitor'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from './styles/theme'
import { ChronoThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { initializeUsers, getTimelines, saveTimelines, migrateEventsToTimeline, createSampleTimelines, getCurrentUser, checkAndMigrateData } from './lib/homePageStorage'
import { EventStorage } from './lib/storage'
// Firebase disabled for now - will be enabled in v0.4.x when needed
// import './lib/firebase'

// Initialize users and timeline data on first load
function initializeHomePageData() {
  // Check for data version and migrate if needed
  checkAndMigrateData();

  // Initialize demo users
  initializeUsers();

  // Ensure CynaCons is the default current user
  const currentUser = getCurrentUser();
  if (!currentUser) {
    logger.warn('No current user found during initialization');
  } else {
    logger.info('Current user initialized', { userId: currentUser.id, name: currentUser.name });
  }

  // Check if we need to initialize timeline data
  const timelines = getTimelines();
  if (timelines.length === 0) {
    // Check if there's existing Event[] data in localStorage (legacy migration)
    const storage = new EventStorage();
    const events = storage.load();

    if (events.length > 0) {
      // Migrate existing events to Timeline format and add to current user
      const migratedTimeline = migrateEventsToTimeline(
        events,
        'RFK Timeline (Migrated)',
        currentUser?.id || 'cynacons'
      );
      // Also create sample timelines for other users
      const sampleTimelines = createSampleTimelines();
      saveTimelines([migratedTimeline, ...sampleTimelines]);
      logger.info('Migrated existing events and created sample timelines', {
        migratedEventCount: events.length,
        totalTimelines: sampleTimelines.length + 1
      });
    } else {
      // No existing data, create sample timelines for all users
      const sampleTimelines = createSampleTimelines();
      saveTimelines(sampleTimelines);
      logger.info('Created sample timelines for all users', {
        timelineCount: sampleTimelines.length
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
          {/* Public routes - accessible to everyone */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes - require auth when VITE_ENFORCE_AUTH=true */}
          <Route path="/user/:userId" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/user/:userId/timeline/:timelineId" element={<EditorPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />

          {/* Fallback for legacy direct editor access */}
          <Route path="/editor" element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          } />
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
      <AuthProvider>
        <AppWithTheme />
      </AuthProvider>
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
