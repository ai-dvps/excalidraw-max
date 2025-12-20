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
