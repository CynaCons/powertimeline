/**
 * BottomNavigation - Mobile navigation component
 * Implements CC-REQ-MOB-001: Mobile-first navigation accessibility
 *
 * Shows on mobile viewports (< md breakpoint) when NavigationRail is hidden.
 * Provides access to main navigation items with iOS/Android-style bottom bar.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { id: 'browse', icon: 'explore', label: 'Browse', path: '/browse' },
  { id: 'my-timelines', icon: 'collections', label: 'My Timelines', path: '/my-timelines', requiresAuth: true },
  { id: 'settings', icon: 'settings', label: 'Settings', path: '/settings', requiresAuth: true },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (item: NavItem): boolean => {
    // Special case for "My Timelines" - matches user profile pages
    if (item.id === 'my-timelines' && user) {
      // Active on /user/:id or /:username profile pages (not timeline editor)
      const isProfilePage = location.pathname.startsWith('/user/') && !location.pathname.includes('/timeline/');
      const isUsernameProfile = /^\/[a-zA-Z][\w-]*$/.test(location.pathname) &&
        !location.pathname.startsWith('/browse') &&
        !location.pathname.startsWith('/login') &&
        !location.pathname.startsWith('/settings') &&
        !location.pathname.startsWith('/admin');
      return isProfilePage || isUsernameProfile;
    }
    return location.pathname === item.path;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'my-timelines' && user) {
      // Navigate to user's own profile page
      navigate(`/user/${user.uid}`);
    } else {
      navigate(item.path);
    }
  };

  // Filter items based on auth state
  const visibleItems = navItems.filter(item =>
    !item.requiresAuth || (item.requiresAuth && user)
  );

  // Add sign-in button for unauthenticated users
  const displayItems: NavItem[] = user ? visibleItems : [
    ...visibleItems,
    { id: 'sign-in', icon: 'person', label: 'Sign In', path: '/login' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden border-t z-50 safe-area-bottom"
      style={{
        backgroundColor: 'var(--page-bg-elevated)',
        borderColor: 'var(--page-border)'
      }}
      role="navigation"
      aria-label="Mobile navigation"
      data-testid="bottom-navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {displayItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center justify-center flex-1 py-2 transition-colors"
              style={{
                color: active ? 'var(--page-accent)' : 'var(--page-text-secondary)',
              }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              data-testid={`bottom-nav-${item.id}`}
            >
              <span
                className="material-symbols-rounded text-2xl"
                style={{
                  fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0"
                }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
