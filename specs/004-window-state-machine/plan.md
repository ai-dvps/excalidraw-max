# Implementation Plan: Window State Machine

**Branch**: `004-window-state-machine` | **Date**: 2024-12-21 | **Spec**: [spec.md](spec.md)

## Summary

Implement a window state machine for the Excalidraw Tauri desktop application. Each window tracks its save state (created/saved/edited) with visual indicators in the title, state-aware save behavior, and close confirmation for unsaved changes. The implementation integrates with existing save/open services and uses Tauri's window management APIs.

## Technical Context

**Language/Version**: TypeScript 5.6, Rust edition 2024
**Primary Dependencies**: Tauri v2, React 18, @tauri-apps/api
**Storage**: In-memory per window (no persistence across restart)
**Testing**: TypeScript compilation, Rust cargo check
**Target Platform**: macOS desktop
**Project Type**: Tauri desktop app (React frontend + Rust backend)
**Performance Goals**: State transition <100ms, title update <1s
**Constraints**: No `any` types at FFI boundary, security-first input validation
**Scale/Scope**: Single user, multiple concurrent windows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Security-First Architecture | ✅ PASS | All Tauri commands validate input; no file path exposure |
| II. Type Safety Across Layers | ✅ PASS | TypeScript interfaces will mirror Rust structures |
| III. Performance-Conscious Bundling | ✅ PASS | Minimal new code, state objects are small |
| IV. Platform-Appropriate UX | ✅ PASS | Native Tauri dialog for close confirmation |
| V. Testable Command Architecture | ✅ PASS | Rust commands can be unit tested |

## Project Structure

### Documentation (this feature)

```text
specs/004-window-state-machine/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── stateService.ts      # NEW: Window state management service
├── hooks/
│   └── useWindowState.ts    # NEW: React hook for window state
├── types/
│   └── windowState.ts       # NEW: TypeScript types for window state
src-tauri/src/commands/
│   └── state_commands.rs    # NEW: Rust commands for state management
└── lib.rs                   # MODIFIED: Register state commands
```

**Structure Decision**: Follows existing project patterns with frontend service/hook and backend commands. State stored in-memory using Tauri app state management.

## Phase 0: Research

**No research needed** - All technical questions resolved during clarify phase. Implementation uses existing Tauri patterns already established in the codebase.

## Phase 1: Design & Contracts

### Data Model

```typescript
// src/types/windowState.ts

export type WindowStateType = 'created' | 'saved' | 'edited';

export interface WindowState {
  state: WindowStateType;
  filePath: string | null;
  lastSavedAt: string | null;  // ISO timestamp
  hasUnsavedChanges: boolean;
}

export interface WindowStateContextValue {
  windowLabel: string;
  currentState: WindowState;
  getState: () => WindowState;
  setSaved: (filePath: string) => void;
  setEdited: () => void;
  resetCreated: () => void;
}
```

### API Contracts

#### Frontend Service (stateService.ts)

```typescript
// State management service
export const stateService = {
  // Initialize state for a window
  init(windowLabel: string): () => void;

  // Get current state for window
  getState(windowLabel: string): WindowState;

  // Transition to saved state (after save or open)
  setSaved(windowLabel: string, filePath: string): void;

  // Transition to edited state (user made changes)
  setEdited(windowLabel: string): void;

  // Reset to created state (new window)
  resetCreated(windowLabel: string): void;

  // Subscribe to state changes
  onStateChange(callback: (label: string, state: WindowState) => void): void;
}
```

#### Rust Commands (state_commands.rs)

```rust
#[tauri::command]
fn get_window_state(app: AppHandle, window_label: String) -> Result<WindowState, String>;

#[tauri::command]
fn update_window_state(app: AppHandle, window_label: String, new_state: WindowStateUpdate) -> Result<(), String>;

#[tauri::command]
fn mark_window_saved(app: AppHandle, window_label: String, file_path: String) -> Result<(), String>;

#[tauri::command]
fn mark_window_edited(app: AppHandle, window_label: String) -> Result<(), String>;

// Native dialog for close confirmation
#[tauri::command]
async fn confirm_close_with_unsaved(app: AppHandle, window_label: String) -> Result<CloseAction, String>
```

### Integration Points

1. **ExcalidrawCanvas**: Use `useWindowState` hook to manage state, update title on state change
2. **saveService**: Call `setSaved()` after successful save
3. **openService**: Call `setSaved()` after opening file
4. **Excalidraw onChange**: Call `setEdited()` when canvas changes
5. **Window close handler**: Check state, show native dialog if edited

## Complexity Tracking

> Not applicable - no constitution violations requiring justification.
