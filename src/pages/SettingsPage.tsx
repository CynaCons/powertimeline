/**
 * SettingsPage - Account settings and preferences
 * Implements requirements from docs/SRS_USER_SETTINGS_PAGE.md
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getUser, getTimelines, deleteUserData } from '../services/firestore';
import { auth, deleteCurrentUserAccount } from '../services/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ThemeToggleButton } from '../components/NavigationRail';
import type { User } from '../types';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [timelineCount, setTimelineCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user profile and timeline count
  useEffect(() => {
    async function loadData() {
      if (!firebaseUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // Load user profile
        const profile = await getUser(firebaseUser.uid);
        setUserProfile(profile);

        // Load timeline count
        if (profile) {
          const timelines = await getTimelines({
            ownerId: firebaseUser.uid,
          });
          setTimelineCount(timelines.length);
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
        showError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [firebaseUser, navigate, showError]);

  const handlePasswordReset = async () => {
    if (!userProfile?.email) {
      showError('Email address not found');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, userProfile.email);
      showSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      showError('Failed to send password reset email');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmEmail('');
  };

  const handleConfirmDelete = async () => {
    if (!firebaseUser || !userProfile) return;

    // Validate email confirmation
    if (deleteConfirmEmail !== userProfile.email) {
      showError('Email does not match');
      return;
    }

    try {
      setIsDeleting(true);

      // 1. Delete all user data from Firestore (timelines and events)
      await deleteUserData(firebaseUser.uid);

      // 2. Delete Firebase Auth account
      await deleteCurrentUserAccount();

      // 3. Show success message and redirect
      showSuccess('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Account deletion error:', error);
      // Check if re-authentication is required
      if (error instanceof Error && error.message.includes('requires-recent-login')) {
        showError('For security, please log out and log back in before deleting your account');
      } else {
        showError('Failed to delete account. Please try again or contact support.');
      }
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmEmail('');
    }
  };

  const formatDate = (isoDate: string | undefined): string => {
    if (!isoDate) return 'Unknown';
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: 'var(--page-accent)' }} />
          <p className="mt-4" style={{ color: 'var(--page-text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <p style={{ color: 'var(--page-text-secondary)' }}>User profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--page-bg-elevated)', borderColor: 'var(--page-border)' }}>
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="material-symbols-rounded p-2 rounded-lg transition-colors"
              style={{ color: 'var(--page-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Go back"
            >
              arrow_back
            </button>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--page-text-primary)' }}>
              Account Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-8 py-8 max-w-5xl">
        <div className="space-y-6">
          {/* Profile Section */}
          <section className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>
              Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--page-text-secondary)' }}>
                  Username
                </label>
                <div className="text-base" style={{ color: 'var(--page-text-primary)' }}>
                  @{userProfile.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--page-text-secondary)' }}>
                  Email
                </label>
                <div className="text-base" style={{ color: 'var(--page-text-primary)' }}>
                  {userProfile.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--page-text-secondary)' }}>
                  Member Since
                </label>
                <div className="text-base" style={{ color: 'var(--page-text-primary)' }}>
                  {formatDate(userProfile.createdAt)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--page-text-secondary)' }}>
                  Timelines
                </label>
                <div className="text-base" style={{ color: 'var(--page-text-primary)' }}>
                  {timelineCount} {timelineCount === 1 ? 'timeline' : 'timelines'}
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--page-text-secondary)' }}>
                  Send a password reset email to {userProfile.email}
                </p>
                <button
                  onClick={handlePasswordReset}
                  className="px-4 py-2 rounded-lg font-medium border transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--page-text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                    e.currentTarget.style.borderColor = 'var(--page-accent)';
                    e.currentTarget.style.color = 'var(--page-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                    e.currentTarget.style.borderColor = 'var(--card-border)';
                    e.currentTarget.style.color = 'var(--page-text-primary)';
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--page-text-secondary)' }}>
                  Theme
                </label>
                <div className="flex items-center gap-3">
                  <ThemeToggleButton />
                  <span className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
                    Click to toggle between light and dark themes
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="border-2 rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--color-danger)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-danger)' }}>
              Danger Zone
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--page-text-secondary)' }}>
              Irreversible and destructive actions
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--page-text-secondary)' }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-danger)',
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-danger-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-danger)';
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCancelDelete}
        >
          <div
            className="border rounded-lg p-6 max-w-md w-full"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-danger)' }}>
              Delete Account
            </h2>

            <div className="space-y-4 mb-6">
              <p className="text-sm" style={{ color: 'var(--page-text-primary)' }}>
                This action will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--page-text-secondary)' }}>
                <li>Your user profile</li>
                <li>All {timelineCount} of your timeline{timelineCount === 1 ? '' : 's'}</li>
                <li>All events in those timelines</li>
                <li>Your authentication account</li>
              </ul>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
                This action cannot be undone.
              </p>

              <div className="pt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--page-text-primary)' }}>
                  To confirm, type your email address: <span className="font-mono">{userProfile?.email}</span>
                </label>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--page-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--page-text-primary)',
                  }}
                  disabled={isDeleting}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-medium border transition-colors"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--page-text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmEmail !== userProfile?.email || isDeleting}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  if (deleteConfirmEmail === userProfile?.email && !isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-danger-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-danger)';
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
