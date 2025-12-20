# Quickstart: Save Menu Feature Implementation

## Prerequisites

1. **Add the global-shortcut plugin:**
   ```bash
   cd src-tauri && cargo add tauri-plugin-global-shortcut
   ```

2. **Update capabilities** in `src-tauri/capabilities/default.json`:
   ```json
   {
     "permissions": [
       "global-shortcut:allow-register",
       "global-shortcut:allow-unregister"
     ]
   }
   ```

## Implementation Steps

### Step 1: Create Save Commands (Rust)

Create `src-tauri/src/commands/save_commands.rs`:

```rust
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveResult {
    pub success: bool,
    pub file_path: Option<PathBuf>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn save_drawing(
    app: AppHandle,
    json_data: String,
    force_dialog: bool,
    current_path: Option<PathBuf>,
) -> Result<SaveResult, String> {
    let path = if force_dialog || current_path.is_none() {
        // Show file dialog
        let path = tauri::api::dialog::blocking::file_save(
            None,
            Some(tauri::api::dialog::FileDialogBuilder::new().set_title("Save Drawing")),
        );
        match path {
            Some(p) => p,
            None => return Ok(SaveResult {
                success: false,
                file_path: None,
                error: Some("Save cancelled".to_string()),
            }),
        }
    } else {
        // Use existing path
        current_path.unwrap()
    };

    // Write to file
    match std::fs::write(&path, json_data) {
        Ok(_) => {
            app.emit("save-state-changed", serde_json::json!({
                "hasUnsavedChanges": false,
                "currentFilePath": path.to_string_lossy().to_string()
            }))?;

            Ok(SaveResult {
                success: true,
                file_path: Some(path),
                error: None,
            })
        }
        Err(e) => Ok(SaveResult {
            success: false,
            file_path: None,
            error: Some(e.to_string()),
        }),
    }
}
```

### Step 2: Register Commands in lib.rs

Update `src-tauri/src/lib.rs`:

```rust
mod commands;

use commands::save_commands::{save_drawing, SaveResult};

// Declare the type for往返 serialization
tauri::bundle::generate_user_data_accessor!(SaveResult);

#[tauri::command]
async fn trigger_save(app: AppHandle) -> Result<(), String> {
    // This will be called from frontend
    // Frontend passes drawing data
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, save_drawing, trigger_save])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 3: Create Menu with Save Item

In `lib.rs`, replace the `run()` function to include menu setup:

```rust
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn create_menu(app: &tauri::App) -> Result<tauri::WindowMenuEvent<'tauri>, tauri::Error> {
    // Create Save menu item with accelerator
    let save_item = MenuItemBuilder::with_id("save", "Save")
        .accelerator("CmdOrControl+S")?
        .build(app)?;

    // Create File submenu
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&save_item)
        .separator()
        .text("quit", "Quit")
        .build()?;

    // Create main menu
    let menu = MenuBuilder::new(app).items(&[&file_menu]).build()?;
    app.set_menu(menu)?;

    // Handle menu events
    let app_handle = app.handle().clone();
    app.on_menu_event(move |_app_handle, event| {
        if event.id().0 == "save" {
            // Emit event to frontend to trigger save
            let _ = app_handle.emit("menu-save-triggered", ());
        }
    });

    // Register global shortcut
    let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);
    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |_app, shortcut, event| {
                if shortcut == &save_shortcut && event.state() == ShortcutState::Pressed {
                    let _ = app_handle.emit("shortcut-save-triggered", ());
                }
            })
            .build(),
    )?;
    app.global_shortcut().register(save_shortcut)?;

    Ok(())
}
```

### Step 4: Frontend Save Service

Create `src/services/saveService.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { SaveState } from '../types/save';

let currentSaveState: SaveState = {
  hasUnsavedChanges: false,
  currentFilePath: null,
  lastSavedAt: null,
  isSaving: false,
};

