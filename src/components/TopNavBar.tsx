/**
 * TopNavBar - Public navigation for unauthenticated users
 *
 * Appears on: LandingPage, HomePage (browse)
 * Dark theme styling matching COLOR_THEME.md
 * Simple horizontal layout: Logo | Browse | Sign In/User Menu
 */

import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileMenu } from './UserProfileMenu';

export function TopNavBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box
      sx={{
        bgcolor: '#0d1117',
        borderBottom: '1px solid #21262d',
        py: 1.5,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          data-testid="top-nav-bar"
        >
          {/* Logo/Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
            data-testid="logo-button"
          >
            <TimelineIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                color: '#e6edf3',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              PowerTimeline
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={() => navigate('/browse')}
              data-testid="browse-button"
              sx={{
                color: '#8d96a0',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                '&:hover': {
                  color: '#e6edf3',
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                },
              }}
            >
              Browse
            </Button>

            {user ? (
              <Box sx={{
                '& .MuiIconButton-root': {
                  '&:hover': {
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                  },
                },
                '& .MuiAvatar-root': {
                  bgcolor: '#8b5cf6',
                },
                '& span': {
                  color: '#e6edf3',
                },
              }}>
                <UserProfileMenu
                  onLogout={() => {
                    localStorage.removeItem('powertimeline_current_user');
                    window.location.href = '/';
                  }}
                />
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                data-testid="sign-in-button"
                sx={{
                  borderColor: '#30363d',
                  color: '#e6edf3',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  '&:hover': {
                    borderColor: '#8b5cf6',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
