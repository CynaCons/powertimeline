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
} from '../lib/homePageStorage';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';

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
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">PowerTimeline</h1>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <button
                  onClick={() => navigate(`/user/${currentUser.id}`)}
                  className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="text-2xl">{currentUser.avatar}</span>
                  <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Bar - Placeholder */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search timelines and users..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
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
    </div>
  );
}
