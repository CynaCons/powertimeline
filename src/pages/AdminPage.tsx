/**
 * AdminPage - Site administration panel
 * Implements CC-REQ-ADMIN-004: Access control and admin UI
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import { getCurrentUser } from '../lib/homePageStorage';
import { canAccessAdmin } from '../lib/adminUtils';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { UserSwitcherModal } from '../components/UserSwitcherModal';
import { Breadcrumb } from '../components/Breadcrumb';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';

type AdminTab = 'users' | 'statistics' | 'activity';

export function AdminPage() {
  const navigate = useNavigate();
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const currentUser = getCurrentUser();

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id);

  // Access control: redirect non-admins to home page
  useEffect(() => {
    if (!canAccessAdmin(currentUser)) {
      console.warn('Access denied: Admin access required');
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Don't render anything if user isn't an admin (during redirect)
  if (!canAccessAdmin(currentUser)) {
    return null;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: AdminTab) => {
    setActiveTab(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation Rail */}
      <aside className="fixed left-0 top-0 bottom-0 w-14 border-r border-gray-200 bg-white z-50 flex flex-col items-center py-2">
        {/* PowerTimeline logo at top */}
        <div className="mb-4 p-1 text-center">
          <img
            src="/assets/images/logo.png"
            alt="PowerTimeline"
            className="w-10 h-10 object-contain"
          />
        </div>

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
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              {currentUser && (
                <UserProfileMenu
                  onSwitchAccount={() => setUserSwitcherOpen(true)}
                  onLogout={() => {
                    // Clear current user and redirect to home
                    localStorage.removeItem('powertimeline_current_user');
                    window.location.href = '/';
                  }}
                />
              )}
            </div>
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
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
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <UserManagementPanel />
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Statistics</h2>
              <p className="text-gray-600">
                Statistics dashboard will be implemented here (Phase 3).
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Features: User counts, timeline counts, visibility breakdown, top creators
              </p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Activity Log</h2>
              <p className="text-gray-600">
                Activity log will be implemented here (Phase 6).
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Features: Audit trail of all admin actions, filtering, export
              </p>
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
