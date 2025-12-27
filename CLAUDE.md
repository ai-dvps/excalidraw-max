# CLAUDE.md

This file provides guidance for Claude Code when working with this project.

## Project Overview

**excalimaxdraw** is a desktop application built with:
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Tauri v2 (Rust)
  - docs: https://v2.tauri.app/start/
- **Package Manager:** pnpm
- **Platform:** macOS (desktop)

## Project Structure

```
excalimaxdraw/
├── src/                    # React frontend (TypeScript)
│   ├── App.tsx             # Main React component
│   ├── main.tsx            # React entry point
│   ├── App.css             # App styling
│   ├── assets/             # Static assets
│   └── vite-env.d.ts       # Vite type declarations
├── src-tauri/              # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs         # Rust entry point
│   │   ├── lib.rs          # Tauri commands & app logic
│   │   └── build.rs        # Build script
│   ├── capabilities/       # Security permission configs
│   │   └── default.json    # Default capability schema
│   ├── gen/                # Auto-generated schemas
│   ├── icons/              # App icons for distribution
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Commands

```bash
# Development
pnpm dev                   # Start Vite dev server (port 1420)

# Build
pnpm build                 # TypeScript check + Vite build
pnpm tauri build           # Build Tauri app (production)
pnpm tauri build --debug   # Build Tauri app (debug)

# Other
pnpm preview               # Preview production build
pnpm tauri dev             # Run Tauri dev mode (with native window)
```

## Development Notes

- **Vite Dev Server:** `http://localhost:1420`
- **HMR Port:** 1421
- **Frontend Build Output:** `dist/`
- **Frontend Dist Path:** `../dist` (configured in tauri.conf.json)

## Tauri Configuration

The app is configured in `src-tauri/tauri.conf.json`:
- **Product Name:** excalimaxdraw
- **Bundle ID:** com.aidvps.excalimaxdraw.app
- **Default Window:** 800x600px

### Capabilities

Permissions are configured in `src-tauri/capabilities/default.json`:
- `core:default` - Core Tauri permissions
- `opener:default` - Open URLs/files permission

## Handling Window Close Events (VIP Flag Pattern)

When using `onCloseRequested` to show a confirmation dialog, calling `win.close()` from within the handler triggers another close event, causing an infinite loop of dialogs.

**Solution: Use a "VIP flag" pattern** (`src/hooks/useWindowCloseHandler.ts`):

```typescript
export function useWindowCloseHandler(): void {
  // Flag that allows close to proceed without showing dialog
  const ignoreCloseRequest = useRef(false);
  // Flag to prevent duplicate processing
  const closeInProgress = useRef(false);

  const handleClose = useCallback(async (event: any) => {
    // 1. CHECK FIRST: If we decided to close, let it happen!
    if (ignoreCloseRequest.current) {
      console.log('[Close Handler] Force close - allowing');
      return; // Returns WITHOUT preventDefault(), window closes
    }

    // 2. NOW prevent default for normal user interactions
    event.preventDefault();

    // 3. Prevent duplicate processing
    if (closeInProgress.current) return;
    closeInProgress.current = true;

    // ... show dialog ...

    if (choice === 'No' || (choice === 'Yes' && saved)) {
      // 4. Set VIP flag BEFORE closing
      ignoreCloseRequest.current = true;
      await win.close();
    }
  }, []);

  // ... setup handler ...
}
```

**How it works:**
1. Check `ignoreCloseRequest.current` FIRST in the handler
2. If true, return immediately WITHOUT calling `preventDefault()` - the window closes
3. Before calling `win.close()`, set `ignoreCloseRequest.current = true`
4. When `win.close()` triggers another `onCloseRequested` event, the flag is checked first and the handler exits without showing the dialog again

This is cleaner than:
- Removing the handler before close (fragile, race conditions)
- Using Rust events to close (adds complexity)

## Adding New Tauri Commands

