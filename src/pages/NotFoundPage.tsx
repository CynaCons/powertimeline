/**
 * 404 Not Found Page
 * Displays when user navigates to a non-existent route
 */

import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Stack } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0d1117',
        color: '#e6edf3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
        {/* Icon */}
        <Box sx={{ mb: 4 }}>
          <TimelineIcon sx={{ fontSize: 80, color: '#8b5cf6', opacity: 0.6 }} />
        </Box>

        {/* 404 Number */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', md: '8rem' },
            fontWeight: 800,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>

        {/* Main message */}
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 600,
            color: '#e6edf3',
          }}
        >
          Timeline not found
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            mb: 5,
            color: '#8d96a0',
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or may have been moved.
          Perhaps the timeline you're searching for is waiting to be created?
        </Typography>

        {/* Action buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#f97316',
              color: '#fff',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#ea580c',
              },
            }}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<SearchIcon />}
            onClick={() => navigate('/browse')}
            sx={{
              borderColor: '#30363d',
              color: '#e6edf3',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#8b5cf6',
                bgcolor: 'rgba(139, 92, 246, 0.1)',
              },
            }}
          >
            Browse Timelines
          </Button>
        </Stack>

        {/* Subtle footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 8,
            color: '#6e7681',
          }}
        >
          Lost? Try searching for what you're looking for.
        </Typography>
      </Container>
    </Box>
  );
}
