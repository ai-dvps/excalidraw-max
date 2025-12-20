# Implementation Plan: Open File

**Branch**: `003-open-file` | **Date**: 2025-12-20 | **Spec**: [spec.md](../spec.md)
**Input**: Feature specification from `/specs/003-open-file/spec.md`

## Summary

Implement the Open File feature allowing users to open Excalidraw files via File → Open... menu or Cmd+O / Ctrl+O keyboard shortcut. The feature uses Tauri's native `open()` dialog API to select files and the Excalidraw component's `initialData` prop to load drawing content. A new Tauri window is created for each opened file, with progress indication for large files.

## Technical Context

**Language/Version**: TypeScript 5.6, Rust 2024 edition (Tauri v2)
**Primary Dependencies**: `@tauri-apps/plugin-dialog`, `@tauri-apps/api/core`, `@excalidraw/excalidraw`
**Storage**: Local filesystem (JSON/.excalidraw files)
**Testing**: TypeScript compiler, manual testing
**Target Platform**: macOS/Windows/Linux desktop
**Project Type**: Tauri desktop app (React frontend + Rust backend)
**Performance Goals**: Open dialog in <1s, load files <10MB in <5s
**Constraints**: Native dialogs only, no server-side processing
**Scale/Scope**: Single-user desktop application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single responsibility**: Feature focuses on file opening - passes
- **No premature abstraction**: Uses existing patterns from save feature - passes
- **Technology constraints**: Using Tauri's native dialog and Excalidraw's API - passes
- **No implementation details in spec**: All requirements are user-focused - passes

## Project Structure

### Documentation (this feature)

```text
specs/003-open-file/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── open-dialog.md   # Frontend-Backend contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ExcalidrawCanvas.tsx    # Modified to accept initialData prop
├── services/
│   ├── saveService.ts          # Extended with open functionality
│   └── openService.ts          # New: dedicated open file service
├── types/
│   └── save.ts                 # Extended with LoadResult type
└── hooks/
    └── useFileLoader.ts        # New: React hook for loading files

src-tauri/src/
├── lib.rs                      # Added open menu item and shortcut
├── commands/
│   ├── mod.rs                  # Updated exports
│   └── open_commands.rs        # New: Rust commands for file reading
```

**Structure Decision**: Feature extends existing save pattern with dedicated open service. Uses React hook for component integration and Rust commands for file system access.

## Phase 0: Research Summary

### Key Findings

**Tauri Dialog API (`@tauri-apps/plugin-dialog`)**:
```typescript
import { open } from '@tauri-apps/plugin-dialog';

const file = await open({
  multiple: false,
  directory: false,
  filters: [{ name: 'Excalidraw', extensions: ['excalidraw', 'json'] }],
});
```

**Excalidraw Loading API (`@excalidraw/excalidraw`)**:
```typescript
<Excalidraw
  initialData={{
    elements: [...],
    appState: {...},
    files: {...}
  }}
  excalidrawAPI={handleAPI}
/>
```

**Window Creation in Tauri**: Use `app.webviewWindow` API to create new windows

### Decisions Made

| Area | Decision | Rationale |
|------|----------|-----------|
| Dialog plugin | Use existing `@tauri-apps/plugin-dialog` | Already installed for save feature |
| File reading | Rust command `read_drawing_file` | Consistent with save pattern, handles async |
| Data loading | Pass via `initialData` prop | Excalidraw's native loading mechanism |
| Window creation | Frontend triggers via Tauri invoke | React controls UI state |
| Large file handling | Show progress indicator in React | UI responsibility |

## Phase 1: Design Artifacts

### Data Model

```typescript
// ExcalidrawFile
interface ExcalidrawFile {
  elements: ExcalidrawElement[];
  appState: AppState;
  files: Record<string, FileId>;
  version: number;
}

// LoadResult
interface LoadResult {
  success: boolean;
  data?: ExcalidrawFile;
  error?: string;
}

// InitialData for Excalidraw component
interface InitialData {
  elements?: ImportedBinaryState['elements'];
  appState?: Partial<AppState>;
  files?: Record<string, FileId>;
}
```

### Contracts

**Frontend → Backend: Open Dialog Flow**

1. Frontend calls `open()` from `@tauri-apps/plugin-dialog`
2. User selects file, path returned
3. Frontend invokes Rust command `read_drawing_file(path)`
4. Rust reads file, parses JSON, validates structure
5. Returns `LoadResult` with data or error
6. Frontend creates new Tauri window with `initialData`

**Rust Command: `read_drawing_file`**

```rust
#[tauri::command]
async fn read_drawing_file(app: AppHandle, path: String) -> Result<LoadResult, String>
```

**Frontend Event: `window-ready-for-data`**

Sent when new ExcalidrawCanvas is mounted and ready to receive initial data

### Quickstart

**To open a file:**

1. User clicks File → Open... or presses Cmd+O / Ctrl+O
2. Frontend shows native open dialog (filters: .excalidraw, .json)
3. User selects file, confirms
4. Frontend invokes `read_drawing_file` Rust command
5. File is read and parsed
6. New Tauri window created
7. ExcalidrawCanvas renders with `initialData` from loaded file

**To handle errors:**

- Invalid JSON → Error message: "File is not a valid JSON file"
- Wrong structure → Error message: "File is not an Excalidraw drawing"
- Missing elements → Error message: "Drawing file is corrupted"
- Large file → Show progress indicator during loading

## Complexity Tracking

> N/A - No constitution violations requiring justification

## Next Steps

Execute `/speckit.tasks` to generate implementation tasks from this plan.
