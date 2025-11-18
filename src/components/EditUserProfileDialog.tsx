/**
 * EditUserProfileDialog - Dialog for editing user profile
 * v0.5.0.2 - User Profile Editing
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import { updateUser, getUser } from '../services/firestore';
import type { User } from '../types';

interface EditUserProfileDialogProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserProfileDialog({ open, userId, onClose, onSuccess }: EditUserProfileDialogProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [nameError, setNameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  // Load user data when dialog opens
  useEffect(() => {
    async function loadUser() {
      if (open && userId) {
        const usr = await getUser(userId);
        if (usr) {
          setUser(usr);
          setName(usr.name);
          setBio(usr.bio || '');
        }
      }
    }
    loadUser();
  }, [open, userId]);

  // Validation functions
  const validateName = useCallback((value: string): string => {
    if (value.length === 0) {
      return 'Name is required';
    } else if (value.length < 2) {
      return 'Name must be at least 2 characters';
    } else if (value.length > 50) {
      return 'Name cannot exceed 50 characters';
    }
    return '';
  }, []);

  const validateBio = useCallback((value: string): string => {
    if (value.length > 280) {
      return 'Bio cannot exceed 280 characters';
    }
    return '';
  }, []);

  // Run validation on blur
  const handleNameBlur = () => {
    setNameError(validateName(name));
  };

  const handleBioBlur = () => {
    setBioError(validateBio(bio));
  };

  const isFormValid =
    name.length >= 2 &&
    name.length <= 50 &&
    bio.length <= 280 &&
    !nameError &&
    !bioError;

  const handleSave = async () => {
    if (!user) {
      setGeneralError('User not found');
      return;
    }

    if (!isFormValid) {
      return;
    }

    try {
      const updates: Partial<User> = {
        name,
        bio: bio || undefined,
      };

      await updateUser(user.id, updates);

      // Close dialog and notify parent
      handleClose();
      onSuccess();
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setBio('');
    setNameError('');
    setBioError('');
    setGeneralError('');
    setUser(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
    >
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Display Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          error={!!nameError}
          helperText={nameError || `${name.length}/50 characters`}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Bio"
          fullWidth
          multiline
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onBlur={handleBioBlur}
          error={!!bioError}
          helperText={bioError || `${bio.length}/280 characters`}
          placeholder="Tell us a bit about yourself..."
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isFormValid}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
