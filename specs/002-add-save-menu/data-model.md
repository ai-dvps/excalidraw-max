# Data Model: Save Menu Feature

## Entities

### SaveState

Tracks the current save status of the drawing.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `hasUnsavedChanges` | boolean | required | True if drawing has modifications since last save |
| `currentFilePath` | string \| null | nullable | Absolute path to saved file; null if never saved |
| `lastSavedAt` | timestamp \| null | nullable | ISO 8601 timestamp of last successful save |
| `isSaving` | boolean | required | True if save operation is in progress |

### SaveMenuItem

Native menu item configuration.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | string | constant: `"save"` | Unique identifier for menu item |
| `text` | string | constant: `"Save"` | Display text shown in menu |
| `accelerator` | string | constant: `"CmdOrControl+S"` | Keyboard shortcut hint |
| `enabled` | boolean | derived | True when `hasUnsavedChanges` is true |

### SaveResult

Output of save operation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `success` | boolean | required | True if save completed successfully |
| `filePath` | string \| null | nullable | Path where file was saved (null if cancelled) |
| `error` | string \| null | nullable | Error message if success is false |

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                        Save State                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    save()    ┌───────────────────┐       │
│   │   New        │─────────────▶│   Saving           │       │
│   │   (no path)  │              │   (in progress)    │       │
│   └──────────────┘              └─────────┬─────────┘       │
│         ▲                                  │                 │
│         │                                  ▼                 │
│         │                         ┌───────────────────┐      │
│         │                         │   Saved           │      │
│         │                         │   (hasPath)       │      │
│         │                         └─────────┬─────────┘      │
│         │                                   │                │
│         │              modify()             │                │
│         └───────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### State Transitions

| From | To | Trigger | Side Effects |
|------|----|---------|--------------|
| New | Saving | User initiates save | Show file dialog |
| Saving | Saved | Save completes | Set `currentFilePath`, update `lastSavedAt`, clear `hasUnsavedChanges` |
| Saved | Saving | User initiates save | Use existing path, no dialog |
| Saved | Saved | Modify drawing | Set `hasUnsavedChanges` |

## Validation Rules

1. `currentFilePath` must be absolute, not relative
2. `currentFilePath` must point to accessible filesystem location
3. Save operation must complete within 2 seconds for drawings < 10MB
4. Menu item must be disabled when `hasUnsavedChanges` is false

## TypeScript Interface Definitions

```typescript
interface SaveState {
  hasUnsavedChanges: boolean;
  currentFilePath: string | null;
  lastSavedAt: string | null;  // ISO 8601
  isSaving: boolean;
}

interface SaveMenuItem {
  id: 'save';
  text: 'Save';
  accelerator: 'CmdOrControl+S';
  enabled: boolean;
}

interface SaveResult {
  success: boolean;
  filePath: string | null;
  error: string | null;
}
```

## Rust Structure Definitions

```rust
#[derive(Clone, Debug)]
pub struct SaveState {
    pub has_unsaved_changes: bool,
    pub current_file_path: Option<PathBuf>,
    pub last_saved_at: Option<chrono::DateTime<Utc>>,
    pub is_saving: bool,
}

#[derive(Clone, Debug)]
pub struct SaveMenuItem {
    pub id: &'static str,
    pub text: &'static str,
    pub accelerator: &'static str,
    pub enabled: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SaveResult {
    pub success: bool,
    pub file_path: Option<PathBuf>,
    pub error: Option<String>,
}
```