export const saveService = {
  /**
   * Initialize save state listeners
   */
  init(): () => void {
    const unlistenSave = listen('menu-save-triggered', () => {
      this.triggerSave();
    });

    const unlistenShortcut = listen('shortcut-save-triggered', () => {
      this.triggerSave();
    });

    return () => {
      unlistenSave.then((fn) => fn());
      unlistenShortcut.then((fn) => fn());
    };
  },

  /**
   * Trigger save operation
   */
  async triggerSave(): Promise<boolean> {
    if (currentSaveState.isSaving) {
      return false;
    }

    currentSaveState.isSaving = true;

    try {
      // Get drawing data from Excalidraw
      const drawingData = await this.getDrawingData();

      const result = await invoke<SaveResult>('save_drawing', {
        jsonData: JSON.stringify(drawingData),
        forceDialog: !currentSaveState.currentFilePath,
        currentPath: currentSaveState.currentFilePath,
      });

      if (result.success && result.filePath) {
        currentSaveState.currentFilePath = result.filePath;
        currentSaveState.lastSavedAt = new Date().toISOString();
        currentSaveState.hasUnsavedChanges = false;
        return true;
      } else {
        console.error('Save failed:', result.error);
        return false;
      }
    } finally {
      currentSaveState.isSaving = false;
    }
  },

  /**
   * Mark drawing as having unsaved changes
   */
  markUnsaved(): void {
    currentSaveState.hasUnsavedChanges = true;
  },

  /**
   * Get current save state
   */
  getState(): SaveState {
    return { ...currentSaveState };
  },

  /**
   * Get drawing data from Excalidraw canvas
   * (implementation depends on Excalidraw API)
   */
  async getDrawingData(): Promise<unknown> {
    // TODO: Integrate with ExcalidrawCanvas component
    throw new Error('Not implemented');
  },
};
```

### Step 5: Integrate with ExcalidrawCanvas

In `src/components/ExcalidrawCanvas.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { saveService } from '../services/saveService';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw';

export function ExcalidrawCanvas() {
  const excalidrawAPI = useRef<ExcalidrawImperativeAPI | null>(null);
  const [saveState, setSaveState] = useState(saveService.getState());

  useEffect(() => {
    // Initialize save listeners
    const cleanup = saveService.init();

    return cleanup;
  }, []);

  const handleChange = (_elements: any, appState: any, files: any) => {
    // Called when drawing changes
    saveService.markUnsaved();
    setSaveState(saveService.getState());
  };

  return (
    <div>
      {/* Excalidraw component with onChange handler */}
    </div>
  );
}
```

## Testing

### Unit Tests

```typescript
// tests/unit/saveService.test.ts
describe('saveService', () => {
  beforeEach(() => {
    // Reset state
  });

  it('marks drawing as unsaved when changed', () => {
    saveService.markUnsaved();
    expect(saveService.getState().hasUnsavedChanges).toBe(true);
  });

  it('returns current save state', () => {
    const state = saveService.getState();
    expect(state).toHaveProperty('hasUnsavedChanges');
    expect(state).toHaveProperty('currentFilePath');
  });
});
```

### Integration Test

```typescript
// tests/integration/save-flow.test.ts
describe('Save flow', () => {
  it('completes save operation when triggered', async () => {
    // Mock drawing data
    const mockDrawingData = { elements: [], appState: {} };

    // Mock file dialog
    const mockSaveResult = {
      success: true,
      filePath: '/tmp/test.excalidraw',
      error: null,
    };

    vi.mocked(invoke).mockResolvedValue(mockSaveResult);

    const result = await saveService.triggerSave();

    expect(result).toBe(true);
    expect(saveService.getState().currentFilePath).toBe('/tmp/test.excalidraw');
  });
});
```

## Next Steps

1. Implement `getDrawingData()` to extract data from Excalidraw
2. Add error handling UI for save failures
3. Add "Save As" functionality for explicit file location changes
4. Write Rust unit tests for save commands
