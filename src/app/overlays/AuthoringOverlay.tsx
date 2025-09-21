import React, { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { Event } from '../../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Read-only view component for displaying event details
interface ReadOnlyEventViewProps {
  event: Event;
}

function ReadOnlyEventView({ event }: ReadOnlyEventViewProps) {
  const formatDateTime = (event: Event): string => {
    if (event.time) {
      const dateTime = new Date(`${event.date} ${event.time}`);
      return dateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      const date = new Date(event.date);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="space-y-6 h-full">
      {/* Date display */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="material-symbols-rounded text-base">calendar_today</span>
        <time dateTime={event.date}>{formatDateTime(event)}</time>
      </div>

      {/* Title display */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
          {event.title}
        </h1>
      </div>

      {/* Description display */}
      {event.description && (
        <div>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Event ID: {event.id}
        </div>
      </div>
    </div>
  );
}

interface AuthoringOverlayProps {
  selected?: Event;
  isNewEvent?: boolean;
  editDate: string;
  editTime: string;
  editTitle: string;
  editDescription: string;
  setEditDate: (v: string) => void;
  setEditTime: (v: string) => void;
  setEditTitle: (v: string) => void;
  setEditDescription: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const AuthoringOverlay: React.FC<AuthoringOverlayProps> = ({
  selected,
  isNewEvent = false,
  editDate,
  editTime,
  editTitle,
  editDescription,
  setEditDate,
  setEditTime,
  setEditTitle,
  setEditDescription,
  onSave,
  onDelete,
  onClose,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isEditMode, setIsEditMode] = useState(isNewEvent || !selected);
  const [errors, setErrors] = useState({ date: '', time: '', title: '', description: '' });
  const [touched, setTouched] = useState({ date: false, time: false, title: false, description: false });
  useFocusTrap(true, rootRef.current);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Keyboard shortcuts for edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = rootRef.current?.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode]);

  // Validation functions
  const validateDate = (value: string): string => {
    if (!value.trim()) return 'Date is required';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date format (use YYYY-MM-DD)';
    return '';
  };

  const validateTitle = (value: string): string => {
    if (!value.trim()) return 'Title is required';
    if (value.length > 100) return 'Title must be less than 100 characters';
    return '';
  };

  const validateTime = (value: string): string => {
    if (!value.trim()) return ''; // Time is optional
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) return 'Invalid time format (use HH:MM)';
    return '';
  };

  const validateDescription = (value: string): string => {
    if (value.length > 500) return 'Description must be less than 500 characters';
    return '';
  };

  // Enhanced change handlers with validation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditTitle(value);
    if (touched.title) {
      setErrors(prev => ({ ...prev, title: validateTitle(value) }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditTime(value);
    if (touched.time) {
      setErrors(prev => ({ ...prev, time: validateTime(value) }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditDescription(value);
    if (touched.description) {
      setErrors(prev => ({ ...prev, description: validateDescription(value) }));
    }
  };

  // Blur handlers to trigger validation
  const handleTitleBlur = () => {
    setTouched(prev => ({ ...prev, title: true }));
    setErrors(prev => ({ ...prev, title: validateTitle(editTitle) }));
  };

  const handleTimeBlur = () => {
    setTouched(prev => ({ ...prev, time: true }));
    setErrors(prev => ({ ...prev, time: validateTime(editTime) }));
  };

  const handleDescriptionBlur = () => {
    setTouched(prev => ({ ...prev, description: true }));
    setErrors(prev => ({ ...prev, description: validateDescription(editDescription) }));
  };

  // Check if form has errors
  const hasErrors = errors.date || errors.time || errors.title || errors.description;

  // Auto-focus date field when entering edit mode
  useEffect(() => {
    if (isEditMode && rootRef.current) {
      // Focus the date input after a brief delay to ensure it's rendered
      const timer = setTimeout(() => {
        const dateInput = rootRef.current?.querySelector('input[placeholder="YYYY-MM-DD"]') as HTMLInputElement;
        if (dateInput) {
          dateInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditMode]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overlay" aria-hidden={false}>
      {/* Scrim */}
      <div
        data-testid="authoring-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered surface */}
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="authoring-overlay-title"
        data-testid="authoring-overlay"
        className="relative bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 w-[min(960px,90vw)] h-[80vh] p-0 overflow-hidden overlay"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <h2 id="authoring-overlay-title" className="text-lg font-semibold tracking-wide">
            {isEditMode ? (selected ? 'Edit Event' : 'Create Event') : 'View Event'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditMode && selected && (
              <IconButton
                aria-label="Edit event"
                size="small"
                onClick={() => setIsEditMode(true)}
                sx={{ color: 'primary.main' }}
              >
                <span className="material-symbols-rounded">edit</span>
              </IconButton>
            )}
            <button
              type="button"
              aria-label="Close authoring"
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 h-[calc(80vh-80px-72px)] overflow-auto" style={{ overscrollBehavior: 'contain' }}>
          <div className="relative h-full">
            {/* Edit Mode */}
            <div
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                isEditMode
                  ? 'opacity-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 translate-x-4 pointer-events-none'
              }`}
            >
              {isEditMode && (
                <form onSubmit={onSave} className="grid grid-cols-1 gap-6 h-full">
                  {/* Date and Time Fields */}
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Enhanced Date Field with Calendar Picker */}
                      <div className="space-y-1">
                        <DatePicker
                          label="Date *"
                          value={editDate ? dayjs(editDate) : null}
                          onChange={(newValue: Dayjs | null) => {
                            const dateString = newValue ? newValue.format('YYYY-MM-DD') : '';
                            setEditDate(dateString);
                            if (touched.date) {
                              setErrors(prev => ({ ...prev, date: validateDate(dateString) }));
                            }
                          }}
                          onClose={() => {
                            setTouched(prev => ({ ...prev, date: true }));
                            setErrors(prev => ({ ...prev, date: validateDate(editDate) }));
                          }}
                          enableAccessibleFieldDOMStructure={false}
                          slots={{
                            textField: (props) => (
                              <TextField
                                {...props}
                                variant="outlined"
                                fullWidth
                                autoFocus
                                error={touched.date && !!errors.date}
                                helperText={touched.date && errors.date ? errors.date : "Click calendar icon to select"}
                              />
                            )
                          }}
                        />
                      </div>

                      {/* Optional Time Field */}
                      <div className="space-y-1">
                        <TextField
                          label="Time (Optional)"
                          variant="outlined"
                          value={editTime}
                          onChange={handleTimeChange}
                          onBlur={handleTimeBlur}
                          error={touched.time && !!errors.time}
                          helperText={touched.time && errors.time ? errors.time : "Format: HH:MM (24-hour)"}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <span className="material-symbols-rounded text-gray-500 text-lg">schedule</span>
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{
                            placeholder: "14:30",
                            pattern: "\\d{2}:\\d{2}"
                          }}
                          fullWidth
                        />
                      </div>
                    </div>
                  </LocalizationProvider>

                  {/* Enhanced Title Field */}
                  <div className="space-y-1">
                    <TextField
                      label="Title *"
                      variant="outlined"
                      value={editTitle}
                      onChange={handleTitleChange}
                      onBlur={handleTitleBlur}
                      error={touched.title && !!errors.title}
                      helperText={touched.title && errors.title}
                      placeholder="Enter event title..."
                      inputProps={{
                        maxLength: 100,
                        style: { fontSize: '18px', fontWeight: 500 }
                      }}
                      fullWidth
                    />
                    <div className="text-xs text-gray-500 text-right">
                      {editTitle.length}/100
                    </div>
                  </div>

                  {/* Enhanced Description Field */}
                  <div className="space-y-1 flex-1">
                    <TextField
                      label="Description (Optional)"
                      variant="outlined"
                      value={editDescription}
                      onChange={handleDescriptionChange}
                      onBlur={handleDescriptionBlur}
                      error={touched.description && !!errors.description}
                      helperText={touched.description && errors.description}
                      placeholder="Add details about this event..."
                      multiline
                      minRows={4}
                      maxRows={8}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '16px',
                          lineHeight: 1.6
                        }
                      }}
                    />
                    <div className="text-xs text-gray-500 text-right">
                      {editDescription.length}/500
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* View Mode */}
            <div
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                !isEditMode
                  ? 'opacity-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 -translate-x-4 pointer-events-none'
              }`}
            >
              {!isEditMode && selected && (
                <ReadOnlyEventView
                  event={selected}
                />
              )}
            </div>
          </div>
        </div>
        {/* Sticky footer action bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-8 py-4 flex items-center justify-between">
          {isEditMode ? (
            <>
              <div>
                {selected && (
                  <Button
                    variant="text"
                    color="error"
                    type="button"
                    onClick={onDelete}
                    startIcon={<span className="material-symbols-rounded">delete</span>}
                    sx={{ textTransform: 'none' }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  color="inherit"
                  type="button"
                  onClick={() => selected ? setIsEditMode(false) : onClose()}
                  sx={{ textTransform: 'none', minWidth: '80px' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!!hasErrors || !editDate.trim() || !editTitle.trim()}
                  onClick={(e) => (e.target as HTMLElement).closest('form')?.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))}
                  startIcon={<span className="material-symbols-rounded">save</span>}
                  sx={{ textTransform: 'none', minWidth: '100px' }}
                >
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              <div></div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  color="inherit"
                  type="button"
                  onClick={onClose}
                  sx={{ textTransform: 'none', minWidth: '80px' }}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  startIcon={<span className="material-symbols-rounded">edit</span>}
                  sx={{ textTransform: 'none', minWidth: '100px' }}
                >
                  Edit
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