To add a new Tauri command in Rust:

1. Add the function with `#[tauri::command]` macro in `src-tauri/src/lib.rs` or a commands module
2. Register it in the `run` function builder
3. Import and use it in the frontend via `@tauri-apps/api/core`

Example:
```rust
#[tauri::command]
fn my_command(arg: String) -> String {
    // logic here
}

// In the run() builder:
// .invoke_handler(tauri::generate_handler![greet, my_command])
```

### Tauri Command Parameter Naming Convention

**Important:** Tauri automatically converts parameter names between Rust and JavaScript:

- **Rust parameters**: Use `snake_case` (e.g., `app_state`, `file_path`)
- **Frontend invoke()**: Use `camelCase` (e.g., `appState`, `filePath`)

Example mismatch that causes errors:
```rust
// Rust - uses app_state (snake_case)
pub fn create_window_with_data(
    _app: AppHandle,
    elements: Vec<serde_json::Value>,
    app_state: serde_json::Value,  // snake_case
    files: serde_json::Value
) -> Result<WindowResult, String> { ... }
```

```typescript
// Frontend - MUST use appState (camelCase) and SPREAD the object
const result = await invoke('create_window_with_data', {
  elements: initialData.elements,
  appState: {...initialData.appState},  // Spread to ensure proper serialization
  files: initialData.files,
});
```

**Why spread?** Direct assignment like `appState: initialData.appState` may cause serialization issues with nested objects. Always use `{...object}` spread syntax for nested objects.

If you get the error "missing required key appState", check that the frontend is using camelCase while Rust uses snake_case.

### Optional Parameters

Use `Option<T>` in Rust for optional parameters:

```rust
// Rust - name is optional (None if not provided)
pub fn create_window_with_data(
    _app: AppHandle,
    elements: Vec<serde_json::Value>,
    app_state: serde_json::Value,
    files: serde_json::Value,
    name: Option<String>,  // Optional parameter
) -> Result<WindowResult, String> { ... }
```

```typescript
// Frontend - can omit optional parameters
const result = await invoke('create_window_with_data', {
  elements: initialData.elements || [],
  appState: initialData.appState || {},
  files: initialData.files || {},
  name: initialData.name,  // Optional - only passed if present
});
```

The `DrawingData` struct must also include the optional field:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DrawingData {
    pub elements: Vec<serde_json::Value>,
    #[serde(rename = "appState")]
    pub app_state: serde_json::Value,
    pub files: serde_json::Value,
    pub name: Option<String>,  // Match the parameter
}
```

### Accessing Rust Response Fields

When accessing fields from Rust responses, use **snake_case** (matching the Rust struct):

```rust
// Rust struct - uses snake_case
pub struct SaveResult {
    pub success: bool,
    pub file_path: Option<String>,  // <-- snake_case
    pub error: Option<String>,
}
```

```typescript
// TypeScript type - MUST use snake_case to match Rust struct
export interface SaveResult {
  success: boolean;
  file_path: string | null;  // <-- snake_case
  error: string | null;
}

// Accessing the response - use snake_case
if (result.success && result.file_path) {
  console.log('Saved to:', result.file_path);
}
```

**Summary:**
- **TS → Rust (invoke)**: camelCase parameters → Rust converts to snake_case
- **Rust → TS (response)**: Use snake_case (matches Rust struct field names)

## Menu & Shortcuts

### Menu Structure

The app uses native menu structure in `src-tauri/src/lib.rs`:

```rust
// Top-level menus added to application menu bar
let app_menu = SubmenuBuilder::new(app, "App")...
let file_menu = SubmenuBuilder::new(app, "File")...
let edit_menu = SubmenuBuilder::new(app, "Edit")...
let view_menu = SubmenuBuilder::new(app, "View")...
let window_menu = SubmenuBuilder::new(app, "Window")...
let help_menu = SubmenuBuilder::new(app, "Help")...

