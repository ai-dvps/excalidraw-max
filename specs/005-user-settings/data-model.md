# Data Model: User Settings

## UserSettings

Top-level settings container for the entire application.

```typescript
interface UserSettings {
  general: GeneralSettings
  appearance: AppearanceSettings
  shortcuts: ShortcutsSettings
  editor: EditorSettings
}
```

**Storage Key**: `settings.json` (Tauri store)

**Default Value**:
```typescript
const defaultSettings: UserSettings = {
  general: {},
  appearance: {},
  shortcuts: {},
  editor: {
    defaultBackgroundColor: '#ffffff'
  }
}
```

## GeneralSettings

Reserved for future general application settings.

```typescript
interface GeneralSettings {
  // Placeholder - extend as needed
}
```

## AppearanceSettings

Reserved for future appearance preferences.

```typescript
interface AppearanceSettings {
  // Placeholder - extend as needed
}
```

## ShortcutsSettings

Reserved for future keyboard shortcut customization.

```typescript
interface ShortcutsSettings {
  // Placeholder - extend as needed
}
```

## EditorSettings

Editor-specific configuration for the Excalidraw canvas.

```typescript
interface EditorSettings {
  /**
   * Default background color for new Excalidraw canvases.
   * Format: Hex color code (e.g., '#ffffff', '#ff0000')
   */
  defaultBackgroundColor: string
}
```

**Validation Rules**:
- Must be a valid hex color string
- Pattern: `^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`
- Default: `'#ffffff'` (white)

## SettingsCategory

Configuration for settings navigation categories.

```typescript
interface SettingsCategory {
  id: string
  name: string
  icon?: React.ReactNode
  order: number
}
```

**Predefined Categories**:

| ID | Name | Icon | Order |
|----|------|------|-------|
| `general` | General | - | 1 |
| `appearance` | Appearance | - | 2 |
| `shortcuts` | Shortcuts | - | 3 |
| `editor` | Editor | - | 4 |

## State Transitions

### Settings Modal States

```
┌─────────────┐
│   Closed     │←─────────────────────────────┐
└──────┬──────┘                              │
       │ Open Modal                          │
       ↓                                     │
┌─────────────┐     ┌─────────────┐          │
│   Editing   │────→│  Discard?   │──────────┘
└──────┬──────┘     │  (confirm)  │
       │ Save       └─────────────┘
       ↓
┌─────────────┐
│   Saved     │
└──────┬──────┘
       │ Close Modal
       ↓
    Closed
```

### File States

```
Missing/Corrupted ──→ Load Defaults ──→ User Notified
        ↓
   Create New File
```

## Validation Functions

```typescript
// Validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// Validate entire settings object
function validateSettings(settings: unknown): settings is UserSettings {
  if (!settings || typeof settings !== 'object') return false
  const s = settings as any
  if (s.editor?.defaultBackgroundColor && !isValidHexColor(s.editor.defaultBackgroundColor)) {
    return false
  }
  return true
}
```

## Rust Data Structure (Backend)

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSettings {
    pub general: Option<serde_json::Value>,
    pub appearance: Option<serde_json::Value>,
    pub shortcuts: Option<serde_json::Value>,
    pub editor: EditorSettings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorSettings {
    #[serde(rename = "defaultBackgroundColor")]
    pub default_background_color: String,
}
```
