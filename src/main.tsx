import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/index.css'
import './styles/stream-edit-panel.css'
import { LandingPage } from './pages/LandingPage'
import { HomePage } from './pages/HomePage'
import { UserProfilePage } from './pages/UserProfilePage'
import { EditorPage } from './pages/EditorPage'
import { AdminPage } from './pages/AdminPage'
import { SettingsPage } from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { environment } from './config/environment'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performanceMonitor'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from './styles/theme'
import { ChronoThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { OfflineIndicator } from './components/OfflineIndicator'

// DEPRECATED (v0.5.6): localStorage initialization disabled
// App now uses Firebase Auth + Firestore exclusively
// Demo users (Alice, Bob, Charlie) removed
function initializeHomePageData() {
  logger.info('localStorage initialization DISABLED - using Firestore only (v0.5.6)');

  // Clear any old localStorage data to prevent conflicts
  try {
    localStorage.removeItem('powertimeline_current_user');
    logger.debug('Cleared old localStorage user data');
  } catch (error) {
    logger.warn('Could not clear localStorage', { error });
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
      <OfflineIndicator />
      <BrowserRouter>
        <Routes>
          {/* Public routes - accessible to everyone */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Settings route - protected */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Username-based routes - clean URLs without prefix
              Note: /@:username pattern broken in React Router v7 (see GitHub #9779, #12460) */}
          <Route path="/:username/timeline/:timelineId" element={<EditorPage />} />
          <Route path="/:username" element={<UserProfilePage />} />
          {/* Legacy routes for backwards compatibility - redirect internally */}
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

          {/* 404 catch-all route */}
          <Route path="*" element={<NotFoundPage />} />
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

if (import.meta.env.PROD && typeof window !== 'undefined') {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      logger.error('Service worker registration failed', { error });
    }
  });
}

if (monitoringEnabled && typeof window !== 'undefined') {
  window.addEventListener('load', () => performanceMonitor.recordBundleLoadTime(), { once: true });
  performanceMonitor.startRenderMeasurement();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChronoThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppWithTheme />
        </ToastProvider>
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
