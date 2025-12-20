# Implementation Plan: Add Save Menu Item

**Branch**: `002-add-save-menu` | **Date**: 2025-12-20 | **Spec**: [spec.md](../spec.md)
**Input**: Feature specification from `/specs/002-add-save-menu/spec.md`

## Summary

Add a "Save" menu item to the File menu in the Tauri desktop application with keyboard shortcut support (Cmd+S on macOS, Ctrl+S on Windows/Linux). The save operation uses the Tauri Menu API to create menu items and the Global Shortcut plugin to register keyboard shortcuts. First save prompts user via file dialog; subsequent saves use the remembered path.

## Technical Context

**Language/Version**: Rust 2024 edition, TypeScript 5.6
**Primary Dependencies**: `@tauri-apps/api/menu`, `@tauri-apps/plugin-global-shortcut`, `tauri-plugin-global-shortcut`
**Storage**: Local filesystem (JSON/Excalidraw format via file dialog)
**Testing**: Rust unit tests, TypeScript unit tests
**Target Platform**: macOS, Windows, Linux (desktop)
**Project Type**: Tauri desktop app (React frontend + Rust backend)
**Performance Goals**: Save operation < 2 seconds for drawings < 10MB
**Constraints**: Native menu integration, platform-appropriate keyboard shortcuts
**Scale/Scope**: Single user, local file operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security-First Architecture | ✅ PASS | File dialog via Tauri API; path validation; no command injection risk |
| II. Type Safety Across Layers | ✅ PASS | TypeScript types for menu items and shortcuts; Rust command signatures |
| III. Performance-Conscious Bundling | ✅ PASS | No new heavy dependencies; native menu APIs |
| IV. Platform-Appropriate UX | ✅ PASS | Native menu via Tauri; platform-specific shortcuts (CmdOrControl) |
| V. Testable Command Architecture | ✅ PASS | Rust commands testable; menu state observable |

## Project Structure

### Documentation (this feature)

```text
specs/002-add-save-menu/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── save-api.yaml
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ExcalidrawCanvas.tsx   # Canvas component (needs save integration)
├── services/
│   └── saveService.ts         # NEW: Save functionality wrapper
tests/
├── integration/
│   └── save-flow.test.ts      # NEW: E2E save flow tests
└── unit/
    └── saveService.test.ts    # NEW: Unit tests

src-tauri/
├── src/
│   ├── lib.rs                 # Register new commands
│   └── commands/
│       └── save_commands.rs   # NEW: File save/rust commands
├── capabilities/
│   └── default.json           # Add global-shortcut permissions
```

**Structure Decision**: Single project structure with feature modules in `services/` and `commands/`. Menu is configured at app startup via Rust; shortcut registration in frontend or Rust.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Phase 0: Research

### Research Findings

**Decision**: Use Tauri Menu API with accelerators for menu shortcuts, and global-shortcut plugin as fallback

**Rationale**:
- Menu accelerators are integrated with native menu system (appears in menu tooltip, works when menu focused)
- Global shortcut plugin needed only if save must work when menu is not focused
- Combining both provides best UX: accelerator in menu + global shortcut

**Alternatives considered**:
1. Menu accelerators only - simpler but requires menu focus
2. Global shortcut only - no menu item visual indicator
3. Both (selected) - optimal UX with clear visual feedback

### Tauri Menu API Usage

```rust
// Rust - Create File menu with Save item
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

let save_item = MenuItemBuilder::with_id("save", "Save")
    .accelerator("CmdOrControl+S")?
    .build(app)?;
let file_menu = SubmenuBuilder::new(app, "File")
    .item(&save_item)
    .separator()
    .text("quit", "Quit")
    .build()?;
let menu = MenuBuilder::new(app).items(&[&file_menu]).build()?;
app.set_menu(menu)?;

// Handle menu events
app.on_menu_event(move |_app_handle, event| {
    if event.id().0 == "save" {
        // Trigger save
    }
});
```

### Global Shortcut Plugin Usage

```rust
// Rust - Register global shortcut
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);
app.handle().plugin(
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |_app, shortcut, event| {
            if shortcut == &save_shortcut && event.state() == ShortcutState::Pressed {
                // Trigger save
            }
        })
        .build(),
)?;
app.global_shortcut().register(save_shortcut)?;
```

---

## Phase 1: Design

### Data Model

See [data-model.md](./data-model.md)

### API Contracts

See [contracts/](./contracts/)

### Quickstart Guide

See [quickstart.md](./quickstart.md)

---

## Phase 2: Implementation Planning

*Generated by `/speckit.tasks` command*

| Task | Type | Priority | Estimated Complexity |
|------|------|----------|---------------------|
| Add tauri-plugin-global-shortcut dependency | setup | P1 | Low |
| Update capabilities/default.json | config | P1 | Low |
| Create save_commands.rs in src-tauri/src/commands | rust | P1 | Medium |
| Add save menu item to app menu in lib.rs | rust | P1 | Medium |
| Register global keyboard shortcut | rust | P1 | Medium |
| Create saveService.ts in src/services | typescript | P1 | Medium |
| Integrate save state with ExcalidrawCanvas | frontend | P1 | Medium |
| Write unit tests for saveService | test | P2 | Low |
| Write integration tests for save flow | test | P2 | Medium |
