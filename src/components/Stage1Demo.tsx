/**
 * Stage 1 Demo: Foundation with Full Cards Only
 * 
 * Test page for the first iteration of our iterative layout engine building.
 * Demonstrates temporal positioning with 1-5 events using only full cards.
 */

import { useState } from 'react';
import { SimpleTimeline } from './SimpleTimeline';
import type { Event } from '../types';

// Test data sets for Stage 1
const testScenarios = {
  single: [
    {
      id: 'test-1',
      title: 'Single Event Test',
      description: 'This is a single event to test basic positioning and timeline axis.',
      date: '2024-06-15T10:00:00Z'
    }
  ] as Event[],
  
  two: [
    {
      id: 'test-1',
      title: 'First Event',
      description: 'First event should appear above the timeline.',
      date: '2024-06-10T10:00:00Z'
    },
    {
      id: 'test-2', 
      title: 'Second Event',
      description: 'Second event should appear below the timeline.',
      date: '2024-06-20T14:00:00Z'
    }
  ] as Event[],
  
  three: [
    {
      id: 'test-1',
      title: 'Event Above',
      description: 'First event positioned above timeline.',
      date: '2024-06-05T10:00:00Z'
    },
    {
      id: 'test-2',
      title: 'Event Below', 
      description: 'Second event positioned below timeline.',
      date: '2024-06-15T14:00:00Z'
    },
    {
      id: 'test-3',
      title: 'Event Above Again',
      description: 'Third event back above timeline following alternating pattern.',
      date: '2024-06-25T16:00:00Z'
    }
  ] as Event[],
  
  five: [
    {
      id: 'test-1',
      title: 'Project Kickoff',
      description: 'Initial project kickoff meeting with stakeholders.',
      date: '2024-01-15T09:00:00Z'
    },
    {
      id: 'test-2',
      title: 'Design Review',
      description: 'Design review session with the development team.',
      date: '2024-02-20T14:00:00Z'
    },
    {
      id: 'test-3',
      title: 'Development Start',
      description: 'Beginning of development phase with sprint planning.',
      date: '2024-03-10T10:00:00Z'
    },
    {
      id: 'test-4',
      title: 'Testing Phase',
      description: 'Quality assurance testing and bug fixes.',
      date: '2024-04-25T11:00:00Z'
    },
    {
      id: 'test-5',
      title: 'Project Launch',
      description: 'Official project launch and deployment to production.',
      date: '2024-05-30T15:00:00Z'
    }
  ] as Event[],
  
  dateRange: [
    {
      id: 'test-1',
      title: 'Ancient Event',
      description: 'Event from long ago to test wide date ranges.',
      date: '2020-01-01T00:00:00Z'
    },
    {
      id: 'test-2',
      title: 'Recent Event',
      description: 'Recent event to create wide temporal spread.',
      date: '2024-12-31T23:59:59Z'
    }
  ] as Event[]
};

export function Stage1Demo() {
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof testScenarios>('single');
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stage 1: Foundation with Full Cards Only
          </h1>
          <p className="text-gray-600">
            Testing basic temporal positioning, timeline axis, and simple above/below card placement.
            All cards are full-sized (200x96px) with no clustering or degradation.
          </p>
        </div>
        
        {/* Test Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Test Scenarios:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(testScenarios).map((scenario) => (
              <button
                key={scenario}
                onClick={() => setSelectedScenario(scenario as keyof typeof testScenarios)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedScenario === scenario
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {scenario === 'single' && 'Single Event'}
                {scenario === 'two' && 'Two Events'}
                {scenario === 'three' && 'Three Events'} 
                {scenario === 'five' && 'Five Events'}
                {scenario === 'dateRange' && 'Wide Date Range'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Current Scenario Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Current Test: {selectedScenario} ({testScenarios[selectedScenario].length} events)
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            {testScenarios[selectedScenario].map((event, index) => (
              <div key={event.id}>
                <strong>{index + 1}.</strong> {event.title} - {new Date(event.date).toLocaleDateString()}
                {index % 2 === 0 ? ' (above)' : ' (below)'}
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4">Timeline Visualization</h3>
          <SimpleTimeline
            events={testScenarios[selectedScenario]}
            width={1200}
            height={600}
            className="border border-gray-200 rounded"
          />
        </div>
        
        {/* Stage 1 Checklist */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Stage 1 Success Criteria:</h3>
          <div className="text-sm text-green-800 space-y-1">
            <div>✅ Timeline axis with proper date range and labels</div>
            <div>✅ Events positioned at correct temporal locations</div>
            <div>✅ Cards alternate above/below timeline pattern</div>
            <div>✅ Full cards only (200x96px, fixed size)</div>
            <div>✅ Connection lines from cards to timeline anchors</div>
            <div>✅ Support for 1-5 events with no overlaps</div>
            <div>✅ Responsive date formatting based on range</div>
          </div>
        </div>
        
      </div>
    </div>
  );
}