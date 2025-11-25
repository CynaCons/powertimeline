/**
 * Login Page
 * Clean, GitHub-inspired authentication interface with comprehensive validation
 * v0.5.1 - Enhanced with real-time validation indicators
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Divider,
  LinearProgress,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { signUpWithEmailAndCreateProfile, signInWithEmail, signInWithGoogle, signOutUser, onAuthStateChange } from '../services/auth';
import { isEmailAvailable, isUsernameAvailable } from '../services/firestore';
import {
  isValidEmailFormat,
  getEmailValidationFeedback,
} from '../utils/emailValidation';
import {
  validatePasswordStrength,
  type PasswordStrength,
} from '../utils/passwordValidation';
import {
  isValidUsernameFormat,
  getUsernameValidationFeedback,
  suggestUsernameFromEmail,
} from '../utils/usernameValidation';
import type { User } from 'firebase/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation states
  const [emailValid, setEmailValid] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        setError(null);
        // Redirect to original destination or home page
        navigate(from, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate, from]);

  // Email validation
  useEffect(() => {
    if (!isSignUp || !email) {
      setEmailValid(false);
      setEmailAvailable(false);
      setEmailFeedback(null);
      return;
    }

    const feedback = getEmailValidationFeedback(email);
    setEmailFeedback(feedback);
    const valid = isValidEmailFormat(email);
    setEmailValid(valid);

    if (!valid) {
      setEmailAvailable(false);
      return;
    }

    // Check availability with debounce
    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const available = await isEmailAvailable(email);
        setEmailAvailable(available);
        if (!available) {
          setEmailFeedback('This email is already registered');
        }
      } catch (err) {
        console.error('Error checking email availability:', err);
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, isSignUp]);

  // Password validation
  useEffect(() => {
    if (!isSignUp || !password) {
      setPasswordStrength(null);
      return;
    }

    const strength = validatePasswordStrength(password);
    setPasswordStrength(strength);
  }, [password, isSignUp]);

  // Username validation
  useEffect(() => {
    if (!isSignUp || !username) {
      setUsernameValid(false);
      setUsernameAvailable(false);
      setUsernameFeedback(null);
      return;
    }

    const feedback = getUsernameValidationFeedback(username);
    setUsernameFeedback(feedback);
    const valid = isValidUsernameFormat(username) && feedback === null;
    setUsernameValid(valid);

    if (!valid) {
      setUsernameAvailable(false);
      return;
    }

    // Check availability with debounce
    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const available = await isUsernameAvailable(username);
        setUsernameAvailable(available);
        if (!available) {
          setUsernameFeedback('This username is already taken');
        }
      } catch (err) {
        console.error('Error checking username availability:', err);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, isSignUp]);

  // Auto-suggest username from email
  useEffect(() => {
    if (isSignUp && email && !username && isValidEmailFormat(email)) {
      const suggested = suggestUsernameFromEmail(email);
      if (suggested) {
        setUsername(suggested);
      }
    }
  }, [email, username, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for sign up
    if (isSignUp) {
      if (!emailValid || !emailAvailable) {
        setError('Please enter a valid and available email address');
        return;
      }
      if (!passwordStrength || passwordStrength.score < 2) {
        setError('Please use a stronger password');
        return;
      }
      if (!usernameValid || !usernameAvailable) {
        setError('Please choose a valid and available username');
        return;
      }
    }

    try {
      if (isSignUp) {
        await signUpWithEmailAndCreateProfile(email, password, username);
      } else {
        await signInWithEmail(email, password);
      }
      setEmail('');
      setPassword('');
      setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  const canSubmit = () => {
    if (!isSignUp) {
      return email && password;
    }
    return (
      emailValid &&
      emailAvailable &&
      usernameValid &&
      usernameAvailable &&
      passwordStrength &&
      passwordStrength.score >= 2
    );
  };

  // If user is signed in, show simple signed-in state
  if (user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f6f8fa',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 340,
            p: 3,
            bgcolor: 'white',
            border: '1px solid #d0d7de',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>
            Signed in as
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#24292f', fontWeight: 600 }}>
            {user.email}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSignOut}
            sx={{
              bgcolor: '#24292f',
              color: 'white',
              textTransform: 'none',
              py: 1,
              '&:hover': {
                bgcolor: '#1f2328',
              },
            }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    );
  }

  // Sign in / Sign up form
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f6f8fa',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 340 }}>
        {/* Logo/Title */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 400, color: '#24292f' }}>
            PowerTimeline
          </Typography>
        </Box>

        {/* Main form container */}
        <Box
          sx={{
            p: 3,
            bgcolor: 'white',
            border: '1px solid #d0d7de',
            borderRadius: '6px',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 300, color: '#24292f' }}>
            {isSignUp ? 'Create your account' : 'Sign in to PowerTimeline'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '14px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: '14px', color: '#24292f' }}
              >
                Email address
              </Typography>
              <TextField
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                fullWidth
                required
                size="small"
                error={isSignUp && !!emailFeedback}
                helperText={isSignUp ? emailFeedback : undefined}
                InputProps={{
                  endAdornment: isSignUp && email ? (
                    <InputAdornment position="end">
                      {emailChecking ? (
                        <CircularProgress size={20} />
                      ) : emailValid && emailAvailable ? (
                        <CheckCircleIcon sx={{ color: '#2da44e' }} />
                      ) : emailFeedback ? (
                        <ErrorIcon sx={{ color: '#dc2626' }} />
                      ) : null}
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    bgcolor: '#f6f8fa',
                  },
                }}
              />
            </Box>

            {/* Username field (sign up only) */}
            {isSignUp && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, fontSize: '14px', color: '#24292f' }}
                >
                  Username
                </Typography>
                <TextField
                  type="text"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value.toLowerCase())
                  }
                  fullWidth
                  required
                  size="small"
                  error={!!usernameFeedback}
                  helperText={
                    usernameFeedback ||
                    'Used in your timeline URLs (e.g., /user/yourname/timeline/id)'
                  }
                  InputProps={{
                    endAdornment: username ? (
                      <InputAdornment position="end">
                        {usernameChecking ? (
                          <CircularProgress size={20} />
                        ) : usernameValid && usernameAvailable ? (
                          <CheckCircleIcon sx={{ color: '#2da44e' }} />
                        ) : usernameFeedback ? (
                          <ErrorIcon sx={{ color: '#dc2626' }} />
                        ) : null}
                      </InputAdornment>
                    ) : undefined,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '6px',
                      bgcolor: '#f6f8fa',
                    },
                  }}
                />
              </Box>
            )}

            {/* Password field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: '14px', color: '#24292f' }}
              >
                Password
              </Typography>
              <TextField
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                fullWidth
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    bgcolor: '#f6f8fa',
                  },
                }}
              />
              {isSignUp && passwordStrength && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '12px', color: passwordStrength.color, fontWeight: 600 }}
                    >
                      {passwordStrength.label}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(passwordStrength.score / 4) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: '#e1e4e8',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: passwordStrength.color,
                        borderRadius: 2,
                      },
                    }}
                  />
                  {passwordStrength.feedback.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {passwordStrength.feedback.map((fb, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{ fontSize: '12px', color: '#656d76' }}
                        >
                          • {fb}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {!isSignUp && (
                <Typography variant="body2" sx={{ mt: 0.5, fontSize: '12px' }}>
                  <Link href="#" sx={{ color: '#0969da', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </Typography>
              )}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSignUp && !canSubmit()}
              data-testid={isSignUp ? 'create-account-submit-button' : 'sign-in-submit-button'}
              sx={{
                bgcolor: '#2da44e',
                color: 'white',
                textTransform: 'none',
                py: 1,
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '6px',
                '&:hover': {
                  bgcolor: '#2c974b',
                },
                '&:disabled': {
                  bgcolor: '#94d3a2',
                  color: 'white',
                },
              }}
            >
              {isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" sx={{ color: '#656d76', fontSize: '12px' }}>
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            data-testid="sign-in-google-button"
            sx={{
              borderColor: '#d0d7de',
              color: '#24292f',
              textTransform: 'none',
              py: 1,
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '6px',
              '&:hover': {
                bgcolor: '#f6f8fa',
                borderColor: '#d0d7de',
              },
            }}
          >
            Sign in with Google
          </Button>
        </Box>

        {/* Sign up / Sign in toggle */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'white',
            border: '1px solid #d0d7de',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '14px', color: '#24292f' }}>
            {isSignUp ? 'Already have an account?' : 'New to PowerTimeline?'}{' '}
            <Link
              component="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setEmail('');
                setPassword('');
                setUsername('');
              }}
              sx={{
                color: '#0969da',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
