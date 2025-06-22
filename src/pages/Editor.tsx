import { useState } from 'react'
import Button from '@/components/Button'

interface EventItem {
  id: number
  title: string
  description: string
  date: string
}

export default function Editor() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')

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

        <section className="flex-1 flex flex-col pl-4">
          <h1 className="text-2xl font-semibold mb-4">Chronograph Editor</h1>
          <div className="space-y-2 mb-4">
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
            <Button onClick={addEvent}>Create Event</Button>
          </div>
          <div className="flex-1 flex items-start justify-center relative">
            {selected && (
              <div className="p-4 border rounded shadow-md bg-white dark:bg-gray-900 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-1">{selected.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(selected.date).toLocaleDateString()}
                </p>
                <p className="whitespace-pre-line">{selected.description || 'No description'}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="border-t mt-4 pt-4">
        <div className="relative">
          <div className="absolute left-0 right-0 top-3 h-px bg-gray-300" />
          <div className="relative flex items-center justify-between overflow-x-auto px-1">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex flex-col items-center cursor-pointer px-4"
                onClick={() => setSelectedId(e.id)}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${selectedId === e.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}
                />
                <span className="mt-2 text-xs whitespace-nowrap">
                  {new Date(e.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
