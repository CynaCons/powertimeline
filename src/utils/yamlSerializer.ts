import yaml from 'js-yaml';
import type { Event } from '../types';

/**
 * YAML Timeline Format Schema
 *
 * timeline:
 *   metadata:
 *     name: "Timeline Name"
 *     description: "Optional description"
 *     created: "2024-01-01T00:00:00.000Z"
 *     version: "1.0"
 *     exported_by: "Chronochart v0.2.8"
 *   events:
 *     - id: "event-1"
 *       date: "1961-01-20"
 *       title: "Event Title"
 *       description: "Event description"
 *       category: "politics"  # Optional
 */

interface TimelineMetadata {
  name: string;
  description?: string;
  created: string;
  version: string;
  exported_by: string;
}

interface TimelineYAML {
  timeline: {
    metadata: TimelineMetadata;
    events: Event[];
  };
}

export interface ExportOptions {
  timelineName?: string;
  description?: string;
  includeMetadata?: boolean;
}

export interface ImportResult {
  success: boolean;
  events?: Event[];
  metadata?: TimelineMetadata;
  error?: string;
}

/**
 * Exports timeline events to YAML format
 */
export function exportToYAML(events: Event[], options: ExportOptions = {}): string {
  const metadata: TimelineMetadata = {
    name: options.timelineName || `Timeline Export ${new Date().toLocaleDateString()}`,
    description: options.description,
    created: new Date().toISOString(),
    version: "1.0",
    exported_by: "Chronochart v0.2.8"
  };

  // Clean events for export (remove any internal properties)
  const cleanEvents = events.map(event => ({
    id: event.id,
    date: event.date,
    title: event.title,
    description: event.description,
    ...(event.category && { category: event.category })
  }));

  const timelineData: TimelineYAML = {
    timeline: {
      metadata,
      events: cleanEvents
    }
  };

  try {
    return yaml.dump(timelineData, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
      sortKeys: false
    });
  } catch (error) {
    throw new Error(`Failed to serialize timeline to YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Imports timeline events from YAML format
 */
export function importFromYAML(yamlContent: string): ImportResult {
  try {
    const parsed = yaml.load(yamlContent) as unknown;

    // Validate basic structure
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'Invalid YAML format: Root must be an object'
      };
    }

    const parsedObj = parsed as Record<string, unknown>;

    if (!parsedObj.timeline) {
      return {
        success: false,
        error: 'Invalid timeline format: Missing "timeline" root property'
      };
    }

    const timeline = parsedObj.timeline as Record<string, unknown>;

    // Validate events array
    if (!timeline.events || !Array.isArray(timeline.events)) {
      return {
        success: false,
        error: 'Invalid timeline format: Missing or invalid "events" array'
      };
    }

    // Validate and clean events
    const events: Event[] = [];
    for (let i = 0; i < timeline.events.length; i++) {
      const eventData = timeline.events[i];

      if (!eventData || typeof eventData !== 'object') {
        return {
          success: false,
          error: `Invalid event at index ${i}: Must be an object`
        };
      }

      // Validate required fields
      if (!eventData.id || typeof eventData.id !== 'string') {
        return {
          success: false,
          error: `Invalid event at index ${i}: Missing or invalid "id" field`
        };
      }

      if (!eventData.date || typeof eventData.date !== 'string') {
        return {
          success: false,
          error: `Invalid event at index ${i}: Missing or invalid "date" field`
        };
      }

      if (!eventData.title || typeof eventData.title !== 'string') {
        return {
          success: false,
          error: `Invalid event at index ${i}: Missing or invalid "title" field`
        };
      }

      // Create clean event object
      const event: Event = {
        id: eventData.id,
        date: eventData.date,
        title: eventData.title,
        description: eventData.description || '',
        ...(eventData.category && { category: eventData.category })
      };

      events.push(event);
    }

    return {
      success: true,
      events,
      metadata: timeline.metadata as TimelineMetadata | undefined
    };

  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      return {
        success: false,
        error: `YAML parsing error: ${error.message}`
      };
    }

    return {
      success: false,
      error: `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generates a filename for timeline export
 */
export function generateExportFilename(timelineName?: string): string {
  const safeName = (timelineName || 'timeline')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0];
  return `${safeName}-${date}.yaml`;
}

/**
 * Downloads YAML content as a file
 */
export function downloadYAML(yamlContent: string, filename: string): void {
  const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}