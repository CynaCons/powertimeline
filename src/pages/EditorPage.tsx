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
import { Box, Snackbar, Alert, useMediaQuery, useTheme } from '@mui/material';
import { getTimeline, getUser, incrementTimelineViewCount } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import type { Timeline, User } from '../types';
import App from '../App';  // The existing editor

// Mobile notice component
function MobileNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 max-w-sm text-center">
        <span className="material-symbols-rounded text-5xl text-[#8b5cf6] mb-4 block">
          desktop_windows
        </span>
        <h2 className="text-xl font-semibold text-[#e6edf3] mb-2">
          Desktop Recommended
        </h2>
        <p className="text-[#8d96a0] mb-4 text-sm leading-relaxed">
          The timeline editor works best on larger screens.
          You can still browse and view timelines, but editing features
          require a desktop or tablet for the best experience.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 bg-[#8b5cf6] text-white rounded-lg font-medium hover:bg-[#7c3aed] transition-colors"
          >
            Continue Anyway
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 border border-[#30363d] text-[#8d96a0] rounded-lg font-medium hover:border-[#8b5cf6] hover:text-[#e6edf3] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditorPage() {
  const { timelineId, userId } = useParams<{ timelineId: string; userId: string }>();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showReadOnlyToast, setShowReadOnlyToast] = useState(false);
  const [mobileNoticeDismissed, setMobileNoticeDismissed] = useState(false);

  // Detect mobile/small screen
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px

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
        await incrementTimelineViewCount(timelineId, firebaseUser?.uid);
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
  }, [timelineId, userId, navigate, firebaseUser]);

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
      {/* Mobile notice - show on small screens */}
      {isMobile && !mobileNoticeDismissed && (
        <MobileNotice onDismiss={() => setMobileNoticeDismissed(true)} />
      )}

      <div className="relative">
        {/* Breadcrumb navigation - shown in all modes (owner and read-only) */}
        {timeline && user && (
          <div className="absolute top-11 left-20 z-[100] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded px-3 py-0.5 pointer-events-auto inline-block">
              <Breadcrumb items={[
                { label: 'Home', href: '/browse' },
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
