/**
 * Landing Page - Redesigned v0.5.6
 * Dark theme with gradient effects and timeline-focused messaging
 * Inspired by GitHub, Linear, and modern SaaS best practices
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, TextField, InputAdornment, Card, CardContent, CardActionArea, Stack, Link, Tooltip, Skeleton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import { TopNavBar } from '../components/TopNavBar';
import { useAuth } from '../contexts/AuthContext';
import { getTimelineMetadata } from '../services/firestore';
import type { TimelineMetadata } from '../types';

// Example timeline IDs to display on landing page
const EXAMPLE_TIMELINE_IDS = [
  'timeline-french-revolution',
  'timeline-napoleon',
  'timeline-charles-de-gaulle',
  'timeline-rfk',
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exampleTimelines, setExampleTimelines] = useState<TimelineMetadata[]>([]);
  const [loadingExamples, setLoadingExamples] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch example timelines from Firestore to get correct owner IDs
  useEffect(() => {
    async function loadExampleTimelines() {
      try {
        const timelines = await Promise.all(
          EXAMPLE_TIMELINE_IDS.map(id => getTimelineMetadata(id))
        );
        setExampleTimelines(timelines.filter((t): t is TimelineMetadata => t !== null));
      } catch (error) {
        console.error('Error loading example timelines:', error);
      } finally {
        setLoadingExamples(false);
      }
    }
    loadExampleTimelines();
  }, []);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not already in an input/textarea
      if (e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleBrowseTimelines = () => {
    navigate('/browse');
  };

  const handleGetStarted = () => {
    if (user) {
      navigate(`/user/${user.uid}`);
    } else {
      navigate('/login');
    }
  };

  // Navigate to specific timeline using actual owner ID from Firestore
  const handleTimelineClick = (timeline: TimelineMetadata) => {
    navigate(`/user/${timeline.ownerId}/timeline/${timeline.id}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0d1117', color: '#e6edf3' }}>
      {/* Top Navigation */}
      <TopNavBar />

      {/* Hero Section - Dark with Gradient Headline */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 10 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150%',
            height: '100%',
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Gradient Headline */}
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              fontWeight: 800,
              lineHeight: 1.1,
              mb: 2,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Where events become understanding
          </Typography>

          {/* Action verbs line */}
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 3,
              color: '#e6edf3',
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            Explore. Create. Visualize. Fork. Merge.
          </Typography>

          {/* Purpose statement */}
          <Typography
            variant="h6"
            component="h2"
            sx={{
              mb: 5,
              color: '#8d96a0',
              fontSize: { xs: '1rem', md: '1.15rem' },
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Make sense of complex events, history, and politics by mapping them across time.
            Build a collaborative shared memory for what matters.
          </Typography>

          {/* Search Bar - Moved here below headline */}
          <Container maxWidth="md" sx={{ mb: 5 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <TextField
                  fullWidth
                  placeholder="Search timelines, users, or topics..."
                  variant="outlined"
                  data-testid="search-input"
                  inputRef={searchInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#8d96a0' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box
                          sx={{
                            bgcolor: '#21262d',
                            color: '#8d96a0',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            border: '1px solid #30363d',
                          }}
                        >
                          /
                        </Box>
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: '#0d1117',
                      color: '#e6edf3',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#30363d',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8b5cf6',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8b5cf6',
                      },
                    },
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const query = (e.target as HTMLInputElement).value;
                      navigate(`/browse?search=${encodeURIComponent(query)}`);
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Container>

          {/* CTA Buttons - Explore primary (orange), Sign In secondary */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleBrowseTimelines}
              data-testid="cta-explore-examples"
              sx={{
                bgcolor: '#f97316',
                color: '#fff',
                fontSize: '1.1rem',
                px: 5,
                py: 1.75,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.4)',
                '&:hover': {
                  bgcolor: '#ea580c',
                  boxShadow: '0 6px 20px 0 rgba(249, 115, 22, 0.5)',
                },
              }}
            >
              Explore Examples
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleGetStarted}
              data-testid="cta-get-started"
              sx={{
                borderColor: '#30363d',
                color: '#e6edf3',
                fontSize: '1.1rem',
                px: 5,
                py: 1.75,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#8b5cf6',
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                },
              }}
            >
              {user ? 'Go to My Timelines' : 'Sign In'}
            </Button>
          </Stack>

          {/* Hero Demo Placeholder */}
          <Box
            sx={{
              mt: 6,
              mx: 'auto',
              maxWidth: 900,
              aspectRatio: '16 / 9',
              bgcolor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Placeholder for future screenshot/demo */}
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <TimelineIcon sx={{ fontSize: 80, color: '#8b5cf6', mb: 2, opacity: 0.6 }} />
              <Typography variant="h6" sx={{ color: '#8d96a0' }}>
                Interactive timeline editor demo coming soon
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          sx={{
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: '#e6edf3',
          }}
        >
          Everything you need to build timelines
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          sx={{
            mb: 8,
            color: '#8d96a0',
            fontSize: '1.1rem',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          Powerful tools for creating, collaborating, and sharing interactive timelines
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          {/* Feature 1: Timeline Editor */}
          <Card
            sx={{
              flex: 1,
              bgcolor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#8b5cf6',
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)',
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <TimelineIcon sx={{ fontSize: 56, color: '#8b5cf6', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ color: '#e6edf3', fontWeight: 600, mb: 2 }}>
                Visual Timeline Editor
              </Typography>
              <Typography variant="body2" sx={{ color: '#8d96a0', lineHeight: 1.7, fontSize: '0.95rem' }}>
                Drag, zoom, and arrange events on an infinite canvas. Smart collision detection
                ensures your timeline stays readable at any scale. Real-time preview as you edit.
              </Typography>
            </CardContent>
          </Card>

          {/* Feature 2: Collaboration */}
          <Card
            sx={{
              flex: 1,
              bgcolor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#06b6d4',
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.2)',
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 56, color: '#06b6d4', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ color: '#e6edf3', fontWeight: 600, mb: 2 }}>
                Fork & Collaborate
              </Typography>
              <Typography variant="body2" sx={{ color: '#8d96a0', lineHeight: 1.7, fontSize: '0.95rem' }}>
                Like GitHub for timelines. Fork any public timeline, make your changes,
                and submit a merge request. Full version history with git-style diffs.
              </Typography>
            </CardContent>
          </Card>

          {/* Feature 3: Share & Discover */}
          <Card
            sx={{
              flex: 1,
              bgcolor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#f97316',
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.2)',
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 56, color: '#f97316', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ color: '#e6edf3', fontWeight: 600, mb: 2 }}>
                Share & Discover
              </Typography>
              <Typography variant="body2" sx={{ color: '#8d96a0', lineHeight: 1.7, fontSize: '0.95rem' }}>
                Make your timelines public or keep them private. Explore thousands of
                community-created timelines on history, science, technology, and more.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Examples Gallery */}
      <Box sx={{ bgcolor: '#161b22', py: 10, borderTop: '1px solid #30363d', borderBottom: '1px solid #30363d' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            sx={{
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: '#e6edf3',
            }}
          >
            Explore Example Timelines
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            sx={{
              mb: 8,
              color: '#8d96a0',
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            See what's possible with PowerTimeline
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {loadingExamples ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  sx={{
                    bgcolor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: 2,
                  }}
                >
                  <Skeleton variant="rectangular" height={140} sx={{ bgcolor: '#161b22' }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Skeleton variant="text" width="80%" sx={{ bgcolor: '#161b22', mb: 1 }} />
                    <Skeleton variant="text" width="100%" sx={{ bgcolor: '#161b22' }} />
                    <Skeleton variant="text" width="60%" sx={{ bgcolor: '#161b22', mb: 1.5 }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Skeleton variant="text" width="30%" sx={{ bgcolor: '#161b22' }} />
                      <Skeleton variant="text" width="25%" sx={{ bgcolor: '#161b22' }} />
                    </Stack>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Actual timeline cards with tooltips
              exampleTimelines.map((timeline) => (
                <Tooltip
                  key={timeline.id}
                  title={`Click to explore ${timeline.title} - ${timeline.eventCount} events spanning ${timeline.description || 'multiple time periods'}`}
                  arrow
                  placement="top"
                  enterDelay={500}
                >
                  <Card
                    data-testid={`timeline-card-${timeline.id}`}
                    sx={{
                      bgcolor: '#0d1117',
                      border: '1px solid #30363d',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#8b5cf6',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleTimelineClick(timeline)}
                      data-testid={`timeline-link-${timeline.id}`}
                    >
                      {/* Placeholder for timeline thumbnail */}
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: '#161b22',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid #30363d',
                        }}
                      >
                        <TimelineIcon sx={{ fontSize: 48, color: '#8b5cf6', opacity: 0.5 }} />
                      </Box>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" gutterBottom noWrap sx={{ color: '#e6edf3', fontWeight: 600, fontSize: '1rem' }}>
                          {timeline.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8d96a0', mb: 1.5, minHeight: 40, fontSize: '0.85rem', lineHeight: 1.4 }}>
                          {timeline.description || 'No description'}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" sx={{ color: '#8d96a0' }}>
                            {timeline.viewCount || 0} views
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 500 }}>
                            {timeline.eventCount} events
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Tooltip>
              ))
            )}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBrowseTimelines}
              sx={{
                borderColor: '#30363d',
                color: '#e6edf3',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#8b5cf6',
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                },
              }}
            >
              View All Timelines
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Container maxWidth="md" sx={{ py: 12, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: '#e6edf3',
          }}
        >
          Start building your timeline today
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 5,
            color: '#8d96a0',
            fontSize: '1.1rem',
            maxWidth: 500,
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          Join the community creating interactive timelines for history, research, and education.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleSignIn}
          sx={{
            bgcolor: '#f97316',
            color: '#fff',
            fontSize: '1.1rem',
            px: 6,
            py: 1.75,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.4)',
            '&:hover': {
              bgcolor: '#ea580c',
              boxShadow: '0 6px 20px 0 rgba(249, 115, 22, 0.5)',
            },
          }}
        >
          Get Started Free
        </Button>
      </Container>

      {/* Footer - Reduced prominence */}
      <Box sx={{ bgcolor: '#0d1117', borderTop: '1px solid #21262d', py: 6 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} sx={{ mb: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#e6edf3', fontSize: '1rem', fontWeight: 600 }}>
                PowerTimeline
              </Typography>
              <Typography variant="body2" sx={{ color: '#8d96a0', fontSize: '0.9rem' }}>
                Version control for history
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#8d96a0', fontSize: '0.85rem', mb: 1.5 }}>
                Product
              </Typography>
              <Stack spacing={0.5}>
                <Button
                  size="small"
                  onClick={handleBrowseTimelines}
                  sx={{
                    color: '#8d96a0',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    '&:hover': { color: '#e6edf3' },
                  }}
                >
                  Browse Timelines
                </Button>
                <Button
                  size="small"
                  sx={{
                    color: '#8d96a0',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    '&:hover': { color: '#e6edf3' },
                  }}
                >
                  Documentation
                </Button>
              </Stack>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#8d96a0', fontSize: '0.85rem', mb: 1.5 }}>
                Contact
              </Typography>
              <Stack spacing={1}>
                <Link
                  href="mailto:cynako@gmail.com"
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#8d96a0',
                    fontSize: '0.85rem',
                    '&:hover': { color: '#e6edf3' },
                  }}
                >
                  <EmailIcon sx={{ fontSize: 18 }} />
                  cynako@gmail.com
                </Link>
                <Link
                  href="https://github.com/CynaCons/powertimeline"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#8d96a0',
                    fontSize: '0.85rem',
                    '&:hover': { color: '#e6edf3' },
                  }}
                >
                  <GitHubIcon sx={{ fontSize: 18 }} />
                  GitHub Repository
                </Link>
              </Stack>
            </Box>
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: '#6e7681',
              textAlign: 'center',
              display: 'block',
              fontSize: '0.8rem',
              pt: 3,
              borderTop: '1px solid #21262d',
            }}
          >
            © 2025 PowerTimeline. Built for history enthusiasts.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
