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
import { Box, Alert, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { getTimeline, getUser, incrementTimelineViewCount } from '../services/firestore';
import { getCurrentUser } from '../lib/homePageStorage';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { TopNavBar } from '../components/TopNavBar';
import type { Timeline, User } from '../types';
import App from '../App';  // The existing editor

export function EditorPage() {
  const { timelineId, userId } = useParams<{ timelineId: string; userId: string }>();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadTimeline() {
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

  // Render the editor/viewer with optional top nav and read-only banner
  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Top navigation for read-only mode (unauthenticated or non-owner) */}
      {isReadOnly && <TopNavBar />}

      {/* Read-only mode banner */}
      {isReadOnly && timeline && (
        <Box sx={{ bgcolor: '#0d1117', borderBottom: '1px solid #21262d' }}>
          <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 2, py: 1.5 }}>
            <Alert
              icon={<InfoIcon fontSize="inherit" />}
              severity="info"
              data-testid="read-only-banner"
              sx={{
                bgcolor: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#e6edf3',
                '& .MuiAlert-icon': {
                  color: '#06b6d4',
                },
              }}
              action={
                !firebaseUser && (
                  <Button
                    size="small"
                    onClick={() => navigate('/login')}
                    data-testid="sign-in-to-edit-button"
                    sx={{
                      color: '#06b6d4',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(6, 182, 212, 0.2)',
                      },
                    }}
                  >
                    Sign In to Edit
                  </Button>
                )
              }
            >
              Viewing <strong>{timeline.title}</strong> in read-only mode
              {firebaseUser && ' (You are not the owner)'}
            </Alert>
          </Box>
        </Box>
      )}

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
    </Box>
  );
}
