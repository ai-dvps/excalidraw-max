# Implementation Plan: Create New File

**Branch**: `005-create-new-file` | **Date**: 2025-12-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-create-new-file/spec.md`

## Summary

Implement "Create New File" functionality for the exalidraw-max desktop application. Users can create new files via the File menu or keyboard shortcut (Ctrl+N/Cmd+N). New files open in a new Tauri window with user settings (e.g., background color) applied.

## Technical Context

**Language/Version**: TypeScript 5.6, Rust 2024 edition
**Primary Dependencies**: React 18, Tauri v2, Excalidraw, @tauri-apps/api
**Storage**: Tauri store plugin (settings.json) for user preferences
**Testing**: TypeScript type checking, Rust cargo tests
**Target Platform**: macOS (primary), Windows, Linux (via Tauri)
**Project Type**: Tauri desktop app with React/TypeScript frontend
**Performance Goals**: New window opens within 500ms of shortcut press
**Constraints**: Single window label pattern already established (excalidraw-*)
**Scale/Scope**: Multiple concurrent windows (10+ supported)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Security-First Architecture | ✅ PASS | No new Tauri commands needed beyond existing patterns |
| Type Safety Across Layers | ✅ PASS | Will use existing TypeScript/Rust type correspondence |
| Performance-Conscious Bundling | ✅ PASS | No new bundle dependencies |
| Platform-Appropriate UX | ✅ PASS | Menu + keyboard shortcut follows desktop conventions |
| Testable Command Architecture | ✅ PASS | No new Rust commands required |

**Post-Design Re-check**: ✅ All gates still PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-create-new-file/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ExcalidrawCanvas.tsx    # Already handles initialData
├── services/
│   ├── openService.ts          # Already handles window creation
│   └── settingsService.ts      # Already handles settings
├── hooks/
│   └── useSettings.ts          # Already handles settings loading
src-tauri/src/
├── commands/
│   └── open_commands.rs        # create_window_with_data exists
└── lib.rs                      # Menu event handlers exist
```

**Structure Decision**: Feature builds on existing architecture. The openService already has `createNewWindow` functionality that will be reused. New menu item and shortcut handlers follow existing patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Phase 0: Research

### Unknowns to Resolve

No unknowns - existing codebase patterns apply directly.

### Research Findings

**New File Pattern**: Reuses existing `openService.triggerOpen()` pattern for creating new windows with empty data.

**Settings Application**: Settings are already loaded via `useSettings` hook and applied to canvas via `initialData` prop on Excalidraw.

**Menu Integration**: Menu already exists in `lib.rs`. Need to add "New" menu item.

**Shortcut Integration**: Global shortcuts already registered. Need to add Ctrl+N/Cmd+N shortcut.

## Phase 1: Design

### Data Model

See `data-model.md` for entity definitions.

### API Contracts

No new API contracts needed. Reuses existing:
- `create_window_with_data` Tauri command
- `load_settings` Tauri command

### Quickstart Guide

See `quickstart.md` for integration guidance.

---

## Phase 2: Tasks

**Output**: `/speckit.tasks` command generates `tasks.md`

### Task Breakdown Preview

1. Add "New" menu item to File menu
2. Register Ctrl+N/Cmd+N global shortcut
3. Wire menu event to openService
4. Wire shortcut event to openService
5. Test new file creation
6. Verify settings applied to new file
