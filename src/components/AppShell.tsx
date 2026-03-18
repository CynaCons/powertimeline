/**
 * AppShell - Shared layout component for all non-editor, non-landing pages
 *
 * Provides:
 * - Left navigation rail (hidden on mobile, shown on md+ screens)
 * - NavigationRail with context-aware sections
 * - User profile menu / Sign-in at bottom of rail
 * - Mobile bottom navigation
 * - Main content area with responsive offset
 *
 * Used by: HomePage, UserProfilePage, AdminPage, SettingsPage
 * NOT used by: LandingPage (has its own TopNavBar), EditorPage (full-bleed canvas)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TimelineIcon from '@mui/icons-material/Timeline';
import IconButton from '@mui/material/IconButton';
import { NavigationRail } from './NavigationRail';
import { BottomNavigation } from './BottomNavigation';
import { UserProfileMenu } from './UserProfileMenu';
import { EnhancedTooltip } from './EnhancedTooltip';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../services/firestore';
import type { User } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  'data-testid'?: string;
}

export function AppShell({ children, 'data-testid': dataTestId }: AppShellProps) {
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load current user profile from Firestore for nav config (admin check, etc.)
  useEffect(() => {
    async function loadUser() {
      if (firebaseUser) {
        const userProfile = await getUser(firebaseUser.uid);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
    }
    loadUser();
  }, [firebaseUser]);

  const { sections } = useNavigationConfig(
    currentUser?.id,
    undefined,
    currentUser,
  );

  return (
    <div
      data-testid={dataTestId}
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      {/* Navigation Rail - hidden on mobile, shown on md+ screens */}
      <aside
        data-tour="nav-rail"
        className="fixed left-0 top-0 bottom-0 w-14 border-r z-50 hidden md:flex flex-col items-center py-2"
        role="navigation"
        aria-label="Main navigation"
        style={{
          borderColor: 'var(--nav-border)',
          backgroundColor: 'var(--nav-bg)',
        }}
      >
        {/* PowerTimeline logo at top - clickable to go to landing page */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-center hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
          style={{ width: '40px', height: '40px' }}
          title="PowerTimeline Home"
          aria-label="Go to Home"
          data-testid="logo-button"
        >
          <TimelineIcon sx={{ fontSize: 28, color: 'var(--page-accent)' }} />
        </button>

        {/* Context-Aware Navigation */}
        <NavigationRail
          sections={sections}
          userSlot={
            firebaseUser ? (
              <UserProfileMenu placement="rail" />
            ) : (
              <EnhancedTooltip title="Sign In" placement="right">
                <IconButton
                  aria-label="Sign In"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: '#8b5cf6',
                    minWidth: '40px',
                    minHeight: '40px',
                    '&:hover': {
                      backgroundColor: 'var(--nav-hover-bg)',
                    },
                  }}
                  data-testid="nav-sign-in-bottom"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '24px' }} aria-hidden="true">
                    account_circle
                  </span>
                </IconButton>
              </EnhancedTooltip>
            )
          }
        />
      </aside>

      {/* Main Content Area - full width on mobile, offset on md+ */}
      <div className="flex-1 md:ml-14">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
