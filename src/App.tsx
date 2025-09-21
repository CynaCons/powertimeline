import { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { DeterministicLayoutComponent } from './layout/DeterministicLayoutComponent';
import { NavigationRail, ThemeToggleButton } from './components/NavigationRail';
import { useNavigationShortcuts, useCommandPaletteShortcuts } from './hooks/useKeyboardShortcuts';
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
// DevPanel temporarily replaced with inline implementation
// const DevPanel = lazy(() => import('./app/panels/DevPanel'));
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
  seedIncremental as seedIncrementalUtil,
  seedMinuteTest as seedMinuteTestUtil
} from './lib/devSeed';
import { useViewWindow } from './app/hooks/useViewWindow';
import { useAnnouncer } from './app/hooks/useAnnouncer';

const DEV_FLAG_KEY = 'chronochart-dev';


function App() {
  // Storage
  const storageRef = useRef(new EventStorage());
  const [events, setEvents] = useState<Event[]>(() => storageRef.current.load());
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [hoveredEventId, setHoveredEventId] = useState<string | undefined>(undefined);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Timeline selection drag state
  const [timelineSelection, setTimelineSelection] = useState<{
    isSelecting: boolean;
    startX: number;
    currentX: number;
    containerLeft: number;
    containerWidth: number;
  } | null>(null);
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

  // Panels & Dev toggle
  const devEnabled = true;
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
  useEffect(() => {
    if (selected) {
      setEditDate(selected.date);
      setEditTime(selected.time ?? '');
      setEditTitle(selected.title);
      setEditDescription(selected.description ?? '');
    } else {
      setEditDate(''); setEditTime(''); setEditTitle(''); setEditDescription('');
    }
  }, [selectedId, selected]);

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

  // Mouse wheel zoom with cursor positioning (no Ctrl key required)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Skip if user is scrolling in input fields or panels
      const target = e.target as Element;
      if (target?.closest('input, textarea, select, .panel, .overlay, .dev-panel')) {
        return; // Allow normal scrolling in UI elements
      }
      
      e.preventDefault();
      
      // Get cursor position
      const cursorX = e.clientX;
      
      const container = document.querySelector('.absolute.inset-0.ml-14 > .w-full.h-full.relative') as HTMLElement | null;
      const rect = container?.getBoundingClientRect();
      
      // Determine zoom direction
      const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;

      // Check if we should use hover-centered zoom
      if (hoveredEventId) {
        // Find the hovered card element and use its screen position for zoom
        const cardElement = document.querySelector(`[data-event-id="${hoveredEventId}"]`) as HTMLElement;
        if (cardElement) {
          const cardRect = cardElement.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;

          // Use the card's visual position for zoom (keep it stable under cursor)
          if (rect) {
            zoomAtCursor(zoomFactor, cardCenterX, rect.width, rect.left, rect.width);
            return;
          } else {
            zoomAtCursor(zoomFactor, cardCenterX, window.innerWidth);
            return;
          }
        }
      }

      // Fall back to cursor-centered zoom
      if (rect) {
        zoomAtCursor(zoomFactor, cursorX, rect.width, rect.left, rect.width);
      } else {
        zoomAtCursor(zoomFactor, cursorX, window.innerWidth);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [zoomAtCursor, hoveredEventId]);

  // Timeline selection drag handlers
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on the timeline area, not on cards or other elements
    const target = e.target as Element;
    if (target?.closest('[data-testid="event-card"]') || target?.closest('.panel') || target?.closest('.overlay')) {
      return; // Don't start selection if clicking on cards or UI elements
    }

    const container = document.querySelector('.absolute.inset-0.ml-14 > .w-full.h-full.relative') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left;

    setTimelineSelection({
      isSelecting: true,
      startX,
      currentX: startX,
      containerLeft: rect.left,
      containerWidth: rect.width
    });

    e.preventDefault();
  }, []);

  const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
    if (!timelineSelection?.isSelecting) return;

    const currentX = e.clientX - timelineSelection.containerLeft;
    setTimelineSelection(prev => prev ? {
      ...prev,
      currentX: Math.max(0, Math.min(timelineSelection.containerWidth, currentX))
    } : null);
  }, [timelineSelection]);

  const handleTimelineMouseUp = useCallback(() => {
    if (!timelineSelection?.isSelecting) return;

    const { startX, currentX, containerWidth } = timelineSelection;

    // Calculate timeline positions (0-1) for the selection
    const leftMargin = 96; // rail + padding
    const rightMargin = 40;
    const usableWidth = containerWidth - leftMargin - rightMargin;

    const minX = Math.min(startX, currentX);
    const maxX = Math.max(startX, currentX);

    // Convert screen coordinates to timeline positions
    const startPos = Math.max(0, Math.min(1, (minX - leftMargin) / usableWidth));
    const endPos = Math.max(0, Math.min(1, (maxX - leftMargin) / usableWidth));

    // Convert view positions to actual timeline positions
    const currentWindowWidth = viewEnd - viewStart;
    const selectionStart = viewStart + (startPos * currentWindowWidth);
    const selectionEnd = viewStart + (endPos * currentWindowWidth);

    // Only zoom if selection is meaningful (at least 20px wide)
    if (Math.abs(maxX - minX) > 20) {
      setWindow(
        Math.max(0, Math.min(1, selectionStart)),
        Math.max(0, Math.min(1, selectionEnd))
      );
    }

    setTimelineSelection(null);
  }, [timelineSelection, viewStart, viewEnd, setWindow]);

  // Add global mouse listeners for drag
  useEffect(() => {
    if (!timelineSelection?.isSelecting) return;

    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
    };
  }, [handleTimelineMouseMove, handleTimelineMouseUp, timelineSelection?.isSelecting]);

  // CRUD handlers
  const saveAuthoring = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedId;
    if (isEdit) {
      setEvents(prev => { const next = prev.map(ev => ev.id === selectedId ? { ...ev, date: editDate || ev.date, time: editTime || undefined, title: editTitle || ev.title, description: editDescription || undefined } : ev); storageRef.current.writeThrough(next); return next; });
      try {
        announce(`Saved changes to ${editTitle || 'event'}`);
      } catch (error) {
        console.warn('Failed to announce save:', error);
      }
    } else {
      if (!editDate || !editTitle) return;
      const newEvent: Event = { id: Date.now().toString(), date: editDate, time: editTime || undefined, title: editTitle, description: editDescription || undefined };
      setEvents(prev => { const next = [...prev, newEvent]; storageRef.current.writeThrough(next); return next; });
      setSelectedId(newEvent.id);
      try {
        announce(`Added event ${editTitle}`);
      } catch (error) {
        console.warn('Failed to announce add:', error);
      }
    }
    setOverlay(null);
  }, [selectedId, editDate, editTime, editTitle, editDescription, announce]);

  // saveAuthoring handles both edit and create flows

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const toDelete = events.find(e => e.id === selectedId);
    setEvents(prev => { const next = prev.filter(ev => ev.id !== selectedId); storageRef.current.writeThrough(next); return next; });
    setSelectedId(undefined);
    try {
      announce(`Deleted ${toDelete?.title || 'event'}`);
    } catch (error) {
      console.warn('Failed to announce delete:', error);
    }
  }, [selectedId, events, announce]);

  // const onDragDate = useCallback((id: string, newISODate: string) => {
  //   // write-through during drag
  //   setEvents(prev => {
  //     const next = prev.map(ev => ev.id === id ? { ...ev, date: newISODate } : ev);
  //     storageRef.current.writeThrough(next);
  //     return next;
  //   });
  // }, []);

  // Dev helpers using utilities
  const seedRandom = useCallback((count: number) => {
    setEvents(prev => { const next = seedRandomUtil(prev, count); storageRef.current.writeThrough(next); return next; });
  }, []);
  const seedClustered = useCallback(() => {
    setEvents(prev => { const next = seedClusteredUtil(prev); storageRef.current.writeThrough(next); return next; });
  }, []);
  const seedLongRange = useCallback(() => {
    setEvents(prev => { const next = seedLongRangeUtil(prev); storageRef.current.writeThrough(next); return next; });
  }, []);
  const seedRFK = useCallback(() => {
    const data = seedRFKTimeline();
    setEvents(data);
    storageRef.current.writeThrough(data);
    setSelectedId(undefined);
  }, []);
  const seedJFK = useCallback(() => {
    const data = seedJFKTimeline();
    setEvents(data);
    storageRef.current.writeThrough(data);
    setSelectedId(undefined);
  }, []);
  const seedNapoleon = useCallback(() => {
    const data = seedNapoleonTimeline();
    setEvents(data);
    storageRef.current.writeThrough(data);
    setSelectedId(undefined);
  }, []);

  const seedDeGaulle = useCallback(() => {
    const data = seedDeGaulleTimeline();
    setEvents(data);
    storageRef.current.writeThrough(data);
    setSelectedId(undefined);
  }, []);

  const seedMinuteTest = useCallback(() => {
    const data = seedMinuteTestUtil();
    setEvents(data);
    storageRef.current.writeThrough(data);
    setSelectedId(undefined);
  }, []);

  const seedIncremental = useCallback((targetCount: number) => {
    setEvents(prev => {
      const next = seedIncrementalUtil(prev, targetCount);
      storageRef.current.writeThrough(next);
      return next;
    });
  }, []);
  
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

  const openDev = useCallback(() => {
    setOverlay(overlay === 'dev' ? null : 'dev');
    setActiveNavItem('dev');
  }, [overlay]);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    setActiveNavItem(null);
  }, []);

  // Navigation rail items
  const navigationItems = useMemo(() => [
    {
      id: 'events',
      label: 'Events',
      icon: 'list',
      shortcut: 'Alt+E',
      onClick: openEvents,
      isActive: overlay === 'events',
    },
    {
      id: 'create',
      label: 'Create',
      icon: <AddIcon fontSize="small" />,
      shortcut: 'Alt+C',
      onClick: openCreate,
      color: 'primary.main',
    },
  ], [overlay, openEvents, openCreate]);

  const utilityItems = useMemo(() => [
    {
      id: 'dev',
      label: 'Developer Panel',
      icon: 'settings',
      shortcut: 'Alt+D',
      onClick: openDev,
      isActive: overlay === 'dev',
    },
  ], [overlay, openDev]);

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
        {/* Enhanced Navigation Rail */}
        <aside className="absolute left-0 top-0 bottom-0 w-14 border-r border-gray-200 bg-white z-30 flex flex-col items-center py-2">
          {/* ChronoChart logo at top */}
          <div className="mb-4 p-2 text-xs font-bold tracking-wide text-gray-800 text-center leading-tight">
            <div>CC</div>
          </div>

          {/* Main Navigation */}
          <NavigationRail
            items={navigationItems}
            activeItemId={activeNavItem || undefined}
          />

          {/* Visual separator */}
          <div className="nav-group-separator my-4"></div>

          {/* Utility Navigation */}
          <NavigationRail
            items={utilityItems}
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
                />
              </Suspense>
            )}
            {overlay === 'editor' && (
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
                />
              </Suspense>
            )}
            {overlay === 'dev' && devEnabled && (
              <div className="fixed left-14 top-0 bottom-0 w-80 bg-white border-r border-gray-200 z-20">
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-4">Developer Panel</h2>
                  <p className="text-sm text-gray-600 mb-4">Events: {events.length}</p>

                  <div className="mb-4">
                    <h3 className="text-md font-semibold mb-2">Sample Data</h3>
                    <div className="space-y-1 mb-4">
                      <button onClick={seedRFK} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">RFK 1968</button>
                      <button onClick={seedJFK} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">JFK</button>
                      <button onClick={seedNapoleon} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">Napoleon</button>
                      <button onClick={seedDeGaulle} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">De Gaulle</button>
                      <button onClick={seedMinuteTest} className="block w-full text-left px-2 py-1 hover:bg-orange-100 text-orange-700 text-sm">⏰ Minute Test</button>
                      <button onClick={() => seedRandom(10)} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">Random (10)</button>
                      <button onClick={seedClustered} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">Clustered</button>
                      <button onClick={seedLongRange} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">Long Range</button>
                      <button onClick={() => seedIncremental(5)} className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm">Incremental (5)</button>
                      <button onClick={clearAll} className="block w-full text-left px-2 py-1 hover:bg-red-100 text-red-700 text-sm">Clear All</button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-md font-semibold mb-2">Timeline Export/Import</h3>
                    <div className="space-y-2">
                      <button
                        type="button"
                        className="rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 px-3 py-1"
                        disabled={events.length === 0}
                        title={events.length === 0 ? "No events to export" : `Export ${events.length} events to YAML file`}
                        onClick={() => {
                          try {
                            console.log('Export clicked - testing yamlSerializer...');
                            import('./utils/yamlSerializer').then(yaml => {
                              console.log('yamlSerializer loaded successfully:', yaml);
                              alert('YAML module loaded successfully! Export would work.');
                            }).catch(err => {
                              console.error('Failed to load yamlSerializer:', err);
                              alert('Failed to load YAML module: ' + err.message);
                            });
                          } catch (err) {
                            console.error('Error testing yamlSerializer:', err);
                            alert('Error testing YAML module: ' + (err as Error).message);
                          }
                        }}
                      >
                        📤 Export YAML ({events.length})
                      </button>
                      <button
                        type="button"
                        className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1"
                        title="Import timeline from YAML file"
                        onClick={() => alert('Import functionality would go here')}
                      >
                        📁 Import YAML
                      </button>
                    </div>

                    <div className="text-gray-500 text-xs">
                      YAML format allows sharing timelines between users and applications
                    </div>
                  </div>

                  <button
                    onClick={() => setOverlay(null)}
                    className="mt-4 px-3 py-1 bg-gray-500 text-white rounded text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main timeline area shifts right to avoid sidebar overlap */}
        <div className="absolute inset-0 ml-14">
          {/* Timeline minimap at top of timeline area */}
          {events.length > 0 && (
            <div className="absolute top-1 left-4 right-4 z-40">
              <Suspense fallback={<div className="h-8 bg-gray-200 rounded animate-pulse"></div>}>
                <TimelineMinimap
                  events={events}
                  viewStart={viewStart}
                  viewEnd={viewEnd}
                  onNavigate={setWindow}
                />
              </Suspense>
            </div>
          )}
          
          {/* Timeline takes full available space */}
          <div
            className="w-full h-full relative"
            onMouseDown={handleTimelineMouseDown}
            style={{ cursor: timelineSelection?.isSelecting ? 'crosshair' : 'default' }}
          >
            <DeterministicLayoutComponent
              events={events}
              showInfoPanels={showInfoPanels}
              viewStart={viewStart}
              viewEnd={viewEnd}
              hoveredEventId={hoveredEventId}
              onCardDoubleClick={(id) => { setSelectedId(id); setOverlay('editor'); }}
              onCardMouseEnter={(id) => setHoveredEventId(id)}
              onCardMouseLeave={() => setHoveredEventId(undefined)}
            />

            {/* Timeline selection overlay */}
            {timelineSelection?.isSelecting && (
              <div
                className="absolute pointer-events-none z-30"
                style={{
                  left: Math.min(timelineSelection.startX, timelineSelection.currentX),
                  top: 0,
                  width: Math.abs(timelineSelection.currentX - timelineSelection.startX),
                  height: '100%',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgb(59, 130, 246)',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                }}
              />
            )}
              {renderLiveRegion()}
              
              {/* Bottom centered control bar overlay - highly transparent by default */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-200 opacity-20 hover:opacity-95 hidden">
                <div className="bg-white/95 backdrop-blur-sm border border-gray-300 rounded-xl shadow-xl px-3 py-2 flex gap-1 items-center">
                  <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-3 py-1.5 text-xs font-medium" onClick={() => nudge(-0.1)}>◀︎ Pan</button>
                  <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-3 py-1.5 text-xs font-medium" onClick={() => nudge(0.1)}>Pan ▶︎</button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button className="rounded bg-indigo-600 text-white hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium" onClick={() => zoom(0.8)}>＋ Zoom In</button>
                  <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-3 py-1.5 text-xs font-medium" onClick={() => zoom(1.25)}>－ Zoom Out</button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button className="rounded bg-sky-600 text-white hover:bg-sky-500 px-3 py-1.5 text-xs font-medium" onClick={() => { animateTo(0, 1); }}>Fit All</button>
                </div>
              </div>
              {/* New icon-based control bar */}
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