// Combine into main menu
let menu = MenuBuilder::new(app)
    .items(&[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu, &help_menu])
    .build()?;
app.set_menu(menu)?;
```

### Platform-Dependent Shortcuts

Shortcuts use Tauri's accelerator syntax for platform support:

- **Menu accelerators**: Use `CmdOrControl+X` syntax - automatically maps to Command on macOS, Control on Windows/Linux
- **Global shortcuts**: Use `#[cfg(target_os = "macos")]` conditional compilation

Example for Save (Cmd+S on Mac, Ctrl+S on Windows/Linux):

```rust
// Menu item with platform-dependent accelerator
let save_item = MenuItemBuilder::with_id("save", "Save")
    .accelerator("CmdOrControl+S")
    .build(app)?;

// Global shortcut with conditional compilation
#[cfg(target_os = "macos")]
let save_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyS);

#[cfg(not(target_os = "macos"))]
let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);
```

### Predefined Menu Items

Use `PredefinedMenuItem` for standard actions that need native OS behavior:

```rust
use tauri::menu::PredefinedMenuItem;

let undo_item = PredefinedMenuItem::undo(app, None)?;
let copy_item = PredefinedMenuItem::copy(app, None)?;
let quit_item = PredefinedMenuItem::quit(app, None)?;
let about_item = PredefinedMenuItem::about(app, None, None)?;
```

Available predefined items: `copy`, `cut`, `paste`, `select_all`, `undo`, `redo`, `minimize`, `close_window`, `quit`, `about`, `fullscreen`, `services`.

### Menu Event Handling

Handle menu events via `app.on_menu_event()`:

```rust
app.on_menu_event(move |_app_handle, event| {
    match event.id().0.as_str() {
        "save" => {
            let _ = app_handle.emit("menu-save-triggered", ());
        }
        _ => {
            println!("Menu event: {:?}", event.id());
        }
    }
});
```

### Global Shortcut Plugin

Required permissions in `capabilities/default.json`:
```json
{
  "permissions": [
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered"
  ]
}
```

Cargo dependency in `Cargo.toml`:
```toml
[target.'cfg(any(target_os = "macos", windows, target_os = "linux"))'.dependencies]
tauri-plugin-global-shortcut = "2"
```

### Dialog Plugin

Native file dialogs for save/open operations.

Install:
```bash
pnpm tauri add dialog
```

Frontend usage:
```typescript
import { save, open } from '@tauri-apps/plugin-dialog';

// Save file dialog
const path = await save({
  filters: [{ name: 'Excalidraw', extensions: ['excalidraw', 'json'] }],
  defaultPath: 'untitled.excalidraw',
  title: 'Save Drawing',
});

// Open file dialog
const filePath = await open({
  multiple: false,
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
});
```

Required permissions (added automatically by `tauri add dialog`):
- `dialog:default` in `capabilities/default.json`

## Excalidraw Integration

### Performance: Change Detection for Large Diagrams

Excalidraw's `onChange` callback fires **extremely frequently**:
- On every pixel during mouse drag (resize/move operations)
- Up to 60 times per second during interactions
- On selection changes, scroll, zoom, etc.

**The Problem:** Using `JSON.stringify(elements)` to detect changes causes:
- 10,000 elements ≈ 2-5 MB string allocation
- 60 calls/sec = hundreds of MB/second of garbage
- GC stutter and frame drops

**The Solution: Version Checksum** (`src/components/ExcalidrawCanvas.tsx`)

Excalidraw elements have a built-in `version` property (integer) that increments on each change. Sum of versions = document checksum with zero memory allocation:

