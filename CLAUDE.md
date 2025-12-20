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

1. Add the function with `#[tauri::command]` macro in `src-tauri/src/lib.rs`
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

## Recent Changes
- 001-auto-create-excalidraw: Added TypeScript 5.6, Rust edition 2024 (Tauri v2) + React 18, @excalidraw/excalidraw (to be added), @tauri-apps/api v2
- 002-add-save-menu: Added native menu bar (App, File, Edit, View, Window, Help) with Save (Cmd+S/Ctrl+S), predefined menu items, global shortcut plugin, platform-dependent shortcuts, native save dialog via @tauri-apps/plugin-dialog
