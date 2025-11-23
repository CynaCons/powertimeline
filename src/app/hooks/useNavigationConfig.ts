/**
 * useNavigationConfig - Context-aware navigation configuration
 * Provides different navigation items based on current page/context
 *
 * Navigation Structure:
 * - Global Navigation: Always visible (Home, My Profile, Settings, About, Admin)
 * - Context Tools: Page-specific tools (Editor: Events, Create, Dev)
 * - Utilities: Always visible (Info Toggle, Theme)
 */

import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getCurrentUser } from '../../lib/homePageStorage';
import { isAdmin } from '../../lib/adminUtils';

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
 */
function getNavigationContext(pathname: string): NavigationContext {
  if (pathname === '/') return 'home';
  if (pathname === '/admin') return 'admin';
  if (pathname.startsWith('/user/') && pathname.includes('/timeline/')) return 'editor';
  if (pathname.startsWith('/user/') || pathname.startsWith('/editor')) return 'profile';
  return 'home';
}

/**
 * Hook to get context-aware navigation configuration
 */
export function useNavigationConfig(
  currentUserId?: string,
  editorItems?: NavigationItem[]
): NavigationConfig {
  const location = useLocation();
  const navigate = useNavigate();
  const context = getNavigationContext(location.pathname);

  const globalNavigation: NavigationSection = useMemo(() => {
    const user = getCurrentUser();
    const items: NavigationItem[] = [
      {
        id: 'browse',
        label: 'Browse',
        icon: 'explore',
        shortcut: 'Alt+B',
        onClick: () => navigate('/browse'),
        isActive: context === 'home',
      },
      {
        id: 'my-timelines',
        label: 'My Timelines',
        icon: 'person',
        shortcut: 'Alt+M',
        onClick: () => navigate(currentUserId ? `/user/${currentUserId}` : '/browse'),
        isActive: context === 'profile',
      },
    ];

    // Add Admin item only for admin users (CC-REQ-ADMIN-NAV-002)
    if (isAdmin(user)) {
      items.push({
        id: 'admin',
        label: 'Admin',
        icon: 'admin_panel_settings',
        onClick: () => navigate('/admin'),
        isActive: context === 'admin',
      });
    }

    items.push(
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        onClick: () => {
          // Placeholder for now
          console.log('Settings clicked - to be implemented');
        },
      },
      {
        id: 'about',
        label: 'About',
        icon: 'info',
        onClick: () => {
          // Placeholder for now
          console.log('About clicked - to be implemented');
        },
      }
    );

    return {
      type: 'global',
      items,
    };
  }, [context, navigate, currentUserId]);

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