```typescript
// Calculate checksum from element versions (O(N) integer math, 0 allocations)
function calculateElementsChecksum(elements: readonly any[]): number {
  let sum = 0;
  for (let i = 0; i < elements.length; i++) {
    // Include deleted elements - deleting is a change
    sum += elements[i].version;
  }
  return sum;
}

// Whitelist for appState (small object, JSON.stringify is fine)
function getAppStateHash(appState: any): string {
  return JSON.stringify({
    viewBackgroundColor: appState.viewBackgroundColor,
    gridSize: appState.gridSize,
    name: appState.name,
    theme: appState.theme,
    // Only visual/export properties that persist in file
    // EXCLUDE: selectedElementIds, scrollX, scrollY, zoom, viewModeEnabled
  });
}
```

**Performance Comparison:**

| Strategy | Memory (10k items) | CPU Cost | Risk |
|----------|-------------------|----------|------|
| JSON.stringify | ~5MB per check | O(N) string parse | High (GC stutter) |
| Version Sum | **0 bytes** | O(N) integer add | **None** |

**Complete Change Detection Implementation:**

```typescript
// Ref to store the "saved" signature (updated only on save/open)
const savedSignatureRef = useRef<{
  elementsChecksum: number;
  appStateHash: string;
  filesCount: number;
} | null>(null);

// Simple debounce utility (no lodash dependency)
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Debounced change checker
const checkForChanges = useCallback(
  debounce((elements: readonly any[], appState: any, files: Record<string, unknown>) => {
    if (!elements || !appState) return;

    // Initialize on first run
    if (savedSignatureRef.current === null) {
      savedSignatureRef.current = {
        elementsChecksum: calculateElementsChecksum(elements),
        appStateHash: getAppStateHash(appState),
        filesCount: Object.keys(files || {}).length,
      };
      return;
    }

    // Compare against saved signature
    const hasChanged =
      calculateElementsChecksum(elements) !== savedSignatureRef.current.elementsChecksum ||
      getAppStateHash(appState) !== savedSignatureRef.current.appStateHash ||
      Object.keys(files || {}).length !== savedSignatureRef.current.filesCount;

    if (hasChanged) {
      stateService.setEdited(getCurrentWindow().label);
    }
  }, 500), // 500ms debounce batches rapid changes
  []
);

const handleChange = useCallback(
  (elements: readonly any[], appState: any, files: Record<string, unknown>) => {
    checkForChanges(elements, appState, files);
  },
  [checkForChanges]
);
```

**Integration with Save/Open:**

```typescript
// Update saved signature after save or open
function updateSavedSignature() {
  if (excalidrawAPI.current) {
    const elements = excalidrawAPI.current.getSceneElements();
    const appState = excalidrawAPI.current.getAppState();
    const files = excalidrawAPI.current.getFiles();

    savedSignatureRef.current = {
      elementsChecksum: calculateElementsChecksum(elements),
      appStateHash: getAppStateHash(appState),
      filesCount: Object.keys(files).length,
    };
  }
}

// Register callbacks in services
useEffect(() => {
  return saveService.onAfterSave(updateSavedSignature);
}, [updateSavedSignature]);

useEffect(() => {
  return openService.onAfterOpen(updateSavedSignature);
}, [updateSavedSignature]);
```

**Key Design Decisions:**

1. **Debounce (500ms)** - Defers expensive operations until user stops interacting
2. **appState whitelist** - Ignores selection, scroll, zoom (transient UI state)
3. **Files count only** - Files can be large binary data, count change is sufficient
4. **Saved state ref** - Tracks "clean" state from last save/open

**Edge Case: Undo Behavior**

Excalidraw's version increments even on undo. If user moves item (v1→v2), then Undo (v2→v3), checksum changes even though position looks same. The app treats this as "edited" - acceptable behavior for most applications.

### Loading Drawings Dynamically

The `initialData` prop only works when Excalidraw is first mounted. For dynamic loading (e.g., opening files in new windows), use the `updateScene` API:

