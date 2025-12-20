# Quickstart: Open File Feature

## Overview

This guide explains how to implement and test the Open File feature for the Excalidraw desktop application.

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User triggers open                                            │
│    ├─ Click File → Open...                                       │
│    └─ Press Cmd+O (Mac) / Ctrl+O (Win/Linux)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Show native open dialog                                       │
│    ├─ Filters: .excalidraw, .json, All Files                     │
│    └─ Title: "Open Drawing"                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User selects file and confirms                                 │
│    ├─ User clicks "Open" button                                  │
│    └─ If cancelled, return to canvas                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Read and validate file                                        │
│    ├─ Read file from filesystem                                  │
│    ├─ Parse JSON                                                 │
│    ├─ Validate structure                                         │
│    └─ If error, show error message                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Create new window with loaded data                            │
│    ├─ Create new Tauri window                                    │
│    ├─ Pass initialData to Excalidraw component                   │
│    └─ Render drawing                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Checklist

### Rust Backend

- [ ] Add `read_drawing_file` command to `src-tauri/src/commands/open_commands.rs`
- [ ] Export command in `src-tauri/src/commands/mod.rs`
- [ ] Register command in `src-tauri/src/lib.rs` invoke handler
- [ ] Add open menu item with accelerator (if not already present)
- [ ] Add global shortcut for Cmd+O / Ctrl+O

### Frontend TypeScript

- [ ] Add `openService.ts` with `triggerOpen()` function
- [ ] Add `useFileLoader` React hook
- [ ] Extend `types/save.ts` with `LoadResult` type
- [ ] Add event listener for menu-triggered open
- [ ] Add event listener for shortcut-triggered open
- [ ] Implement `createNewWindow()` function
- [ ] Add progress indicator for large files

### Testing

- [ ] Test opening .excalidraw files
- [ ] Test opening .json files
- [ ] Test opening invalid JSON file
- [ ] Test opening non-Excalidraw JSON
- [ ] Test opening empty file
- [ ] Test cancelling dialog
- [ ] Test Cmd+O shortcut on macOS
- [ ] Test Ctrl+O shortcut on Windows/Linux
- [ ] Test large file loading with progress indicator

## Key Files Modified

| File | Change |
|------|--------|
| `src/services/openService.ts` | New - open file service |
| `src/hooks/useFileLoader.ts` | New - React hook for loading |
| `src/types/open.ts` | New - TypeScript types |
| `src-tauri/src/commands/open_commands.rs` | New - Rust command |
| `src-tauri/src/lib.rs` | Modified - menu/shortcut |
| `src/components/ExcalidrawCanvas.tsx` | Modified - accept initialData |

## API Reference

### Frontend: Open Dialog

```typescript
import { open } from '@tauri-apps/plugin-dialog';

const file = await open({
  multiple: false,
  directory: false,
  filters: [
    { name: 'Excalidraw', extensions: ['excalidraw', 'json'] },
    { name: 'JSON', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] },
  ],
});
```

### Frontend: Load File

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { LoadResult } from '../types/open';

const result = await invoke<LoadResult>('read_drawing_file', {
  path: '/path/to/file.excalidraw',
});

if (result.success) {
  // result.data contains { elements, appState, files }
} else {
  // result.error contains error message
}
```

### Frontend: Create Window

```typescript
import { WebviewWindow } from '@tauri-apps/api/window';

const window = new WebviewWindow('excalidraw-' + Date.now(), {
  url: '/',
  title: 'Excalidraw',
});

window.emit('load-canvas-data', initialData);
```

### Excalidraw Component

```typescript
<Excalidraw
  initialData={initialData}
  excalidrawAPI={handleAPI}
/>
```
