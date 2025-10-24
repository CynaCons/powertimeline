/**
 * UserProfilePage - Display user information and their timelines
 * Implements requirements from docs/SRS_HOME_PAGE.md (v0.4.0)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Timeline, User } from '../types';
import { getUserById, getTimelinesByOwner, getCurrentUser } from '../lib/homePageStorage';
import { NavigationRail, ThemeToggleButton } from '../components/NavigationRail';
import { useNavigationConfig } from '../app/hooks/useNavigationConfig';
import { UserProfileMenu } from '../components/UserProfileMenu';
import { UserSwitcherModal } from '../components/UserSwitcherModal';
import { Breadcrumb } from '../components/Breadcrumb';

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const currentUser = getCurrentUser();

  // Get navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    const userData = getUserById(userId);
    if (!userData) {
      // User not found - redirect to home
      navigate('/');
      return;
    }

    setUser(userData);
    setTimelines(getTimelinesByOwner(userId));
    setLoading(false);
  }, [userId, navigate]);

  const handleTimelineClick = (timeline: Timeline) => {
    navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">User not found</div>;
  }

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
              { label: user.name }
            ]} />
          </div>
        </header>

        {/* User Profile Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="text-6xl">{user.avatar}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
              {user.bio && (
                <p className="text-gray-600 max-w-2xl">{user.bio}</p>
              )}
              <div className="mt-2 text-sm text-gray-500">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* User Timelines */}
        <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Timelines ({timelines.length})
        </h2>

        {timelines.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-600">{user.name} hasn't created any timelines yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timelines.map(timeline => (
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
                  <span>{timeline.viewCount} views</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Updated {new Date(timeline.updatedAt).toLocaleDateString()}
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
    </div>
  );
}