```typescript
// Get Excalidraw API via excalidrawAPI prop
const handleExcalidrawAPI = useCallback((api: any) => {
  excalidrawAPI.current = api;
}, []);

// Use updateScene to load data
excalidrawAPI.current.updateScene({
  elements: drawingData.elements || [],
  appState: drawingData.appState || {},
  files: drawingData.files || {},
  captureUpdate: 'IMMEDIATELY', // or 'EVENTUALLY' or 'NEVER'
});
```

**captureUpdate options:**
- `IMMEDIATELY` - Captured in undo/redo stack (use for most local updates)
- `EVENTUALLY` - For async multi-step processes
- `NEVER` - Not recorded (remote updates, scene initialization)

**Important:** The `initialData` prop only takes effect on initial mount. If data changes after the component is mounted, you MUST use `updateScene` to reflect those changes.

### Loading Data After Excalidraw API is Ready

When loading data asynchronously (e.g., from file open), you need to handle the case where the Excalidraw API isn't available yet:

```typescript
useEffect(() => {
  const loadDrawing = () => {
    if (drawingData && excalidrawAPI.current) {
      excalidrawAPI.current.updateScene({
        elements: drawingData.elements || [],
        appState: drawingData.appState || {},
        files: drawingData.files || {},
        captureUpdate: 'IMMEDIATELY',
      });
    }
  };

  // Try immediately
  loadDrawing();

  // Poll if API not yet available
  const checkInterval = setInterval(() => {
    if (drawingData && excalidrawAPI.current) {
      loadDrawing();
      clearInterval(checkInterval);
    }
  }, 50);

  return () => clearInterval(checkInterval);
}, [drawingData]);
```

### Window Title Updates

When opening a file, the window title should update to show the file name. This requires passing the file name through the entire data flow:

**Execution Path for Window Title:**

| Step | File | What happens |
|------|------|--------------|
| 1 | `src/services/openService.ts` | Extract `name` from filePath |
| 2 | `src/services/openService.ts` | Pass `name` to Rust via `invoke` |
| 3 | `src-tauri/src/commands/open_commands.rs` | Receive `name` in `create_window_with_data` |
| 4 | Rust | Include `name` in `DrawingData` struct |
| 5 | Rust injection | `name` injected into `window.__excalidrawInitialData` |
| 6 | `src/hooks/useFileLoader.ts` | Read `window.__excalidrawInitialData` |
| 7 | `src/components/ExcalidrawCanvas.tsx` | Use `initialData.name` to set title |

**Code flow:**

```typescript
// 1. openService.ts - Extract name and pass to Rust
const fileName = filePath.split('/').pop()?.replace(/\.(excalidraw|json)$/i, '') || 'Untitled';
const initialData: InitialData = {
  elements: result.data.elements,
  appState: result.data.appState,
  files: result.data.files,
  name: fileName,  // <-- Include name
};

const result = await invoke('create_window_with_data', {
  elements: initialData.elements || [],
  appState: initialData.appState || {},
  files: initialData.files || {},
  name: initialData.name,  // <-- Pass to Rust
});
```

```rust
// 2. Rust backend - Receive and include name
#[tauri::command]
pub fn create_window_with_data(
    _app: AppHandle,
    elements: Vec<serde_json::Value>,
    app_state: serde_json::Value,
    files: serde_json::Value,
    name: Option<String>,  // <-- Receive name
) -> Result<WindowResult, String> {
    let drawing_data = DrawingData {
        elements,
        app_state,
        files,
        name,  // <-- Include in DrawingData
    };
    // ... inject into window.__excalidrawInitialData
}
```

```typescript
// 3. ExcalidrawCanvas.tsx - Set window title
const fileName = initialData.name;
if (typeof fileName === 'string' && fileName) {
  const appWindow = getCurrentWindow();
  await appWindow.setTitle(fileName);
}
```

### Updating Window Title After Save

Window titles are now automatically updated by `stateService.setSaved()` via the `updateWindowTitle()` method:

```typescript
// stateService.setSaved updates the state and title automatically
await stateService.setSaved(windowLabel, result.file_path);
```

