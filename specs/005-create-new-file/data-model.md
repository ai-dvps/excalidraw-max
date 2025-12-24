# Data Model: Create New File Feature

## Entities

### New File Request

Represents the intent to create a new empty file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `windowLabel` | string | Yes | Unique label for the new window (e.g., "excalidraw-3") |
| `elements` | array | Yes | Empty array for new canvas |
| `appState` | object | Yes | Canvas state including user settings |
| `files` | object | Yes | Empty files object |

### User Settings (Existing Entity)

User preferences that apply to new files.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `editor.defaultBackgroundColor` | string | "#ffffff" | Canvas background color |

### Window State (Existing Entity)

Tracks state of each window.

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `state` | string | "created" \| "saved" \| "edited" | Window content state |
| `filePath` | string \| null | null | Associated file path (null for new files) |
| `lastModified` | Date | - | Last modification timestamp |

## Validation Rules

- Window labels must be unique across all open windows
- Empty canvas initialization must not contain any elements
- Background color must be valid hex format (#RRGGBB or #RGB)

## State Transitions

```
new window → "created" state
  ↓ (user edits)
"edited" state
  ↓ (user saves)
"saved" state with filePath
```
