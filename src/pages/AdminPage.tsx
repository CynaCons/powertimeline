/**
 * AdminPage - Site administration panel
 * Implements CC-REQ-ADMIN-004: Access control and admin UI
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/auth';
import { getUser } from '../services/firestore';
import { canAccessAdmin } from '../lib/adminUtils';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { UserSwitcherModal } from '../components/UserSwitcherModal';
import { Breadcrumb } from '../components/Breadcrumb';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { StatisticsDashboard } from '../components/admin/StatisticsDashboard';
import { ActivityLogPanel } from '../components/admin/ActivityLogPanel';
import type { User } from '../types';

type AdminTab = 'users' | 'statistics' | 'activity';

export function AdminPage() {
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id, undefined, currentUser);

  // Load user profile from Firestore
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

  // Access control: redirect non-admins to home page
  useEffect(() => {
    if (currentUser !== null && !canAccessAdmin(currentUser)) {
      console.warn('Access denied: Admin access required');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Don't render anything if user isn't an admin (during redirect)
  if (!firebaseUser || !canAccessAdmin(currentUser)) {
    return null;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: AdminTab) => {
    setActiveTab(newValue);
  };

  return (
    <div data-testid="admin-page" className="min-h-screen bg-gray-50 flex">
      {/* Navigation Rail */}
      <aside className="fixed left-0 top-0 bottom-0 w-14 border-r border-gray-200 bg-white z-50 flex flex-col items-center py-2">
        {/* PowerTimeline logo at top - clickable to go home */}
        <button
          onClick={() => navigate('/browse')}
          className="mb-4 p-1 text-center hover:opacity-80 transition-opacity cursor-pointer"
          title="Go to Home"
        >
          <img
            src="/assets/images/logo.png"
            alt="PowerTimeline - Go to Home"
            className="w-10 h-10 object-contain"
          />
        </button>

        {/* Navigation sections */}
        <NavigationRail sections={sections} />

        {/* Bottom utilities */}
        <div className="flex flex-col items-center gap-2 mt-auto">
          <ThemeToggleButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-14">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 data-testid="admin-heading" className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              {currentUser && (
                <UserProfileMenu
                  onLogout={async () => {
                    await signOutUser();
                    navigate('/');
                  }}
                />
              )}
            </div>
            <Breadcrumb items={[
              { label: 'Home', href: '/browse' },
              { label: 'Admin' }
            ]} />
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="Admin panel tabs">
              <Tab label="Users" value="users" />
              <Tab label="Statistics" value="statistics" />
              <Tab label="Activity Log" value="activity" />
            </Tabs>
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'users' && (
            <div data-testid="admin-users-tab" className="space-y-4">
              <h2 data-testid="user-management-heading" className="text-xl font-semibold text-gray-900">User Management</h2>
              <UserManagementPanel />
            </div>
          )}

          {activeTab === 'statistics' && (
            <div data-testid="admin-statistics-tab" className="space-y-4">
              <h2 data-testid="platform-statistics-heading" className="text-xl font-semibold text-gray-900">Platform Statistics</h2>
              <StatisticsDashboard />
            </div>
          )}

          {activeTab === 'activity' && (
            <div data-testid="admin-activity-tab" className="space-y-4">
              <h2 data-testid="activity-log-heading" className="text-xl font-semibold text-gray-900">Admin Activity Log</h2>
              <ActivityLogPanel />
            </div>
          )}
        </main>
      </div>

      {/* User Switcher Modal */}
      <UserSwitcherModal
        open={userSwitcherOpen}
        onClose={() => setUserSwitcherOpen(false)}
      />
    </div>
  );
}
