/**
 * Timeline Import/Export Service
 * v0.5.27 - AI-Ready YAML format for timeline import/export
 *
 * Provides functions to export timelines to YAML and import from YAML.
 * Format is designed to be simple enough for any LLM to generate.
 */

import * as yaml from 'js-yaml';
import type { Event, Timeline, TimelineVisibility } from '../types';

// ============================================================================
// YAML Format Types
// ============================================================================

/**
 * Event as represented in YAML format
 * Event IDs are mandatory to support external editing and change tracking
 */
export interface YamlEvent {
  id: string;             // Required: unique event identifier (e.g., "evt-001")
  date: string;           // Required: YYYY-MM-DD
  title: string;          // Required
  description?: string;   // Optional
  endDate?: string;       // Optional: YYYY-MM-DD (for date ranges)
  time?: string;          // Optional: HH:MM
  sources?: string[];     // Optional: array of source URLs/references
}

/**
 * Timeline metadata in YAML format
 */
export interface YamlTimeline {
  title: string;
  description?: string;
  visibility?: TimelineVisibility;  // Defaults to 'private' on import
}

/**
 * Complete YAML document structure
 */
export interface YamlDocument {
  version: 1;
  timeline: YamlTimeline;
  events: YamlEvent[];
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationError {
  line?: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: YamlDocument;
}

export class YamlSessionParseError extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('YAML validation failed');
    this.name = 'YamlSessionParseError';
    this.errors = errors;
  }
}

/**
 * Validate a date string is in YYYY-MM-DD format
 */
function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

/**
 * Validate a time string is in HH:MM format
 */
