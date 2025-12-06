/**
 * useNavigationConfig - Context-aware navigation configuration
 * Provides different navigation items based on current page/context
 *
 * Navigation Structure (v0.5.6 redesign):
 * - Global Navigation: Browse (all users), My Profile (authenticated), Admin (admin only)
 * - Context Tools: Page-specific tools (Editor: Events toggle, Lock indicator)
 * - Utilities: Theme toggle at bottom
 */

import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin } from '../../lib/adminUtils';
import type { User } from '../../types';

export type NavigationContext = 'home' | 'profile' | 'editor' | 'admin';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string | ReactNode;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
}

export interface NavigationSection {
  type: 'global' | 'context' | 'utilities';
  title?: string;  // Optional section title
  collapsible?: boolean;  // Whether section can be collapsed
  defaultCollapsed?: boolean;  // Default collapse state
  items: NavigationItem[];
}

export interface NavigationConfig {
  context: NavigationContext;
  sections: NavigationSection[];
}

/**
 * Determine navigation context from current location
 * v0.5.26.1 - Updated to recognize new username-based URLs (/:username/timeline/:id)
 */
function getNavigationContext(pathname: string): NavigationContext {
  if (pathname === '/') return 'home';
  if (pathname === '/admin') return 'admin';
  // Editor context: legacy /user/:id/timeline/:id OR new /:username/timeline/:id format
  if (pathname.includes('/timeline/')) return 'editor';
  if (pathname.startsWith('/user/') || pathname.startsWith('/editor')) return 'profile';
  // Username-based profile pages (/@username or /username without /timeline/)
  if (pathname.startsWith('/@') || (pathname.match(/^\/[a-zA-Z][\w-]*$/) && !pathname.startsWith('/browse') && !pathname.startsWith('/login'))) return 'profile';
  return 'home';
}

/**
 * Hook to get context-aware navigation configuration
 * v0.5.6 - Updated to use Firebase Auth instead of localStorage
 */
export function useNavigationConfig(
  currentUserId?: string,
  editorItems?: NavigationItem[],
  currentUser?: User | null
): NavigationConfig {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const context = getNavigationContext(location.pathname);

  const globalNavigation: NavigationSection = useMemo(() => {
    // Use firebaseUser.uid if currentUserId not provided
    const userId = currentUserId || firebaseUser?.uid;
    const isAuthenticated = !!firebaseUser;

    const items: NavigationItem[] = [
      {
        id: 'browse',
        label: 'Browse',
        icon: 'explore',
        shortcut: 'Alt+B',
        onClick: () => navigate('/browse'),
        isActive: context === 'home',
      },
    ];

    // My Timelines - only for authenticated users
    if (isAuthenticated) {
      items.push({
        id: 'my-timelines',
        label: 'My Timelines',
        icon: 'person',
        shortcut: 'Alt+M',
        onClick: () => navigate(userId ? `/user/${userId}` : '/browse'),
        isActive: context === 'profile',
      });
    }

    // Admin item - only for admin users (CC-REQ-ADMIN-NAV-002)
    if (isAdmin(currentUser)) {
      items.push({
        id: 'admin',
        label: 'Admin',
        icon: 'admin_panel_settings',
        onClick: () => navigate('/admin'),
        isActive: context === 'admin',
      });
    }

    // Sign In - only for unauthenticated users
    if (!isAuthenticated) {
      items.push({
        id: 'sign-in',
        label: 'Sign In',
        icon: 'person',
        onClick: () => navigate('/login'),
        color: '#8b5cf6', // Purple accent
      });
    }

    return {
      type: 'global',
      items,
    };
  }, [context, navigate, currentUserId, firebaseUser, currentUser]);

  const contextSection: NavigationSection | null = useMemo(() => {
    // Only show context tools in editor
    if (context === 'editor' && editorItems && editorItems.length > 0) {
      return {
        type: 'context',
        items: editorItems,
      };
    }
    return null;
  }, [context, editorItems]);

  const sections = useMemo(() => {
    const result: NavigationSection[] = [globalNavigation];
    if (contextSection) {
      result.push(contextSection);
    }
    return result;
  }, [globalNavigation, contextSection]);

  return {
    context,
    sections,
  };
}
