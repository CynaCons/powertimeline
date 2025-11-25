/**
 * HomePage - Landing page with search, user workspace, and discovery feeds
 * Implements requirements from docs/SRS_HOME_PAGE.md (v0.4.0)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import type { TimelineMetadata, User } from '../types';
import {
  getTimeline,
  getTimelines,
  getUsers,
  getPlatformStats,
} from '../services/firestore';
import {
  getCurrentUser,
  searchTimelinesAndUsers,
} from '../lib/homePageStorage';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { UserSwitcherModal } from '../components/UserSwitcherModal';
import { TopNavBar } from '../components/TopNavBar';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { CreateTimelineDialog } from '../components/CreateTimelineDialog';
import { EditTimelineDialog } from '../components/EditTimelineDialog';
import { DeleteTimelineDialog } from '../components/DeleteTimelineDialog';
import { TimelineCardMenu } from '../components/TimelineCardMenu';
import { UserAvatar } from '../components/UserAvatar';
import { useToast } from '../hooks/useToast';
import { migrateLocalStorageToFirestore } from '../utils/migrateLocalStorage';

export function HomePage() {
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Cache all users for lookups
  const [myTimelines, setMyTimelines] = useState<TimelineMetadata[]>([]);
  const [recentlyEdited, setRecentlyEdited] = useState<TimelineMetadata[]>([]);
  const [popular, setPopular] = useState<TimelineMetadata[]>([]);
  const [featured, setFeatured] = useState<TimelineMetadata[]>([]);
  const [stats, setStats] = useState({
    timelineCount: 0,
    userCount: 0,
    eventCount: 0,
    viewCount: 0,
  });
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    timelines: TimelineMetadata[];
    users: User[];
    hasMore: boolean;
  } | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTimelineId, setEditTimelineId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTimelineId, setDeleteTimelineId] = useState<string | null>(null);

  // Toast notifications
  const { toast, showToast, hideToast } = useToast();

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id);

  // Helper function to get user by ID from cache
  const getUserById = (userId: string): User | null => {
    return allUsers.find(u => u.id === userId) || null;
  };

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      // First, migrate any localStorage data to Firestore
      const migrationResult = await migrateLocalStorageToFirestore();
      if (migrationResult.migratedTimelines > 0 || migrationResult.migratedUsers > 0) {
        showToast(migrationResult.message, 'success');
      }

      const user = getCurrentUser();
      setCurrentUser(user);

      try {
        // Load all users for caching
        const users = await getUsers();
        setAllUsers(users);

        // Load platform statistics
        const platformStats = await getPlatformStats();
        setStats({
          timelineCount: platformStats.totalTimelines,
          userCount: platformStats.totalUsers,
          eventCount: platformStats.totalEvents,
          viewCount: platformStats.totalViews,
        });

        // Load user's timelines
        if (user) {
          const userTimelines = await getTimelines({
            ownerId: user.id,
            orderByField: 'updatedAt',
            orderDirection: 'desc',
          });
          setMyTimelines(userTimelines);
        }

        // Load recently edited timelines (include all timelines)
        const recentTimelines = await getTimelines({
          orderByField: 'updatedAt',
          orderDirection: 'desc',
          limitCount: 6,
        });
        setRecentlyEdited(recentTimelines);

        // Load popular timelines (include all timelines)
        const popularTimelines = await getTimelines({
          orderByField: 'viewCount',
          orderDirection: 'desc',
          limitCount: 6,
        });
        setPopular(popularTimelines);

        // Note: Featured timelines functionality to be removed per PLAN.md known issues
        setFeatured([]);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading timelines', 'error');
      }
    }

    loadData();
  }, []); // Run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleCreateTimeline = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = async (timelineId: string) => {
    showToast('Timeline created successfully!', 'success');

    // Refresh timeline lists
    if (currentUser) {
      const userTimelines = await getTimelines({
        ownerId: currentUser.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setMyTimelines(userTimelines);
    }

    const recentTimelines = await getTimelines({
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 6,
    });
    setRecentlyEdited(recentTimelines);

    // Navigate to the new timeline
    const timeline = await getTimeline(timelineId);
    if (timeline) {
      navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
    }
  };

  const handleEditTimeline = (timelineId: string) => {
    setEditTimelineId(timelineId);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = async () => {
    showToast('Timeline updated successfully!', 'success');

    // Refresh timeline lists
    if (currentUser) {
      const userTimelines = await getTimelines({
        ownerId: currentUser.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setMyTimelines(userTimelines);
    }

    const recentTimelines = await getTimelines({
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 6,
    });
    setRecentlyEdited(recentTimelines);
  };

  const handleDeleteTimeline = (timelineId: string) => {
    setDeleteTimelineId(timelineId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = async () => {
    showToast('Timeline deleted successfully!', 'success');

    // Refresh timeline lists
    if (currentUser) {
      const userTimelines = await getTimelines({
        ownerId: currentUser.id,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setMyTimelines(userTimelines);
    }

    const recentTimelines = await getTimelines({
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 6,
    });
    setRecentlyEdited(recentTimelines);

    const popularTimelines = await getTimelines({
      orderByField: 'viewCount',
      orderDirection: 'desc',
      limitCount: 6,
    });
    setPopular(popularTimelines);
  };

  const handleTimelineClick = (timeline: TimelineMetadata) => {
    navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
  };

  const handleUserClick = (user: User) => {
    navigate(`/user/${user.id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      const results = searchTimelinesAndUsers(query, currentUser?.id);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      {/* Top Navigation for unauthenticated users */}
      {!firebaseUser && <TopNavBar />}

      <div className="flex">
      {/* Navigation Rail for authenticated users */}
      {firebaseUser && (
      <aside className="fixed left-0 top-0 bottom-0 w-14 border-r z-50 flex flex-col items-center py-2" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
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
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ${firebaseUser ? 'ml-14' : ''}`}>
        {/* Header */}
        <header className="border-b sticky top-0 z-40" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold" style={{ color: '#e6edf3' }}>PowerTimeline</h1>
              <div className="flex items-center gap-4">
                {firebaseUser ? (
                  <UserProfileMenu
                    onSwitchAccount={() => setUserSwitcherOpen(true)}
                    onLogout={() => {
                      // Clear current user and redirect to home
                      localStorage.removeItem('powertimeline_current_user');
                      window.location.href = '/';
                    }}
                  />
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 text-white rounded-lg transition-colors font-medium"
                    style={{ backgroundColor: '#8b5cf6' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
            <Breadcrumb items={[{ label: 'Home' }]} />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 material-symbols-rounded" style={{ color: '#8d96a0' }}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search timelines and users..."
              className="w-full pl-14 pr-12 py-4 text-lg border-2 rounded-xl outline-none transition-all"
              style={{
                backgroundColor: '#161b22',
                borderColor: '#30363d',
                color: '#e6edf3'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#30363d';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 material-symbols-rounded"
                style={{ color: '#8d96a0' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e6edf3'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8d96a0'}
                aria-label="Clear search"
              >
                close
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full mt-2 w-full rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto" style={{ backgroundColor: '#161b22', border: '2px solid #30363d' }}>
              {searchResults.timelines.length === 0 && searchResults.users.length === 0 ? (
                <div className="p-6 text-center" style={{ color: '#8d96a0' }}>
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Timeline Results */}
                  {searchResults.timelines.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8d96a0' }}>
                        Timelines ({searchResults.timelines.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.timelines.map(timeline => (
                          <button
                            key={`search-${timeline.id}`}
                            onClick={() => {
                              handleTimelineClick(timeline);
                              clearSearch();
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d1117'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div className="font-medium" style={{ color: '#e6edf3' }}>{timeline.title}</div>
                            <div className="text-sm mt-1" style={{ color: '#8d96a0' }}>
                              {timeline.eventCount} events • by {timeline.ownerId}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Results */}
                  {searchResults.users.length > 0 && (
                    <div className="p-4" style={{ borderTop: '1px solid #30363d' }}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8d96a0' }}>
                        Users ({searchResults.users.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.users.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              handleUserClick(user);
                              clearSearch();
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d1117'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <UserAvatar user={user} size="medium" />
                            <div>
                              <div className="font-medium" style={{ color: '#e6edf3' }}>{user.name}</div>
                              <div className="text-sm mt-1" style={{ color: '#8d96a0' }}>{user.bio}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Has More Indicator */}
                  {searchResults.hasMore && (
                    <div className="p-4 text-center text-sm" style={{ borderTop: '1px solid #30363d', color: '#8d96a0' }}>
                      More results available. Continue typing to refine search.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* My Timelines Section - Only show when authenticated */}
        {firebaseUser && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: '#e6edf3' }}>
              My Timelines ({myTimelines.length})
            </h2>
            <button
              onClick={handleCreateTimeline}
              className="px-4 py-2 text-white rounded-lg transition-colors font-medium"
              style={{ backgroundColor: '#8b5cf6' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
            >
              + Create New
            </button>
          </div>

          {myTimelines.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <p className="mb-4" style={{ color: '#8d96a0' }}>You haven't created any timelines yet</p>
              <button
                onClick={handleCreateTimeline}
                className="px-6 py-3 text-white rounded-lg transition-colors font-medium"
                style={{ backgroundColor: '#8b5cf6' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                + Create Your First Timeline
              </button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {myTimelines.map(timeline => (
                <div
                  key={`my-${timeline.id}`}
                  className="flex-none w-80 border rounded-lg p-4 hover:shadow-lg transition-all relative"
                  style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                >
                  {/* Kebab menu - always visible */}
                  <div className="absolute top-2 right-2">
                    <TimelineCardMenu
                      timelineId={timeline.id}
                      ownerId={timeline.ownerId}
                      currentUserId={currentUser?.id}
                      onEdit={handleEditTimeline}
                      onDelete={handleDeleteTimeline}
                    />
                  </div>

                  {/* Card content - clickable to navigate */}
                  <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                    <h3 className="font-semibold mb-2 pr-10" style={{ color: '#e6edf3' }}>{timeline.title}</h3>
                    <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: '#8d96a0' }}>
                      {timeline.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm" style={{ color: '#8d96a0' }}>
                      <span>{timeline.eventCount} events</span>
                      <span>{new Date(timeline.updatedAt).toLocaleDateString()}</span>
                    </div>
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
        </section>
        )}

        {/* Statistics Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#e6edf3' }}>Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-6" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#06b6d4' }}>{stats.timelineCount}</div>
              <div className="text-sm" style={{ color: '#8d96a0' }}>Timelines</div>
            </div>
            <div className="border rounded-lg p-6" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#10b981' }}>{stats.userCount}</div>
              <div className="text-sm" style={{ color: '#8d96a0' }}>Users</div>
            </div>
            <div className="border rounded-lg p-6" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#8b5cf6' }}>{stats.eventCount}</div>
              <div className="text-sm" style={{ color: '#8d96a0' }}>Events</div>
            </div>
            <div className="border rounded-lg p-6" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#f59e0b' }}>{stats.viewCount}</div>
              <div className="text-sm" style={{ color: '#8d96a0' }}>Total Views</div>
            </div>
          </div>
        </section>

        {/* Recently Edited Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#e6edf3' }}>🔥 Recently Edited</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentlyEdited.map(timeline => (
              <div
                key={`recent-${timeline.id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
              >
                {/* Kebab menu */}
                <div className="absolute top-2 right-2">
                  <TimelineCardMenu
                    timelineId={timeline.id}
                    ownerId={timeline.ownerId}
                    currentUserId={currentUser?.id}
                    onEdit={handleEditTimeline}
                    onDelete={handleDeleteTimeline}
                  />
                </div>

                {/* Card content - clickable to navigate */}
                <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                  <h3 className="font-semibold mb-2 pr-8" style={{ color: '#e6edf3' }}>{timeline.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: '#8d96a0' }}>
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm" style={{ color: '#8d96a0' }}>
                    <span>{timeline.eventCount} events</span>
                    <span>{new Date(timeline.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {/* Owner badge - absolutely positioned at bottom-left */}
                  {(() => {
                    const owner = getUserById(timeline.ownerId);
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
        </section>

        {/* Popular Timelines Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#e6edf3' }}>⭐ Popular Timelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popular.map(timeline => (
              <div
                key={`popular-${timeline.id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
              >
                {/* Kebab menu */}
                <div className="absolute top-2 right-2">
                  <TimelineCardMenu
                    timelineId={timeline.id}
                    ownerId={timeline.ownerId}
                    currentUserId={currentUser?.id}
                    onEdit={handleEditTimeline}
                    onDelete={handleDeleteTimeline}
                  />
                </div>

                {/* Card content - clickable to navigate */}
                <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                  <h3 className="font-semibold mb-2 pr-8" style={{ color: '#e6edf3' }}>{timeline.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: '#8d96a0' }}>
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm" style={{ color: '#8d96a0' }}>
                    <span>{timeline.viewCount} views</span>
                    <span>{timeline.eventCount} events</span>
                  </div>
                  {/* Owner badge - absolutely positioned at bottom-left */}
                  {(() => {
                    const owner = getUserById(timeline.ownerId);
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
        </section>

        {/* Featured Timelines Section */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#e6edf3' }}>✨ Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map(timeline => (
                <div
                  key={`featured-${timeline.id}`}
                  className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                  style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                >
                  {/* Kebab menu */}
                  <div className="absolute top-2 right-2">
                    <TimelineCardMenu
                      timelineId={timeline.id}
                      ownerId={timeline.ownerId}
                      currentUserId={currentUser?.id}
                      onEdit={handleEditTimeline}
                      onDelete={handleDeleteTimeline}
                    />
                  </div>

                  {/* Card content - clickable to navigate */}
                  <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                    <div className="flex items-center gap-2 mb-2 pr-8">
                      <span className="text-yellow-500">⭐</span>
                      <h3 className="font-semibold flex-1" style={{ color: '#e6edf3' }}>{timeline.title}</h3>
                    </div>
                    <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: '#8d96a0' }}>
                      {timeline.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm" style={{ color: '#8d96a0' }}>
                      <span>{timeline.eventCount} events</span>
                      <span>{timeline.viewCount} views</span>
                    </div>
                    {/* Owner badge - absolutely positioned at bottom-left */}
                    {(() => {
                      const owner = getUserById(timeline.ownerId);
                      return owner ? (
                        <div className="absolute bottom-2 left-2" title={`Owner: ${owner.name}`}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {owner.avatar} {owner.name}
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
          </section>
        )}
        </main>
      </div>

      {/* User Switcher Modal */}
      <UserSwitcherModal
        open={userSwitcherOpen}
        onClose={() => setUserSwitcherOpen(false)}
      />

      {/* Timeline CRUD Dialogs */}
      <CreateTimelineDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

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
    </div>
  );
}
