# PowerTimeline YAML Timeline Format

This document describes the YAML format used by PowerTimeline for timeline export and import.

## Format Overview

PowerTimeline uses a structured YAML format that includes metadata about the timeline and an array of events. This format is human-readable and can be easily shared between users or edited in any text editor.

## Schema Structure

```yaml
timeline:
  metadata:
    name: "Timeline Name"
    description: "Optional timeline description"
    created: "2024-01-01T00:00:00.000Z"
    version: "1.0"
    exported_by: "PowerTimeline v0.2.8"
  events:
    - id: "event-1"
      date: "1961-01-20"
      title: "Event Title"
      description: "Event description"
      category: "politics"  # Optional
    - id: "event-2"
      date: "1962-10-16"
      title: "Another Event"
      description: "Another description"
```

## Field Definitions

### Metadata Section

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable name for the timeline |
| `description` | string | No | Optional longer description |
| `created` | string | Yes | ISO 8601 timestamp of when timeline was created/exported |
| `version` | string | Yes | Format version (currently "1.0") |
| `exported_by` | string | Yes | Software identifier that created the export |

### Events Section

Each event in the `events` array has the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the event |
| `date` | string | Yes | Date in YYYY-MM-DD format |
| `title` | string | Yes | Event title/name |
| `description` | string | Yes | Event description (can be empty string) |
| `category` | string | No | Optional category classification |

## Date Format

Dates must be in ISO 8601 format: `YYYY-MM-DD`

Examples:
- `1961-01-20` (January 20, 1961)
- `2024-12-25` (December 25, 2024)

## Category Values

While the `category` field is optional, common values include:
- `politics`
- `military`
- `culture`
- `science`
- `technology`
- `sports`
- `personal`

## Example Complete Timeline

```yaml
timeline:
  metadata:
    name: "JFK Presidency Timeline"
    description: "Key events during John F. Kennedy's presidency"
    created: "2024-01-15T10:30:00.000Z"
    version: "1.0"
    exported_by: "PowerTimeline v0.2.8"
  events:
    - id: "jfk-inauguration"
      date: "1961-01-20"
      title: "JFK Inauguration"
      description: "John F. Kennedy is sworn in as the 35th President of the United States"
      category: "politics"
    - id: "bay-of-pigs"
      date: "1961-04-17"
      title: "Bay of Pigs Invasion"
      description: "Failed invasion of Cuba by CIA-trained Cuban exiles"
      category: "military"
    - id: "cuban-missile-crisis"
      date: "1962-10-16"
      title: "Cuban Missile Crisis Begins"
      description: "U-2 spy plane photographs Soviet missile sites in Cuba"
      category: "politics"
```

## Usage in PowerTimeline

### Exporting
1. Open the Developer Panel (Alt+D or click the settings icon)
2. Scroll to the "Timeline Export/Import" section
3. Click "📤 Export YAML" to download your timeline

### Importing
1. Open the Developer Panel
2. Click "📁 Import YAML"
3. Select a `.yaml` or `.yml` file
4. The timeline will be loaded (replacing current events)

## Error Handling

When importing, PowerTimeline validates:
- YAML syntax correctness
- Required field presence
- Data type correctness
- Date format validity

Common errors and solutions:
- **"YAML parsing error"**: Check file syntax with a YAML validator
- **"Missing required field"**: Ensure all events have `id`, `date`, `title`, and `description`
- **"Invalid date format"**: Use YYYY-MM-DD format only
- **"Invalid timeline format"**: Ensure root structure has `timeline.events` array

## Compatibility

This format is designed to be:
- **Human-readable**: Can be edited in any text editor
- **Version-controlled**: Works well with Git and other VCS
- **Interoperable**: Can be used by other timeline applications
- **Extensible**: Future versions can add fields while maintaining backward compatibility

## Future Enhancements

Planned additions to the format:
- Time of day support (YYYY-MM-DD HH:MM:SS)
- Event duration/end dates
- Media attachments (images, links)
- Event relationships/dependencies
- Custom metadata fields