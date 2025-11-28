import { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeterministicLayoutComponent } from './layout/DeterministicLayoutComponent';
import { NavigationRail, ThemeToggleButton } from './components/NavigationRail';
import { useNavigationShortcuts, useCommandPaletteShortcuts } from './hooks/useKeyboardShortcuts';
import { useNavigationConfig, type NavigationItem } from './app/hooks/useNavigationConfig';
import { useAuth } from './contexts/AuthContext';
import { getTimeline, updateTimeline, getUser } from './services/firestore';
import type { User } from './types';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { useTheme } from './contexts/ThemeContext';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import type { Event } from './types';
import type { Command } from './components/CommandPalette';

// Lazy load panels, overlays and heavy components for better bundle splitting
const OutlinePanel = lazy(() => import('./app/panels/OutlinePanel').then(m => ({ default: m.OutlinePanel })));
const AuthoringOverlay = lazy(() => import('./app/overlays/AuthoringOverlay').then(m => ({ default: m.AuthoringOverlay })));
const DevPanel = lazy(() => import('./app/panels/DevPanel').then(m => ({ default: m.DevPanel })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const TimelineMinimap = lazy(() => import('./components/TimelineMinimap').then(m => ({ default: m.TimelineMinimap })));
import { EventStorage } from './lib/storage';
import {
  seedRandom as seedRandomUtil,
  seedClustered as seedClusteredUtil,
  seedLongRange as seedLongRangeUtil,
  seedRFKTimeline,
  seedJFKTimeline,
  seedNapoleonTimeline,
  seedDeGaulleTimeline,
  seedFrenchRevolutionTimeline,
  seedIncremental as seedIncrementalUtil,
  seedMinuteTest as seedMinuteTestUtil
} from './lib/devSeed';
import { useViewWindow } from './app/hooks/useViewWindow';
import { useAnnouncer } from './app/hooks/useAnnouncer';
import { useTimelineZoom } from './app/hooks/useTimelineZoom';
import { useTimelineSelection } from './app/hooks/useTimelineSelection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePerformanceMonitoring } from './app/hooks/usePerformanceMonitoring';

const DEV_FLAG_KEY = 'powertimeline-dev';

interface AppProps {
  timelineId?: string;  // Optional timeline ID to load from home page storage
  readOnly?: boolean;   // Read-only mode: hide authoring overlay, show lock icon on nav rail
}

function App({ timelineId, readOnly = false }: AppProps = {}) {
  usePerformanceMonitoring();
  const navigate = useNavigate();

  // Storage
  const storageRef = useRef(new EventStorage());

  // Helper function to save events to the correct location
  const saveEvents = useCallback(async (events: Event[]) => {
    console.log('[saveEvents] Called with', events.length, 'events, timelineId:', timelineId);
    if (timelineId) {
      // Save to timeline in Firestore
      console.log('[saveEvents] Saving to Firestore, timelineId:', timelineId);
      await updateTimeline(timelineId, { events });
      console.log('[saveEvents] Timeline updated successfully in Firestore');

      // Verify it was saved
      const timeline = await getTimeline(timelineId);
      console.log('[saveEvents] Verification - timeline now has', timeline?.events.length, 'events');
    } else {
      // Save to legacy EventStorage
      console.log('[saveEvents] Saving to legacy EventStorage');
      storageRef.current.writeThrough(events);
    }
  }, [timelineId]);

  const [events, setEvents] = useState<Event[]>(() => {
    console.log('[App] Initializing with timelineId:', timelineId);
    // If timelineId is provided, we'll load from Firestore in useEffect (can't be async here)
    if (timelineId) {
      console.log('[App] Timeline ID provided, will load from Firestore in useEffect');
      return [];
    }

    // Otherwise, load from legacy EventStorage
    console.log('[App] No timelineId, loading from legacy EventStorage');
    const stored = storageRef.current.load();
    if (stored.length > 0) {
      return stored;
    }

    console.log('[App] No stored events, loading default RFK seed');
    const defaultSeed = seedRFKTimeline();
    storageRef.current.writeThrough(defaultSeed);
    return defaultSeed;
  });
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [hoveredEventId, setHoveredEventId] = useState<string | undefined>(undefined);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Use readOnly prop from EditorPage (which determines ownership via Firebase Auth)
  const isReadOnly = readOnly;

  // Reload events when timelineId changes
  useEffect(() => {
    async function loadTimelineEvents() {
      if (timelineId) {
        const timeline = await getTimeline(timelineId);
        if (timeline) {
          console.log('Loading timeline:', timeline.title, 'with', timeline.events.length, 'events');
          setEvents(timeline.events);
          return;
        }
      }

      // If no timelineId or timeline not found, load from EventStorage
      const stored = storageRef.current.load();
      if (stored.length > 0) {
        setEvents(stored);
      }
    }

    loadTimelineEvents();
  }, [timelineId]);

  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const selected = useMemo(
    () => events.find((e) => e.id === selectedId),
    [events, selectedId]
  );
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

  // Panels & Dev toggle
  // Left sidebar overlays (permanent sidebar width = 56px)
  const [overlay, setOverlay] = useState<null | 'events' | 'editor' | 'dev'>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [outlineFilter, setOutlineFilter] = useState('');

  // Info panels toggle
  const [showInfoPanels, setShowInfoPanels] = useState(false);

  // Dragging state (for disabling overlay pointer events)
  const [dragging] = useState(false);
  // Dev options (removed unused placeholder and force card mode for Stage 1)

  // Announcer hook
  const { announce, renderLiveRegion } = useAnnouncer();

  // Navigation and theme hooks
  const { toggleTheme } = useTheme();

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
  const saveAuthoring = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('[saveAuthoring] Called');
    console.log('[saveAuthoring] editDate:', editDate, 'editTitle:', editTitle);
    const isEdit = !!selectedId;
    console.log('[saveAuthoring] isEdit:', isEdit, 'selectedId:', selectedId);
    if (isEdit) {
      console.log('[saveAuthoring] Editing existing event');
      setEvents(prev => { const next = prev.map(ev => ev.id === selectedId ? { ...ev, date: editDate || ev.date, time: editTime || undefined, title: editTitle || ev.title, description: editDescription || undefined } : ev); saveEvents(next); return next; });
      try {
        announce(`Saved changes to ${editTitle || 'event'}`);
      } catch (error) {
        console.warn('Failed to announce save:', error);
      }
    } else {
      if (!editDate || !editTitle) {
        console.log('[saveAuthoring] Missing required fields - date or title');
        return;
      }
      console.log('[saveAuthoring] Creating new event');
      const newEvent: Event = { id: Date.now().toString(), date: editDate, time: editTime || undefined, title: editTitle, description: editDescription || undefined };
      console.log('[saveAuthoring] New event:', newEvent);
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


  // Dev helpers using utilities
  const seedRandom = useCallback((count: number) => {
    setEvents(prev => { const next = seedRandomUtil(prev, count); saveEvents(next); return next; });
  }, [saveEvents]);
  const seedClustered = useCallback(() => {
    setEvents(prev => { const next = seedClusteredUtil(prev); saveEvents(next); return next; });
  }, [saveEvents]);
  const seedLongRange = useCallback(() => {
    setEvents(prev => { const next = seedLongRangeUtil(prev); saveEvents(next); return next; });
  }, [saveEvents]);
  const seedRFK = useCallback(() => {
    const data = seedRFKTimeline();
    setEvents(data);
    saveEvents(data);
    setSelectedId(undefined);
  }, [saveEvents]);
  const seedJFK = useCallback(() => {
    const data = seedJFKTimeline();
    setEvents(data);
    saveEvents(data);
    setSelectedId(undefined);
  }, [saveEvents]);
  const seedNapoleon = useCallback(() => {
    const data = seedNapoleonTimeline();
    setEvents(data);
    saveEvents(data);
    setSelectedId(undefined);
  }, [saveEvents]);

  const seedDeGaulle = useCallback(() => {
    const data = seedDeGaulleTimeline();
    setEvents(data);
    saveEvents(data);
    setSelectedId(undefined);
  }, [saveEvents]);

  const seedFrenchRevolution = useCallback(() => {
    const data = seedFrenchRevolutionTimeline();
    setEvents(data);
    saveEvents(data);
    setSelectedId(undefined);
  }, [saveEvents]);

  const seedMinuteTest = useCallback(() => {
    const data = seedMinuteTestUtil();
    setEvents(data);
    saveEvents(data);
    setSelectedId(undefined);
  }, [saveEvents]);

  const seedIncremental = useCallback((targetCount: number) => {
    setEvents(prev => {
      const next = seedIncrementalUtil(prev, targetCount);
      saveEvents(next);
      return next;
    });
  }, [saveEvents]);
  
  const clearAll = useCallback(() => { setEvents([]); }, []);

  // Removed unused exportEvents function

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

  const openDev = useCallback(() => {
    setOverlay(overlay === 'dev' ? null : 'dev');
    setActiveNavItem('dev');
  }, [overlay]);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    setActiveNavItem(null);
  }, []);

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

    return items;
  }, [overlay, openEvents, openCreate, isReadOnly]);

  // Get current user for navigation context
  const { user: firebaseUser } = useAuth();
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

  // Get context-aware navigation configuration
  const { sections } = useNavigationConfig(currentUser?.id, editorItems, currentUser);

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
      id: 'dev-panel',
      title: 'Open Developer Panel',
      description: 'Access developer tools and options',
      icon: 'code',
      shortcut: 'Alt+D',
      category: 'dev',
      action: openDev,
      aliases: ['dev', 'debug', 'tools'],
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
  ], [openEvents, openCreate, openDev, toggleTheme, closeOverlay]);

  // Keyboard shortcuts
  useNavigationShortcuts({
    openEvents,
    openCreate,
    openDev,
    toggleTheme,
    closeOverlay,
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
      case 'dev':
        setActiveNavItem('dev');
        break;
      default:
        setActiveNavItem(null);
    }
  }, [overlay]);

  return (
    <div className="min-h-screen bg-background text-primary transition-theme">
      {/* Full-bleed canvas area - no header, maximum space */}
      <div className="relative h-screen">
        {/* Enhanced Navigation Rail - Always visible */}
        <aside className="absolute left-0 top-0 bottom-0 w-14 border-r border-gray-200 bg-white z-30 flex flex-col items-center py-2">
          {/* PowerTimeline logo at top - clickable to go home */}
          <button
            onClick={() => navigate('/browse')}
            className="mb-4 p-1 text-center hover:opacity-80 transition-opacity cursor-pointer"
            title="Go to Home"
          >
            <img
              src="/assets/images/logo.png"
              alt="PowerTimeline - Go to Home"
              className="w-10 h-10 object-contain"
            />
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
              className={`material-symbols-rounded rounded-md p-2 transition-theme ${showInfoPanels ? 'bg-primary-50 text-primary-700' : 'text-secondary hover:bg-surface-elevated'}`}
              aria-pressed={showInfoPanels}
              aria-label="Toggle info panels"
            >
              info
            </button>
            <ThemeToggleButton />
          </div>
        </aside>

        {/* Overlays next to the sidebar, never covering it */}
        {overlay && (
          <div ref={overlayRef} className="absolute top-0 right-0 bottom-0 left-14 z-[80]">
            <div className="absolute top-0 right-0 bottom-0 left-14 z-10 pointer-events-none" aria-hidden="true" />
            {overlay === 'events' && (
              <ErrorBoundary>
                <Suspense fallback={<div className="fixed left-14 top-0 bottom-0 w-80 bg-white border-r border-gray-200 flex items-center justify-center">Loading...</div>}>
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
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {overlay === 'editor' && !readOnly && (
              <ErrorBoundary>
                <Suspense fallback={<div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 flex items-center justify-center">Loading...</div>}>
                  <AuthoringOverlay
                    selected={selected}
                    isNewEvent={!selected}
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
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {overlay === 'dev' && (
              <ErrorBoundary>
                <Suspense fallback={<div className="fixed left-14 top-0 bottom-0 w-80 bg-white border-r border-gray-200 flex items-center justify-center">Loading...</div>}>
                  <DevPanel
                    seedRandom={seedRandom}
                    seedClustered={seedClustered}
                    seedLongRange={seedLongRange}
                    clearAll={clearAll}
                    onClose={() => setOverlay(null)}
                    seedRFK={seedRFK}
                    seedJFK={seedJFK}
                    seedNapoleon={seedNapoleon}
                    seedDeGaulle={seedDeGaulle}
                    seedFrenchRevolution={seedFrenchRevolution}
                    seedIncremental={seedIncremental}
                    seedMinuteTest={seedMinuteTest}
                    events={events}
                    onImportEvents={(importedEvents) => {
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
        {events.length > 0 && (
          <div className="fixed top-1 left-20 right-4 z-[90] pointer-events-auto">
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
          {/* Timeline takes full available space */}
          <div
            className="w-full h-full relative"
            onMouseDown={handleTimelineMouseDownWithSelection}
            style={{ cursor: timelineSelection?.isSelecting ? 'crosshair' : 'default' }}
          >
            <ErrorBoundary>
              <DeterministicLayoutComponent
                events={events}
                showInfoPanels={showInfoPanels}
                viewStart={viewStart}
                viewEnd={viewEnd}
                hoveredEventId={hoveredEventId}
                onCardDoubleClick={isReadOnly ? undefined : (id) => { setSelectedId(id); setOverlay('editor'); }}
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

              {/* Icon-based control bar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-200 opacity-20 hover:opacity-95">
                <div className="bg-white/95 backdrop-blur-sm border border-gray-300 rounded-xl shadow-xl px-3 py-2 flex gap-1 items-center">
                  <Tooltip title="Pan left" placement="top"><IconButton size="small" color="default" onClick={() => nudge(-0.1)}><span className="material-symbols-rounded">chevron_left</span></IconButton></Tooltip>
                  <Tooltip title="Pan right" placement="top"><IconButton size="small" color="default" onClick={() => nudge(0.1)}><span className="material-symbols-rounded">chevron_right</span></IconButton></Tooltip>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <Tooltip title="Zoom in" placement="top"><IconButton size="small" color="primary" onClick={() => zoom(0.8)}><AddIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Zoom out" placement="top"><IconButton size="small" color="default" onClick={() => zoom(1.25)}><RemoveIcon fontSize="small" /></IconButton></Tooltip>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <Tooltip title="Fit all" placement="top"><IconButton size="small" color="info" onClick={() => { animateTo(0, 1); }}><FitScreenIcon fontSize="small" /></IconButton></Tooltip>
                </div>
              </div>
          </div>
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

        {/* Live region for announcements */}
        {renderLiveRegion()}
      </div>
    </div>
  );
}


export default App;




