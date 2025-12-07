import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { Event } from '../../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { EventPreviewList } from '../components/EventPreviewList';
import { SourcesEditor } from '../components/SourcesEditor';

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
    <div className="space-y-8 h-full">
      {/* Title display - moved to top for better hierarchy */}
      <div>
        <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--page-text-primary)' }}>
          {event.title}
        </h1>
      </div>

      {/* Date display with enhanced styling */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--page-bg)', border: '1px solid var(--page-border)' }}>
        <span className="material-symbols-rounded text-xl" style={{ color: 'var(--page-accent)' }}>calendar_today</span>
        <time dateTime={event.date} className="text-base font-medium" style={{ color: 'var(--page-text-primary)' }}>
          {formatDateTime(event)}
        </time>
      </div>

      {/* Description display with improved spacing */}
      {event.description && (
        <div className="pt-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--page-text-secondary)' }}>
            Description
          </h3>
          <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--page-text-primary)' }}>
            {event.description}
          </p>
        </div>
      )}

      {/* Metadata - subtly placed at bottom */}
      <div className="mt-auto pt-8" style={{ borderTop: '1px solid var(--page-border)' }}>
        <div className="text-xs font-mono" style={{ color: 'var(--page-text-secondary)' }}>
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
  onSave: (e: React.FormEvent, options?: { sources: string[] }) => void;
  onDelete: () => void;
  onClose: () => void;
  // New props for navigation
  allEvents: Event[];
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onSelectEvent: (eventId: string) => void;
  // Props for event creation
  onCreateNew: () => void;
  // Ownership control (v0.5.23)
  isOwner?: boolean;
  // Navigation icons (v0.5.34)
  /** Close editor and zoom to event on canvas */
  onViewOnCanvas?: () => void;
  /** Switch to stream view */
  onOpenStreamView?: () => void;
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
  isOwner = true, // Default to true for backwards compatibility
  onViewOnCanvas,
  onOpenStreamView,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Force view mode for non-owners (v0.5.23)
  const [isEditMode, setIsEditMode] = useState(isOwner ? (isNewEvent || !selected) : false);
  const [errors, setErrors] = useState({ date: '', time: '', title: '', description: '' });
  const [touched, setTouched] = useState({ date: false, time: false, title: false, description: false });
  const [editSources, setEditSources] = useState<string[]>(selected?.sources ?? []);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  // Actions menu state (for responsive icon grouping)
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);
  const actionsMenuOpen = Boolean(actionsMenuAnchor);
  useFocusTrap(true, rootRef.current);

  // Compute previous and next events (memoized to avoid re-sorting on every keystroke)
  const sortedEvents = useMemo(() =>
    [...allEvents].sort((a, b) =>
      new Date(a.date + (a.time || '00:00')).getTime() - new Date(b.date + (b.time || '00:00')).getTime()
    ),
    [allEvents]
  );

  const currentIndex = useMemo(() =>
    selected ? sortedEvents.findIndex(e => e.id === selected.id) : -1,
    [selected, sortedEvents]
  );

  const prevEvents = useMemo(() => {
    if (!selected) {
      // When creating a new event, show all prior events for context
      return [...sortedEvents].reverse();
    }
    return currentIndex > 0 ? sortedEvents.slice(0, currentIndex).reverse() : [];
  }, [selected, currentIndex, sortedEvents]);

  const nextEvents = useMemo(() => {
    if (!selected) {
      // When creating a new event, also show the full list in the next panel
      return sortedEvents;
    }
    return currentIndex >= 0 ? sortedEvents.slice(currentIndex + 1) : [];
  }, [selected, currentIndex, sortedEvents]);

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

  useEffect(() => {
    setEditSources(selected?.sources ?? []);
    setIsSourcesExpanded(true);
  }, [selected]);

  // Keyboard shortcuts for edit mode and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcuts (Ctrl+S or Ctrl+Enter) - only in edit mode
      if (isEditMode && (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
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
  const sourcesCount = editSources.length;

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
        className="relative rounded-2xl shadow-2xl max-w-[1080px] w-[90vw] h-[80vh] overflow-hidden flex"
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="authoring-overlay-title"
        aria-describedby="authoring-overlay-description"
        data-testid="authoring-overlay"
        data-tour="event-editor"
        style={{
          backgroundColor: 'var(--page-bg-elevated)',
          color: 'var(--page-text-primary)',
          border: '1px solid var(--page-border)'
        }}
      >
        {/* Left Panel - Previous Events */}
        <div
          className="w-[240px] flex flex-col"
          style={{
            backgroundColor: 'var(--page-bg-elevated)',
            borderRight: '1px solid var(--page-border)'
          }}
        >
          {/* Left panel header with navigation chevron */}
          <div
            className="p-4 flex items-center justify-between"
            style={{
              borderBottom: '1px solid var(--page-border)',
              backgroundColor: 'var(--page-bg)'
            }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigatePrev}
                disabled={!canNavigatePrev}
                className="p-2 rounded-lg transition-colors"
                style={{
                  border: '1px solid var(--page-border)',
                  backgroundColor: canNavigatePrev ? 'transparent' : 'var(--page-bg)',
                  color: canNavigatePrev ? 'var(--page-text-primary)' : 'var(--page-text-secondary)',
                  cursor: canNavigatePrev ? 'pointer' : 'not-allowed',
                  opacity: canNavigatePrev ? 1 : 0.5
                }}
                title="Previous event (Left arrow)"
                aria-label="Navigate to previous event"
                onMouseEnter={(e) => {
                  if (canNavigatePrev) {
                    e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="material-symbols-rounded text-lg">chevron_left</span>
              </button>
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--page-text-primary)' }}>Previous</h3>
                <p className="text-xs" style={{ color: 'var(--page-text-secondary)' }}>{prevEvents.length} event{prevEvents.length !== 1 ? 's' : ''}</p>
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
        <div
          className="flex-1 flex flex-col max-w-[600px]"
          style={{ backgroundColor: 'var(--page-bg-elevated)' }}
        >
          {/* Header */}
          <div
            className="px-8 py-6 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--page-border)' }}
          >
            <div className="flex items-center gap-4">
              <h2
                id="authoring-overlay-title"
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--page-text-primary)' }}
              >
                {isEditMode ? (selected ? 'Edit Event' : 'Create Event') : 'Event Details'}
              </h2>
              {/* Screen reader description */}
              <div id="authoring-overlay-description" className="sr-only">
                {isEditMode
                  ? 'Edit event details including title, date, time, and description. Use Escape to close, Ctrl+S to save.'
                  : 'View event details. Use arrow keys to navigate between events, Escape to close.'}
              </div>
              {selected && allEvents.length > 1 && (
                <div className="text-sm px-3 py-1 rounded-full" style={{ color: 'var(--page-text-secondary)', backgroundColor: 'var(--page-bg)' }}>
                  {currentIndex + 1} of {allEvents.length}
                </div>
              )}
              {/* Read-only badge for non-owners */}
              {!isOwner && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
                  <span className="material-symbols-rounded text-sm">lock</span>
                  <span className="text-xs font-medium">View Only</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Desktop: Show all action icons inline */}
              <div className="hidden sm:flex items-center gap-1">
                {/* View on canvas icon - show when event is selected */}
                {selected && onViewOnCanvas && (
                  <Tooltip title="View on canvas" arrow>
                    <IconButton
                      aria-label="View event on canvas"
                      size="small"
                      onClick={onViewOnCanvas}
                      sx={{ color: 'var(--page-text-secondary)', '&:hover': { color: 'var(--page-accent)' } }}
                    >
                      <span className="material-symbols-rounded">visibility</span>
                    </IconButton>
                  </Tooltip>
                )}
                {/* Stream view icon - show when event is selected */}
                {selected && onOpenStreamView && (
                  <Tooltip title="Open in Stream View" arrow>
                    <IconButton
                      aria-label="Open in stream view"
                      size="small"
                      onClick={onOpenStreamView}
                      sx={{ color: 'var(--page-text-secondary)', '&:hover': { color: 'var(--page-accent)' } }}
                    >
                      <span className="material-symbols-rounded">view_stream</span>
                    </IconButton>
                  </Tooltip>
                )}
                {/* Divider between navigation and edit actions */}
                {selected && (onViewOnCanvas || onOpenStreamView) && (
                  <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--page-border)' }} />
                )}
                {/* Edit button for owners in view mode */}
                {!isEditMode && selected && isOwner && (
                  <Tooltip title="Edit event" arrow>
                    <IconButton
                      aria-label="Edit event"
                      size="small"
                      onClick={() => setIsEditMode(true)}
                      sx={{ color: 'var(--page-accent)' }}
                    >
                      <span className="material-symbols-rounded">edit</span>
                    </IconButton>
                  </Tooltip>
                )}
                {/* Create button for owners */}
                {selected && isOwner && (
                  <Tooltip title="Create new event" arrow>
                    <IconButton
                      aria-label="Create new event"
                      size="small"
                      onClick={handleCreateNewEvent}
                      sx={{ color: 'var(--page-accent)' }}
                    >
                      <span className="material-symbols-rounded">add</span>
                    </IconButton>
                  </Tooltip>
                )}
              </div>

              {/* Mobile: Show "more" menu with all actions */}
              <div className="sm:hidden">
                {selected && (
                  <>
                    <IconButton
                      aria-label="More actions"
                      size="small"
                      onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
                      sx={{ color: 'var(--page-text-secondary)' }}
                    >
                      <span className="material-symbols-rounded">more_vert</span>
                    </IconButton>
                    <Menu
                      anchorEl={actionsMenuAnchor}
                      open={actionsMenuOpen}
                      onClose={() => setActionsMenuAnchor(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      slotProps={{
                        paper: {
                          sx: {
                            backgroundColor: 'var(--page-bg-elevated)',
                            border: '1px solid var(--page-border)',
                            minWidth: 180,
                          }
                        }
                      }}
                    >
                      {onViewOnCanvas && (
                        <MenuItem
                          onClick={() => { setActionsMenuAnchor(null); onViewOnCanvas(); }}
                          sx={{ color: 'var(--page-text-primary)' }}
                        >
                          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
                            <span className="material-symbols-rounded text-xl">visibility</span>
                          </ListItemIcon>
                          <ListItemText>View on canvas</ListItemText>
                        </MenuItem>
                      )}
                      {onOpenStreamView && (
                        <MenuItem
                          onClick={() => { setActionsMenuAnchor(null); onOpenStreamView(); }}
                          sx={{ color: 'var(--page-text-primary)' }}
                        >
                          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
                            <span className="material-symbols-rounded text-xl">view_stream</span>
                          </ListItemIcon>
                          <ListItemText>Stream view</ListItemText>
                        </MenuItem>
                      )}
                      {(onViewOnCanvas || onOpenStreamView) && isOwner && <Divider />}
                      {!isEditMode && isOwner && (
                        <MenuItem
                          onClick={() => { setActionsMenuAnchor(null); setIsEditMode(true); }}
                          sx={{ color: 'var(--page-text-primary)' }}
                        >
                          <ListItemIcon sx={{ color: 'var(--page-accent)' }}>
                            <span className="material-symbols-rounded text-xl">edit</span>
                          </ListItemIcon>
                          <ListItemText>Edit event</ListItemText>
                        </MenuItem>
                      )}
                      {isOwner && (
                        <MenuItem
                          onClick={() => { setActionsMenuAnchor(null); handleCreateNewEvent(); }}
                          sx={{ color: 'var(--page-text-primary)' }}
                        >
                          <ListItemIcon sx={{ color: 'var(--page-accent)' }}>
                            <span className="material-symbols-rounded text-xl">add</span>
                          </ListItemIcon>
                          <ListItemText>Create new</ListItemText>
                        </MenuItem>
                      )}
                    </Menu>
                  </>
                )}
              </div>

              {/* Close button - always visible */}
              <button
                type="button"
                aria-label="Close authoring"
                className="text-sm px-4 py-2 rounded-lg transition-colors font-medium ml-2"
                style={{
                  border: '1px solid var(--page-border)',
                  color: 'var(--page-text-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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
                  <form
                    id="event-form"
                    onSubmit={(e) => onSave(e, { sources: editSources })}
                    className="grid grid-cols-1 gap-6 h-full max-w-2xl"
                  >
                    {/* Live region for validation error announcements */}
                    <div
                      aria-live="polite"
                      aria-atomic="true"
                      className="sr-only"
                    >
                      {touched.date && errors.date && `Date error: ${errors.date}`}
                      {touched.time && errors.time && `Time error: ${errors.time}`}
                      {touched.title && errors.title && `Title error: ${errors.title}`}
                      {touched.description && errors.description && `Description error: ${errors.description}`}
                    </div>
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
                                helperText: touched.date && errors.date ? errors.date : "Click calendar icon to select",
                                inputProps: {
                                  'aria-invalid': touched.date && !!errors.date,
                                  'aria-describedby': touched.date && errors.date ? 'error-date' : undefined
                                },
                                FormHelperTextProps: {
                                  id: touched.date && errors.date ? 'error-date' : undefined,
                                  role: touched.date && errors.date ? 'alert' : undefined
                                } as any
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
                              pattern: "\\d{2}:\\d{2}",
                              'aria-invalid': touched.time && !!errors.time,
                              'aria-describedby': touched.time && errors.time ? 'error-time' : undefined
                            }}
                            FormHelperTextProps={{
                              id: touched.time && errors.time ? 'error-time' : undefined,
                              role: touched.time && errors.time ? 'alert' : undefined
                            } as any}
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
                          style: { fontSize: '18px', fontWeight: 500 },
                          'aria-invalid': touched.title && !!errors.title,
                          'aria-describedby': touched.title && errors.title ? 'error-title' : undefined
                        }}
                        FormHelperTextProps={{
                          id: touched.title && errors.title ? 'error-title' : undefined,
                          role: touched.title && errors.title ? 'alert' : undefined
                        } as any}
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
                        inputProps={{
                          'aria-invalid': touched.description && !!errors.description,
                          'aria-describedby': touched.description && errors.description ? 'error-description' : undefined
                        }}
                        FormHelperTextProps={{
                          id: touched.description && errors.description ? 'error-description' : undefined,
                          role: touched.description && errors.description ? 'alert' : undefined
                        } as any}
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

                    {/* Sources Section */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                        style={{
                          backgroundColor: 'var(--page-bg)',
                          border: '1px solid var(--page-border)',
                          color: 'var(--page-text-primary)',
                        }}
                        onClick={() => setIsSourcesExpanded((prev) => !prev)}
                        aria-expanded={isSourcesExpanded}
                        aria-controls="sources-editor-panel"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-rounded text-base" aria-hidden="true">source_notes</span>
                          <span className="text-sm font-semibold tracking-wide">
                            Sources ({sourcesCount})
                          </span>
                        </div>
                        <span className="material-symbols-rounded text-lg" aria-hidden="true">
                          {isSourcesExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      {isSourcesExpanded && (
                        <div
                          id="sources-editor-panel"
                          className="rounded-xl px-4 py-3"
                          style={{
                            border: '1px solid var(--page-border)',
                            backgroundColor: 'var(--page-bg)',
                          }}
                        >
                          <SourcesEditor
                            sources={editSources}
                            onChange={setEditSources}
                            readOnly={!isOwner}
                          />
                        </div>
                      )}
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
                  <div className="max-w-2xl space-y-6">
                    <ReadOnlyEventView event={selected} />
                    <div className="space-y-2">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                        style={{
                          backgroundColor: 'var(--page-bg)',
                          border: '1px solid var(--page-border)',
                          color: 'var(--page-text-primary)',
                        }}
                        onClick={() => setIsSourcesExpanded((prev) => !prev)}
                        aria-expanded={isSourcesExpanded}
                        aria-controls="sources-viewer-panel"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-rounded text-base" aria-hidden="true">source_notes</span>
                          <span className="text-sm font-semibold tracking-wide">
                            Sources ({selected.sources?.length ?? 0})
                          </span>
                        </div>
                        <span className="material-symbols-rounded text-lg" aria-hidden="true">
                          {isSourcesExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      {isSourcesExpanded && (
                        <div
                          id="sources-viewer-panel"
                          className="rounded-xl px-4 py-3"
                          style={{
                            border: '1px solid var(--page-border)',
                            backgroundColor: 'var(--page-bg)',
                          }}
                        >
                          <SourcesEditor
                            sources={selected.sources ?? []}
                            onChange={() => { /* read-only, no changes */ }}
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer action bar */}
          <div
            className="px-8 py-5 flex items-center justify-between"
            style={{
              borderTop: '1px solid var(--page-border)',
              backgroundColor: 'var(--page-bg-elevated)'
            }}
          >
            {isEditMode && isOwner ? (
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
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--page-text-secondary)' }}>
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
                  {/* Only show Edit button for owners */}
                  {isOwner && (
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
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Next Events */}
        <div
          className="w-[240px] flex flex-col"
          style={{
            backgroundColor: 'var(--page-bg-elevated)',
            borderLeft: '1px solid var(--page-border)'
          }}
        >
          {/* Right panel header with navigation chevron */}
          <div
            className="p-4 flex items-center justify-between"
            style={{
              borderBottom: '1px solid var(--page-border)',
              backgroundColor: 'var(--page-bg)'
            }}
          >
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--page-text-primary)' }}>Next</h3>
                <p className="text-xs" style={{ color: 'var(--page-text-secondary)' }}>{nextEvents.length} event{nextEvents.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={onNavigateNext}
                disabled={!canNavigateNext}
                className="p-2 rounded-lg transition-colors"
                style={{
                  border: '1px solid var(--page-border)',
                  backgroundColor: canNavigateNext ? 'transparent' : 'var(--page-bg)',
                  color: canNavigateNext ? 'var(--page-text-primary)' : 'var(--page-text-secondary)',
                  cursor: canNavigateNext ? 'pointer' : 'not-allowed',
                  opacity: canNavigateNext ? 1 : 0.5
                }}
                title="Next event (Right arrow)"
                aria-label="Navigate to next event"
                onMouseEnter={(e) => {
                  if (canNavigateNext) {
                    e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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