function isValidTime(timeStr: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Validate a parsed YAML document
 */
export function validateYamlDocument(doc: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Check document structure
  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [{ field: 'document', message: 'Invalid YAML document structure' }] };
  }

  const obj = doc as Record<string, unknown>;

  // Check version
  if (obj.version !== 1) {
    errors.push({ field: 'version', message: 'Version must be 1' });
  }

  // Check timeline section
  if (!obj.timeline || typeof obj.timeline !== 'object') {
    errors.push({ field: 'timeline', message: 'Missing timeline section' });
  } else {
    const timeline = obj.timeline as Record<string, unknown>;
    if (!timeline.title || typeof timeline.title !== 'string' || timeline.title.trim() === '') {
      errors.push({ field: 'timeline.title', message: 'Timeline title is required' });
    }
    if (timeline.description !== undefined && typeof timeline.description !== 'string') {
      errors.push({ field: 'timeline.description', message: 'Timeline description must be a string' });
    }
    if (timeline.visibility !== undefined) {
      if (!['public', 'unlisted', 'private'].includes(timeline.visibility as string)) {
        errors.push({ field: 'timeline.visibility', message: 'Visibility must be public, unlisted, or private' });
      }
    }
  }

  // Check events section
  if (!obj.events || !Array.isArray(obj.events)) {
    errors.push({ field: 'events', message: 'Missing events array' });
  } else {
    obj.events.forEach((event: unknown, index: number) => {
      if (!event || typeof event !== 'object') {
        errors.push({ field: `events[${index}]`, message: 'Invalid event object' });
        return;
      }

      const ev = event as Record<string, unknown>;

      // Required: id (mandatory for external editing and change tracking)
      if (!ev.id || typeof ev.id !== 'string' || (ev.id as string).trim() === '') {
        errors.push({ field: `events[${index}].id`, message: 'Event ID is required for change tracking' });
      }

      // Required: date
      if (!ev.date || typeof ev.date !== 'string') {
        errors.push({ field: `events[${index}].date`, message: 'Event date is required' });
      } else if (!isValidDate(ev.date as string)) {
        errors.push({ field: `events[${index}].date`, message: `Invalid date format: ${ev.date}. Use YYYY-MM-DD` });
      }

      // Required: title
      if (!ev.title || typeof ev.title !== 'string' || (ev.title as string).trim() === '') {
        errors.push({ field: `events[${index}].title`, message: 'Event title is required' });
      }

      // Optional: description
      if (ev.description !== undefined && typeof ev.description !== 'string') {
        errors.push({ field: `events[${index}].description`, message: 'Event description must be a string' });
      }

      // Optional: endDate
      if (ev.endDate !== undefined) {
        if (typeof ev.endDate !== 'string') {
          errors.push({ field: `events[${index}].endDate`, message: 'Event endDate must be a string' });
        } else if (!isValidDate(ev.endDate as string)) {
          errors.push({ field: `events[${index}].endDate`, message: `Invalid endDate format: ${ev.endDate}. Use YYYY-MM-DD` });
        }
      }

      // Optional: time
      if (ev.time !== undefined) {
        if (typeof ev.time !== 'string') {
          errors.push({ field: `events[${index}].time`, message: 'Event time must be a string' });
        } else if (!isValidTime(ev.time as string)) {
          errors.push({ field: `events[${index}].time`, message: `Invalid time format: ${ev.time}. Use HH:MM` });
        }
      }

      // Optional: sources (array of strings)
      if (ev.sources !== undefined) {
        if (!Array.isArray(ev.sources)) {
          errors.push({ field: `events[${index}].sources`, message: 'Event sources must be an array' });
        } else {
          ev.sources.forEach((source: unknown, srcIndex: number) => {
            if (typeof source !== 'string') {
              errors.push({ field: `events[${index}].sources[${srcIndex}]`, message: 'Each source must be a string' });
            }
          });
        }
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: obj as unknown as YamlDocument,
  };
}

// ============================================================================
// Export
// ============================================================================

/**
 * Export a timeline to YAML format
 */
export function exportTimelineToYaml(timeline: Timeline): string {
  const doc: YamlDocument = {
    version: 1,
    timeline: {
      title: timeline.title,
      ...(timeline.description && { description: timeline.description }),
      visibility: timeline.visibility,
    },
    events: timeline.events
      .map(event => ({
        id: event.id,  // Event ID is mandatory for change tracking
        date: event.date,
        title: event.title,
        ...(event.description && { description: event.description }),
        ...(event.endDate && { endDate: event.endDate }),
        ...(event.time && { time: event.time }),
        ...(event.sources && event.sources.length > 0 && { sources: event.sources }),
      }))
      // Sort chronologically for readability
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };

  // Generate YAML with header comment
  const header = `# PowerTimeline Export Format v1
# Generated: ${new Date().toISOString().split('T')[0]}
# Import this file at powertimeline.com to recreate the timeline
#
# Format (all events require an ID for change tracking):
#   - id: Unique event identifier (required)
#   - date: YYYY-MM-DD (required)
#   - title: Event title (required)
#   - description: Event description (optional)
#   - endDate: YYYY-MM-DD for date ranges (optional)
#   - time: HH:MM (optional)
#   - sources: Array of source URLs/references (optional)

`;

  return header + yaml.dump(doc, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false,
  });
}

/**
 * Generate a download filename for the timeline
 */
export function getExportFilename(timeline: { title: string }): string {
  const sanitized = timeline.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return `${sanitized || 'timeline'}.yaml`;
}

/**
 * Trigger a download of the timeline as YAML
 */
export function downloadTimelineAsYaml(timeline: Timeline): void {
  const yamlContent = exportTimelineToYaml(timeline);
  const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = getExportFilename(timeline);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Import
// ============================================================================

/**
 * Parse YAML string and validate structure
 */
export function parseTimelineYaml(yamlString: string): ValidationResult {
  try {
    const doc = yaml.load(yamlString);
    return validateYamlDocument(doc);
  } catch (error) {
    const yamlError = error as yaml.YAMLException;
    return {
      valid: false,
      errors: [{
        line: yamlError.mark?.line,
        field: 'yaml',
        message: yamlError.message || 'Invalid YAML syntax',
      }],
    };
  }
}

/**
 * Convert parsed YAML to Event objects
 * Uses IDs from YAML (mandatory) to support external editing and change tracking
 */
export function yamlEventsToEvents(yamlEvents: YamlEvent[]): Event[] {
  return yamlEvents.map(ye => ({
    id: ye.id,  // Use ID from YAML (mandatory field)
    date: ye.date,
    title: ye.title,
    ...(ye.description && { description: ye.description }),
    ...(ye.endDate && { endDate: ye.endDate }),
    ...(ye.time && { time: ye.time }),
    ...(ye.sources && ye.sources.length > 0 && { sources: ye.sources }),
  }));
}

/**
 * Import result containing parsed timeline data ready to save
 */
export interface ImportResult {
  title: string;
  description?: string;
  visibility: TimelineVisibility;
  events: Event[];
}

/**
 * Parse YAML and convert to timeline data ready for creation
 */
export function importTimelineFromYaml(yamlString: string): {
  success: boolean;
  result?: ImportResult;
  errors?: ValidationError[];
} {
  const validation = parseTimelineYaml(yamlString);

  if (!validation.valid || !validation.data) {
    return { success: false, errors: validation.errors };
  }

  const { timeline, events } = validation.data;

  return {
    success: true,
    result: {
      title: timeline.title,
      description: timeline.description,
      visibility: timeline.visibility || 'private',
      events: yamlEventsToEvents(events),
    },
  };
}

/**
 * Parse YAML and return events for import sessions
 */
export function parseYamlForSession(yamlContent: string): Partial<Event>[] {
  const validation = parseTimelineYaml(yamlContent);

  if (!validation.valid || !validation.data) {
    throw new YamlSessionParseError(validation.errors);
  }

  return yamlEventsToEvents(validation.data.events);
}

// ============================================================================
// Example Generation (for AI documentation)
// ============================================================================

/**
 * Generate an example YAML template
 */
export function generateExampleYaml(): string {
  return `# PowerTimeline Export Format v1
# Copy and modify this template to create your own timeline

version: 1

timeline:
  title: "My Timeline"
  description: "A brief description of your timeline"
  visibility: private  # Options: public, unlisted, private

events:
  - id: "evt-001"
    date: "2024-01-15"
    title: "First Event"
    description: "Description of what happened"

  - id: "evt-002"
    date: "2024-03-20"
    title: "Second Event"
    description: "Another important event"
    time: "14:30"
    sources:
      - "https://example.com/source1"
      - "https://example.com/source2"

  - id: "evt-003"
    date: "2024-06-01"
    endDate: "2024-06-15"
    title: "Multi-day Event"
    description: "An event spanning multiple days"
`;
}
