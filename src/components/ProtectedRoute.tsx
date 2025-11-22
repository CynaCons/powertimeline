/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 * v0.5.1 - Phase 1: Auth Foundation
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { environment } from '../config/environment';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for routes that require authentication
 *
 * Behavior:
 * - If auth enforcement disabled (VITE_ENFORCE_AUTH=false): Always render children
 * - If loading auth state: Show spinner
 * - If not authenticated: Redirect to /login with return URL
 * - If authenticated: Render protected content
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if auth enforcement is enabled via environment variable
  const enforceAuth = environment.flags.enforceAuth ?? true;

  // If auth enforcement disabled, always allow access (for gradual migration)
  if (!enforceAuth) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated - render protected content
  return <>{children}</>;
}
