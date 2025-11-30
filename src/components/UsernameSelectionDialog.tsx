/**
 * UsernameSelectionDialog - Modal for new users to select a unique username
 * Required for Google OAuth users who don't provide a username during sign-up
 * SRS_DB.md compliant - v0.5.14
 *
 * Username requirements (DB-USER-003):
 * - 3-20 characters
 * - Lowercase alphanumeric + hyphen
 * - Unique across all users
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { isUsernameAvailable, updateUser } from '../services/firestore';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'powertimeline', 'powertimelines',
  'support', 'help', 'info', 'contact', 'api', 'www', 'mail', 'email',
  'user', 'users', 'account', 'accounts', 'login', 'logout', 'signup', 'signin',
  'settings', 'profile', 'browse', 'search', 'timeline', 'timelines',
  'home', 'about', 'privacy', 'terms', 'tos', 'legal', 'copyright',
  'test', 'testing', 'demo', 'example', 'sample',
]);

interface UsernameSelectionDialogProps {
  open: boolean;
  userId: string;
  suggestedUsername?: string;
  onSuccess: (username: string) => void;
  onClose?: () => void; // Optional - dialog may be non-dismissible for new users
}

export function UsernameSelectionDialog({
  open,
  userId,
  suggestedUsername = '',
  onSuccess,
  onClose,
}: UsernameSelectionDialogProps) {
  const [username, setUsername] = useState(suggestedUsername);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset username when dialog opens with new suggestion
  useEffect(() => {
    if (open && suggestedUsername) {
      setUsername(suggestedUsername);
    }
  }, [open, suggestedUsername]);

  // Validate username format (synchronous)
  const validateFormat = useCallback((value: string): string => {
    if (!value) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 20) {
      return 'Username cannot exceed 20 characters';
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Username can only contain lowercase letters, numbers, and hyphens';
    }
    if (value.startsWith('-') || value.endsWith('-')) {
      return 'Username cannot start or end with a hyphen';
    }
    if (value.includes('--')) {
      return 'Username cannot contain consecutive hyphens';
    }
    if (RESERVED_USERNAMES.has(value)) {
      return 'This username is reserved';
    }
    return '';
  }, []);

  // Check username availability (async)
  const checkAvailability = useCallback(async (value: string): Promise<string> => {
    const formatError = validateFormat(value);
    if (formatError) {
      return formatError;
    }

    setChecking(true);
    try {
      const available = await isUsernameAvailable(value);
      if (!available) {
        return 'This username is already taken';
      }
      return '';
    } catch (err) {
      console.error('Error checking username availability:', err);
      return 'Error checking availability. Please try again.';
    } finally {
      setChecking(false);
    }
  }, [validateFormat]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(value);
    // Clear error on change - will validate on blur
    setError('');
  };

  // Validate on blur
  const handleBlur = async () => {
    if (username) {
      const err = await checkAvailability(username);
      setError(err);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Final validation
    const err = await checkAvailability(username);
    if (err) {
      setError(err);
      return;
    }

    setSaving(true);
    try {
      // Update user profile with the selected username
      await updateUser(userId, { username });
      onSuccess(username);
    } catch (err) {
      console.error('Error saving username:', err);
      setError('Failed to save username. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = username.length >= 3 && !error && !checking;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!onClose}
    >
      <DialogTitle>Choose Your Username</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your username will be used in your profile URL and displayed publicly.
          Choose wisely - it cannot be changed later.
        </Alert>

        <TextField
          autoFocus
          fullWidth
          label="Username"
          value={username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={!!error}
          helperText={
            error ||
            (checking ? 'Checking availability...' : `${username.length}/20 characters`)
          }
          placeholder="e.g., john-doe"
          InputProps={{
            startAdornment: <span style={{ color: '#666', marginRight: 4 }}>@</span>,
            endAdornment: checking ? <CircularProgress size={20} /> : null,
          }}
          disabled={saving}
          sx={{ mt: 1 }}
        />

        <Alert severity="warning" sx={{ mt: 2 }} icon={false}>
          <strong>Username rules:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>3-20 characters long</li>
            <li>Only lowercase letters, numbers, and hyphens</li>
            <li>Cannot start or end with a hyphen</li>
            <li>Must be unique</li>
          </ul>
        </Alert>
      </DialogContent>
      <DialogActions>
        {onClose && (
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || saving}
        >
          {saving ? 'Saving...' : 'Confirm Username'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
