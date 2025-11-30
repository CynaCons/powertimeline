/**
 * HomePage - Landing page with search, user workspace, and discovery feeds
 * Implements requirements from docs/SRS_HOME_PAGE.md (v0.4.0)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Skeleton } from '@mui/material';
import type { TimelineMetadata, User } from '../types';
import {
  getTimeline,
  getTimelines,
  getUsers,
  getUser,
  getPlatformStats,
} from '../services/firestore';
import { signOutUser } from '../services/auth';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { useAuth } from '../contexts/AuthContext';
import { CreateTimelineDialog } from '../components/CreateTimelineDialog';
import { EditTimelineDialog } from '../components/EditTimelineDialog';
import { DeleteTimelineDialog } from '../components/DeleteTimelineDialog';
import { TimelineCardMenu } from '../components/TimelineCardMenu';
import { UserAvatar } from '../components/UserAvatar';
import { useToast } from '../hooks/useToast';

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

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id, undefined, currentUser);

  // Loading state for timeline data
  const [loadingTimelines, setLoadingTimelines] = useState(true);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not already in an input/textarea
      if (e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper function to get user by ID from cache
  const getUserById = (userId: string): User | null => {
    return allUsers.find(u => u.id === userId) || null;
  };

  // Filter out private timelines from discovery feeds (only show public)
  const filterPublicTimelines = (timelines: TimelineMetadata[]) =>
    timelines.filter(t => (t.visibility ?? 'public') === 'public');

  // Load data on mount and when firebaseUser changes
  useEffect(() => {
    async function loadData() {
      setLoadingTimelines(true);
      try {
        // Load current user profile from Firestore if authenticated
        if (firebaseUser) {
          const userProfile = await getUser(firebaseUser.uid);
          setCurrentUser(userProfile);
        } else {
          setCurrentUser(null);
        }

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

        // Load user's timelines (only if authenticated)
        if (firebaseUser) {
          const userTimelines = await getTimelines({
            ownerId: firebaseUser.uid,
            orderByField: 'updatedAt',
            orderDirection: 'desc',
          });
          setMyTimelines(userTimelines);
        } else {
          setMyTimelines([]);
        }

        // Load recently edited timelines for discovery (public only)
        const recentTimelines = await getTimelines({
          orderByField: 'updatedAt',
          orderDirection: 'desc',
          limitCount: 12, // Fetch extra to account for filtering
        });
        setRecentlyEdited(filterPublicTimelines(recentTimelines).slice(0, 6));

        // Load popular timelines for discovery (public only)
        const popularTimelines = await getTimelines({
          orderByField: 'viewCount',
          orderDirection: 'desc',
          limitCount: 12, // Fetch extra to account for filtering
        });
        setPopular(filterPublicTimelines(popularTimelines).slice(0, 6));

        // Note: Featured timelines functionality to be removed per PLAN.md known issues
        setFeatured([]);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading timelines', 'error');
      } finally {
        setLoadingTimelines(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]); // Re-run when auth state changes

  const handleCreateTimeline = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = async (timelineId: string) => {
    showToast('Timeline created successfully!', 'success');

    // Refresh timeline lists
    if (firebaseUser) {
      const userTimelines = await getTimelines({
        ownerId: firebaseUser.uid,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setMyTimelines(userTimelines);
    }

    const recentTimelines = await getTimelines({
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 12,
    });
    setRecentlyEdited(filterPublicTimelines(recentTimelines).slice(0, 6));

    // Navigate to the new timeline using username-based URL
    // Note: URL pattern is /:username/timeline/:id (no @ prefix - React Router v7 bug)
    const timeline = await getTimeline(timelineId);
    if (timeline && currentUser) {
      navigate(`/${currentUser.username}/timeline/${timeline.id}`);
    }
  };

  const handleEditTimeline = (timelineId: string) => {
    setEditTimelineId(timelineId);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = async () => {
    showToast('Timeline updated successfully!', 'success');

    // Refresh timeline lists
    if (firebaseUser) {
      const userTimelines = await getTimelines({
        ownerId: firebaseUser.uid,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setMyTimelines(userTimelines);
    }

    const recentTimelines = await getTimelines({
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 12,
    });
    setRecentlyEdited(filterPublicTimelines(recentTimelines).slice(0, 6));
  };

  const handleDeleteTimeline = (timelineId: string) => {
    setDeleteTimelineId(timelineId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = async () => {
    showToast('Timeline deleted successfully!', 'success');

    // Refresh timeline lists
    if (firebaseUser) {
      const userTimelines = await getTimelines({
        ownerId: firebaseUser.uid,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
      });
      setMyTimelines(userTimelines);
    }

    const recentTimelines = await getTimelines({
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 12,
    });
    setRecentlyEdited(filterPublicTimelines(recentTimelines).slice(0, 6));

    const popularTimelines = await getTimelines({
      orderByField: 'viewCount',
      orderDirection: 'desc',
      limitCount: 12,
    });
    setPopular(filterPublicTimelines(popularTimelines).slice(0, 6));
  };

  const handleTimelineClick = (timeline: TimelineMetadata) => {
    // v0.5.14: Use username-based URL with fallback to legacy URL
    // Note: URL pattern is /:username/timeline/:id (no @ prefix - React Router v7 bug)
    const owner = getUserById(timeline.ownerId);
    if (owner?.username) {
      navigate(`/${owner.username}/timeline/${timeline.id}`);
    } else {
      // Fallback: use legacy URL pattern (EditorPage will handle redirect)
      console.warn(`Owner not cached for timeline ${timeline.id}, using legacy URL`);
      navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
    }
  };

  const handleUserClick = (user: User) => {
    // Note: URL pattern is /:username (no @ prefix - React Router v7 bug)
    navigate(`/${user.username}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      const lowerQuery = query.toLowerCase();

      // Search in already loaded timelines (recently edited + popular)
      const allLoadedTimelines = [...recentlyEdited, ...popular, ...myTimelines];
      const uniqueTimelines = allLoadedTimelines.filter((t, i, arr) =>
        arr.findIndex(x => x.id === t.id) === i
      );

      const matchingTimelines = uniqueTimelines.filter(t =>
        t.title.toLowerCase().includes(lowerQuery) ||
        (t.description && t.description.toLowerCase().includes(lowerQuery))
      );

      // Search in cached users (SRS_DB.md compliant - v0.5.14: search by username)
      const matchingUsers = allUsers.filter(u =>
        u.username.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
      );

      setSearchResults({
        timelines: matchingTimelines.slice(0, 10),
        users: matchingUsers.slice(0, 5),
        hasMore: matchingTimelines.length > 10 || matchingUsers.length > 5,
      });
    } else {
      setSearchResults(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <div data-testid="browse-page" className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="flex">
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
        {/* Header - with mobile logo and navigation */}
        <header className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--page-bg-elevated)', borderColor: 'var(--page-border)' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              {/* Brand: Logo + PowerTimeline BETA */}
              <div className="flex items-center gap-2">
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
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile: Theme toggle (since nav rail is hidden) */}
                <div className="md:hidden">
                  <ThemeToggleButton />
                </div>
                {firebaseUser ? (
                  <UserProfileMenu
                    onLogout={async () => {
                      await signOutUser();
                      navigate('/');
                    }}
                  />
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 material-symbols-rounded" style={{ color: 'var(--page-text-secondary)' }}>
              search
            </span>
            <input
              ref={searchInputRef}
              data-testid="browse-search-input"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search timelines and users..."
              className="w-full pl-14 pr-20 py-4 text-lg border-2 rounded-xl outline-none transition-all"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--page-text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--input-focus-border)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--input-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Keyboard shortcut hint - hidden on mobile */}
            {!searchQuery && (
              <span
                className="absolute right-12 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded text-xs font-mono hidden md:block"
                style={{
                  backgroundColor: 'var(--page-bg)',
                  color: 'var(--page-text-secondary)',
                  border: '1px solid var(--page-border)',
                }}
              >
                /
              </span>
            )}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 material-symbols-rounded"
                style={{ color: 'var(--page-text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--page-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--page-text-secondary)'}
                aria-label="Clear search"
              >
                close
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full mt-2 w-full rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
              {searchResults.timelines.length === 0 && searchResults.users.length === 0 ? (
                <div className="p-6 text-center" style={{ color: 'var(--page-text-secondary)' }}>
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Timeline Results */}
                  {searchResults.timelines.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--page-text-secondary)' }}>
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div className="font-medium" style={{ color: 'var(--page-text-primary)' }}>{timeline.title}</div>
                            <div className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
                              {timeline.eventCount} events • by {timeline.ownerId}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Results */}
                  {searchResults.users.length > 0 && (
                    <div className="p-4" style={{ borderTop: '1px solid var(--card-border)' }}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--page-text-secondary)' }}>
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <UserAvatar user={user} size="medium" />
                            <div>
                              <div className="font-medium" style={{ color: 'var(--page-text-primary)' }}>@{user.username}</div>
                              <div className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>{user.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Has More Indicator */}
                  {searchResults.hasMore && (
                    <div className="p-4 text-center text-sm" style={{ borderTop: '1px solid var(--card-border)', color: 'var(--page-text-secondary)' }}>
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
        <section data-testid="my-timelines-section" className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 data-testid="my-timelines-heading" className="text-xl font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              My Timelines ({myTimelines.length})
            </h2>
            <button
              data-testid="create-timeline-button"
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
            <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <p className="mb-4" style={{ color: 'var(--page-text-secondary)' }}>You haven't created any timelines yet</p>
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
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
                >
                  {/* Kebab menu - always visible */}
                  <div className="absolute top-2 right-2">
                    <TimelineCardMenu
                      timelineId={timeline.id}
                      ownerId={timeline.ownerId}
                      ownerUsername={currentUser?.username || ''}
                      currentUserId={firebaseUser?.uid}
                      onEdit={handleEditTimeline}
                      onDelete={handleDeleteTimeline}
                    />
                  </div>

                  {/* Card content - clickable to navigate */}
                  <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                    <h3 className="font-semibold mb-2 pr-10" style={{ color: 'var(--page-text-primary)' }}>{timeline.title}</h3>
                    <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: 'var(--page-text-secondary)' }}>
                      {timeline.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm" style={{ color: 'var(--page-text-secondary)' }}>
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
        <section data-testid="platform-stats-section" className="mb-12">
          <h2 data-testid="platform-stats-heading" className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#06b6d4' }}>{stats.timelineCount}</div>
              <div className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>Timelines</div>
            </div>
            <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#10b981' }}>{stats.userCount}</div>
              <div className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>Users</div>
            </div>
            <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#8b5cf6' }}>{stats.eventCount}</div>
              <div className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>Events</div>
            </div>
            <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#f59e0b' }}>{stats.viewCount}</div>
              <div className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>Total Views</div>
            </div>
          </div>
        </section>

        {/* Recently Edited Section */}
        <section data-testid="recently-edited-section" className="mb-12">
          <h2 data-testid="recently-edited-heading" className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>🔥 Recently Edited</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingTimelines ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-recent-${index}`}
                  className="border rounded-lg p-4"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'var(--page-bg)' }} />
                  <Skeleton variant="text" width="100%" sx={{ bgcolor: 'var(--page-bg)', mt: 1 }} />
                  <Skeleton variant="text" width="80%" sx={{ bgcolor: 'var(--page-bg)' }} />
                  <div className="flex justify-between mt-3">
                    <Skeleton variant="text" width="30%" sx={{ bgcolor: 'var(--page-bg)' }} />
                    <Skeleton variant="text" width="25%" sx={{ bgcolor: 'var(--page-bg)' }} />
                  </div>
                </div>
              ))
            ) : recentlyEdited.map(timeline => (
              <div
                key={`recent-${timeline.id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
              >
                {/* Kebab menu */}
                <div className="absolute top-2 right-2">
                  <TimelineCardMenu
                    timelineId={timeline.id}
                    ownerId={timeline.ownerId}
                    ownerUsername={getUserById(timeline.ownerId)?.username || ''}
                    currentUserId={firebaseUser?.uid}
                    onEdit={handleEditTimeline}
                    onDelete={handleDeleteTimeline}
                  />
                </div>

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
                    const owner = getUserById(timeline.ownerId);
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
        </section>

        {/* Popular Timelines Section */}
        <section data-testid="popular-timelines-section" className="mb-12">
          <h2 data-testid="popular-timelines-heading" className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>⭐ Popular Timelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingTimelines ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-popular-${index}`}
                  className="border rounded-lg p-4"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'var(--page-bg)' }} />
                  <Skeleton variant="text" width="100%" sx={{ bgcolor: 'var(--page-bg)', mt: 1 }} />
                  <Skeleton variant="text" width="80%" sx={{ bgcolor: 'var(--page-bg)' }} />
                  <div className="flex justify-between mt-3">
                    <Skeleton variant="text" width="30%" sx={{ bgcolor: 'var(--page-bg)' }} />
                    <Skeleton variant="text" width="25%" sx={{ bgcolor: 'var(--page-bg)' }} />
                  </div>
                </div>
              ))
            ) : popular.map(timeline => (
              <div
                key={`popular-${timeline.id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
              >
                {/* Kebab menu */}
                <div className="absolute top-2 right-2">
                  <TimelineCardMenu
                    timelineId={timeline.id}
                    ownerId={timeline.ownerId}
                    ownerUsername={getUserById(timeline.ownerId)?.username || ''}
                    currentUserId={firebaseUser?.uid}
                    onEdit={handleEditTimeline}
                    onDelete={handleDeleteTimeline}
                  />
                </div>

                {/* Card content - clickable to navigate */}
                <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                  <h3 className="font-semibold mb-2 pr-8" style={{ color: 'var(--page-text-primary)' }}>{timeline.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: 'var(--page-text-secondary)' }}>
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm" style={{ color: 'var(--page-text-secondary)' }}>
                    <span>{timeline.viewCount} views</span>
                    <span>{timeline.eventCount} events</span>
                  </div>
                  {/* Owner badge - absolutely positioned at bottom-left */}
                  {(() => {
                    const owner = getUserById(timeline.ownerId);
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
        </section>

        {/* Featured Timelines Section */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>✨ Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map(timeline => (
                <div
                  key={`featured-${timeline.id}`}
                  className="border rounded-lg p-4 hover:shadow-lg transition-all relative"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
                >
                  {/* Kebab menu */}
                  <div className="absolute top-2 right-2">
                    <TimelineCardMenu
                      timelineId={timeline.id}
                      ownerId={timeline.ownerId}
                      ownerUsername={getUserById(timeline.ownerId)?.username || ''}
                      currentUserId={firebaseUser?.uid}
                      onEdit={handleEditTimeline}
                      onDelete={handleDeleteTimeline}
                    />
                  </div>

                  {/* Card content - clickable to navigate */}
                  <div onClick={() => handleTimelineClick(timeline)} className="cursor-pointer relative min-h-[140px] pb-8">
                    <div className="flex items-center gap-2 mb-2 pr-8">
                      <span className="text-yellow-500">⭐</span>
                      <h3 className="font-semibold flex-1" style={{ color: 'var(--page-text-primary)' }}>{timeline.title}</h3>
                    </div>
                    <p className="text-sm mb-3 line-clamp-2 min-h-[40px]" style={{ color: 'var(--page-text-secondary)' }}>
                      {timeline.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm" style={{ color: 'var(--page-text-secondary)' }}>
                      <span>{timeline.eventCount} events</span>
                      <span>{timeline.viewCount} views</span>
                    </div>
                    {/* Owner badge - absolutely positioned at bottom-left */}
                    {(() => {
                      const owner = getUserById(timeline.ownerId);
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
          </section>
        )}
        </main>
      </div>

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
