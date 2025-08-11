import { useEffect, useMemo, useRef, useState } from 'react';
import Timeline from './components/Timeline';
import type { Event } from './types';

const STORAGE_KEY = 'chronochart-events';
const DEV_FLAG_KEY = 'chronochart-dev';
const DAY_MS = 24 * 60 * 60 * 1000;

const LOREM = [
  'Lorem ipsum dolor sit amet',
  'consectetur adipiscing elit',
  'sed do eiusmod tempor',
  'incididunt ut labore et dolore',
  'magna aliqua',
  'Ut enim ad minim veniam',
  'quis nostrud exercitation ullamco',
  'laboris nisi ut aliquip ex ea commodo consequat',
  'Duis aute irure dolor in reprehenderit',
  'in voluptate velit esse cillum dolore eu fugiat nulla pariatur'
];

function randLorem(n = 2) {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(LOREM[Math.floor(Math.random() * LOREM.length)]);
  return parts.join(' · ');
}

function App() {
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Event[]) : [];
    } catch {
      return [];
    }
  });
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

  // zoom/pan state for view window [start,end] in 0..1
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(1);
  const animRef = useRef<number | null>(null);

  // Panels & Dev toggle
  const devParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';
  const [devEnabled, setDevEnabled] = useState<boolean>(() => {
    try { return devParam || localStorage.getItem(DEV_FLAG_KEY) === '1'; } catch { return devParam; }
  });
  // Left sidebar overlays (permanent sidebar width = 56px)
  const [overlay, setOverlay] = useState<null | 'outline' | 'editor' | 'dev' | 'create'>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const [outlineFilter, setOutlineFilter] = useState('');

  // Pause overlay interactivity during timeline drag
  const [dragging, setDragging] = useState(false);
  const liveRef = useRef<HTMLDivElement | null>(null);

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

  // Track dragging to avoid spamming persistence
  const draggingRef = useRef(false);

  // Persist events whenever they change (debounced), skipping active drag
  useEffect(() => {
    if (draggingRef.current) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [events]);

  // Sync edit fields when selection changes
  useEffect(() => {
    if (selected) {
      setEditDate(selected.date);
      setEditTitle(selected.title);
      setEditDescription(selected.description ?? '');
      // If Outline is open, keep it but no need to close.
    } else {
      setEditDate(''); setEditTitle(''); setEditDescription('');
    }
  }, [selectedId]);

  // Controls helpers
  function setViewWindow(start: number, end: number) {
    setViewStart(Math.max(0, Math.min(1, start)));
    setViewEnd(Math.max(0, Math.min(1, end)));
  }
  function nudgeView(delta: number) {
    const width = Math.max(viewEnd - viewStart, 0.05);
    let start = viewStart + delta;
    let end = viewEnd + delta;
    if (start < 0) { end -= start; start = 0; }
    if (end > 1) { start -= end - 1; end = 1; }
    if (end - start < width) end = start + width;
    setViewWindow(start, end);
  }
  function zoom(factor: number) {
    const center = (viewStart + viewEnd) / 2;
    let half = ((viewEnd - viewStart) / 2) * factor;
    half = Math.max(0.025, Math.min(0.5, half));
    setViewWindow(center - half, center + half);
  }
  // Smoothly animate to a target [start,end]
  function animateViewWindow(targetStart: number, targetEnd: number, durationMs = 400) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const startStart = viewStart;
    const startEnd = viewEnd;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / durationMs);
      const e = ease(t);
      const s = startStart + (targetStart - startStart) * e;
      const eend = startEnd + (targetEnd - startEnd) * e;
      setViewWindow(s, eend);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }

  // Keyboard shortcuts (ignore when typing in inputs)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === '+' || e.key === '=') { zoom(0.8); }
      else if (e.key === '-' || e.key === '_') { zoom(1.25); }
      else if (e.key === 'ArrowLeft') { nudgeView(-0.05); }
      else if (e.key === 'ArrowRight') { nudgeView(0.05); }
      else if (e.key === 'Home') { setViewWindow(0, Math.max(viewEnd - viewStart, 0.1)); }
      else if (e.key === 'End') { const w = Math.max(viewEnd - viewStart, 0.1); setViewWindow(Math.max(0, 1 - w), 1); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewStart, viewEnd]);

  // CRUD handlers
  function addEvent(e: React.FormEvent) {
    e.preventDefault(); if (!date || !title) return;
    const newEvent: Event = { id: Date.now().toString(), date, title, description: description || undefined };
    setEvents((prev) => { const next = [...prev, newEvent]; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} return next; });
    setSelectedId(newEvent.id);
    setDate(''); setTitle(''); setDescription('');
    setOverlay(null);
  }
  function saveSelected(e: React.FormEvent) {
    e.preventDefault(); if (!selectedId) return;
    setEvents((prev) => { const next = prev.map((ev) => ev.id === selectedId ? { ...ev, date: editDate || ev.date, title: editTitle || ev.title, description: editDescription || undefined } : ev); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} return next; });
  }
  function deleteSelected() {
    if (!selectedId) return;
    setEvents((prev) => { const next = prev.filter((ev) => ev.id !== selectedId); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} return next; });
    setSelectedId(undefined);
  }
  function onDragDate(id: string, newISODate: string) {
    // mark dragging and update on drop; write-through to storage immediately
    draggingRef.current = true;
    setEvents((prev) => { const next = prev.map((ev) => (ev.id === id ? { ...ev, date: newISODate } : ev)); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} return next; });
    // allow persistence effect after microtask
    setTimeout(() => (draggingRef.current = false), 0);
  }

  // Dev helpers
  function seedRandom(count: number) {
    setEvents((prev) => {
      const base = Date.now() - 180 * DAY_MS; const next = [...prev];
      for (let i = 0; i < count; i++) {
        const d = new Date(base + Math.floor(Math.random() * 360) * DAY_MS).toISOString().slice(0, 10);
        next.push({ id: (Date.now() + Math.random() + i).toString(36), date: d, title: `Rand ${next.length + 1}`, description: randLorem(2) });
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function seedClustered() {
    setEvents((prev) => {
      const next = [...prev];
      const centers = [-10, 0, 12].map((offset) => Date.now() + offset * DAY_MS);
      let idx = 1;
      for (let ci = 0; ci < centers.length; ci++) {
        for (let i = 0; i < 10; i++) {
          const jitter = (Math.floor(Math.random() * 7) - 3) * DAY_MS; // -3..+3 days
          const d = new Date(centers[ci] + jitter).toISOString().slice(0, 10);
          next.push({ id: (Date.now() + Math.random() + ci * 100 + i).toString(36), date: d, title: `Cluster ${ci + 1}-${idx++}`, description: randLorem(3) });
        }
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function seedLongRange() {
    setEvents((prev) => {
      const start = new Date('2015-01-01').getTime();
      const months = 60; // ~5 years monthly
      const next = [...prev];
      for (let i = 0; i < months; i++) {
        const d = new Date(start + i * (DAY_MS * 30)).toISOString().slice(0, 10);
        next.push({ id: (Date.now() + Math.random() + i).toString(36), date: d, title: `Long ${i + 1}`, description: randLorem(2) });
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function clearAll() { setEvents(() => { const next: Event[] = []; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} return next; }); }

  function exportEvents() {
    try {
      const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chronochart-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  }

  const sortedForList = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);
  const filteredForList = useMemo(() => {
    const q = outlineFilter.trim().toLowerCase();
    if (!q) return sortedForList;
    return sortedForList.filter((e) => (e.title || '').toLowerCase().includes(q) || e.date.includes(q));
  }, [sortedForList, outlineFilter]);

  // Create flow helpers
  function openCreate(dateISO: string) {
    setDate(dateISO);
    setTitle('');
    setDescription('');
    setOverlay('create');
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
          </div>
        </div>
      </header>
      <div className="h-14" /> {/* spacer to avoid overlap */}

      {/* Full-bleed canvas area below header */}
      <div
        className="relative h-[calc(100vh-56px)]"
      >
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
            {/* click-outside backdrop (visual only; lets events pass-through) */}
            <div className="absolute top-0 right-0 bottom-0 left-14 z-10 pointer-events-none" aria-hidden="true" />
            <aside
              ref={overlayRef as any}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`dialog-title-${overlay}`}
              className={`absolute left-14 top-0 bottom-0 w-72 max-w-[75vw] text-gray-50 p-3 space-y-3 z-20 ${dragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
              style={{ background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(4px)', borderRight: '1px solid rgba(75,85,99,0.6)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', pointerEvents: dragging ? 'none' as const : 'auto' }}
            >
              {overlay === 'outline' && (
                <section>
                  <h2 id="dialog-title-outline" className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-300">Outline</h2>
                  <input aria-label="Filter outline" placeholder="Filter…" value={outlineFilter} onChange={(e) => setOutlineFilter(e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800/60 text-gray-100 placeholder-gray-400 px-2 py-1 text-[11px]" />
                  <ul className="mt-2 space-y-1 max-h-[70vh] overflow-auto pr-1">
                    {filteredForList.map((ev) => (
                      <li key={ev.id}>
                        <button onClick={() => setSelectedId(ev.id)} className={`w-full text-left rounded px-2 py-1 border text-[11px] ${ev.id === selectedId ? 'bg-blue-500/20 border-blue-500 text-blue-100' : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 text-gray-100'}`}>
                          <div className="font-medium truncate">{ev.title || '(untitled)'}</div>
                          <div className="opacity-70">{ev.date}</div>
                        </button>
                      </li>
                    ))}
                    {filteredForList.length === 0 && (
                      <li className="text-[11px] text-gray-400">No matches</li>
                    )}
                  </ul>
                </section>
              )}
              {overlay === 'editor' && (
                <section>
                  <h2 id="dialog-title-editor" className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-300">Edit Event</h2>
                  {selected ? (
                    <form onSubmit={saveSelected} className="flex flex-col gap-2 text-[11px]">
                      <label className="flex flex-col"><span className="opacity-80">Date</span><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
                      <label className="flex flex-col"><span className="opacity-80">Title</span><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
                      <label className="flex flex-col"><span className="opacity-80">Description</span><input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" placeholder="Optional" /></label>
                      <div className="flex gap-2">
                        <button type="submit" className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-white">Save</button>
                        <button type="button" onClick={deleteSelected} className="rounded bg-rose-600 hover:bg-rose-500 px-3 py-1 text-white">Delete</button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-[11px] text-gray-400">Select an event on the timeline or from the outline to edit.</p>
                  )}
                </section>
              )}
              {overlay === 'create' && (
                <section>
                  <h2 id="dialog-title-create" className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-300">Create Event</h2>
                  <form onSubmit={addEvent} className="flex flex-col gap-2 text-[11px]">
                    <label className="flex flex-col"><span className="opacity-80">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
                    <label className="flex flex-col"><span className="opacity-80">Title</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
                    <label className="flex flex-col"><span className="opacity-80">Description</span><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" placeholder="Optional" /></label>
                    <div className="flex gap-2">
                      <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-white">Add</button>
                      <button type="button" onClick={() => setOverlay(null)} className="rounded bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-3 py-1">Cancel</button>
                    </div>
                  </form>
                </section>
              )}
              {overlay === 'dev' && devEnabled && (
                <section>
                  <h2 id="dialog-title-dev" className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-300">Developer Options</h2>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={() => seedRandom(5)}>Seed 5</button>
                    <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={() => seedRandom(10)}>Seed 10</button>
                    <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={seedClustered}>Clustered</button>
                    <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={seedLongRange}>Long-range</button>
                    <button type="button" className="rounded bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 px-3 py-1" onClick={clearAll}>Clear</button>
                  </div>
                </section>
              )}
            </aside>
          </>
        )}

        {/* Main timeline area shifts right to avoid sidebar overlap */}
        <div className="absolute inset-0 ml-14 flex flex-col">
          {/* Minimal header bar for actions */}
          <div className="flex gap-2 p-2 items-center justify-center">
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1 text-xs" onClick={() => setViewStart(Math.max(0, viewStart - 0.1))}>◀︎ Pan</button>
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1 text-xs" onClick={() => setViewEnd(Math.min(1, viewEnd + 0.1))}>Pan ▶︎</button>
            <button className="rounded bg-indigo-600 text-white hover:bg-indigo-500 px-2 py-1 text-xs" onClick={() => { const center = (viewStart + viewEnd) / 2; const span = (viewEnd - viewStart) * 0.8; setViewStart(Math.max(0, center - span / 2)); setViewEnd(Math.min(1, center + span / 2)); }}>＋ Zoom In</button>
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1 text-xs" onClick={() => { const center = (viewStart + viewEnd) / 2; const span = (viewEnd - viewStart) * 1.25; setViewStart(Math.max(0, center - span / 2)); setViewEnd(Math.min(1, center + span / 2)); }}>－ Zoom Out</button>
            <button className="rounded bg-sky-600 text-white hover:bg-sky-500 px-2 py-1 text-xs" onClick={() => { animateViewWindow(0, 1); }}>Fit All</button>
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
                onViewWindowChange={(s, e) => { setViewStart(s); setViewEnd(e); }}
                onInlineEdit={(id, updates) => {
                  setEvents((prev) => {
                    const next = prev.map((ev) => (ev.id === id ? { ...ev, title: updates.title, description: updates.description } : ev));
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
                    return next;
                  });
                }}
                onCreateAt={(iso) => openCreate(iso)}
                onDragState={(isDragging) => { setDragging(isDragging); const pane = overlayRef.current as HTMLElement | null; if (pane) pane.style.pointerEvents = isDragging ? 'none' : 'auto'; }}
                onAnnounce={(msg) => { if (liveRef.current) liveRef.current.textContent = msg; }}
              />
              <div aria-live="polite" className="sr-only" ref={liveRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
