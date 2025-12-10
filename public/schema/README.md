# PowerTimeline YAML Schema

This directory contains the JSON Schema for PowerTimeline's YAML timeline format.

## Schema Location

- **JSON Schema**: `/schema/timeline.schema.json`
- **Production URL**: `https://powertimeline.com/schema/timeline.schema.json`
- **Example YAML**: `/schema/example.yaml` - Demonstrates all supported features

## Quick Start

### Minimal Example

```yaml
timeline:
  events:
    - id: "event-1"
      date: "1968-06-05"
      title: "RFK Assassination"
```

### Complete Example

```yaml
timeline:
  metadata:
    name: "Historical Events"
    description: "Key moments in history"
    created: "2024-01-01T00:00:00.000Z"
    version: "1.0"
    exported_by: "PowerTimeline v0.7.14"
  events:
    - id: "event-1"
      date: "1968-06-05"
      title: "RFK Assassination"
      description: "Robert F. Kennedy was assassinated at the Ambassador Hotel in Los Angeles."
      time: "00:15"
      sources:
        - "https://en.wikipedia.org/wiki/Assassination_of_Robert_F._Kennedy"

    - id: "event-2"
      date: "1969-07-20"
      endDate: "1969-07-21"
      title: "Moon Landing"
      description: "Apollo 11 astronauts Neil Armstrong and Buzz Aldrin became the first humans to walk on the Moon."
      time: "20:17"
      sources:
        - "https://www.nasa.gov/mission_pages/apollo/apollo11.html"
```

## Schema Structure

### Root Object

```yaml
timeline:          # Required root object
  metadata:        # Optional metadata section
  events:          # Required events array
```

### Metadata (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Timeline name |
| `description` | string | No | Timeline description |
| `created` | string | No | ISO 8601 timestamp |
| `version` | string | No | Schema version (default: "1.0") |
| `exported_by` | string | No | Exporting application version |

### Events (Required)

Each event must have the following structure:

| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `id` | string | **Yes** | UUID or unique string | Unique event identifier |
| `date` | string | **Yes** | `YYYY-MM-DD` | Event date (ISO 8601) |
| `title` | string | **Yes** | - | Event title |
| `description` | string | No | Markdown | Event description |
| `endDate` | string | No | `YYYY-MM-DD` | End date for time ranges |
| `time` | string | No | `HH:MM` (24-hour) | Time of day |
| `sources` | array | No | string[] | Source URLs or references |

## Field Details

### Required Fields

Every event **must** include:
- `id`: Unique identifier (UUIDs recommended)
- `date`: ISO 8601 date in `YYYY-MM-DD` format
- `title`: Non-empty event title

### Optional Fields

#### Date/Time Fields
- `endDate`: For events spanning multiple days (e.g., conferences, battles)
- `time`: Time in 24-hour format (`HH:MM`), e.g., `14:30` or `09:00`

#### Content Fields
- `description`: Supports markdown formatting for rich text
- `sources`: Array of URLs or text references for fact-checking

## Examples

### Single Event

```yaml
timeline:
  events:
    - id: "moon-landing"
      date: "1969-07-20"
      title: "Apollo 11 Moon Landing"
      description: "First humans on the Moon"
      time: "20:17"
```

### Multi-Day Event

```yaml
timeline:
  events:
    - id: "wwii-d-day"
      date: "1944-06-06"
      endDate: "1944-06-30"
      title: "D-Day and Battle of Normandy"
      description: "Allied invasion of Normandy, France"
```

### Event with Sources

```yaml
timeline:
  events:
    - id: "rfk-1968"
      date: "1968-06-05"
      title: "RFK Assassination"
      sources:
        - "https://en.wikipedia.org/wiki/Assassination_of_Robert_F._Kennedy"
        - "National Archives"
```

### Rich Description with Markdown

```yaml
timeline:
  events:
    - id: "apollo-11"
      date: "1969-07-20"
      title: "Moon Landing"
      description: |
        **Apollo 11** mission achievements:

        - Neil Armstrong: First person on the Moon
        - Buzz Aldrin: Second person on the Moon
        - Michael Collins: Command module pilot

        Famous quote: "That's one small step for man, one giant leap for mankind."
```

## Validation

The schema enforces:

1. **Required Structure**: Timeline must have `events` array
2. **Required Event Fields**: Each event must have `id`, `date`, and `title`
3. **Date Format**: Dates must match `YYYY-MM-DD` pattern
4. **Time Format**: Times must match `HH:MM` 24-hour pattern
5. **No Extra Fields**: Only documented fields are allowed

## Using the Schema

### For AI Agents

AI agents can discover this schema at:
```
https://powertimeline.com/schema/timeline.schema.json
```

The schema provides:
- Field definitions and constraints
- Type information
- Format requirements
- Examples for each field

### For Developers

Validate YAML files against the schema using tools like:

```bash
# Using ajv-cli
ajv validate -s timeline.schema.json -d timeline.yaml

# Using check-jsonschema
check-jsonschema --schemafile timeline.schema.json timeline.yaml
```

### For Users

Import YAML files through PowerTimeline's UI:
1. Click "Import YAML" button in the developer panel
2. Select your `.yaml` file
3. Review the preview
4. Confirm to add events to your timeline

## Format Version

Current version: **1.0**

This schema is compatible with PowerTimeline v0.7.14 and later.

## Related Documentation

- [SRS_EDITOR_IMPORT_EXPORT.md](../../docs/SRS_EDITOR_IMPORT_EXPORT.md) - Import/Export requirements
- [yamlSerializer.ts](../../src/utils/yamlSerializer.ts) - Implementation
- [YAML.org](https://yaml.org/) - YAML specification

## Support

For issues or questions:
- GitHub Issues: https://github.com/cyrilk7/powertimeline/issues
- Documentation: https://powertimeline.com/docs
