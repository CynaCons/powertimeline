/**
 * EditorPage - Timeline editor/viewer page with timeline loading from URL params
 * Wraps the existing App.tsx editor functionality for v0.4.0 routing
 *
 * Read-only mode (v0.5.3):
 * - Unauthenticated users can view timelines
 * - Authenticated non-owners can view timelines
 * - Only owners can edit their timelines
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';
import { getTimeline, getUser, incrementTimelineViewCount } from '../services/firestore';
import { getCurrentUser } from '../lib/homePageStorage';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import type { Timeline, User } from '../types';
import App from '../App';  // The existing editor

export function EditorPage() {
  const { timelineId, userId } = useParams<{ timelineId: string; userId: string }>();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showReadOnlyToast, setShowReadOnlyToast] = useState(false);

  useEffect(() => {
    async function loadTimeline() {
      try {
        if (!timelineId) {
          // No timeline ID - load default editor
          setLoading(false);
          return;
        }

        const tl = await getTimeline(timelineId);
        if (!tl) {
          // Timeline not found - redirect to home
          navigate('/');
          return;
        }

        const usr = userId ? (await getUser(userId) || null) : null;

        setTimeline(tl);
        setUser(usr);

        // Increment view count for the timeline (only if viewer is not the owner)
        const currentUser = getCurrentUser();
        await incrementTimelineViewCount(timelineId, currentUser?.id);
        setLoading(false);

        // Show read-only toast if user is not the owner
        const isOwner = firebaseUser && firebaseUser.uid === tl.ownerId;
        if (!isOwner) {
          setShowReadOnlyToast(true);
        }
      } catch (error) {
        console.error('Error loading timeline:', error);
        console.error('Timeline ID:', timelineId);
        console.error('User ID:', userId);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        // On error, redirect to home page
        navigate('/');
      }
    }

    loadTimeline();
  }, [timelineId, userId, navigate]);

  // Determine if user is the owner (can edit)
  const isOwner = timeline && firebaseUser && firebaseUser.uid === timeline.ownerId;
  const isReadOnly = !isOwner;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  // Render the editor/viewer with breadcrumbs
  return (
    <Box sx={{ minHeight: '100vh' }}>

      <div className="relative">
        {/* Breadcrumb for authenticated owner mode */}
        {timeline && user && !isReadOnly && (
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
        <App timelineId={timelineId} readOnly={isReadOnly} />
      </div>

      {/* Read-only mode toast notification */}
      <Snackbar
        open={showReadOnlyToast}
        autoHideDuration={5000}
        onClose={() => setShowReadOnlyToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowReadOnlyToast(false)}
          severity="info"
          sx={{ width: '100%' }}
        >
          Viewing in read-only mode. {!firebaseUser ? 'Sign in to edit your own timelines.' : 'You can fork this timeline to make your own copy.'}
        </Alert>
      </Snackbar>
    </Box>
  );
}
