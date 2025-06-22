import { useState } from 'react'
import Button from '@/components/Button'
import Timeline, { type EventItem as TimelineEvent } from '@/components/Timeline'

interface EventItem extends TimelineEvent {
  description: string
}

export default function Editor() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [showForm, setShowForm] = useState(false)

  const addEvent = () => {
    if (!title || !date) return
    const newEvent: EventItem = {
      id: Date.now(),
      title,
      description,
      date,
    }
    setEvents((prev) =>
      [...prev, newEvent].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    )
    setTitle('')
    setDescription('')
    setDate('')
    setSelectedId(newEvent.id)
    setShowForm(false)
  }

  const selected = events.find((e) => e.id === selectedId)

  return (
    <main className="p-4 flex flex-col h-[calc(100vh-4rem)]">{/* header is 4rem */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/3 pr-4 border-r overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className={`cursor-pointer p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedId === e.id ? 'bg-blue-50 dark:bg-gray-800' : ''}`}
                onClick={() => setSelectedId(e.id)}
              >
                <div className="text-sm text-gray-500">
                  {new Date(e.date).toLocaleDateString()}
                </div>
                <div className="font-medium">{e.title}</div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex-1 relative pl-4 overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full">
            <Timeline
              events={events}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
            />
            {selected && (
              <div className="mt-4 p-4 border rounded shadow-md bg-white dark:bg-gray-900 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-1">{selected.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(selected.date).toLocaleDateString()}
                </p>
                <p className="whitespace-pre-line">{selected.description || 'No description'}</p>
              </div>
            )}
          </div>

          {showForm && (
            <div className="absolute bottom-16 right-4 bg-white dark:bg-gray-900 p-4 rounded shadow-lg w-64 space-y-2">
              <input
                className="border rounded w-full px-2 py-1"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="border rounded w-full px-2 py-1"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                type="date"
                className="border rounded w-full px-2 py-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Button onClick={addEvent} className="w-full">Create Event</Button>
            </div>
          )}

          <Button
            className="absolute bottom-4 right-4 h-12 w-12 rounded-full text-2xl p-0"
            onClick={() => setShowForm((v) => !v)}
          >
            +
          </Button>
        </section>
      </div>

    </main>
  )
}
