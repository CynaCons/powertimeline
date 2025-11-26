/**
 * Landing Page - Redesigned v0.5.3
 * Dark theme with gradient effects and timeline-focused messaging
 * Inspired by GitHub, Linear, and modern SaaS best practices
 */

import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, TextField, InputAdornment, Card, CardContent, CardActionArea, Stack, Link } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import { TopNavBar } from '../components/TopNavBar';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Navigate to specific timeline
  const handleTimelineClick = (timelineId: string) => {
    // Navigate to the timeline - using cynacons as the owner for now
    navigate(`/user/cynacons/timeline/${timelineId}`);
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
              mb: 3,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Build timelines like you build code
          </Typography>

          <Typography
            variant="h5"
            component="h2"
            sx={{
              mb: 5,
              color: '#8d96a0',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.5,
            }}
          >
            Version control for history. Collaborate on timelines with forking, merge requests,
            and a powerful visual editor.
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#8d96a0' }} />
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

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              data-testid="cta-get-started"
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
              {user ? 'Go to My Timelines' : 'Get Started Free'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBrowseTimelines}
              data-testid="cta-explore-examples"
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
              Explore Examples
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
            {[
              {
                title: 'French Revolution',
                author: 'CynaCons',
                events: 150,
                description: 'Complete chronicle of revolutionary France 1789-1799',
                timelineId: 'timeline-french-revolution',
              },
              {
                title: 'Napoleon Bonaparte',
                author: 'CynaCons',
                events: 85,
                description: 'Rise and fall of Napoleon from Corsica to Saint Helena',
                timelineId: 'timeline-napoleon',
              },
              {
                title: 'Charles de Gaulle',
                author: 'CynaCons',
                events: 90,
                description: 'From Free France to Fifth Republic',
                timelineId: 'timeline-charles-de-gaulle',
              },
              {
                title: 'RFK Timeline',
                author: 'CynaCons',
                events: 65,
                description: 'Robert F. Kennedy\'s political career and legacy',
                timelineId: 'timeline-rfk',
              },
            ].map((timeline) => (
              <Card
                key={timeline.title}
                data-testid={`timeline-card-${timeline.timelineId}`}
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
                  onClick={() => handleTimelineClick(timeline.timelineId)}
                  data-testid={`timeline-link-${timeline.timelineId}`}
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
                      {timeline.description}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#8d96a0' }}>
                        by {timeline.author}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 500 }}>
                        {timeline.events} events
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
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