**Note:** The `updateWindowTitle()` method:
1. Only updates title if current window matches the windowLabel
2. Strips `.excalidraw` and `.json` extensions from filename
3. Adds `[edited]` or `[saved]` prefix based on state

## Window State Management

### Single Source of Truth Pattern

The application uses `stateService` as the single source of truth for window state. State is managed in Rust (`state_commands.rs`) with frontend sync.

**State Machine States:**
- `created` - New window, no file path associated
- `saved` - Has file path, no unsaved changes
- `edited` - Has unsaved modifications

**Data Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                  state_commands.rs (Rust)                       │
│           Single Source of Truth - HashMap                      │
│  window_states: HashMap<"main" | "excalidraw-*", WindowState>   │
└─────────────────────────────────────────────────────────────────┘
           │                                                      │
           │ 1. create_window_state() on window init              │
           │ 2. update_window_state() on state changes            │
           │ 3. emit "window-state-changed" for frontend sync      │
           │                                                      │
           ▼                                                      │
┌─────────────────────────────────────────────────────────────────┐
│                     stateService.ts                             │
│                                                                 │
│  - getState(windowLabel): Get state from Rust                   │
│  - setSaved(windowLabel, filePath): Transition to saved         │
│  - setEdited(windowLabel): Transition to edited                 │
│  - updateWindowTitle(windowLabel): Update window title          │
│  - onStateChange(): Subscribe to state changes                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles:**
1. All state mutations flow through `state_commands.rs`
2. Frontend calls `update_window_state` to sync changes to Rust
3. Rust emits `window-state-changed` events for cross-window sync

### saveService Integration

The `saveService` delegates state management to `stateService`:

```typescript
// saveService.triggerSave now takes windowLabel
async triggerSave(windowLabel: string): Promise<boolean> {
  const currentWinState = await stateService.getState(windowLabel);

  // Use stateService for file path
  if (!currentWinState.filePath) {
    filePath = await this.showSaveDialog();
  } else {
    filePath = currentWinState.filePath;
  }

  // After save, update state via stateService
  await stateService.setSaved(windowLabel, result.file_path);
}
```

### SaveStateContext

Simplified to only track `isSaving`:

```typescript
// src/types/save.ts
export interface SaveState {
  isSaving: boolean;  // Only tracks save operation in progress
}
```

**Note:** Use `stateService` for file path, unsaved changes, and last saved time.

### Window Title Updates

Window titles are updated via `stateService.updateWindowTitle()`:

```typescript
// File extensions are stripped automatically
const title = filePath.split('/').pop()?.replace(/\.(excalidraw|json)$/i, '');

// Format based on state
if (state === 'edited') {
  title = `[edited] ${title}`;
} else {
  title = `[saved] ${title}`;
}
```

## Multi-Window Configuration

### DevTools for All Windows

Enable devtools for debugging across all windows:

**1. Add `devtools` feature to Cargo.toml:**
```toml
[dependencies]
tauri = { version = "2", features = ["macos-private-api", "devtools"] }
```

**2. Enable in tauri.conf.json for main window:**
```json
{
  "app": {
    "windows": [
      {
        "title": "excalimaxdraw",
        "width": 800,
        "height": 600,
        "label": "main",
        "devtools": true
      }
    ]
  }
}
```

**3. Open devtools programmatically in Rust:**

For main window (in `setup` function):
```rust
// In setup() function
if let Some(window) = app.get_webview_window("main") {
    let _ = window.open_devtools();
}
```

For new windows (in WebviewWindowBuilder):
```rust
use tauri::{WebviewUrl, WebviewWindowBuilder};

WebviewWindowBuilder::new(
    &app,
    &window_label,
    WebviewUrl::App("index.html".into()),
)
.title("Excalidraw")
.inner_size(1000.0, 700.0)
.devtools(true)
.build()?;

// Or open programmatically after creation
let _ = window.open_devtools();
```

