import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { DeterministicLayoutComponent } from './layout/DeterministicLayoutComponent';
import type { Event } from './types';
import { OutlinePanel } from './app/panels/OutlinePanel';
import { EditorPanel } from './app/panels/EditorPanel';
import { CreatePanel } from './app/panels/CreatePanel';
import { DevPanel } from './app/panels/DevPanel';
import { EventStorage } from './lib/storage';
import { 
  seedRandom as seedRandomUtil, 
  seedClustered as seedClusteredUtil, 
  seedLongRange as seedLongRangeUtil, 
  seedRFKTimeline, 
  seedJFKTimeline, 
  seedNapoleonTimeline, 
  seedIncremental as seedIncrementalUtil
} from './lib/devSeed';
import { useViewWindow } from './app/hooks/useViewWindow';
import { useAnnouncer } from './app/hooks/useAnnouncer';

const DEV_FLAG_KEY = 'chronochart-dev';

function App() {
  // Storage
  const storageRef = useRef(new EventStorage());
  const [events, setEvents] = useState<Event[]>(() => storageRef.current.load());
  // Reuse these as the Create panel draft fields
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selected = useMemo(
    () => events.find((e) => e.id === selectedId),
    [events, selectedId]
  );
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // View window controls via hook
  const { viewStart, viewEnd, setWindow, nudge, zoom, animateTo } = useViewWindow(0,1);

  // Panels & Dev toggle
  const devParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';
  const [devEnabled, setDevEnabled] = useState<boolean>(() => {
    try { return devParam || localStorage.getItem(DEV_FLAG_KEY) === '1'; } catch { return devParam; }
  });
  // Left sidebar overlays (permanent sidebar width = 56px)
  const [overlay, setOverlay] = useState<null | 'outline' | 'editor' | 'dev' | 'create'>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const [outlineFilter, setOutlineFilter] = useState('');

  // Info panels toggle
  const [showInfoPanels, setShowInfoPanels] = useState(false);

  // Dragging state (for disabling overlay pointer events)
  const [dragging] = useState(false);
  // Dev options (removed unused placeholder and force card mode for Stage 1)

  // Announcer hook
  const { announce, renderLiveRegion } = useAnnouncer();

  // Theme: dark-only (no data-theme switch)
  useEffect(() => { document.documentElement.removeAttribute('data-theme'); }, []);

  // Debug: expose events globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__debugEvents = events;
    }
  }, [events]);

  useEffect(() => {
    try { if (devEnabled) localStorage.setItem(DEV_FLAG_KEY, '1'); else localStorage.removeItem(DEV_FLAG_KEY); } catch {}
  }, [devEnabled]);

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
      setEditTitle(selected.title);
      setEditDescription(selected.description ?? '');
    } else {
      setEditDate(''); setEditTitle(''); setEditDescription('');
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

  // CRUD handlers
  const addEvent = useCallback((e: React.FormEvent) => {
    e.preventDefault(); if (!date || !title) return;
    const newEvent: Event = { id: Date.now().toString(), date, title, description: description || undefined };
    setEvents(prev => { const next = [...prev, newEvent]; storageRef.current.writeThrough(next); return next; });
    setSelectedId(newEvent.id);
    try { announce(`Added event ${title}`); } catch {}
    setDate(''); setTitle(''); setDescription('');
    setOverlay(null);
  }, [date, title, description, announce]);

  const saveSelected = useCallback((e: React.FormEvent) => {
    e.preventDefault(); if (!selectedId) return;
    setEvents(prev => { const next = prev.map(ev => ev.id === selectedId ? { ...ev, date: editDate || ev.date, title: editTitle || ev.title, description: editDescription || undefined } : ev); storageRef.current.writeThrough(next); return next; });
    try { announce(`Saved changes to ${editTitle || 'event'}`); } catch {}
  }, [selectedId, editDate, editTitle, editDescription, announce]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const toDelete = events.find(e => e.id === selectedId);
    setEvents(prev => { const next = prev.filter(ev => ev.id !== selectedId); storageRef.current.writeThrough(next); return next; });
    setSelectedId(undefined);
    try { announce(`Deleted ${toDelete?.title || 'event'}`); } catch {}
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

  // Create flow helpers
  // function openCreate(dateISO: string) {
  //   setDate(dateISO); setTitle(''); setDescription(''); setOverlay('create');
  // }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Full-bleed canvas area - no header, maximum space */}
      <div className="relative h-screen">
        {/* Permanent left sidebar for icon rail */}
        <aside className="absolute left-0 top-0 bottom-0 w-14 border-r border-gray-200 bg-white z-30 flex flex-col items-center py-2">
          {/* ChronoChart logo at top */}
          <div className="mb-4 p-2 text-xs font-bold tracking-wide text-gray-800 text-center leading-tight">
            <div>CC</div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex flex-col items-center gap-2 mb-auto">
            <button aria-label="Outline" className={`material-symbols-rounded rounded-md p-2 ${overlay === 'outline' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setOverlay(overlay === 'outline' ? null : 'outline')}>list</button>
            <button aria-label="Editor" className={`material-symbols-rounded rounded-md p-2 ${overlay === 'editor' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setOverlay(overlay === 'editor' ? null : 'editor')}>edit</button>
            <button aria-label="Create" className={`material-symbols-rounded rounded-md p-2 ${overlay === 'create' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`} onClick={() => setOverlay(overlay === 'create' ? null : 'create')}>add</button>
          </div>
          
          {/* Dev toggle at bottom */}
          <div className="flex flex-col items-center gap-2">
            <button type="button" title={devEnabled ? 'Disable Developer Options' : 'Enable Developer Options'} onClick={() => setDevEnabled((v) => !v)} className={`material-symbols-rounded rounded-md p-2 text-xs ${devEnabled ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'}`} aria-pressed={devEnabled} aria-label="Toggle developer options">build</button>
            <button aria-label="Developer Panel" disabled={!devEnabled} title={devEnabled ? 'Developer options' : 'Enable Dev first'} className={`material-symbols-rounded rounded-md p-2 ${overlay === 'dev' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'} ${!devEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => devEnabled && setOverlay(overlay === 'dev' ? null : 'dev')}>settings</button>
            <button 
              type="button" 
              title={showInfoPanels ? 'Hide Info Panels' : 'Show Info Panels'} 
              onClick={() => setShowInfoPanels(!showInfoPanels)} 
              className={`material-symbols-rounded rounded-md p-2 ${showInfoPanels ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`} 
              aria-pressed={showInfoPanels} 
              aria-label="Toggle info panels"
            >
              info
            </button>
            {/* Theme toggle removed */}
          </div>
        </aside>

        {/* Overlays next to the sidebar, never covering it */}
        {overlay && (
          <>
            <div className="absolute top-0 right-0 bottom-0 left-14 z-10 pointer-events-none" aria-hidden="true" />
            {overlay === 'outline' && (
              <OutlinePanel
                filtered={filteredForList}
                selectedId={selectedId}
                onSelect={setSelectedId}
                filter={outlineFilter}
                setFilter={setOutlineFilter}
                dragging={dragging}
                onClose={() => setOverlay(null)}
              />
            )}
            {overlay === 'editor' && (
              <EditorPanel
                selected={selected}
                editDate={editDate} editTitle={editTitle} editDescription={editDescription}
                setEditDate={setEditDate} setEditTitle={setEditTitle} setEditDescription={setEditDescription}
                onSave={saveSelected} onDelete={deleteSelected}
                dragging={dragging}
                onClose={() => setOverlay(null)}
              />
            )}
            {overlay === 'create' && (
              <CreatePanel
                date={date} title={title} description={description}
                setDate={setDate} setTitle={setTitle} setDescription={setDescription}
                onAdd={addEvent}
                dragging={dragging}
                onClose={() => setOverlay(null)}
              />
            )}
            {overlay === 'dev' && devEnabled && (
              <DevPanel
                seedRandom={seedRandom}
                seedClustered={seedClustered}
                seedLongRange={seedLongRange}
                clearAll={clearAll}
                dragging={dragging}
                onClose={() => setOverlay(null)}
                devEnabled={devEnabled}
                seedRFK={seedRFK}
                seedJFK={seedJFK}
                seedNapoleon={seedNapoleon}
                seedIncremental={seedIncremental}
              />
            )}
          </>
        )}

        {/* Main timeline area shifts right to avoid sidebar overlap */}
        <div className="absolute inset-0 ml-14 flex flex-col">
          {/* Timeline takes full available space */}
          <div className="w-full h-full relative">
            <DeterministicLayoutComponent events={events} showInfoPanels={showInfoPanels} />
              {renderLiveRegion()}
              
              {/* Bottom centered control bar overlay - highly transparent by default */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-200 opacity-20 hover:opacity-95">
                <div className="bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg px-4 py-2 flex gap-2 items-center">
                  <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-3 py-1.5 text-xs font-medium" onClick={() => nudge(-0.1)}>◀︎ Pan</button>
                  <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-3 py-1.5 text-xs font-medium" onClick={() => nudge(0.1)}>Pan ▶︎</button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button className="rounded bg-indigo-600 text-white hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium" onClick={() => zoom(0.8)}>＋ Zoom In</button>
                  <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-3 py-1.5 text-xs font-medium" onClick={() => zoom(1.25)}>－ Zoom Out</button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button className="rounded bg-sky-600 text-white hover:bg-sky-500 px-3 py-1.5 text-xs font-medium" onClick={() => { animateTo(0, 1); }}>Fit All</button>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
