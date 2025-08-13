import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Timeline from './components/Timeline';
import type { Event } from './types';
import { OutlinePanel } from './app/panels/OutlinePanel';
import { EditorPanel } from './app/panels/EditorPanel';
import { CreatePanel } from './app/panels/CreatePanel';
import { DevPanel } from './app/panels/DevPanel';
import { EventStorage } from './lib/storage';
import { seedRandom as seedRandomUtil, seedClustered as seedClusteredUtil, seedLongRange as seedLongRangeUtil } from './lib/devSeed';
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

  // Dragging state (for disabling overlay pointer events)
  const [dragging, setDragging] = useState(false);

  // Announcer hook
  const { announce, renderLiveRegion } = useAnnouncer();

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => 'dark');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

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
    setDate(''); setTitle(''); setDescription('');
    setOverlay(null);
  }, [date, title, description]);

  const saveSelected = useCallback((e: React.FormEvent) => {
    e.preventDefault(); if (!selectedId) return;
    setEvents(prev => { const next = prev.map(ev => ev.id === selectedId ? { ...ev, date: editDate || ev.date, title: editTitle || ev.title, description: editDescription || undefined } : ev); storageRef.current.writeThrough(next); return next; });
  }, [selectedId, editDate, editTitle, editDescription]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setEvents(prev => { const next = prev.filter(ev => ev.id !== selectedId); storageRef.current.writeThrough(next); return next; });
    setSelectedId(undefined);
  }, [selectedId]);

  const onDragDate = useCallback((id: string, newISODate: string) => {
    // write-through during drag
    setEvents(prev => {
      const next = prev.map(ev => ev.id === id ? { ...ev, date: newISODate } : ev);
      storageRef.current.writeThrough(next);
      return next;
    });
  }, []);

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
  const clearAll = useCallback(() => { setEvents([]); }, []);

  const exportEvents = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'chronochart-export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {}
  }, [events]);

  const sortedForList = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);
  const filteredForList = useMemo(() => {
    const q = outlineFilter.trim().toLowerCase();
    if (!q) return sortedForList;
    return sortedForList.filter((e) => (e.title || '').toLowerCase().includes(q) || e.date.includes(q));
  }, [sortedForList, outlineFilter]);

  // Create flow helpers
  function openCreate(dateISO: string) {
    setDate(dateISO); setTitle(''); setDescription(''); setOverlay('create');
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* fixed header height reserved below via spacer */}
      <header className="fixed top-0 inset-x-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-gray-200 h-14 flex items-center">
        <div className="mx-auto max-w-screen-2xl px-4 w-full flex items-center justify-between">
          <h1 className="text-sm font-semibold tracking-[0.12em] text-gray-900">Chronochart</h1>
          <div className="flex items-center gap-3">
            <div className="text-[11px] text-gray-500" aria-hidden>Local-only • Prototype</div>
            <button type="button" title={devEnabled ? 'Disable Developer Options' : 'Enable Developer Options'} onClick={() => setDevEnabled((v) => !v)} className={`rounded px-2 py-1 text-[11px] border ${devEnabled ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`} aria-pressed={devEnabled} aria-label="Toggle developer options">⚙︎ Dev</button>
            <button type="button" aria-label="Toggle light/dark theme" className="rounded px-2 py-1 text-[11px] border bg-white text-gray-600 border-gray-300 hover:bg-gray-50" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
          </div>
        </div>
      </header>
      <div className="h-14" /> {/* spacer to avoid overlap */}

      {/* Full-bleed canvas area below header */}
      <div className="relative h-[calc(100vh-56px)]">
        {/* Permanent left sidebar for icon rail */}
        <aside className="absolute left-0 top-0 bottom-0 w-14 border-r border-gray-200 bg-white z-30 flex flex-col items-center gap-2 py-2">
          <button aria-label="Outline" className={`material-symbols-rounded rounded-md p-2 ${overlay === 'outline' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setOverlay(overlay === 'outline' ? null : 'outline')}>list</button>
          <button aria-label="Editor" className={`material-symbols-rounded rounded-md p-2 ${overlay === 'editor' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setOverlay(overlay === 'editor' ? null : 'editor')}>edit</button>
            <button aria-label="Create" className={`material-symbols-rounded rounded-md p-2 ${overlay === 'create' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`} onClick={() => setOverlay(overlay === 'create' ? null : 'create')}>add</button>
          <button aria-label="Developer" disabled={!devEnabled} title={devEnabled ? 'Developer options' : 'Enable Dev in header'} className={`material-symbols-rounded rounded-md p-2 ${overlay === 'dev' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'} ${!devEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => devEnabled && setOverlay(overlay === 'dev' ? null : 'dev')}>build</button>
        </aside>

        {/* Overlays next to the sidebar, never covering it */}
        {overlay && (
          <>
            <div className="absolute top-0 right-0 bottom-0 left-14 z-10 pointer-events-none" aria-hidden="true" />
            {overlay === 'outline' && (
              <OutlinePanel
                events={events}
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
              />
            )}
          </>
        )}

        {/* Main timeline area shifts right to avoid sidebar overlap */}
        <div className="absolute inset-0 ml-14 flex flex-col">
          {/* Minimal header bar for actions */}
          <div className="flex gap-2 p-2 items-center justify-center">
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1 text-xs" onClick={() => nudge(-0.1)}>◀︎ Pan</button>
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1 text-xs" onClick={() => nudge(0.1)}>Pan ▶︎</button>
            <button className="rounded bg-indigo-600 text-white hover:bg-indigo-500 px-2 py-1 text-xs" onClick={() => zoom(0.8)}>＋ Zoom In</button>
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1 text-xs" onClick={() => zoom(1.25)}>－ Zoom Out</button>
            <button className="rounded bg-sky-600 text-white hover:bg-sky-500 px-2 py-1 text-xs" onClick={() => { animateTo(0, 1); }}>Fit All</button>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={exportEvents} className="rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-2 py-1 text-xs" aria-label="Export events as JSON">Export</button>
            </div>
          </div>
          {/* Center timeline vertically within remaining space */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full">
              <Timeline
                events={events}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDragDate={onDragDate}
                viewStart={viewStart}
                viewEnd={viewEnd}
                onViewWindowChange={(s, e) => { setWindow(s, e); }}
                onInlineEdit={(id, updates) => {
                  setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, title: updates.title, description: updates.description } : ev)));
                }}
                onCreateAt={(iso) => openCreate(iso)}
                onDragState={(isDragging) => {
                  setDragging(isDragging);
                  storageRef.current.setDragging(isDragging);
                  if (!isDragging) storageRef.current.save(events); // final debounce after drop
                  const pane = overlayRef.current as HTMLElement | null; if (pane) pane.style.pointerEvents = isDragging ? 'none' : 'auto';
                }}
                onAnnounce={(msg) => announce(msg)}
              />
              {renderLiveRegion()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