### Multi-Window Permissions

Tauri v2 requires explicit permissions for each window. Use wildcard patterns for dynamic windows.

**capabilities/default.json:**
```json
{
  "windows": [
    "main",
    "excalidraw-*"
  ],
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:default",
    "global-shortcut:default",
    {
      "identifier": "core:event:allow-listen",
      "allow": [
        {
          "windows": ["excalidraw-*"]
        }
      ]
    }
  ]
}
```

**Key patterns:**
- `"main"` - Explicit window label
- `"excalidraw-*"` - Wildcard pattern for dynamically created windows
- Permissions scoped to specific windows use the `allow` array with `windows` key

**Common error:** `event.listen not allowed on window "excalidraw-1"`
- Fix: Add `core:event:allow-listen` permission with scoped windows

## Frontend

- **React 18** with JSX
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Excalidraw** Virtual whiteboard for sketching hand-drawn like diagrams
  - docs: https://docs.excalidraw.com/docs
  - repo: https://github.com/excalidraw/excalidraw

## Dependencies

### Core
- `react`, `react-dom` - UI framework
- `@tauri-apps/api` - Tauri JavaScript API
- `@tauri-apps/plugin-opener` - Open URLs/files

### Dev
- `@vitejs/plugin-react` - Vite React plugin
- `typescript` - TypeScript compiler
- `vite` - Build tool
- `@tauri-apps/cli` - Tauri CLI

## Active Technologies
- TypeScript 5.6, Rust edition 2024 (Tauri v2) + React 18, @excalidraw/excalidraw (to be added), @tauri-apps/api v2 (001-auto-create-excalidraw)
- N/A - no persistence for this feature (fresh canvas on every launch) (001-auto-create-excalidraw)
- Rust 2024 edition, TypeScript 5.6 + `@tauri-apps/api/menu`, `@tauri-apps/plugin-global-shortcut`, `tauri-plugin-global-shortcut`, `@tauri-apps/plugin-dialog`, `tauri-plugin-dialog` (002-add-save-menu)
- Platform-dependent shortcuts: `CmdOrControl` accelerator syntax + `#[cfg(target_os)]` conditional compilation (002-add-save-menu)
- Local filesystem (JSON/Excalidraw format via native save dialog) (002-add-save-menu)
- TypeScript 5.6, Rust 2024 edition (Tauri v2) + `@tauri-apps/plugin-dialog`, `@tauri-apps/api/core`, `@excalidraw/excalidraw` (003-open-file)
- Local filesystem (JSON/.excalidraw files) (003-open-file)
- Rust HashMap for window state (state_commands.rs) + frontend sync via events (004-window-state-machine)
- stateService as single source of truth for window state machine (004-window-state-machine)
- TypeScript 5.6, Rust 2024 edition (Tauri v2) + Ant Design (UI components), Tauri store plugin (persistence), Tauri notification plugin (toasts) (005-user-settings)
- Tauri store plugin (local JSON file at app config path) (005-user-settings)
- TypeScript 5.6, Rust 2024 edition + React 18, Tauri v2, Excalidraw, @tauri-apps/api (005-create-new-file)
- Tauri store plugin (settings.json) for user preferences (005-create-new-file)

## Recent Changes
- 001-auto-create-excalidraw: Added TypeScript 5.6, Rust edition 2024 (Tauri v2) + React 18, @excalidraw/excalidraw (to be added), @tauri-apps/api v2
- 002-add-save-menu: Added native menu bar (App, File, Edit, View, Window, Help) with Save (Cmd+S/Ctrl+S), predefined menu items, global shortcut plugin, platform-dependent shortcuts, native save dialog via @tauri-apps/plugin-dialog
- 004-window-state-machine: Refactored state management - `stateService` is single source of truth, `saveService` uses `stateService` for state, simplified `SaveStateContext`, removed duplicate state tracking
