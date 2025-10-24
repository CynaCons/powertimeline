/**
 * EditorPage - Timeline editor page with timeline loading from URL params
 * Wraps the existing App.tsx editor functionality for v0.4.0 routing
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTimelineById, incrementViewCount, getUserById } from '../lib/homePageStorage';
import { Breadcrumb } from '../components/Breadcrumb';
import type { Timeline, User } from '../types';
import App from '../App';  // The existing editor

export function EditorPage() {
  const { timelineId, userId } = useParams<{ timelineId: string; userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!timelineId) {
      // No timeline ID - load default editor
      setLoading(false);
      return;
    }

    const tl = getTimelineById(timelineId);
    if (!tl) {
      // Timeline not found - redirect to home
      navigate('/');
      return;
    }

    const usr = userId ? (getUserById(userId) || null) : null;

    setTimeline(tl);
    setUser(usr);

    // Increment view count for the timeline
    incrementViewCount(timelineId);
    setLoading(false);
  }, [timelineId, userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  // Render the editor with the timeline ID and breadcrumb
  return (
    <div className="relative">
      {timeline && user && (
        <div className="absolute top-11 left-20 z-[100] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded px-3 py-0.5 pointer-events-auto inline-block">
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: user.name, href: `/user/${user.id}` },
              { label: timeline.title }
            ]} />
          </div>
        </div>
      )}
      <App timelineId={timelineId} />
    </div>
  );
}
