import { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeterministicLayoutComponent } from './layout/DeterministicLayoutComponent';
import { NavigationRail, ThemeToggleButton } from './components/NavigationRail';
import { UserProfileMenu } from './components/UserProfileMenu';
import { useNavigationShortcuts, useCommandPaletteShortcuts } from './hooks/useKeyboardShortcuts';
import { useNavigationConfig, type NavigationItem } from './app/hooks/useNavigationConfig';
import { useAuth } from './contexts/AuthContext';
import { getTimeline, updateTimeline, getUser, addEvent, updateEvent as updateEventFirestore, deleteEvent as deleteEventFirestore } from './services/firestore';
import type { User } from './types';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { useToast } from './contexts/ToastContext';
import { useTheme } from './contexts/ThemeContext';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { Event, Timeline } from './types';
import type { Command } from './components/CommandPalette';

// Lazy load panels, overlays and heavy components for better bundle splitting
const OutlinePanel = lazy(() => import('./app/panels/OutlinePanel').then(m => ({ default: m.OutlinePanel })));
const AuthoringOverlay = lazy(() => import('./app/overlays/AuthoringOverlay').then(m => ({ default: m.AuthoringOverlay })));
const ImportExportOverlay = lazy(() => import('./app/overlays/ImportExportOverlay').then(m => ({ default: m.ImportExportOverlay })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const TimelineMinimap = lazy(() => import('./components/TimelineMinimap').then(m => ({ default: m.TimelineMinimap })));
const StreamViewerOverlay = lazy(() => import('./components/StreamViewerOverlay').then(m => ({ default: m.StreamViewerOverlay })));
const ChatPanel = lazy(() => import('./app/panels/ChatPanel').then(m => ({ default: m.ChatPanel })));
import { useAISession } from './hooks/useAISession';
import { buildAIContext } from './lib/aiContextBuilder';
import { executeActions } from './lib/aiActionHandlers';
import type { AIAction, AIContext } from './types/ai';
import { EventStorage } from './lib/storage';
import { seedRFKTimeline } from './lib/devSeed';
import { useViewWindow } from './app/hooks/useViewWindow';
import { useAnnouncer } from './app/hooks/useAnnouncer';
import { useTimelineZoom } from './app/hooks/useTimelineZoom';
import { useTimelineSelection } from './app/hooks/useTimelineSelection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePerformanceMonitoring } from './app/hooks/usePerformanceMonitoring';
import { ErrorState } from './components/ErrorState';
import { TourProvider, useTour } from './components/tours/TourProvider';
import { EditorTour } from './components/tours/EditorTour';

const DEV_FLAG_KEY = 'powertimeline-dev';

interface AppProps {
  timelineId?: string;  // Optional timeline ID to load from home page storage
  readOnly?: boolean;   // Read-only mode: hide authoring overlay, show lock icon on nav rail
  initialStreamViewOpen?: boolean;  // Open stream view on mount (for mobile first experience)
  onStreamViewChange?: (isOpen: boolean) => void;  // Callback when stream view opens/closes
}

// Inner component that uses tour context
function AppContent({ timelineId, readOnly = false, initialStreamViewOpen = false, onStreamViewChange }: AppProps = {}) {
  // Ownership is inverse of readOnly (readOnly = false means user owns the timeline)
  const isOwner = !readOnly;
  usePerformanceMonitoring();
  const navigate = useNavigate();
  const { startTour } = useTour();

  // Storage
  const storageRef = useRef(new EventStorage());

  // Ref to always have current events (avoid stale closures)
  const eventsRef = useRef<Event[]>([]);

  // Helper function to save events to the correct location
  const saveEvents = useCallback(async (events: Event[]) => {
    try {
      if (timelineId) {
        // Only owners can save - check before attempting
        if (!isOwner) {
          console.error('[saveEvents] Cannot save: user is not the owner');
          throw new Error('Permission denied: only the timeline owner can save changes');
        }
        // Save to timeline in Firestore
        await updateTimeline(timelineId, { events });

        // Verify the save worked by fetching back
        const savedTimeline = await getTimeline(timelineId);
        if (!savedTimeline) {
          throw new Error('Verification failed: could not fetch timeline after save');
        }
        if (savedTimeline.events.length !== events.length) {
          console.error('[saveEvents] MISMATCH: Saved', events.length, 'but fetched', savedTimeline.events.length);
          throw new Error(`Save verification failed: expected ${events.length} events, got ${savedTimeline.events.length}`);
        }
      } else {
        // Save to legacy EventStorage
        storageRef.current.writeThrough(events);
      }
    } catch (error) {
      console.error('[saveEvents] Failed to save events:', error);
      throw error; // Re-throw so caller can handle
    }
  }, [timelineId, isOwner]);

  const [events, setEvents] = useState<Event[]>(() => {
    // If timelineId is provided, we'll load from Firestore in useEffect (can't be async here)
    if (timelineId) {
      return [];
    }

    // Otherwise, load from legacy EventStorage
    const stored = storageRef.current.load();
    if (stored.length > 0) {
      return stored;
    }

    const defaultSeed = seedRFKTimeline();
    storageRef.current.writeThrough(defaultSeed);
    return defaultSeed;
  });

  // Keep eventsRef in sync with events (for callbacks that need current events)
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [hoveredEventId, setHoveredEventId] = useState<string | undefined>(undefined);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [streamViewerOpen, setStreamViewerOpen] = useState(initialStreamViewOpen);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Respond to external trigger to open stream view (e.g., from MobileNotice)
  useEffect(() => {
    if (initialStreamViewOpen) {
      setStreamViewerOpen(true);
    }
  }, [initialStreamViewOpen]);

  // Notify parent when stream view state changes
  useEffect(() => {
    onStreamViewChange?.(streamViewerOpen);
  }, [streamViewerOpen, onStreamViewChange]);

  // Use readOnly prop from EditorPage (which determines ownership via Firebase Auth)
  const isReadOnly = readOnly;

  // Get current Firebase user for auth-gated features (moved up for editorItems dependency)
  const { user: firebaseUser, signOut } = useAuth();

  // Current timeline metadata (for import/export)
  const [currentTimeline, setCurrentTimeline] = useState<Timeline | null>(null);

  // Reload events when timelineId changes
  const loadTimelineEvents = useCallback(async () => {
    try {
      setLoadError(null);
      if (timelineId) {
        const timeline = await getTimeline(timelineId);
        if (timeline) {
          setEvents(timeline.events);
          setCurrentTimeline(timeline);
          return;
        }
      }

      // If no timelineId or timeline not found, load from EventStorage
      const stored = storageRef.current.load();
      if (stored.length > 0) {
        setEvents(stored);
      }
      // Create a minimal timeline object for local/legacy storage
      setCurrentTimeline({
        id: 'local-timeline',
        title: 'Local Timeline',
        description: '',
        ownerId: '',
        visibility: 'private',
        events: stored,
        eventCount: stored.length,
        viewCount: 0,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load timeline:', error);
      setLoadError(error instanceof Error ? error : new Error('Failed to load timeline'));
      setEvents([]);
      setCurrentTimeline(null);
    }
  }, [timelineId]);

  useEffect(() => {
    loadTimelineEvents();
  }, [loadTimelineEvents]);

  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  // Selected regular event (used for AI context)
  const selected = useMemo(
    () => events.find((e) => e.id === selectedId),
    [events, selectedId]
  );

  // AI Context for chat
  const aiContext = useMemo<AIContext>(() => buildAIContext({
    timeline: currentTimeline,
    events,
    selectedEvent: selected,
  }), [currentTimeline, events, selected]);

  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // View window controls via hook
  const { viewStart, viewEnd, setWindow, nudge, zoom, zoomAtCursor, animateTo } = useViewWindow(0,1);

  // Timeline interaction hooks
  useTimelineZoom({ zoomAtCursor, hoveredEventId });
  const { timelineSelection, handleTimelineMouseDown } = useTimelineSelection({ viewStart, viewEnd, setWindow });

  const handleTimelineMouseDownWithSelection = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    const interactedWithCard = target?.closest('[data-testid="event-card"]');
    const interactedWithAnchor = target?.closest('[data-testid="timeline-anchor"]');

    if (!interactedWithCard && !interactedWithAnchor) {
      setSelectedId(undefined);
    }

    handleTimelineMouseDown(e);
  }, [handleTimelineMouseDown, setSelectedId]);

  // Panels & overlays
  // Left sidebar overlays (permanent sidebar width = 56px)
  const [overlay, setOverlay] = useState<null | 'events' | 'editor' | 'import-export'>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [outlineFilter, setOutlineFilter] = useState('');
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  // Info panels toggle
  const [showInfoPanels, setShowInfoPanels] = useState(false);

  // Dragging state (for disabling overlay pointer events)
  const [dragging] = useState(false);
  // Dev options (removed unused placeholder and force card mode for Stage 1)

  // Announcer hook
  const { announce, renderLiveRegion } = useAnnouncer();

  // Navigation and theme hooks
  const { toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Theme: dark-only (no data-theme switch)
  useEffect(() => {
    try {
      localStorage.removeItem(DEV_FLAG_KEY);
    } catch (error) {
      console.warn('Failed to remove dev flag from localStorage:', error);
    }
  }, []);

  // Add Esc to close overlays
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && overlay) setOverlay(null);
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [overlay]);

  // If opening Editor with exactly one event and nothing selected, auto-select it
  useEffect(() => {
    if (overlay === 'editor' && !selectedId && events.length === 1) {
      setSelectedId(events[0].id);
    }
  }, [overlay, selectedId, events]);

  // On overlay open, focus first focusable and enable simple focus trap
  useEffect(() => {
    if (!overlay || !overlayRef.current) return;
    const root = overlayRef.current;
    const focusable = root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    if (first) first.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const list = Array.from(root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
      if (list.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = list.indexOf(active || list[0]);
      if (e.shiftKey) {
        if (active === list[0] || idx === -1) { e.preventDefault(); list[list.length - 1].focus(); }
      } else {
        if (active === list[list.length - 1]) { e.preventDefault(); list[0].focus(); }
      }
    }
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [overlay]);

  // Persist events whenever they change (debounced via storage)
  useEffect(() => {
    storageRef.current.save(events);
  }, [events]);

  // Sync edit fields when selection changes
  // IMPORTANT: Only depend on selectedId, NOT on 'selected' object
  // If 'selected' is in deps, form fields reset whenever events array changes
  // (because selected reference changes), causing user to lose their edits
  useEffect(() => {
    if (selected) {
      setEditDate(selected.date);
      setEditTime(selected.time ?? '');
      setEditTitle(selected.title);
      setEditDescription(selected.description ?? '');
    } else {
      setEditDate(''); setEditTime(''); setEditTitle(''); setEditDescription('');
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts (ignore when typing in inputs)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === '+' || e.key === '=') { zoom(0.8); }
      else if (e.key === '-' || e.key === '_') { zoom(1.25); }
      else if (e.key === 'ArrowLeft') { nudge(-0.05); }
      else if (e.key === 'ArrowRight') { nudge(0.05); }
      else if (e.key === 'Home') { const w = Math.max(viewEnd - viewStart, 0.1); setWindow(0, w); }
      else if (e.key === 'End') { const w = Math.max(viewEnd - viewStart, 0.1); setWindow(Math.max(0, 1 - w), 1); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewStart, viewEnd, zoom, nudge, setWindow]);



  // CRUD handlers
  const saveAuthoring = useCallback((e: React.FormEvent, options?: { sources?: string[] }) => {
    e.preventDefault();
    const isEdit = !!selectedId;

    // Check if this is a preview event (AI-proposed event)
    if (selectedId?.startsWith('preview-')) {
      const actionId = selectedId.replace('preview-', '');

      // Update the pending action's payload instead of writing to Firestore
      updateActionPayloadRef.current(actionId, {
        date: editDate,
        time: editTime || undefined,
        title: editTitle,
        description: editDescription || undefined,
        sources: options?.sources,
      });

      try {
        announce(`Updated preview for ${editTitle || 'event'}`);
      } catch (error) {
        console.warn('Failed to announce preview update:', error);
      }
      setOverlay(null);
      return;
    }

    if (isEdit) {
      setEvents(prev => {
        const next = prev.map(ev => ev.id === selectedId ? {
          ...ev,
          date: editDate || ev.date,
          time: editTime || undefined,
          title: editTitle || ev.title,
          description: editDescription || undefined,
          sources: options?.sources ?? ev.sources,
        } : ev);
        saveEvents(next);
        return next;
      });
      try {
        announce(`Saved changes to ${editTitle || 'event'}`);
      } catch (error) {
        console.warn('Failed to announce save:', error);
      }
    } else {
      if (!editDate || !editTitle) {
        return;
      }
      const newEvent: Event = {
        id: Date.now().toString(),
        date: editDate,
        time: editTime || undefined,
        title: editTitle,
        description: editDescription || undefined,
        sources: options?.sources,
      };
      setEvents(prev => { const next = [...prev, newEvent]; saveEvents(next); return next; });
      try {
        announce(`Added event ${editTitle}`);
      } catch (error) {
        console.warn('Failed to announce add:', error);
      }
    }
    setOverlay(null);
  }, [selectedId, editDate, editTime, editTitle, editDescription, announce, saveEvents]);

  // saveAuthoring handles both edit and create flows

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const toDelete = events.find(e => e.id === selectedId);
    setEvents(prev => { const next = prev.filter(ev => ev.id !== selectedId); saveEvents(next); return next; });
    setSelectedId(undefined);
    setOverlay(null); // Close the authoring overlay after deletion
    try {
      announce(`Deleted ${toDelete?.title || 'event'}`);
    } catch (error) {
      console.warn('Failed to announce delete:', error);
    }
  }, [selectedId, events, announce, saveEvents]);

  const handleEventSave = useCallback(async (event: Event) => {
    let nextEvents: Event[] = [];
    let isUpdate = false;
    setEvents(prev => {
      const existing = prev.find(ev => ev.id === event.id);
      isUpdate = !!existing;
      const updatedEvent = existing ? { ...existing, ...event } : event;
      const updatedList = existing
        ? prev.map(ev => (ev.id === event.id ? updatedEvent : ev))
        : [...prev, updatedEvent];
      nextEvents = updatedList;
      return updatedList;
    });
    await saveEvents(nextEvents);
    setSelectedId(event.id);
    try {
      announce(`${isUpdate ? 'Updated' : 'Added'} ${event.title}`);
    } catch (error) {
      console.warn('Failed to announce stream save:', error);
    }
  }, [saveEvents, announce]);

  const handleEventDelete = useCallback(async (eventId: string) => {
    let nextEvents: Event[] = [];
    let deletedTitle = '';
    setEvents(prev => {
      const toDelete = prev.find(ev => ev.id === eventId);
      deletedTitle = toDelete?.title ?? '';
      nextEvents = prev.filter(ev => ev.id !== eventId);
      return nextEvents;
    });
    await saveEvents(nextEvents);
    setSelectedId(prev => (prev === eventId ? undefined : prev));
    try {
      announce(`Deleted ${deletedTitle || 'event'}`);
    } catch (error) {
      console.warn('Failed to announce stream delete:', error);
    }
  }, [saveEvents, announce]);

  // AI Action handlers
  const handleApplyAIActions = useCallback(async (actions: AIAction[]) => {
    // Use ref to get current events (avoid stale closure)
    let currentEvents = eventsRef.current;

    // Need ownerId for Firestore operations
    const ownerId = currentTimeline?.ownerId;
    if (!ownerId || !timelineId) {
      throw new Error('Cannot apply AI actions: missing timeline or owner info');
    }

    // Check ownership
    if (!isOwner) {
      throw new Error('Permission denied: only the timeline owner can apply AI actions');
    }

    const results = await executeActions(actions, {
      events: currentEvents,
      timeline: currentTimeline,
      onCreateEvent: async (eventData) => {
        const newId = Date.now().toString();
        const newEvent = { ...eventData, id: newId } as Event;

        // Add to Firestore events subcollection
        await addEvent(timelineId, ownerId, newEvent);

        // Update local state
        const nextEvents = [...currentEvents, newEvent];
        currentEvents = nextEvents;
        setEvents(nextEvents);
        return newId;
      },
      onUpdateEvent: async (id, changes) => {
        // Update in Firestore events subcollection
        await updateEventFirestore(timelineId, ownerId, id, changes);

        // Update local state
        const nextEvents = currentEvents.map(ev => ev.id === id ? { ...ev, ...changes } : ev);
        currentEvents = nextEvents;
        setEvents(nextEvents);
      },
      onDeleteEvent: async (id) => {
        // Delete from Firestore events subcollection
        await deleteEventFirestore(timelineId, ownerId, id);

        // Update local state
        const nextEvents = currentEvents.filter(ev => ev.id !== id);
        currentEvents = nextEvents;
        setEvents(nextEvents);
      },
      onUpdateTimeline: async (changes) => {
        if (currentTimeline && timelineId) {
          await updateTimeline(timelineId, changes);
          setCurrentTimeline(prev => prev ? { ...prev, ...changes } : null);
        }
      },
    });

    // Check for failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      throw new Error(`Failed to apply ${failures.length} action(s)`);
    }
  }, [currentTimeline, timelineId, isOwner]);

  // AI Session
  const aiSession = useAISession({
    context: aiContext,
    onApplyActions: handleApplyAIActions,
  });

  // Ref to access updateActionPayload in saveAuthoring (declared earlier)
  const updateActionPayloadRef = useRef(aiSession.updateActionPayload);
  useEffect(() => {
    updateActionPayloadRef.current = aiSession.updateActionPayload;
  }, [aiSession.updateActionPayload]);

  // Preview events from pending AI actions
  const previewEvents = useMemo((): Event[] => {
    return aiSession.pendingActions
      .filter((a): a is import('./types/ai').CreateEventAction =>
        a.type === 'CREATE_EVENT' && (a.status === 'pending' || a.status === 'approved')
      )
      .map(action => ({
        id: `preview-${action.id}`,
        title: action.payload.title,
        date: action.payload.date,
        description: action.payload.description,
        endDate: action.payload.endDate,
        time: action.payload.time,
        sources: action.payload.sources,
        isPreview: true,
      }));
  }, [aiSession.pendingActions]);

  // Combine real events with preview events
  const eventsWithPreviews = useMemo(() => {
    return [...events, ...previewEvents];
  }, [events, previewEvents]);

  // Selected event including preview events (for editor)
  const selectedWithPreviews = useMemo(
    () => eventsWithPreviews.find((e) => e.id === selectedId),
    [eventsWithPreviews, selectedId]
  );

  // Sync form fields when selecting a PREVIEW event
  // (regular events are handled by the earlier effect at line ~292)
  useEffect(() => {
    if (selectedId?.startsWith('preview-') && selectedWithPreviews) {
      setEditDate(selectedWithPreviews.date);
      setEditTime(selectedWithPreviews.time ?? '');
      setEditTitle(selectedWithPreviews.title);
      setEditDescription(selectedWithPreviews.description ?? '');
    }
  }, [selectedId, selectedWithPreviews]);

  // Handle preview action - zoom to and highlight the preview event
  const handlePreviewAction = useCallback((action: import('./types/ai').AIAction) => {
    if (action.type !== 'CREATE_EVENT') return;

    const date = action.payload.date as string;
    if (!date) return;

    // Select the preview event to highlight it
    const previewEventId = `preview-${action.id}`;
    setSelectedId(previewEventId);

    // Calculate normalized position for the date
    const allEvents = [...events, ...previewEvents];
    if (allEvents.length === 0) {
      // No events, just center on the preview date
      animateTo(0.4, 0.6);
      return;
    }

    const eventDate = new Date(date);
    const allDates = allEvents.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...allDates, eventDate.getTime());
    const maxDate = Math.max(...allDates, eventDate.getTime());
    const range = maxDate - minDate || 1;
    const normalizedPos = (eventDate.getTime() - minDate) / range;

    // Zoom to a window around the event
    const windowSize = 0.2;
    const start = Math.max(0, normalizedPos - windowSize / 2);
    const end = Math.min(1, start + windowSize);
    animateTo(start, end);
  }, [events, previewEvents, animateTo]);

  const sortedForList = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);
  const filteredForList = useMemo(() => {
    const q = outlineFilter.trim().toLowerCase();
    if (!q) return sortedForList;
    return sortedForList.filter((e) => (e.title || '').toLowerCase().includes(q) || e.date.includes(q));
  }, [sortedForList, outlineFilter]);

  // Navigation actions
  const openEvents = useCallback(() => {
    setOverlay(overlay === 'events' ? null : 'events');
    setActiveNavItem('events');
  }, [overlay]);

  const openCreate = useCallback(() => {
    setSelectedId(undefined);
    setEditDate('');
    setEditTitle('');
    setEditDescription('');
    setOverlay('editor');
    setActiveNavItem('create');
  }, []);

  // Event navigation functions
  const navigateToPreviousEvent = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.date + (a.time || '00:00')).getTime() - new Date(b.date + (b.time || '00:00')).getTime()
    );
    const currentIndex = sortedEvents.findIndex(e => e.id === selectedId);
    if (currentIndex > 0) {
      setSelectedId(sortedEvents[currentIndex - 1].id);
    }
  }, [events, selectedId]);

  const navigateToNextEvent = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.date + (a.time || '00:00')).getTime() - new Date(b.date + (b.time || '00:00')).getTime()
    );
    const currentIndex = sortedEvents.findIndex(e => e.id === selectedId);
    if (currentIndex >= 0 && currentIndex < sortedEvents.length - 1) {
      setSelectedId(sortedEvents[currentIndex + 1].id);
    }
  }, [events, selectedId]);

  const selectEvent = useCallback((eventId: string) => {
    setSelectedId(eventId);
  }, []);

  const createNewEvent = useCallback(() => {
    setSelectedId(undefined);
    setEditDate('');
    setEditTime('');
    setEditTitle('');
    setEditDescription('');
    // Keep the overlay open so user can create the new event
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    setActiveNavItem(null);
  }, []);

  // Import/Export overlay toggle
  const openImportExport = useCallback(() => {
    setOverlay(overlay === 'import-export' ? null : 'import-export');
    setActiveNavItem('import-export');
  }, [overlay]);

  // Stream View toggle
  const openStreamView = useCallback(() => {
    setStreamViewerOpen(true);
  }, []);

  // Handle Stream View event click - zoom to event on timeline
  const handleStreamEventClick = useCallback((event: Event) => {
    // Parse the event date and calculate normalized position
    const eventDate = new Date(event.date);
    const minDate = Math.min(...events.map(e => new Date(e.date).getTime()));
    const maxDate = Math.max(...events.map(e => new Date(e.date).getTime()));
    const range = maxDate - minDate || 1;
    const normalizedPos = (eventDate.getTime() - minDate) / range;

    // Zoom to a window around the event (20% of timeline centered on event)
    const windowSize = 0.2;
    const start = Math.max(0, normalizedPos - windowSize / 2);
    const end = Math.min(1, start + windowSize);
    animateTo(start, end);

    // Also select the event
    setSelectedId(event.id);
  }, [events, animateTo]);

  // Editor-specific navigation items (context section)
  // v0.5.6 - Simplified: Events toggle, Create (owner only), Lock indicator (read-only)
  const editorItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      {
        id: 'events',
        label: 'Events',
        icon: 'list',
        shortcut: 'Alt+E',
        onClick: openEvents,
        isActive: overlay === 'events',
      },
    ];

    // Only show Create button if not in read-only mode
    if (!isReadOnly) {
      items.push({
        id: 'create',
        label: 'Create',
        icon: <AddIcon fontSize="small" />,
        shortcut: 'Alt+C',
        onClick: openCreate,
        color: 'primary.main',
        'data-tour': 'add-event',
      });
    }

    // Show Lock indicator for read-only mode (non-clickable visual indicator)
    if (isReadOnly) {
      items.push({
        id: 'read-only',
        label: 'View Only',
        icon: 'lock',
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick: () => {}, // Indicator only - no action
        color: '#f97316', // Orange to indicate restriction
      });
    }

    // Stream View button - available in all modes
    items.push({
      id: 'stream-view',
      label: 'Stream View',
      icon: 'view_stream',
      shortcut: 'Alt+S',
      onClick: openStreamView,
      isActive: streamViewerOpen,
      'data-tour': 'stream-view',
    });

    // Import/Export button - available to any signed-in user
    if (firebaseUser) {
      items.push({
        id: 'import-export',
        label: 'Import/Export',
        icon: 'sync_alt',
        shortcut: 'Alt+I',
        onClick: openImportExport,
        isActive: overlay === 'import-export',
      });
    }

    return items;
  }, [overlay, openEvents, openCreate, isReadOnly, openStreamView, streamViewerOpen, openImportExport, firebaseUser, chatPanelOpen]);

  // Current user profile from Firestore (firebaseUser already declared above)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user profile from Firestore
  useEffect(() => {
    async function loadUser() {
      if (firebaseUser) {
        const userProfile = await getUser(firebaseUser.uid);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
    }
    loadUser();
  }, [firebaseUser]);

  // Help handler - starts the editor tour
  const handleHelpClick = useCallback(() => {
    startTour('editor-tour');
  }, [startTour]);

  // Share handler - copy timeline URL to clipboard
  const handleShareLink = useCallback(() => {
    if (!currentTimeline) return;
    // Get username from URL path (format: /:username/timeline/:id)
    const pathParts = window.location.pathname.split('/');
    const username = pathParts[1];
    const url = `${window.location.origin}/${username}/timeline/${currentTimeline.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch((error) => {
      console.error('Failed to copy link:', error);
      showToast('Failed to copy link', 'error');
    });
  }, [currentTimeline, showToast]);

  // Get context-aware navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id, editorItems, currentUser, handleHelpClick);

  // Command palette commands
  const commands: Command[] = useMemo(() => [
    {
      id: 'open-events',
      title: 'Open Events Panel',
      description: 'Browse and manage all events',
      icon: 'list',
      shortcut: 'Alt+E',
      category: 'navigation',
      action: openEvents,
      aliases: ['events', 'list', 'browse'],
    },
    {
      id: 'create-event',
      title: 'Create New Event',
      description: 'Add a new event to the timeline',
      icon: 'add_circle',
      shortcut: 'Alt+C',
      category: 'create',
      action: openCreate,
      aliases: ['new', 'add', 'create'],
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark themes',
      icon: 'palette',
      shortcut: 'Alt+T',
      category: 'theme',
      action: toggleTheme,
      aliases: ['theme', 'dark', 'light'],
    },
    {
      id: 'close-overlay',
      title: 'Close Panel',
      description: 'Close the currently open panel',
      icon: 'close',
      shortcut: 'Escape',
      category: 'navigation',
      action: closeOverlay,
      aliases: ['close', 'hide', 'dismiss'],
    },
  ], [openEvents, openCreate, toggleTheme, closeOverlay]);

  // Keyboard shortcuts
  useNavigationShortcuts({
    openEvents,
    openCreate,
    toggleTheme,
    closeOverlay,
    openAIChat: () => setChatPanelOpen(true),
  });

  useCommandPaletteShortcuts(() => setCommandPaletteOpen(true));

  // Update active nav item based on overlay
  useEffect(() => {
    switch (overlay) {
      case 'events':
        setActiveNavItem('events');
        break;
      case 'editor':
        setActiveNavItem('create');
        break;
      case 'import-export':
        setActiveNavItem('import-export');
        break;
      default:
        setActiveNavItem(null);
    }
  }, [overlay]);

  return (
    <>
      <EditorTour />
      <div className="min-h-screen transition-theme" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
        {/* Full-bleed canvas area - no header, maximum space */}
        <div className="relative h-screen">
        {/* Enhanced Navigation Rail - Always visible */}
        <aside className="absolute left-0 top-0 bottom-0 w-14 border-r z-30 flex flex-col items-center py-2" style={{ borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-surface-elevated)' }}>
          {/* PowerTimeline logo at top - clickable to go home */}
          <button
            onClick={() => navigate('/browse')}
            className="mb-4 p-1 text-center hover:opacity-80 transition-opacity cursor-pointer"
            title="Go to Home"
          >
            <TimelineIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />
          </button>

          {/* Read-only lock icon - shown in read-only mode */}
          {readOnly && (
            <Tooltip title="You are viewing in read-only mode. Sign in to edit your own timelines, or fork this timeline to make your own copy." placement="right">
              <div className="mb-4 p-2 text-gray-400">
                <span className="material-symbols-rounded text-xl">lock</span>
              </div>
            </Tooltip>
          )}

          {/* Context-Aware Navigation */}
          <NavigationRail
            sections={sections}
            activeItemId={activeNavItem || undefined}
          />

          {/* Bottom actions */}
          <div className="flex flex-col items-center gap-2 mt-auto">
            <button
              type="button"
              title={showInfoPanels ? 'Hide Info Panels' : 'Show Info Panels'}
              onClick={() => setShowInfoPanels(!showInfoPanels)}
              className={`material-symbols-rounded rounded-md p-2 transition-theme ${showInfoPanels ? 'bg-primary-50 text-primary-700' : ''}`}
              style={{ color: showInfoPanels ? undefined : 'var(--color-text-secondary)', backgroundColor: showInfoPanels ? undefined : 'transparent' }}
              onMouseEnter={(e) => !showInfoPanels && (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
              onMouseLeave={(e) => !showInfoPanels && (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-pressed={showInfoPanels}
              aria-label="Toggle info panels"
            >
              info
            </button>
            <ThemeToggleButton />
          </div>
        </aside>

        {/* Overlays next to the sidebar, never covering it */}
        {overlay && !loadError && (
          <div ref={overlayRef} className="absolute top-0 right-0 bottom-0 left-14 z-[80]" onClick={(e) => { if (e.target === e.currentTarget) setOverlay(null); }}>
            <div className="absolute top-0 right-0 bottom-0 left-14 z-10 pointer-events-none" aria-hidden="true" />
            {overlay === 'events' && (
              <ErrorBoundary>
                <Suspense fallback={<div className="fixed left-14 top-0 bottom-0 w-80 border-r flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>Loading...</div>}>
                  <OutlinePanel
                    filtered={filteredForList}
                    selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); setOverlay('editor'); }}
                    onCreate={() => { setSelectedId(undefined); setEditDate(''); setEditTime(''); setEditTitle(''); setEditDescription(''); setOverlay('editor'); }}
                    filter={outlineFilter}
                    setFilter={setOutlineFilter}
                    dragging={dragging}
                    onClose={() => setOverlay(null)}
                    onHover={(id) => setHoveredEventId(id)}
                    onHoverEnd={() => setHoveredEventId(undefined)}
                    onNavigateToEvent={(id) => {
                      const event = events.find(e => e.id === id);
                      if (event) {
                        handleStreamEventClick(event);
                        setOverlay(null);
                      }
                    }}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {overlay === 'editor' && (
              <ErrorBoundary>
                <Suspense fallback={<div className="fixed right-0 top-0 bottom-0 w-96 border-l flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>Loading...</div>}>
                  <AuthoringOverlay
                    selected={selectedWithPreviews}
                    isNewEvent={!selectedWithPreviews}
                    editDate={editDate}
                    editTime={editTime}
                    editTitle={editTitle}
                    editDescription={editDescription}
                    setEditDate={setEditDate}
                    setEditTime={setEditTime}
                    setEditTitle={setEditTitle}
                    setEditDescription={setEditDescription}
                    onSave={saveAuthoring}
                    onDelete={deleteSelected}
                    onClose={() => setOverlay(null)}
                    allEvents={events}
                    onNavigatePrev={navigateToPreviousEvent}
                    onNavigateNext={navigateToNextEvent}
                    onSelectEvent={selectEvent}
                    onCreateNew={createNewEvent}
                    isOwner={isOwner}
                    onViewOnCanvas={() => {
                      // Close editor and zoom to the selected event on canvas
                      if (selectedWithPreviews) {
                        handleStreamEventClick(selectedWithPreviews);
                      }
                      setOverlay(null);
                    }}
                    onOpenStreamView={() => {
                      // Close editor and open stream view
                      setOverlay(null);
                      setStreamViewerOpen(true);
                    }}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {overlay === 'import-export' && currentTimeline && (
              <ErrorBoundary>
                <Suspense fallback={<div className="fixed left-14 top-0 bottom-0 w-80 border-r flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>Loading...</div>}>
                  <ImportExportOverlay
                    timeline={currentTimeline}
                    events={events}
                    dragging={dragging}
                    onClose={() => setOverlay(null)}
                    onImport={(importedEvents) => {
                      setEvents(importedEvents);
                      saveEvents(importedEvents);
                    }}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        )}

        {/* Timeline minimap positioned fixed to ensure proper z-index layering above overlays */}
        {!loadError && events.length > 0 && (
          <div className={`fixed top-1 left-20 right-4 pointer-events-auto ${streamViewerOpen ? 'z-[1400]' : 'z-[90]'}`} data-tour="minimap">
            <Suspense fallback={<div className="h-8 bg-gray-200 rounded animate-pulse"></div>}>
              <TimelineMinimap
                events={events}
                viewStart={viewStart}
                viewEnd={viewEnd}
                onNavigate={setWindow}
                highlightedEventId={selectedId}
                hoveredEventId={hoveredEventId}
              />
            </Suspense>
          </div>
        )}

        {/* Main timeline area shifts right to avoid sidebar overlap */}
        <div className="absolute inset-0 ml-14">
          {loadError ? (
            <div className="w-full h-full flex items-center justify-center px-4">
              <ErrorState
                message="Failed to load timeline"
                description={loadError.message}
                onRetry={loadTimelineEvents}
              />
            </div>
          ) : (
            <div
              className="w-full h-full relative"
              onMouseDown={handleTimelineMouseDownWithSelection}
              style={{ cursor: timelineSelection?.isSelecting ? 'crosshair' : 'default' }}
            >
              <ErrorBoundary>
                <DeterministicLayoutComponent
                  events={eventsWithPreviews}
                  showInfoPanels={showInfoPanels}
                  viewStart={viewStart}
                  viewEnd={viewEnd}
                  hoveredEventId={hoveredEventId}
                  onCardDoubleClick={(id) => {
                    // Allow ALL users to open overlay - AuthoringOverlay handles view vs edit mode
                    // Set selection first, then delay overlay opening to allow React to recompute
                    // selectedWithPreviews before the overlay renders
                    setSelectedId(id);
                    // Use setTimeout(0) to ensure state update and useMemo recomputation complete
                    setTimeout(() => setOverlay('editor'), 0);
                  }}
                  onCardMouseEnter={(id) => setHoveredEventId(id)}
                  onCardMouseLeave={() => setHoveredEventId(undefined)}
                  selectedEventId={selectedId}
                  onEventSelect={setSelectedId}
                />
              </ErrorBoundary>

              {/* Timeline selection overlay */}
              {timelineSelection?.isSelecting && (
                <div
                  className="absolute pointer-events-none z-30 transition-all duration-75 ease-out"
                  style={{
                    left: Math.min(timelineSelection.startX, timelineSelection.currentX),
                    top: 0,
                    width: Math.abs(timelineSelection.currentX - timelineSelection.startX),
                    height: '100%',
                    background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    border: '2px solid rgb(59, 130, 246)',
                    borderRadius: '4px',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                  }}
                >
                  {/* Left edge indicator */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-lg"
                    style={{ marginLeft: '-1px' }}
                  />
                  {/* Right edge indicator */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 shadow-lg"
                    style={{ marginRight: '-1px' }}
                  />
                  {/* Selection info overlay */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg font-mono">
                    Select to Zoom
                  </div>
                </div>
              )}

              {/* Share button and user profile - top-right corner */}
              {currentTimeline && (
                <div
                  className="absolute top-20 right-4 z-20 flex flex-col items-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {/* Share Button - fixed size circular */}
                  <Tooltip title="Copy link to share" placement="left">
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); handleShareLink(); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      size="small"
                      sx={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border-primary)',
                        backdropFilter: 'blur(8px)',
                        width: '36px',
                        height: '36px',
                        padding: '8px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: 'var(--color-surface-hover)',
                        },
                      }}
                    >
                      <span className="material-symbols-rounded">share</span>
                    </IconButton>
                  </Tooltip>

                  {/* User Profile Button - only when logged in */}
                  {firebaseUser && (
                    <UserProfileMenu
                      onLogout={async () => {
                        await signOut();
                        navigate('/');
                      }}
                    />
                  )}
                </div>
              )}

              {/* Icon-based control bar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-200 opacity-20 hover:opacity-95" data-tour="zoom-controls">
                <div className="backdrop-blur-sm border rounded-xl shadow-xl px-3 py-2 flex gap-1 items-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)', opacity: 0.95 }}>
                  <Tooltip title="Pan left" placement="top"><IconButton size="small" color="default" onClick={() => nudge(-0.1)}><span className="material-symbols-rounded">chevron_left</span></IconButton></Tooltip>
                  <Tooltip title="Pan right" placement="top"><IconButton size="small" color="default" onClick={() => nudge(0.1)}><span className="material-symbols-rounded">chevron_right</span></IconButton></Tooltip>
                  <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border-primary)' }}></div>
                  <Tooltip title="Zoom in" placement="top"><IconButton size="small" color="primary" onClick={() => zoom(0.8)}><AddIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Zoom out" placement="top"><IconButton size="small" color="default" onClick={() => zoom(1.25)}><RemoveIcon fontSize="small" /></IconButton></Tooltip>
                  <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border-primary)' }}></div>
                  <Tooltip title="Fit all" placement="top"><IconButton size="small" color="info" onClick={() => { animateTo(0, 1); }}><FitScreenIcon fontSize="small" /></IconButton></Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Command Palette */}
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            commands={commands}
            placeholder="Search commands... (Ctrl+K)"
          />
        </Suspense>

        {/* Stream Viewer Overlay (v0.5.26) - mobile-friendly timeline view */}
        <Suspense fallback={null}>
          <StreamViewerOverlay
            open={streamViewerOpen}
            onClose={() => setStreamViewerOpen(false)}
            events={events}
            timelineTitle=""
            onEventClick={handleStreamEventClick}
            isOwner={isOwner}
            onEventSave={handleEventSave}
            onEventDelete={handleEventDelete}
            onEditInEditor={(event) => {
              setSelectedId(event.id);
              setOverlay('editor');
            }}
            initialEventId={selectedId}
          />
        </Suspense>

        {/* AI Chat Widget (v0.7.0) - Floating bottom-right, only for timeline owners */}
        {firebaseUser && isOwner && (
          <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-3">
            {/* Chat popup - appears above the button when open */}
            {chatPanelOpen && (
              <Suspense fallback={null}>
                <div
                  className="w-80 h-[500px] max-h-[70vh] rounded-xl shadow-2xl overflow-hidden border"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border-primary)'
                  }}
                >
                  <ChatPanel
                    apiKey={aiSession.apiKey}
                    isKeyValid={aiSession.isKeyValid}
                    messages={aiSession.messages}
                    isLoading={aiSession.isLoading}
                    error={aiSession.error}
                    usage={aiSession.usage}
                    pendingActions={aiSession.pendingActions}
                    onSetApiKey={aiSession.setApiKey}
                    onClearApiKey={aiSession.clearApiKey}
                    onSendMessage={aiSession.sendMessage}
                    onClearHistory={aiSession.clearHistory}
                    onApproveActions={aiSession.approveActions}
                    onRejectActions={aiSession.rejectActions}
                    onRestoreActions={aiSession.restoreActions}
                    onApplyActions={aiSession.applyActions}
                    onPreviewAction={handlePreviewAction}
                    onClose={() => setChatPanelOpen(false)}
                  />
                </div>
              </Suspense>
            )}

            {/* Floating action button */}
            <Tooltip title={chatPanelOpen ? "Close AI Assistant" : "AI Assistant"} placement="left">
              <IconButton
                onClick={() => setChatPanelOpen(prev => !prev)}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: chatPanelOpen ? 'var(--color-surface-elevated)' : '#8b5cf6',
                  color: chatPanelOpen ? 'var(--color-text-primary)' : 'white',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                  '&:hover': {
                    bgcolor: chatPanelOpen ? 'var(--color-surface-hover)' : '#7c3aed',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 28 }}>
                  {chatPanelOpen ? 'close' : 'smart_toy'}
                </span>
              </IconButton>
            </Tooltip>
          </div>
        )}

        {/* Live region for announcements */}
        {renderLiveRegion()}
        </div>
      </div>
    </>
  );
}

// Wrapper component that provides TourProvider
function App(props: AppProps) {
  return (
    <TourProvider>
      <AppContent {...props} />
    </TourProvider>
  );
}

export default App;




