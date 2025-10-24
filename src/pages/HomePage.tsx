/**
 * HomePage - Landing page with search, user workspace, and discovery feeds
 * Implements requirements from docs/SRS_HOME_PAGE.md (v0.4.0)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Timeline, User } from '../types';
import {
  getCurrentUser,
  getTimelinesByOwner,
  getRecentlyEditedTimelines,
  getPopularTimelines,
  getFeaturedTimelines,
  getPlatformStatistics,
  searchTimelinesAndUsers,
} from '../lib/homePageStorage';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { UserSwitcherModal } from '../components/UserSwitcherModal';
import { Breadcrumb } from '../components/Breadcrumb';

export function HomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myTimelines, setMyTimelines] = useState<Timeline[]>([]);
  const [recentlyEdited, setRecentlyEdited] = useState<Timeline[]>([]);
  const [popular, setPopular] = useState<Timeline[]>([]);
  const [featured, setFeatured] = useState<Timeline[]>([]);
  const [stats, setStats] = useState({
    timelineCount: 0,
    userCount: 0,
    eventCount: 0,
    viewCount: 0,
  });
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    timelines: Timeline[];
    users: User[];
    hasMore: boolean;
  } | null>(null);

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id);

  // Load data on mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user) {
      setMyTimelines(getTimelinesByOwner(user.id));
    }

    setRecentlyEdited(getRecentlyEditedTimelines(6));
    setPopular(getPopularTimelines(6));
    setFeatured(getFeaturedTimelines(6));
    setStats(getPlatformStatistics());
  }, []);

  const handleCreateTimeline = () => {
    // TODO: Open timeline creation dialog
    console.log('Create timeline clicked');
  };

  const handleTimelineClick = (timeline: Timeline) => {
    navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
  };

  const handleUserClick = (user: User) => {
    navigate(`/user/${user.id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      const results = searchTimelinesAndUsers(query);
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">PowerTimeline</h1>
              <div className="flex items-center gap-4">
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
            </div>
            <Breadcrumb items={[{ label: 'Home' }]} />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 material-symbols-rounded">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search timelines and users..."
              className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 material-symbols-rounded"
                aria-label="Clear search"
              >
                close
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
              {searchResults.timelines.length === 0 && searchResults.users.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Timeline Results */}
                  {searchResults.timelines.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Timelines ({searchResults.timelines.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.timelines.map(timeline => (
                          <button
                            key={timeline.id}
                            onClick={() => {
                              handleTimelineClick(timeline);
                              clearSearch();
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{timeline.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {timeline.events.length} events • by {timeline.ownerId}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Results */}
                  {searchResults.users.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <div className="text-2xl">{user.avatar}</div>
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 mt-1">{user.bio}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Has More Indicator */}
                  {searchResults.hasMore && (
                    <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
                      More results available. Continue typing to refine search.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* My Timelines Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              My Timelines ({myTimelines.length})
            </h2>
            <button
              onClick={handleCreateTimeline}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create New
            </button>
          </div>

          {myTimelines.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-gray-600 mb-4">You haven't created any timelines yet</p>
              <button
                onClick={handleCreateTimeline}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Create Your First Timeline
              </button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {myTimelines.map(timeline => (
                <div
                  key={timeline.id}
                  onClick={() => handleTimelineClick(timeline)}
                  className="flex-none w-80 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{timeline.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{timeline.events.length} events</span>
                    <span>{new Date(timeline.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Statistics Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.timelineCount}</div>
              <div className="text-sm text-gray-600">Timelines</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.userCount}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.eventCount}</div>
              <div className="text-sm text-gray-600">Events</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-600 mb-1">{stats.viewCount}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
          </div>
        </section>

        {/* Recently Edited Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔥 Recently Edited</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentlyEdited.map(timeline => (
              <div
                key={timeline.id}
                onClick={() => handleTimelineClick(timeline)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{timeline.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {timeline.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{timeline.events.length} events</span>
                  <span>{new Date(timeline.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Timelines Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⭐ Popular Timelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popular.map(timeline => (
              <div
                key={timeline.id}
                onClick={() => handleTimelineClick(timeline)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{timeline.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {timeline.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{timeline.viewCount} views</span>
                  <span>{timeline.events.length} events</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Timelines Section */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✨ Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map(timeline => (
                <div
                  key={timeline.id}
                  onClick={() => handleTimelineClick(timeline)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <h3 className="font-semibold text-gray-900">{timeline.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {timeline.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{timeline.events.length} events</span>
                    <span>{timeline.viewCount} views</span>
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
    </div>
  );
}
