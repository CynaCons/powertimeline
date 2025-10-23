/**
 * EditorPage - Timeline editor page with timeline loading from URL params
 * Wraps the existing App.tsx editor functionality for v0.4.0 routing
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTimelineById, incrementViewCount } from '../lib/homePageStorage';
import App from '../App';  // The existing editor

export function EditorPage() {
  const { timelineId } = useParams<{ timelineId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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

    // Increment view count for the timeline
    incrementViewCount(timelineId);
    setLoading(false);
  }, [timelineId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  // For now, render the existing App component (timeline editor)
  // In the future, we'll pass timeline data as props
  return <App />;
}
