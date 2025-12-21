# CLAUDE.md

This file provides guidance for Claude Code when working with this project.

## Project Overview

**exalidraw-max** is a desktop application built with:
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Tauri v2 (Rust)
  - docs: https://v2.tauri.app/start/
- **Package Manager:** pnpm
- **Platform:** macOS (desktop)

## Project Structure

```
exalidraw-max/
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
- **Product Name:** exalidraw-max
- **Bundle ID:** com.aidvps.excalidraw-max.app
- **Default Window:** 800x600px

### Capabilities

Permissions are configured in `src-tauri/capabilities/default.json`:
- `core:default` - Core Tauri permissions
- `opener:default` - Open URLs/files permission

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
        "title": "exalidraw-max",
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

## Recent Changes
- 001-auto-create-excalidraw: Added TypeScript 5.6, Rust edition 2024 (Tauri v2) + React 18, @excalidraw/excalidraw (to be added), @tauri-apps/api v2
- 002-add-save-menu: Added native menu bar (App, File, Edit, View, Window, Help) with Save (Cmd+S/Ctrl+S), predefined menu items, global shortcut plugin, platform-dependent shortcuts, native save dialog via @tauri-apps/plugin-dialog
