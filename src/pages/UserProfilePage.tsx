/**
 * UserProfilePage - Display user information and their timelines
 * Implements requirements from docs/SRS_HOME_PAGE.md (v0.4.0)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import type { TimelineMetadata, User } from '../types';
import { getCurrentUser } from '../lib/homePageStorage';
import { getUser, getTimelines } from '../services/firestore';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { UserSwitcherModal } from '../components/UserSwitcherModal';
import { Breadcrumb } from '../components/Breadcrumb';
import { TimelineCardMenu } from '../components/TimelineCardMenu';
import { EditTimelineDialog } from '../components/EditTimelineDialog';
import { DeleteTimelineDialog } from '../components/DeleteTimelineDialog';
import { EditUserProfileDialog } from '../components/EditUserProfileDialog';
import { CreateTimelineDialog } from '../components/CreateTimelineDialog';
import { UserAvatar } from '../components/UserAvatar';
import { useToast } from '../hooks/useToast';

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [timelines, setTimelines] = useState<TimelineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTimelineId, setEditTimelineId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTimelineId, setDeleteTimelineId] = useState<string | null>(null);
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [createTimelineDialogOpen, setCreateTimelineDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'events' | 'views'>('updated');
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());
  const currentUser = getCurrentUser();

  // Toast notifications
  const { toast, showToast, hideToast } = useToast();

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id);

  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) {
        navigate('/');
        return;
      }

      const userData = await getUser(userId);
      if (!userData) {
        // User not found - redirect to home
        navigate('/');
        return;
      }

      setUser(userData);

      const userTimelines = await getTimelines({
        ownerId: userId,
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
  }, [userId, navigate]);

  const handleTimelineClick = (timeline: TimelineMetadata) => {
    navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
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
    if (userId) {
      const userTimelines = await getTimelines({
        ownerId: userId,
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

  const handleDeleteSuccess = async () => {
    showToast('Timeline deleted successfully!', 'success');
    // Refresh timelines
    if (userId) {
      const userTimelines = await getTimelines({
        ownerId: userId,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setTimelines(userTimelines);
    }
  };

  const handleEditProfile = () => {
    setEditProfileDialogOpen(true);
  };

  const handleEditProfileSuccess = async () => {
    showToast('Profile updated successfully!', 'success');
    // Refresh user data
    if (userId) {
      const userData = await getUser(userId);
      if (userData) {
        setUser(userData);
      }
    }
  };

  const handleCreateTimeline = () => {
    setCreateTimelineDialogOpen(true);
  };

  const handleCreateTimelineSuccess = async () => {
    showToast('Timeline created successfully!', 'success');
    // Refresh timelines
    if (userId) {
      const userTimelines = await getTimelines({
        ownerId: userId,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setTimelines(userTimelines);
    }
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
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-semibold text-gray-900">User Profile</h1>
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
              { label: user?.name || '...' }
            ]} />
          </div>
        </header>

        {/* User Profile Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {loading || !user ? (
              // Skeleton loader for user profile
              <div className="flex items-center gap-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-96 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <UserAvatar user={user} size="xlarge" />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                    {currentUser && currentUser.id === userId && (
                      <button
                        onClick={handleEditProfile}
                        className="mb-2 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                  {user.bio && (
                    <p className="text-gray-600 max-w-2xl">{user.bio}</p>
                  )}
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-semibold text-gray-900">{timelines.length}</span>
                      <span className="text-gray-500 ml-1">Timelines</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {timelines.reduce((sum, t) => sum + (t.eventCount || 0), 0)}
                      </span>
                      <span className="text-gray-500 ml-1">Events</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {timelines.reduce((sum, t) => sum + (t.viewCount || 0), 0)}
                      </span>
                      <span className="text-gray-500 ml-1">Views</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Timelines */}
        <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Timelines ({loading ? '...' : timelines.length})
            </h2>
            {!loading && timelines.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm text-gray-600">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated' | 'title' | 'views')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="updated">Last Updated</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="events">Event Count</option>
                  <option value="views">Views</option>
                </select>
              </div>
            )}
          </div>
          {currentUser && currentUser.id === userId && (
            <button
              onClick={handleCreateTimeline}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create Timeline
            </button>
          )}
        </div>

        {loading ? (
          // Skeleton loader for timeline cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : timelines.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-600">{user?.name || 'User'} hasn't created any timelines yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedTimelines.map(timeline => (
              <div
                key={`user-profile-${timeline.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all relative"
              >
                {/* Kebab menu - only show if current user is the owner */}
                {currentUser && currentUser.id === timeline.ownerId && (
                  <div className="absolute top-2 right-2">
                    <TimelineCardMenu
                      timelineId={timeline.id}
                      ownerId={timeline.ownerId}
                      currentUserId={currentUser.id}
                      onEdit={handleEditTimeline}
                      onDelete={handleDeleteTimeline}
                    />
                  </div>
                )}

                {/* Card content - clickable to navigate */}
                <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                  <h3 className="font-semibold text-gray-900 mb-2 pr-8">{timeline.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{timeline.eventCount} events</span>
                    <span>{new Date(timeline.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {/* Owner badge - absolutely positioned at bottom-left */}
                  {(() => {
                    const owner = userCache.get(timeline.ownerId);
                    return owner ? (
                      <div className="absolute bottom-2 left-2" title={`Owner: ${owner.name}`}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {owner.name}
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

      {/* User Switcher Modal */}
      <UserSwitcherModal
        open={userSwitcherOpen}
        onClose={() => setUserSwitcherOpen(false)}
      />

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

      {/* User Profile Edit Dialog */}
      <EditUserProfileDialog
        open={editProfileDialogOpen}
        userId={userId || null}
        onClose={() => setEditProfileDialogOpen(false)}
        onSuccess={handleEditProfileSuccess}
      />

      {/* Create Timeline Dialog */}
      <CreateTimelineDialog
        open={createTimelineDialogOpen}
        onClose={() => setCreateTimelineDialogOpen(false)}
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
