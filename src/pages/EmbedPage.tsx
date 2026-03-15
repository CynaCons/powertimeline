/**
 * EmbedPage - Lightweight embed viewer for iframes
 * Only renders public/unlisted timelines without chrome
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getTimeline, getUser, getUserByUsername, incrementTimelineViewCount } from '../services/firestore';
import { timelineUrl } from '../utils/urls';
import type { Timeline, User } from '../types';
import App from '../App';

export function EmbedPage() {
  const { timelineId, username } = useParams<{ timelineId: string; username?: string }>();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!timelineId) {
        setError('No timeline ID');
        setLoading(false);
        return;
      }

      const tl = await getTimeline(timelineId);
      if (!tl) {
        setError('Timeline not found');
        setLoading(false);
        return;
      }

      // Only allow public or unlisted timelines to be embedded
      const visibility = tl.visibility ?? 'public';
      if (visibility === 'private') {
        setError('This timeline is private');
        setLoading(false);
        return;
      }

      let usr: User | null = null;
      if (username) {
        usr = await getUserByUsername(username);
      }
      if (!usr && tl.ownerId) {
        usr = await getUser(tl.ownerId);
      }

      setTimeline(tl);
      setUser(usr);
      setLoading(false);

      // Increment view count (fire-and-forget)
      incrementTimelineViewCount(timelineId).catch((err) => {
        console.debug('Failed to increment embed view count:', err);
      });
    }
    load();
  }, [timelineId, username]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--page-bg)' }}>
        <div style={{ color: 'var(--page-text-secondary)' }}>Loading timeline...</div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--page-bg)' }}>
        <div style={{ color: 'var(--page-text-secondary)' }}>{error || 'Timeline not found'}</div>
      </div>
    );
  }

  const fullUrl = user ? timelineUrl(user.username, timeline.id) : '';

  return (
    <>
      <Helmet>
        <title>{timeline.title} | PowerTimeline</title>
      </Helmet>

      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <App timelineId={timelineId} readOnly embed />

        {/* Powered by badge - bottom-right corner */}
        {fullUrl && (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              zIndex: 100,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#e6edf3',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              textDecoration: 'none',
              backdropFilter: 'blur(4px)',
            }}
          >
            Powered by PowerTimeline
          </a>
        )}
      </div>
    </>
  );
}
