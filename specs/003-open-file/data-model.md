# Data Model: Open File Feature

## Core Entities

### ExcalidrawFile

The data structure representing an Excalidraw drawing file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `elements` | `ExcalidrawElement[]` | Yes | Array of drawing elements (shapes, text, etc.) |
| `appState` | `AppState` | Yes | Application state (view mode, zoom, scroll, etc.) |
| `files` | `Record<string, FileId>` | Yes | References to embedded image files |
| `version` | `number` | No | Excalidraw format version |

### ExcalidrawElement

Base structure for all drawing elements.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique element identifier |
| `type` | `string` | Yes | Element type (rectangle, ellipse, text, etc.) |
| `x` | `number` | Yes | X position |
| `y` | `number` | Yes | Y position |
| `width` | `number` | No | Element width |
| `height` | `number` | No | Element height |
| `strokeColor` | `string` | No | Stroke color |
| `backgroundColor` | `string` | No | Background fill color |

### AppState

Application state for the Excalidraw canvas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `viewModeEnabled` | `boolean` | No | Whether view-only mode is active |
| `zenModeEnabled` | `boolean` | No | Whether zen mode is active |
| `theme` | `'light' \| 'dark'` | No | UI theme |
| `zoom` | `number` | No | Current zoom level |

## API Response Types

### LoadResult

Response from the `read_drawing_file` Rust command.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the load succeeded |
| `data` | `ExcalidrawFile` | The loaded file data (if successful) |
| `error` | `string` | Error message (if failed) |

### InitialData

Prop passed to Excalidraw component to initialize the canvas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `elements` | `ImportedBinaryState['elements']` | No | Elements to load |
| `appState` | `Partial<AppState>` | No | Initial app state |
| `files` | `Record<string, FileId>` | No | Embedded files |

## Validation Rules

1. **File must be valid JSON**: Parse must succeed without errors
2. **File must have required fields**: At minimum, `elements` array must exist
3. **Elements must have required fields**: Each element must have `id`, `type`, `x`, `y`
4. **Version compatibility**: Unknown element types are ignored gracefully
