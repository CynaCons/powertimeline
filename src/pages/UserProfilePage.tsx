/**
 * UserProfilePage - Display user information and their timelines
 * v0.5.14 - SRS_DB.md compliant with username-based URLs
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import type { TimelineMetadata, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/auth';
import { getUser, getUserByUsername, getTimelines, getTimeline } from '../services/firestore';
import { downloadTimelineAsYaml } from '../services/timelineImportExport';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { TimelineCardMenu } from '../components/TimelineCardMenu';
import { EditTimelineDialog } from '../components/EditTimelineDialog';
import { DeleteTimelineDialog } from '../components/DeleteTimelineDialog';
import { CreateTimelineDialog } from '../components/CreateTimelineDialog';
import { ImportTimelineDialog } from '../components/ImportTimelineDialog';
import { UserAvatar } from '../components/UserAvatar';
import { useToast } from '../hooks/useToast';

export function UserProfilePage() {
  // Support both /@:username (preferred) and /user/:userId (legacy) routes
  const { username, userId } = useParams<{ username?: string; userId?: string }>();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [timelines, setTimelines] = useState<TimelineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTimelineId, setEditTimelineId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTimelineId, setDeleteTimelineId] = useState<string | null>(null);
  const [createTimelineDialogOpen, setCreateTimelineDialogOpen] = useState(false);
  const [importTimelineDialogOpen, setImportTimelineDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'events' | 'views'>('updated');
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());

  // Toast notifications
  const { toast, showToast, hideToast } = useToast();

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id, undefined, currentUser);

  // Load current user profile from Firestore
  useEffect(() => {
    async function loadCurrentUser() {
      if (firebaseUser) {
        const userProfile = await getUser(firebaseUser.uid);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
    }
    loadCurrentUser();
  }, [firebaseUser]);

  useEffect(() => {
    async function loadUserProfile() {
      // Support both username and userId params
      if (!username && !userId) {
        navigate('/');
        return;
      }

      let userData: User | null = null;

      if (username) {
        // New URL format: /@username
        userData = await getUserByUsername(username);
      } else if (userId) {
        // Legacy URL format: /user/:userId
        userData = await getUser(userId);
        // If found, redirect to the new username-based URL
        // Note: URL pattern is /:username (no @ prefix - React Router v7 bug)
        if (userData) {
          navigate(`/${userData.username}`, { replace: true });
          return;
        }
      }

      if (!userData) {
        // User not found - redirect to home
        navigate('/');
        return;
      }

      setUser(userData);

      const userTimelines = await getTimelines({
        ownerId: userData.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setTimelines(userTimelines);

      // Build user cache from timeline owners
      const cache = new Map<string, User>();
      const ownerIds = new Set(userTimelines.map(t => t.ownerId));
      for (const ownerId of ownerIds) {
        const owner = await getUser(ownerId);
        if (owner) {
          cache.set(ownerId, owner);
        }
      }
      setUserCache(cache);

      setLoading(false);
    }

    loadUserProfile();
  }, [username, userId, navigate]);

  const handleTimelineClick = (timeline: TimelineMetadata) => {
    // v0.5.14: Use username-based URL (no @ prefix - React Router v7 bug)
    const owner = userCache.get(timeline.ownerId) || user;
    if (owner) {
      navigate(`/${owner.username}/timeline/${timeline.id}`);
    }
  };

  // Sort timelines based on selected criteria
  const sortedTimelines = [...timelines].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'events':
        return (b.eventCount || 0) - (a.eventCount || 0);
      case 'views':
        return (b.viewCount || 0) - (a.viewCount || 0);
      case 'updated':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleEditTimeline = (timelineId: string) => {
    setEditTimelineId(timelineId);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = async () => {
    showToast('Timeline updated successfully!', 'success');
    // Refresh timelines
    if (user) {
      const userTimelines = await getTimelines({
        ownerId: user.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setTimelines(userTimelines);
    }
  };

  const handleDeleteTimeline = (timelineId: string) => {
    setDeleteTimelineId(timelineId);
    setDeleteDialogOpen(true);
  };

  // v0.5.27: Export timeline to YAML
  const handleExportTimeline = async (timelineId: string) => {
    try {
      const timeline = await getTimeline(timelineId);
      if (timeline) {
        downloadTimelineAsYaml(timeline);
        showToast('Timeline exported as YAML', 'success');
      } else {
        showToast('Failed to load timeline for export', 'error');
      }
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const handleDeleteSuccess = async () => {
    showToast('Timeline deleted successfully!', 'success');
    // Refresh timelines
    if (user) {
      const userTimelines = await getTimelines({
        ownerId: user.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setTimelines(userTimelines);
    }
  };


  const handleCreateTimeline = () => {
    setCreateTimelineDialogOpen(true);
  };

  const handleImportTimeline = () => {
    setImportTimelineDialogOpen(true);
  };

  const handleCreateTimelineSuccess = async () => {
    showToast('Timeline created successfully!', 'success');
    // Refresh timelines
    if (user) {
      const userTimelines = await getTimelines({
        ownerId: user.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setTimelines(userTimelines);
    }
  };

  return (
    <div data-testid="user-profile-page" className="min-h-screen flex" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Navigation Rail - hidden on mobile, shown on md+ screens */}
      <aside className="fixed left-0 top-0 bottom-0 w-14 border-r z-50 hidden md:flex flex-col items-center py-2" style={{ borderColor: 'var(--nav-border)', backgroundColor: 'var(--nav-bg)' }}>
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

      {/* Main Content Area - full width on mobile, offset on md+ */}
      <div className="flex-1 md:ml-14">
        {/* Header */}
        <header className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--page-bg-elevated)', borderColor: 'var(--page-border)' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              {/* Brand: Logo + PowerTimeline BETA */}
              <button
                onClick={() => navigate('/')}
                className="p-1 hover:opacity-80 transition-opacity flex items-center gap-2"
                title="Go to Landing Page"
                data-testid="logo-button"
              >
                <img
                  src="/assets/images/logo.png"
                  alt="PowerTimeline"
                  className="w-8 h-8 object-contain"
                />
                <span className="font-bold text-lg" style={{ color: 'var(--page-text-primary)' }}>
                  PowerTimeline
                </span>
                <span
                  className="px-2 py-0.5 text-xs font-bold rounded"
                  style={{ backgroundColor: '#f97316', color: '#fff', letterSpacing: '0.05em' }}
                >
                  BETA
                </span>
              </button>
              <div className="flex items-center gap-2">
                {/* Mobile: Theme toggle (since nav rail is hidden) */}
                <div className="md:hidden">
                  <ThemeToggleButton />
                </div>
                {firebaseUser && (
                  <UserProfileMenu
                    onLogout={async () => {
                      await signOutUser();
                      navigate('/');
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* User Profile Header */}
        <div className="border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {loading || !user ? (
              // Skeleton loader for user profile
              <div className="flex items-center gap-6 animate-pulse">
                <div className="w-16 h-16 rounded-full" style={{ backgroundColor: 'var(--page-bg)' }}></div>
                <div className="flex-1">
                  <div className="h-8 rounded w-64 mb-2" style={{ backgroundColor: 'var(--page-bg)' }}></div>
                  <div className="h-4 rounded w-96 mb-2" style={{ backgroundColor: 'var(--page-bg)' }}></div>
                  <div className="h-3 rounded w-32" style={{ backgroundColor: 'var(--page-bg)' }}></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <UserAvatar user={user} size="xlarge" />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--page-text-primary)' }}>@{user.username}</h1>
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>{timelines.length}</span>
                      <span className="ml-1" style={{ color: 'var(--page-text-secondary)' }}>Timelines</span>
                    </div>
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
                        {timelines.reduce((sum, t) => sum + (t.eventCount || 0), 0)}
                      </span>
                      <span className="ml-1" style={{ color: 'var(--page-text-secondary)' }}>Events</span>
                    </div>
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
                        {timelines.reduce((sum, t) => sum + (t.viewCount || 0), 0)}
                      </span>
                      <span className="ml-1" style={{ color: 'var(--page-text-secondary)' }}>Views</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm" style={{ color: 'var(--page-text-secondary)' }}>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Timelines */}
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              Timelines ({loading ? '...' : timelines.length})
            </h2>
            {!loading && timelines.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated' | 'title' | 'views')}
                  className="px-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--page-text-primary)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--input-focus-border)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--input-focus-shadow)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--input-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="updated">Last Updated</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="events">Event Count</option>
                  <option value="views">Views</option>
                </select>
              </div>
            )}
          </div>
          {firebaseUser && user && firebaseUser.uid === user.id && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportTimeline}
                className="px-4 py-2 rounded-lg transition-colors font-medium border flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--page-text-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.color = 'var(--page-text-primary)';
                }}
              >
                <span className="material-symbols-rounded text-base">upload_file</span>
                Import
              </button>
              <button
                onClick={handleCreateTimeline}
                className="px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                style={{ backgroundColor: '#8b5cf6' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                <span className="text-xl">+</span>
                Create Timeline
              </button>
            </div>
          )}
        </div>

        {loading ? (
          // Skeleton loader for timeline cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg shadow-sm border p-4 animate-pulse" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="h-6 rounded w-3/4 mb-3" style={{ backgroundColor: 'var(--page-bg)' }}></div>
                <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--page-bg)' }}></div>
                <div className="h-4 rounded w-2/3" style={{ backgroundColor: 'var(--page-bg)' }}></div>
              </div>
            ))}
          </div>
        ) : timelines.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <p style={{ color: 'var(--page-text-secondary)' }}>@{user?.username || 'User'} hasn't created any timelines yet</p>
          </div>
        ) : (
          <div
            data-testid="user-timelines-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--page-border) transparent'
            }}
          >
            {sortedTimelines.map(timeline => (
              <div
                key={`user-profile-${timeline.id}`}
                data-testid={`timeline-card-${timeline.id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
              >
                {/* Kebab menu - only show if current user is the owner */}
                {firebaseUser && firebaseUser.uid === timeline.ownerId && (
                  <div className="absolute top-2 right-2">
                    <TimelineCardMenu
                      timelineId={timeline.id}
                      ownerId={timeline.ownerId}
                      ownerUsername={userCache.get(timeline.ownerId)?.username || user?.username || ''}
                      currentUserId={firebaseUser.uid}
                      onEdit={handleEditTimeline}
                      onDelete={handleDeleteTimeline}
                      onExport={handleExportTimeline}
                    />
                  </div>
                )}

                {/* Card content - clickable to navigate */}
                <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                  <h3 className="font-semibold mb-2 pr-8" style={{ color: 'var(--page-text-primary)' }}>{timeline.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: 'var(--page-text-secondary)' }}>
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm" style={{ color: 'var(--page-text-secondary)' }}>
                    <span>{timeline.eventCount} events</span>
                    <span>{new Date(timeline.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {/* Owner badge - absolutely positioned at bottom-left */}
                  {(() => {
                    const owner = userCache.get(timeline.ownerId);
                    return owner ? (
                      <div className="absolute bottom-2 left-2" title={`Owner: @${owner.username}`}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          @{owner.username}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {/* Visibility badge - absolutely positioned at bottom-right */}
                  <div className="absolute bottom-2 right-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      timeline.visibility === 'public'
                        ? 'bg-green-100 text-green-800'
                        : timeline.visibility === 'private'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {timeline.visibility === 'public' ? '🌍 Public' :
                       timeline.visibility === 'private' ? '🔒 Private' : '🔗 Unlisted'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </main>
      </div>

      {/* Timeline Edit/Delete Dialogs */}
      <EditTimelineDialog
        open={editDialogOpen}
        timelineId={editTimelineId}
        onClose={() => {
          setEditDialogOpen(false);
          setEditTimelineId(null);
        }}
        onSuccess={handleEditSuccess}
      />

      <DeleteTimelineDialog
        open={deleteDialogOpen}
        timelineId={deleteTimelineId}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteTimelineId(null);
        }}
        onSuccess={handleDeleteSuccess}
      />

      {/* Create Timeline Dialog */}
      <CreateTimelineDialog
        open={createTimelineDialogOpen}
        onClose={() => setCreateTimelineDialogOpen(false)}
        onSuccess={handleCreateTimelineSuccess}
      />

      {/* Import Timeline Dialog */}
      <ImportTimelineDialog
        open={importTimelineDialogOpen}
        onClose={() => setImportTimelineDialogOpen(false)}
        onSuccess={handleCreateTimelineSuccess}
      />

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={hideToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
