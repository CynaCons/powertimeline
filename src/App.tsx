import { useEffect, useState } from 'react';
import Timeline from './components/Timeline';
import type { Event } from './types';

const STORAGE_KEY = 'chronochart-events';

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

  // Persist events whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore quota errors
    }
  }, [events]);

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !title) return;
    const newEvent: Event = {
      id: Date.now().toString(),
      date,
      title,
      description: description || undefined,
    };
    setEvents((prev) => [...prev, newEvent]);
    setDate('');
    setTitle('');
    setDescription('');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Chronochart</h1>
      <form onSubmit={addEvent} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-sm">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border px-2 py-1 text-black"
            required
          />
        </label>
        <label className="flex flex-col text-sm">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border px-2 py-1 text-black"
            required
          />
        </label>
        <label className="flex flex-col text-sm">
          <span>Description</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded border px-2 py-1 text-black"
            placeholder="Optional"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-indigo-600 px-3 py-1 text-white"
        >
          Add
        </button>
      </form>
      <Timeline events={events} />
    </main>
  );
}

export default App;
