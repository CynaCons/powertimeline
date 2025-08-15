import React, { useState } from 'react';
import { Event } from '../types';
import { TimelineWithSlots } from './TimelineWithSlots';

// Sample events for testing
const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    date: '2024-01-15',
    title: 'Project Kickoff',
    description: 'Initial meeting to discuss project goals, timeline, and deliverables. Team introductions and role assignments.'
  },
  {
    id: '2',
    date: '2024-01-20',
    title: 'Requirements Gathering',
    description: 'Detailed analysis of user requirements and technical specifications.'
  },
  {
    id: '3',
    date: '2024-01-22',
    title: 'Architecture Review',
    description: 'Technical architecture design and review session with senior architects.'
  },
  {
    id: '4',
    date: '2024-02-01',
    title: 'Development Start',
    description: 'Begin implementation of core features based on approved design.'
  },
  {
    id: '5',
    date: '2024-02-05',
    title: 'Sprint 1 Demo',
    description: 'First sprint demonstration to stakeholders.'
  },
  {
    id: '6',
    date: '2024-02-06',
    title: 'Bug Fixes',
    description: 'Address issues found during sprint demo.'
  },
  {
    id: '7',
    date: '2024-02-07',
    title: 'Code Review',
    description: 'Peer review of implemented features.'
  },
  {
    id: '8',
    date: '2024-02-15',
    title: 'Integration Testing',
    description: 'Test integration between different system components.'
  },
  {
    id: '9',
    date: '2024-02-20',
    title: 'Performance Optimization',
    description: 'Optimize application performance and fix bottlenecks.'
  },
  {
    id: '10',
    date: '2024-03-01',
    title: 'User Acceptance Testing',
    description: 'Final testing with end users to validate functionality and usability.'
  },
  {
    id: '11',
    date: '2024-03-05',
    title: 'Documentation',
    description: 'Complete user documentation and technical guides.'
  },
  {
    id: '12',
    date: '2024-03-10',
    title: 'Deployment',
    description: 'Deploy application to production environment.'
  }
];

// Dense cluster events for testing degradation
const DENSE_EVENTS: Event[] = Array.from({ length: 25 }, (_, i) => ({
  id: `dense-${i}`,
  date: `2024-01-${String(15 + Math.floor(i / 3)).padStart(2, '0')}`,
  title: `Event ${i + 1}`,
  description: `This is event number ${i + 1} with some description text to test layout.`
}));

export function TestSlotLayout() {
  const [eventSet, setEventSet] = useState<'sample' | 'dense'>('sample');
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS);

  const handleEventSetChange = (newSet: 'sample' | 'dense') => {
    setEventSet(newSet);
    setEvents(newSet === 'sample' ? SAMPLE_EVENTS : DENSE_EVENTS);
  };

  const addRandomEvent = () => {
    const randomDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const newEvent: Event = {
      id: `random-${Date.now()}`,
      date: randomDate.toISOString().split('T')[0],
      title: `Random Event ${events.length + 1}`,
      description: `This is a randomly generated event for testing purposes.`
    };
    setEvents([...events, newEvent]);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg space-y-2">
        <div className="text-sm font-semibold">Slot Layout Test</div>
        
        <div className="space-x-2">
          <button
            onClick={() => handleEventSetChange('sample')}
            className={`px-3 py-1 text-xs rounded ${
              eventSet === 'sample' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sample Events ({SAMPLE_EVENTS.length})
          </button>
          <button
            onClick={() => handleEventSetChange('dense')}
            className={`px-3 py-1 text-xs rounded ${
              eventSet === 'dense' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Dense Events ({DENSE_EVENTS.length})
          </button>
        </div>

        <div className="space-x-2">
          <button
            onClick={addRandomEvent}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Random
          </button>
          <button
            onClick={clearEvents}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All
          </button>
        </div>

        <div className="text-xs text-gray-600">
          Current: {events.length} events
        </div>
      </div>

      {/* Timeline */}
      <TimelineWithSlots 
        events={events}
        className="w-full h-full"
      />
    </div>
  );
}