# Implementation Tasks: Add Save Menu Item

**Feature**: Add Save Menu Item to File Menu
**Branch**: `002-add-save-menu`
**Created**: 2025-12-20

## Task Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 18 |
| Setup Phase | 3 |
| Foundational Phase | 4 |
| User Story 1 (Menu) | 5 |
| User Story 2 (Shortcut) | 3 |
| User Story 3 (Menus Intact) | 1 |
| Polish Phase | 2 |

## MVP Scope

**User Story 1** (Save via Menu) represents the MVP. Completing US1 delivers a functional save capability. US2 and US3 enhance the experience but are not blocking.

---

## Dependencies Graph

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ────── US1 (Menu Save)
    │                         (blocking: all)
    │                               │
    ▼                               ▼
US2 (Keyboard Shortcut) ◄─────────┘
    │                         (depends on US1 for menu integration)
    │
    ▼
US3 (Menus Intact) ──────────────┐
    │                            │
    ▼                            │
Phase 4 (Polish) ◄──────────────┘
    (depends on all user stories)
```

---

## Phase 1: Setup

Project initialization and dependency installation.

- [x] T001 Add tauri-plugin-global-shortcut dependency to src-tauri/Cargo.toml
- [x] T002 Update src-tauri/capabilities/default.json to include global-shortcut permissions
- [x] T003 Create src/types/save.ts with TypeScript interfaces for SaveState and SaveResult

---

## Phase 2: Foundational

Core backend infrastructure required before user stories can be implemented.

- [x] T004 Create src-tauri/src/commands/save_commands.rs with save_drawing command
- [x] T005 Create src/services/saveService.ts for frontend save operations
- [x] T006 Register save_drawing command in src-tauri/src/lib.rs invoke_handler
- [x] T007 Create src/components/SaveStateContext.tsx for React context management

---

## Phase 3: User Story 1 - Save Canvas via Menu (Priority: P1)

**Goal**: Users can save drawings using File > Save menu option

**Independent Test**: Open File menu, verify Save item visible and enabled, click it, verify file dialog appears and drawing saves.

### Tasks

- [x] T008 [P] [US1] Create File menu with Save item in src-tauri/src/lib.rs using MenuBuilder
- [x] T009 [US1] Implement menu event handler for "save" item in src-tauri/src/lib.rs
- [x] T010 [US1] Add save menu accelerator "CmdOrControl+S" to menu item
- [x] T011 [US1] Integrate saveService with ExcalidrawCanvas in src/components/ExcalidrawCanvas.tsx
- [x] T012 [US1] Add menu item state management (enabled/disabled based on hasUnsavedChanges)

---

## Phase 4: User Story 2 - Save Canvas via Keyboard Shortcut (Priority: P1)

**Goal**: Users can save drawings using Cmd+S (Mac) or Ctrl+S (Windows/Linux)

**Independent Test**: With app in focus, press Cmd+S or Ctrl+S, verify save operation triggers.

### Tasks

- [x] T013 [P] [US2] Register global shortcut in src-tauri/src/lib.rs using global-shortcut plugin
- [x] T014 [US2] Implement shortcut handler to trigger save_drawing command
- [x] T015 [US2] Prevent duplicate save operations when shortcut pressed during save

---

## Phase 5: User Story 3 - Default Menus Remain Intact (Priority: P2)

**Goal**: All existing menu items remain unchanged after Save item addition

**Independent Test**: Open all menus, verify all previously existing items are present and functional.

### Tasks

- [x] T016 [US3] Add Save item to File menu without modifying existing menu items

---

## Phase 6: Polish & Cross-Cutting Concerns

Final integration, error handling, and verification.

- [x] T017 [P] Add error handling UI in saveService for save failures (disk full, permission denied)
- [x] T018 Verify all existing menu functionality remains accessible (integration test)

---

## Parallel Execution Opportunities

### Within User Story 1 (T008-T012)
- T008 (Create menu) and T010 (Add accelerator) can run in parallel
- T011 and T012 depend on T010 completion

### Between Stories
- T013 (Register global shortcut) can run after T008 completes (menu structure defined)

### After Foundational
- All user story tasks can proceed in parallel once Phase 2 is complete

---

## Independent Test Criteria

### User Story 1 Tests
1. File menu opens with Save item visible
2. Save item shows "Save (Cmd+S)" accelerator text
3. Save item is enabled when hasUnsavedChanges is true
4. Clicking Save shows file dialog
5. File is written to selected location
6. hasUnsavedChanges becomes false after save

### User Story 2 Tests
1. App in focus, Cmd+S triggers save
2. Ctrl+S triggers save on Windows/Linux
3. Second shortcut press during save is ignored
4. Save works even when menu is not open

### User Story 3 Tests
1. All existing menu items present
2. All menu items functional
3. Save item positioned logically in File menu

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete Phase 1 and Phase 2
2. Implement File menu with Save item (T008-T010)
3. Integrate with canvas (T011-T012)
4. Test: File > Save flow works end-to-end

### Incremental Delivery
1. MVP delivers basic save via menu
2. Add keyboard shortcut (US2) for power users
3. Verify no regressions (US3)
4. Polish with error handling

---

## Quick Reference

| Task | Description | File Path | Story |
|------|-------------|-----------|-------|
| T001 | Add global-shortcut plugin | src-tauri/Cargo.toml | - |
| T002 | Update capabilities | src-tauri/capabilities/default.json | - |
| T003 | Create TypeScript types | src/types/save.ts | - |
| T004 | Create save command | src-tauri/src/commands/save_commands.rs | - |
| T005 | Create save service | src/services/saveService.ts | - |
| T006 | Register command | src-tauri/src/lib.rs | - |
| T007 | Create SaveState context | src/components/SaveStateContext.tsx | - |
| T008 | Create File menu with Save | src-tauri/src/lib.rs | US1 |
| T009 | Menu event handler | src-tauri/src/lib.rs | US1 |
| T010 | Add accelerator | src-tauri/src/lib.rs | US1 |
| T011 | Integrate with canvas | src/components/ExcalidrawCanvas.tsx | US1 |
| T012 | Menu state management | src/components/SaveStateContext.tsx | US1 |
| T013 | Register global shortcut | src-tauri/src/lib.rs | US2 |
| T014 | Shortcut handler | src-tauri/src/lib.rs | US2 |
| T015 | Prevent duplicate saves | src-tauri/src/commands/save_commands.rs | US2 |
| T016 | Preserve existing menus | src-tauri/src/lib.rs | US3 |
| T017 | Error handling UI | src/services/saveService.ts | - |
| T018 | Integration test | - | - |
