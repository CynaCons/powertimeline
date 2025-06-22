import { useState } from 'react'
import Timeline, { type EventItem as TimelineEvent } from '@/components/Timeline'

interface EventItem extends TimelineEvent {
  description: string
}

const initialEvents: EventItem[] = [
  {
    id: 1,
    title: "ChatGPT Launch",
    date: "2022-11-30",
    description: "OpenAI launched ChatGPT, revolutionizing conversational AI and making it accessible to the general public."
  },
  {
    id: 2,
    title: "Queen Elizabeth II Passes Away",
    date: "2022-09-08",
    description: "Queen Elizabeth II, the longest-reigning British monarch, passed away at age 96 after 70 years on the throne."
  },
  {
    id: 3,
    title: "Russia Invades Ukraine",
    date: "2022-02-24",
    description: "Russia launched a full-scale military invasion of Ukraine, marking the beginning of the largest conflict in Europe since WWII."
  },
  {
    id: 4,
    title: "Elon Musk Acquires Twitter",
    date: "2022-10-27",
    description: "Elon Musk completed his $44 billion acquisition of Twitter, later rebranding the platform to 'X'."
  },
  {
    id: 5,
    title: "FIFA World Cup Qatar 2022",
    date: "2022-11-20",
    description: "The 2022 FIFA World Cup began in Qatar, the first World Cup held in the Middle East, with Argentina ultimately winning."
  }
]

export default function Editor() {
  const [events, setEvents] = useState<EventItem[]>(initialEvents)
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
    
    setEvents(prev => [...prev, newEvent].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ))
    
    // Clear form and select new event
    setTitle('')
    setDescription('')
    setDate('')
    setSelectedId(newEvent.id)
  }

  const selected = events.find(e => e.id === selectedId)

  return (
    <main className="p-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/3 pr-4 border-r overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <ul className="space-y-2">
            {events.map(event => (
              <li
                key={event.id}
                className={`cursor-pointer p-2 rounded border hover:bg-gray-50 ${
                  selectedId === event.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedId(event.id)}
              >
                <div className="text-sm text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="font-medium">{event.title}</div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <section className="flex-1 pl-4 overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            
            {/* Add Event Form */}
            <div className="bg-white p-6 rounded-lg shadow-lg border w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Add New Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter event description (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={addEvent}
                  disabled={!title || !date}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Create Event
                </button>
              </div>
            </div>

            {/* Timeline */}
            <Timeline
              events={events}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {/* Event Details */}
            {selected && (
              <div className="p-4 border rounded shadow-md bg-white w-full max-w-md">
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
    </main>
  )
}
