/**
 * AI Context Builder
 * v0.7.0 - Builds context object to send to Gemini API
 */

import type { Event, Timeline } from '../types';
import type { AIContext } from '../types/ai';

interface BuildContextOptions {
  timeline: Timeline | null;
  events: Event[];
  selectedEvent?: Event | null;
  visibleDateRange?: { start: Date; end: Date };
}

/**
 * Build AI context from current timeline state
 */
export function buildAIContext({
  timeline,
  events,
  selectedEvent,
  visibleDateRange,
}: BuildContextOptions): AIContext {
  // Filter to visible events if date range provided
  let visibleEvents = events;
  
  if (visibleDateRange) {
    visibleEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= visibleDateRange.start && eventDate <= visibleDateRange.end;
    });
  }
  
  // Limit to reasonable number of events (avoid token overflow)
  const MAX_EVENTS = 50;
  if (visibleEvents.length > MAX_EVENTS) {
    // Prioritize: selected event first, then recent, then by date
    const selected = selectedEvent ? [selectedEvent] : [];
    const others = visibleEvents
      .filter(e => e.id !== selectedEvent?.id)
      .slice(0, MAX_EVENTS - selected.length);
    visibleEvents = [...selected, ...others];
  }

  // Build date range from events
  let dateRange: { start: string; end: string } | undefined;
  if (events.length > 0) {
    const dates = events.map(e => new Date(e.date).getTime());
    dateRange = {
      start: new Date(Math.min(...dates)).toISOString().split('T')[0],
      end: new Date(Math.max(...dates)).toISOString().split('T')[0],
    };
  }

  return {
    timeline: {
      id: timeline?.id || '',
      title: timeline?.title || 'Untitled Timeline',
      description: timeline?.description,
      dateRange,
    },
    visibleEvents: visibleEvents.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      description: event.description,
      sources: event.sources,
    })),
    selectedEvent: selectedEvent ? {
      id: selectedEvent.id,
      title: selectedEvent.title,
      date: selectedEvent.date,
      description: selectedEvent.description,
      sources: selectedEvent.sources,
    } : undefined,
    conversationHistory: [], // Will be filled by useAISession
  };
}

/**
 * Estimate token count for context (rough approximation)
 * ~4 chars per token for English text
 */
export function estimateTokenCount(context: AIContext): number {
  const json = JSON.stringify(context);
  return Math.ceil(json.length / 4);
}
