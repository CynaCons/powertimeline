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
import { getTimeline, getUser, getUserByUsername, incrementTimelineViewCount } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import type { Timeline, User } from '../types';
import App from '../App';  // The existing editor
import { SkeletonCard } from '../components/SkeletonCard';

// Mobile notice component - now offers Stream View as primary option
function MobileNotice({ onDismiss, onOpenStreamView }: { onDismiss: () => void; onOpenStreamView: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 max-w-sm text-center">
        <span className="material-symbols-rounded text-5xl text-[#8b5cf6] mb-4 block">
          view_stream
        </span>
        <h2 className="text-xl font-semibold text-[#e6edf3] mb-2">
          Mobile View Available
        </h2>
        <p className="text-[#8d96a0] mb-4 text-sm leading-relaxed">
          The timeline canvas works best on larger screens.
          Use <strong>Stream View</strong> for a mobile-friendly experience,
          or continue to the canvas view anyway.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onOpenStreamView}
            className="w-full px-4 py-2 bg-[#8b5cf6] text-white rounded-lg font-medium hover:bg-[#7c3aed] transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>view_stream</span>
            Open Stream View
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 border border-[#30363d] text-[#8d96a0] rounded-lg font-medium hover:border-[#8b5cf6] hover:text-[#e6edf3] transition-colors"
          >
            Continue to Canvas
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 text-[#6e7681] text-sm hover:text-[#8d96a0] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditorPage() {
  // Support both username-based (/:username/timeline/:timelineId) and legacy userId-based URLs
  const { timelineId, userId, username } = useParams<{ timelineId: string; userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showReadOnlyToast, setShowReadOnlyToast] = useState(false);
  const [mobileNoticeDismissed, setMobileNoticeDismissed] = useState(false);
  const [streamViewerOpen, setStreamViewerOpen] = useState(false);

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

        // Resolve user from username, userId, or timeline.ownerId as fallback
        let usr: User | null = null;
        if (username) {
          // New username-based URL - try to find user by username
          usr = await getUserByUsername(username);
          if (!usr) {
            // Username not found - try getting owner from timeline's ownerId
            console.warn(`User not found for username: ${username}, falling back to timeline owner`);
            usr = await getUser(tl.ownerId);
            if (usr && usr.username.toLowerCase() !== username.toLowerCase()) {
              // Redirect to correct username URL
              // Note: URL pattern is /:username/timeline/:id (no @ prefix - React Router v7 bug)
              navigate(`/${usr.username}/timeline/${timelineId}`, { replace: true });
              return;
            }
          }
        } else if (userId) {
          // Legacy userId-based URL - redirect to username URL
          usr = await getUser(userId);
          if (usr) {
            // Redirect to the new username-based URL (hard cutover)
            // Note: URL pattern is /:username/timeline/:id (no @ prefix - React Router v7 bug)
            navigate(`/${usr.username}/timeline/${timelineId}`, { replace: true });
            return;
          }
        }

        // Final fallback: get user from timeline owner if still not found
        if (!usr && tl.ownerId) {
          usr = await getUser(tl.ownerId);
        }

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
  }, [timelineId, userId, username, navigate, firebaseUser]);

  // Determine if user is the owner (can edit)
  const isOwner = timeline && firebaseUser && firebaseUser.uid === timeline.ownerId;
  const isReadOnly = !isOwner;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-6">
          <div className="skeleton-panel">
            <div className="skeleton-block skeleton-title" style={{ width: '60%', height: '32px' }} />
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="skeleton-pill" style={{ width: '120px', height: '14px' }} />
              <span className="skeleton-pill" style={{ width: '90px', height: '14px' }} />
              <span className="skeleton-pill" style={{ width: '140px', height: '14px' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={`editor-skeleton-${index}`} minHeight={140} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render the editor/viewer with breadcrumbs
  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Mobile notice - show on small screens, offer Stream View */}
      {isMobile && !mobileNoticeDismissed && timeline && (
        <MobileNotice
          onDismiss={() => setMobileNoticeDismissed(true)}
          onOpenStreamView={() => {
            setMobileNoticeDismissed(true);
            setStreamViewerOpen(true);
          }}
        />
      )}

      <div className="relative">
        {/* Breadcrumb navigation - shown in all modes (owner and read-only) */}
        {/* z-[1400] when stream view open to appear above overlay (z-1300) */}
        {timeline && user && (
          <div className={`absolute top-11 left-20 pointer-events-none ${streamViewerOpen ? 'z-[1400]' : 'z-[100]'}`}>
            <div
              className="backdrop-blur-sm rounded px-3 py-0.5 pointer-events-auto inline-flex items-center gap-2"
              style={{
                backgroundColor: 'var(--page-bg-elevated)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--page-border)'
              }}
            >
              <Breadcrumb items={[
                { label: 'Home', href: '/browse' },
                { label: `@${user.username}`, href: `/@${user.username}` },
                { label: timeline.title }
              ]} />
            </div>
          </div>
        )}
        <App timelineId={timelineId} readOnly={isReadOnly} initialStreamViewOpen={streamViewerOpen} onStreamViewChange={(isOpen) => setStreamViewerOpen(isOpen)} />
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
      {/* Stream Viewer is now handled by App.tsx for proper sync with minimap/timeline */}
    </Box>
  );
}
