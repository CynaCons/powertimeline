import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { EventPreviewList } from '../components/EventPreviewList';

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
  // New props for navigation
  allEvents: Event[];
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onSelectEvent: (eventId: string) => void;
  // Props for event creation
  onCreateNew: () => void;
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
  allEvents,
  onNavigatePrev,
  onNavigateNext,
  onSelectEvent,
  onCreateNew,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isEditMode, setIsEditMode] = useState(isNewEvent || !selected);
  const [errors, setErrors] = useState({ date: '', time: '', title: '', description: '' });
  const [touched, setTouched] = useState({ date: false, time: false, title: false, description: false });
  useFocusTrap(true, rootRef.current);

  // Compute previous and next events
  const sortedEvents = [...allEvents].sort((a, b) =>
    new Date(a.date + (a.time || '00:00')).getTime() - new Date(b.date + (b.time || '00:00')).getTime()
  );

  const currentIndex = selected ? sortedEvents.findIndex(e => e.id === selected.id) : -1;
  const prevEvents = currentIndex > 0 ? sortedEvents.slice(0, currentIndex).reverse() : [];
  const nextEvents = currentIndex >= 0 ? sortedEvents.slice(currentIndex + 1) : [];

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex >= 0 && currentIndex < sortedEvents.length - 1;

  // Handler for creating a new event
  const handleCreateNewEvent = useCallback(() => {
    onCreateNew();
  }, [onCreateNew]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Keyboard shortcuts for edit mode and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcut (Ctrl+S) - only in edit mode
      if (isEditMode && (e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = rootRef.current?.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
        return;
      }

      // Navigation shortcuts (Arrow keys) - only when not focused on an input
      if (e.target instanceof HTMLElement) {
        const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
                              e.target.contentEditable === 'true';

        if (!isInputFocused) {
          if (e.key === 'ArrowLeft' && canNavigatePrev) {
            e.preventDefault();
            onNavigatePrev();
          } else if (e.key === 'ArrowRight' && canNavigateNext) {
            e.preventDefault();
            onNavigateNext();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, canNavigatePrev, canNavigateNext, onNavigatePrev, onNavigateNext]);

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

      {/* Three-panel overlay container */}
      <div
        className="relative bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 max-w-[1080px] w-[90vw] h-[80vh] overflow-hidden flex"
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="authoring-overlay-title"
        data-testid="authoring-overlay"
      >
        {/* Left Panel - Previous Events */}
        <div className="w-[240px] bg-white border-r border-gray-200 flex flex-col">
          {/* Left panel header with navigation chevron */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigatePrev}
                disabled={!canNavigatePrev}
                className={`p-2 rounded-lg border transition-colors ${
                  canNavigatePrev
                    ? 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="Previous event (Left arrow)"
                aria-label="Navigate to previous event"
              >
                <span className="material-symbols-rounded text-lg">chevron_left</span>
              </button>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Previous</h3>
                <p className="text-xs text-gray-500">{prevEvents.length} event{prevEvents.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Previous events list */}
          <div className="flex-1 overflow-hidden">
            <EventPreviewList
              events={prevEvents}
              currentEventId={selected?.id}
              onSelect={onSelectEvent}
              direction="prev"
            />
          </div>
        </div>

        {/* Center Panel - Main Editor */}
        <div className="flex-1 bg-white flex flex-col max-w-[600px]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 id="authoring-overlay-title" className="text-lg font-semibold tracking-wide">
                {isEditMode ? (selected ? 'Edit Event' : 'Create Event') : 'View Event'}
              </h2>
              {selected && allEvents.length > 1 && (
                <div className="text-sm text-gray-500">
                  Event {currentIndex + 1} of {allEvents.length}
                </div>
              )}
            </div>
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
              {selected && (
                <IconButton
                  aria-label="Create new event"
                  size="small"
                  onClick={handleCreateNewEvent}
                  sx={{ color: 'success.main' }}
                  title="Create new event"
                >
                  <span className="material-symbols-rounded">add</span>
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
          <div className="flex-1 p-8 overflow-auto" style={{ overscrollBehavior: 'contain' }}>
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
                  <form id="event-form" onSubmit={onSave} className="grid grid-cols-1 gap-6 h-full max-w-2xl">
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
                              // Mark as touched and validate the NEW value immediately
                              setTouched(prev => ({ ...prev, date: true }));
                              setErrors(prev => ({ ...prev, date: validateDate(dateString) }));
                            }}
                            onClose={() => {
                              // Don't re-validate here - already done in onChange with correct value
                            }}
                            slotProps={{
                               
                              openPickerButton: {
                                'data-testid': 'date-picker-button'
                              } as any, // data-testid is a valid HTML attribute for testing but not in MUI types
                              textField: {
                                variant: "outlined" as const,
                                fullWidth: true,
                                error: touched.date && !!errors.date,
                                helperText: touched.date && errors.date ? errors.date : "Click calendar icon to select"
                              }
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
                  <div className="max-w-2xl">
                    <ReadOnlyEventView event={selected} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer action bar */}
          <div className="border-t border-gray-200 bg-white px-8 py-4 flex items-center justify-between">
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
                    form="event-form"
                    disabled={!!hasErrors || !editDate.trim() || !editTitle.trim()}
                    startIcon={<span className="material-symbols-rounded">save</span>}
                    sx={{ textTransform: 'none', minWidth: '100px' }}
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="material-symbols-rounded text-base">keyboard</span>
                  Use ← → keys to navigate events
                </div>
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

        {/* Right Panel - Next Events */}
        <div className="w-[240px] bg-white border-l border-gray-200 flex flex-col">
          {/* Right panel header with navigation chevron */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Next</h3>
                <p className="text-xs text-gray-500">{nextEvents.length} event{nextEvents.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={onNavigateNext}
                disabled={!canNavigateNext}
                className={`p-2 rounded-lg border transition-colors ${
                  canNavigateNext
                    ? 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="Next event (Right arrow)"
                aria-label="Navigate to next event"
              >
                <span className="material-symbols-rounded text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Next events list */}
          <div className="flex-1 overflow-hidden">
            <EventPreviewList
              events={nextEvents}
              currentEventId={selected?.id}
              onSelect={onSelectEvent}
              direction="next"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
