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
        bgcolor: 'var(--page-bg)',
        color: 'var(--page-text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
        {/* Icon */}
        <Box sx={{ mb: 4 }}>
          <TimelineIcon sx={{ fontSize: 80, color: 'var(--page-accent)', opacity: 0.6 }} />
        </Box>

        {/* 404 Number */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', md: '8rem' },
            fontWeight: 800,
            background: 'var(--gradient-brand)',
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
            color: 'var(--page-text-primary)',
          }}
        >
          Timeline not found
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            mb: 5,
            color: 'var(--page-text-secondary)',
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
              bgcolor: 'var(--color-beta-orange)',
              color: '#ffffff',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#ea580c', // Darker orange on hover
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
              borderColor: 'var(--page-border)',
              color: 'var(--page-text-primary)',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: 'var(--page-accent)',
                bgcolor: 'var(--input-focus-shadow)',
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
            color: 'var(--page-text-secondary)',
          }}
        >
          Lost? Try searching for what you're looking for.
        </Typography>
      </Container>
    </Box>
  );
}
