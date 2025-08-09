import { useEffect, useMemo, useRef, useState } from 'react';
import Timeline from './components/Timeline';
import type { Event } from './types';

const STORAGE_KEY = 'chronochart-events';
const DEV_FLAG_KEY = 'chronochart-dev';
const DAY_MS = 24 * 60 * 60 * 1000;

function App() {
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Event[]) : [];
    } catch {
      return [];
    }
  });
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

  // Panels & Dev toggle
  const devParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';
  const [devEnabled, setDevEnabled] = useState<boolean>(() => {
    try { return devParam || localStorage.getItem(DEV_FLAG_KEY) === '1'; } catch { return devParam; }
  });
  const [showOutline, setShowOutline] = useState(true);
  const [showEditor, setShowEditor] = useState(true); // default true to keep current UX/tests
  const [showDevPanel, setShowDevPanel] = useState<boolean>(() => devParam);

  useEffect(() => {
    try { if (devEnabled) localStorage.setItem(DEV_FLAG_KEY, '1'); else localStorage.removeItem(DEV_FLAG_KEY); } catch {}
  }, [devEnabled]);

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
  function fitAll() { setViewWindow(0, 1); }

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
    setDate(''); setTitle(''); setDescription('');
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
      for (let i = 0; i < count; i++) { const d = new Date(base + Math.floor(Math.random() * 360) * DAY_MS).toISOString().slice(0, 10); next.push({ id: (Date.now() + Math.random() + i).toString(36), date: d, title: `Rand ${next.length + 1}` }); }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function clearAll() { setEvents(() => { const next: Event[] = []; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} return next; }); }

  const sortedForList = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-wide text-gray-900">Chronochart</h1>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500" aria-hidden>Local-only • Prototype</div>
            <button type="button" title={devEnabled ? 'Disable Developer Options' : 'Enable Developer Options'} onClick={() => setDevEnabled((v) => !v)} className={`rounded px-2 py-1 text-xs border ${devEnabled ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`} aria-pressed={devEnabled} aria-label="Toggle developer options">⚙︎ Dev</button>
          </div>
        </div>
      </header>

      {/* Shell with left rail, center content, right panels */}
      <main className="mx-auto max-w-6xl px-4 py-6 flex gap-4">
        {/* Left rail */}
        <aside className="sticky top-24 self-start flex flex-col gap-2">
          <button className={`rounded p-2 border ${showOutline ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={showOutline} aria-label="Toggle outline panel" onClick={() => setShowOutline((v) => !v)}>🗂️</button>
          <button className={`rounded p-2 border ${showEditor ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={showEditor} aria-label="Toggle editor drawer" onClick={() => setShowEditor((v) => !v)}>✏️</button>
          <button className={`rounded p-2 border ${showDevPanel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={showDevPanel} aria-label="Toggle developer options panel" onClick={() => setShowDevPanel((v) => !v)} disabled={!devEnabled} title={devEnabled ? 'Show Developer Options' : 'Enable Dev (header) to use'}>🛠️</button>
        </aside>

        {/* Center column */}
        <div className="flex-1 flex flex-col items-stretch gap-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 self-center">
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1" onClick={() => nudgeView(-0.1)}>◀︎ Pan</button>
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1" onClick={() => nudgeView(0.1)}>Pan ▶︎</button>
            <button className="rounded bg-indigo-600 text-white hover:bg-indigo-500 px-2 py-1" onClick={() => zoom(0.8)}>＋ Zoom In</button>
            <button className="rounded bg-gray-800 text-white hover:bg-gray-700 px-2 py-1" onClick={() => zoom(1.25)}>－ Zoom Out</button>
            <button className="rounded bg-sky-600 text-white hover:bg-sky-500 px-2 py-1" onClick={fitAll}>Fit All</button>
          </div>
          {/* Timeline */}
          <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm flex justify-center items-center min-h-72">
            <Timeline
              events={events}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDragDate={onDragDate}
              viewStart={viewStart}
              viewEnd={viewEnd}
              onViewWindowChange={setViewWindow}
              onInlineEdit={(id, updates) => {
                setEvents((prev) => {
                  const next = prev.map((ev) => (ev.id === id ? { ...ev, title: updates.title, description: updates.description } : ev));
                  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
                  return next;
                });
              }}
            />
          </div>
          {/* Create form */}
          <section className="w-full">
            <h2 className="mb-2 text-sm font-medium text-gray-700">Add Event</h2>
            <form onSubmit={addEvent} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col text-sm text-gray-700"><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-gray-900 bg-white" required /></label>
              <label className="flex flex-col text-sm text-gray-700"><span>Title</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-gray-900 bg-white" required /></label>
              <label className="flex flex-col text-sm text-gray-700"><span>Description</span><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-gray-900 bg-white" placeholder="Optional" /></label>
              <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-white">Add</button>
            </form>
          </section>
        </div>

        {/* Right column panels */}
        <div className="w-80 flex flex-col gap-3">
          {showOutline && (
            <section className="rounded-lg border border-gray-200 bg-white p-3">
              <h2 className="mb-2 text-sm font-medium text-gray-700">Outline</h2>
              <ul className="space-y-1">
                {sortedForList.map((ev) => (
                  <li key={ev.id}>
                    <button onClick={() => setSelectedId(ev.id)} className={`w-full text-left rounded px-2 py-1 border ${ev.id === selectedId ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                      <div className="text-sm font-medium truncate">{ev.title || '(untitled)'}</div>
                      <div className="text-xs text-gray-500">{ev.date}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showEditor && (
            <section className="rounded-lg border border-gray-200 bg-white p-3">
              <h2 className="mb-2 text-sm font-medium text-gray-700">Edit Event</h2>
              {selected ? (
                <form onSubmit={saveSelected} className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">Editing: {selected.title}</span>
                  <label className="flex flex-col text-sm text-gray-700"><span>Date</span><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-gray-900 bg-white" required /></label>
                  <label className="flex flex-col text-sm text-gray-700"><span>Title</span><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-gray-900 bg-white" required /></label>
                  <label className="flex flex-col text-sm text-gray-700"><span>Description</span><input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-gray-900 bg-white" placeholder="Optional" /></label>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-white">Save</button>
                    <button type="button" onClick={deleteSelected} className="rounded bg-rose-600 hover:bg-rose-500 px-3 py-1 text-white">Delete</button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-500">Select an event on the timeline or from the outline to edit.</p>
              )}
            </section>
          )}

          {devEnabled && showDevPanel && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <h2 className="mb-2 text-sm font-medium text-amber-900">Developer Options</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={() => seedRandom(5)}>Seed 5 random events</button>
                <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={() => seedRandom(10)}>Seed 10 random events</button>
                <button type="button" className="rounded bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 px-3 py-1" onClick={clearAll}>Clear all events</button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
