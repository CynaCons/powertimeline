/**
 * Landing Page
 * GitHub/GitLab-style landing page for unauthenticated users
 * v0.5.1 Phase 2 - Placeholder implementation
 */

import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, TextField, InputAdornment, Card, CardContent, CardActionArea, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            PowerTimeline
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
            Visualize history. Build timelines. Share knowledge.
          </Typography>
          <Typography variant="body1" sx={{ mb: 6, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
            Create interactive timelines for historical events, project milestones, or personal journeys.
            Collaborate with others and explore thousands of public timelines.
          </Typography>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                bgcolor: 'background.paper',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
                px: 4,
                py: 1.5,
              }}
            >
              {user ? 'Go to My Timelines' : 'Get Started - Sign In'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBrowseTimelines}
              sx={{
                borderColor: 'primary.contrastText',
                color: 'primary.contrastText',
                '&:hover': {
                  borderColor: 'primary.contrastText',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Browse Public Timelines
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Search Section */}
      <Container maxWidth="md" sx={{ mt: -4, mb: 8 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 3 }}>
            <TextField
              fullWidth
              placeholder="Search timelines, users, or topics..."
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
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

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 6 }}>
          Why PowerTimeline?
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Card sx={{ flex: 1, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <TimelineIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Interactive Timelines
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create beautiful, interactive timelines with events, dates, and rich descriptions.
                Zoom, pan, and explore historical data like never before.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <GroupIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Collaborate & Share
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share your timelines with the world. Browse public timelines created by others.
                Fork and remix timelines to create your own versions.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ fontSize: 60, mb: 2 }}>📚</Box>
              <Typography variant="h6" gutterBottom>
                Learn & Discover
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore timelines about history, science, technology, and more.
                Learn from expert-curated content or create your own educational resources.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Featured Timelines Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 6 }}>
            Featured Timelines
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {[
              { title: 'French Revolution', author: 'CynaCons', events: 42 },
              { title: 'Space Exploration', author: 'CynaCons', events: 35 },
              { title: 'Renaissance Art', author: 'CynaCons', events: 28 },
              { title: 'American Civil Rights', author: 'CynaCons', events: 31 },
            ].map((timeline) => (
              <Card key={timeline.title}>
                <CardActionArea onClick={handleBrowseTimelines}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {timeline.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {timeline.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {timeline.events} events
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button variant="outlined" onClick={handleBrowseTimelines}>
              View All Timelines
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Ready to build your timeline?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sign in with Google to start creating and sharing timelines.
        </Typography>
        <Button variant="contained" size="large" onClick={handleSignIn} sx={{ px: 6 }}>
          Sign In to Get Started
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'grey.100', py: 4 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                PowerTimeline
              </Typography>
              <Typography variant="body2" color="grey.400">
                Visualize history. Build timelines. Share knowledge.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Product
              </Typography>
              <Stack spacing={1}>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none' }} onClick={handleBrowseTimelines}>
                  Browse Timelines
                </Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                  Documentation
                </Button>
              </Stack>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Community
              </Typography>
              <Stack spacing={1}>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                  GitHub
                </Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                  Discord
                </Button>
              </Stack>
            </Box>
          </Stack>
          <Typography variant="body2" color="grey.500" textAlign="center" sx={{ mt: 4 }}>
            © 2024 PowerTimeline. Built with ❤️ for history enthusiasts.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
