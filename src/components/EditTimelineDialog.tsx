/**
 * EditTimelineDialog - Dialog for editing timeline metadata
 * Implements CC-REQ-EDIT-001 through CC-REQ-EDIT-005
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { updateTimeline, isTimelineIdUnique, getTimelineById } from '../lib/homePageStorage';
import type { Timeline, TimelineVisibility } from '../types';

interface EditTimelineDialogProps {
  open: boolean;
  timelineId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTimelineDialog({ open, timelineId, onClose, onSuccess }: EditTimelineDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customId, setCustomId] = useState('');
  const [originalId, setOriginalId] = useState('');
  const [visibility, setVisibility] = useState<TimelineVisibility>('public');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [idError, setIdError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [timeline, setTimeline] = useState<Timeline | null>(null);

  // Load timeline data when dialog opens
  useEffect(() => {
    if (open && timelineId) {
      const tl = getTimelineById(timelineId);
      if (tl) {
        setTimeline(tl);
        setTitle(tl.title);
        setDescription(tl.description || '');
        setVisibility(tl.visibility);

        // Extract ID without "timeline-" prefix
        const idWithoutPrefix = tl.id.replace(/^timeline-/, '');
        setCustomId(idWithoutPrefix);
        setOriginalId(tl.id);
      }
    }
  }, [open, timelineId]);

  // Validation functions (moved to functions instead of useEffect for better performance)
  const validateTitle = useCallback((value: string): string => {
    if (value.length > 0 && value.length < 3) {
      return 'Title must be at least 3 characters';
    } else if (value.length > 100) {
      return 'Title cannot exceed 100 characters';
    }
    return '';
  }, []);

  const validateDescription = useCallback((value: string): string => {
    if (value.length > 500) {
      return 'Description cannot exceed 500 characters';
    }
    return '';
  }, []);

  const validateCustomId = useCallback((value: string): string => {
    if (!value || !timeline) return '';

    // Validate format
    const validFormat = /^[a-z0-9-]+$/.test(value);
    if (!validFormat) {
      return 'ID must contain only lowercase letters, numbers, and hyphens';
    }

    // Check uniqueness (if ID changed)
    const fullId = `timeline-${value}`;
    if (fullId !== originalId && !isTimelineIdUnique(fullId, timeline.ownerId)) {
      return 'This ID already exists for your account';
    }

    return '';
  }, [timeline, originalId]);

  // Run validation on blur instead of every keystroke
  const handleTitleBlur = () => {
    setTitleError(validateTitle(title));
  };

  const handleDescriptionBlur = () => {
    setDescriptionError(validateDescription(description));
  };

  const handleIdBlur = () => {
    setIdError(validateCustomId(customId));
  };

  const isFormValid =
    title.length >= 3 &&
    title.length <= 100 &&
    description.length <= 500 &&
    customId.length > 0 &&
    !titleError &&
    !descriptionError &&
    !idError;

  const handleSave = () => {
    if (!timeline) {
      setGeneralError('Timeline not found');
      return;
    }

    if (!isFormValid) {
      return;
    }

    try {
      const newId = `timeline-${customId}`;
      const updates: Partial<Timeline> = {
        title,
        description,
        visibility,
      };

      // If ID changed, we need to create a new timeline and delete the old one
      // For now, just update title and description (ID editing is complex)
      if (newId !== originalId) {
        // TODO: Implement ID change (requires deleting old timeline and creating new one)
        setGeneralError('Changing timeline ID is not yet supported');
        return;
      }

      updateTimeline(timeline.id, updates);

      // Close dialog and notify parent
      handleClose();
      onSuccess();
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to update timeline');
    }
  };

  const handleClose = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setCustomId('');
    setOriginalId('');
    setVisibility('public');
    setTitleError('');
    setDescriptionError('');
    setIdError('');
    setGeneralError('');
    setTimeline(null);
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
      <DialogTitle>Edit Timeline Settings</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Title"
          fullWidth
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          error={!!titleError}
          helperText={titleError || `${title.length}/100 characters`}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          error={!!descriptionError}
          helperText={descriptionError || `${description.length}/500 characters`}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Timeline ID"
          fullWidth
          required
          value={customId}
          onChange={(e) => setCustomId(e.target.value.toLowerCase())}
          onBlur={handleIdBlur}
          error={!!idError}
          helperText={
            idError ||
            (customId !== originalId.replace(/^timeline-/, '')
              ? 'Warning: Changing ID is not yet supported'
              : `Used in URL: /timeline/${customId}`)
          }
          disabled={true}  // Disable ID editing for now
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Visibility</InputLabel>
          <Select
            value={visibility}
            label="Visibility"
            onChange={(e) => setVisibility(e.target.value as TimelineVisibility)}
          >
            <MenuItem value="public">Public - Visible to everyone</MenuItem>
            <MenuItem value="unlisted">Unlisted - Accessible via URL only</MenuItem>
            <MenuItem value="private">Private - Only you can see this</MenuItem>
          </Select>
        </FormControl>
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
