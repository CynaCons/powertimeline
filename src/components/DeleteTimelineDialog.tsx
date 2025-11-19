/**
 * DeleteTimelineDialog - Confirmation dialog for deleting timelines
 * Implements CC-REQ-DELETE-001 through CC-REQ-DELETE-004
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Alert,
  Typography,
} from '@mui/material';
import { deleteTimeline, getTimeline } from '../services/firestore';
import type { Timeline } from '../types';

interface DeleteTimelineDialogProps {
  open: boolean;
  timelineId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteTimelineDialog({ open, timelineId, onClose, onSuccess }: DeleteTimelineDialogProps) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [generalError, setGeneralError] = useState('');

  // Load timeline data when dialog opens
  useEffect(() => {
    async function loadTimeline() {
      if (open && timelineId) {
        const tl = await getTimeline(timelineId);
        if (tl) {
          setTimeline(tl);
        } else {
          setGeneralError('Timeline not found');
        }
      }
    }
    loadTimeline();
  }, [open, timelineId]);

  const handleDelete = async () => {
    if (!timeline) {
      setGeneralError('Timeline not found');
      return;
    }

    try {
      await deleteTimeline(timeline.id);

      // Close dialog and notify parent
      handleClose();
      onSuccess();
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to delete timeline');
    }
  };

  const handleClose = () => {
    setTimeline(null);
    setGeneralError('');
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
      <DialogTitle>Delete Timeline?</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        {timeline && (
          <>
            <DialogContentText>
              You are about to permanently delete:
            </DialogContentText>

            <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold' }}>
              {timeline.title}
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              This will permanently delete <strong>{timeline.events.length} event{timeline.events.length !== 1 ? 's' : ''}</strong>.
              This action cannot be undone.
            </Alert>

            <DialogContentText>
              Are you sure you want to proceed?
            </DialogContentText>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={!timeline}
        >
          Delete Timeline
        </Button>
      </DialogActions>
    </Dialog>
  );
}
