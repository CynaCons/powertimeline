/**
 * StreamEditPanel - Slide-up bottom sheet for editing events in Stream View
 * v0.5.33 - Mobile-friendly edit form
 *
 * Features:
 * - Slide-up animation from bottom
 * - Form validation (title required, max lengths)
 * - Save/Cancel actions
 * - Loading states
 */

import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Event } from '../types';

interface StreamEditPanelProps {
  event: Event | null; // null = new event mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Generate a unique event ID
 */
function generateId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function StreamEditPanel({ event, isOpen, onClose, onSave, onDelete }: StreamEditPanelProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form from event data
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode - populate from event
        setTitle(event.title || '');
        setDate(event.date || getTodayISO());
        setTime(event.time || '');
        setDescription(event.description || '');
      } else {
        // New event mode - use defaults
        setTitle('');
        setDate(getTodayISO());
        setTime('');
        setDescription('');
      }
      setErrors({});
      setSaving(false);
    }
  }, [event, isOpen]);

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Title is required';
    } else if (title.length > 100) {
      errs.title = 'Title must be 100 characters or less';
    }

    if (!date) {
      errs.date = 'Date is required';
    }

    if (description.length > 500) {
      errs.description = 'Description must be 500 characters or less';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const eventData: Event = {
        id: event?.id || generateId(),
        title: title.trim(),
        date,
        time: time || undefined,
        description: description.trim() || undefined,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      setErrors({ general: 'Failed to save event. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;

    // Simple confirmation
    const confirmed = window.confirm(`Delete "${event.title}"?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setErrors({ general: 'Failed to delete event. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      className={`stream-edit-panel ${isOpen ? 'open' : ''}`}
      data-testid="stream-edit-panel"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'var(--stream-card-bg)',
        borderTop: '1px solid var(--stream-card-border)',
        borderRadius: '16px 16px 0 0',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 300ms ease-out',
        zIndex: 1500,
        maxHeight: '70vh',
        overflowY: 'auto',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--stream-card-border)',
          p: 2,
          position: 'sticky',
          top: 0,
          bgcolor: 'var(--stream-card-bg)',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'var(--stream-text-primary)',
            fontWeight: 600,
            fontSize: '1.05rem',
          }}
        >
          {event ? 'Edit Event' : 'New Event'}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            color: 'var(--stream-text-secondary)',
            '&:hover': {
              color: 'var(--stream-text-primary)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Panel Content */}
      <Box sx={{ p: 2 }}>
        <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            inputProps={{ maxLength: 100 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--stream-text-primary)',
                '& fieldset': {
                  borderColor: 'var(--stream-card-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--stream-text-secondary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--stream-dot-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--stream-text-secondary)',
              },
              '& .MuiFormHelperText-root': {
                color: errors.title ? '#ef5350' : 'var(--stream-text-muted)',
              },
            }}
          />

          {/* Date */}
          <TextField
            fullWidth
            type="date"
            label="Date *"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={!!errors.date}
            helperText={errors.date}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--stream-text-primary)',
                '& fieldset': {
                  borderColor: 'var(--stream-card-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--stream-text-secondary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--stream-dot-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--stream-text-secondary)',
              },
              '& .MuiFormHelperText-root': {
                color: errors.date ? '#ef5350' : 'var(--stream-text-muted)',
              },
            }}
          />

          {/* Time */}
          <TextField
            fullWidth
            type="time"
            label="Time (optional)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--stream-text-primary)',
                '& fieldset': {
                  borderColor: 'var(--stream-card-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--stream-text-secondary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--stream-dot-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--stream-text-secondary)',
              },
            }}
          />

          {/* Description */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description || `${description.length}/500 characters`}
            inputProps={{ maxLength: 500 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--stream-text-primary)',
                '& fieldset': {
                  borderColor: 'var(--stream-card-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--stream-text-secondary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--stream-dot-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--stream-text-secondary)',
              },
              '& .MuiFormHelperText-root': {
                color: errors.description ? '#ef5350' : 'var(--stream-text-muted)',
              },
            }}
          />

          {/* General error */}
          {errors.general && (
            <Typography sx={{ color: '#ef5350', fontSize: '0.875rem' }}>
              {errors.general}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Panel Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--stream-card-border)',
          p: 2,
          position: 'sticky',
          bottom: 0,
          bgcolor: 'var(--stream-card-bg)',
        }}
      >
        {/* Delete button (only for existing events) */}
        {event && onDelete && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={saving}
            sx={{
              color: '#ef5350',
              borderColor: '#ef5350',
              '&:hover': {
                borderColor: '#e53935',
                bgcolor: 'rgba(239, 83, 80, 0.08)',
              },
            }}
          >
            Delete
          </Button>
        )}
        {(!event || !onDelete) && <Box />}

        {/* Save/Cancel buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={saving}
            sx={{
              color: 'var(--stream-text-secondary)',
              borderColor: 'var(--stream-card-border)',
              '&:hover': {
                borderColor: 'var(--stream-text-secondary)',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: 'var(--stream-dot-color)',
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'var(--stream-dot-color-hover)',
              },
              '&:disabled': {
                bgcolor: 'rgba(139, 92, 246, 0.5)',
                color: 'rgba(255, 255, 255, 0.6)',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
