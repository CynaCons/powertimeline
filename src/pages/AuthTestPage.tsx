/**
 * Authentication Test Page
 * Simple page to test Firebase Authentication functionality
 */

import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  Container,
  Divider,
  Stack,
} from '@mui/material';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOutUser, onAuthStateChange } from '../services/auth';
import type { User } from 'firebase/auth';

export default function AuthTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        setSuccess(`Signed in as ${user.email}`);
        setError(null);
      } else {
        setSuccess(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async () => {
    try {
      setError(null);
      setSuccess(null);
      await signUpWithEmail(email, password);
      setSuccess('Account created successfully!');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      setSuccess(null);
      await signInWithEmail(email, password);
      setSuccess('Signed in successfully!');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setSuccess(null);
      await signInWithGoogle();
      setSuccess('Signed in with Google successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      setSuccess(null);
      await signOutUser();
      setSuccess('Signed out successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Firebase Authentication Test
      </Typography>

      {/* Current User Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Current User" />
        <CardContent>
          {user ? (
            <Stack spacing={2}>
              <Typography>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography>
                <strong>UID:</strong> {user.uid}
              </Typography>
              <Typography>
                <strong>Provider:</strong> {user.providerData[0]?.providerId}
              </Typography>
              <Button onClick={handleSignOut} variant="contained" color="error" sx={{ mt: 2 }}>
                Sign Out
              </Button>
            </Stack>
          ) : (
            <Typography color="text.secondary">No user signed in</Typography>
          )}
        </CardContent>
      </Card>

      {/* Feedback Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Email/Password Forms */}
      {!user && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Email/Password Sign Up" subheader="Create a new account" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  type="password"
                  label="Password (min 6 characters)"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  fullWidth
                />
                <Button onClick={handleSignUp} variant="contained" fullWidth>
                  Sign Up
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardHeader title="Email/Password Sign In" subheader="Sign in to existing account" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  fullWidth
                />
                <Button onClick={handleSignIn} variant="contained" fullWidth>
                  Sign In
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Card>
            <CardHeader title="Google OAuth" subheader="Sign in with Google account" />
            <CardContent>
              <Button onClick={handleGoogleSignIn} variant="outlined" fullWidth>
                Sign In with Google
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
}
