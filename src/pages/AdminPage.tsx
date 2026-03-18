/**
 * AdminPage - Site administration panel
 * Implements CC-REQ-ADMIN-004: Access control and admin UI
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../services/firestore';
import { canAccessAdmin } from '../lib/adminUtils';
import { AppShell } from '../components/AppShell';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { StatisticsDashboard } from '../components/admin/StatisticsDashboard';
import { ActivityLogPanel } from '../components/admin/ActivityLogPanel';
import type { User } from '../types';

type AdminTab = 'users' | 'statistics' | 'activity';

export function AdminPage() {
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

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

  // Show loading while checking auth
  if (!firebaseUser) {
    return null; // Not logged in - redirect will happen
  }

  // Still loading user profile
  if (currentUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--page-accent)]"></div>
          <span style={{ color: 'var(--page-text-secondary)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  // Not admin - redirect in progress
  if (!canAccessAdmin(currentUser)) {
    return null;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: AdminTab) => {
    setActiveTab(newValue);
  };

  return (
    <AppShell data-testid="admin-page">
        {/* Admin Panel Heading */}
        <div className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--page-bg-elevated)', borderColor: 'var(--page-border)' }}>
          <div className="px-4 md:px-8 py-3">
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--page-text-primary)' }}
              data-testid="admin-heading"
            >
              Admin Panel
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b" style={{ backgroundColor: 'var(--page-bg-elevated)', borderColor: 'var(--page-border)' }}>
          <div className="px-4 md:px-8">
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="Admin panel tabs">
              <Tab label="Users" value="users" />
              <Tab label="Statistics" value="statistics" />
              <Tab label="Activity Log" value="activity" />
            </Tabs>
          </div>
        </div>

        {/* Tab Content */}
        <main className="px-4 md:px-8 py-8 has-bottom-nav">
          {activeTab === 'users' && (
            <div data-testid="admin-users-tab" className="space-y-4">
              <h2 data-testid="user-management-heading" className="text-xl font-semibold" style={{ color: 'var(--page-text-primary)' }}>User Management</h2>
              <UserManagementPanel />
            </div>
          )}

          {activeTab === 'statistics' && (
            <div data-testid="admin-statistics-tab" className="space-y-4">
              <h2 data-testid="platform-statistics-heading" className="text-xl font-semibold" style={{ color: 'var(--page-text-primary)' }}>Platform Statistics</h2>
              <StatisticsDashboard />
            </div>
          )}

          {activeTab === 'activity' && (
            <div data-testid="admin-activity-tab" className="space-y-4">
              <h2 data-testid="activity-log-heading" className="text-xl font-semibold" style={{ color: 'var(--page-text-primary)' }}>Admin Activity Log</h2>
              <ActivityLogPanel />
            </div>
          )}
        </main>
    </AppShell>
  );
}
