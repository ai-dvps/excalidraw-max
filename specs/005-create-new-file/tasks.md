# Task List: Create New File Feature

**Feature**: Create New File | **Branch**: `005-create-new-file`
**Created**: 2025-12-24 | **Spec**: [spec.md](spec.md)

## Summary

Implement "Create New File" functionality enabling users to create new files via File menu or keyboard shortcut (Ctrl+N/Cmd+N). New files open in a new Tauri window with user settings applied.

## Task Count Summary

| Phase | Tasks | User Stories |
|-------|-------|--------------|
| Phase 1: Setup | 2 | N/A |
| Phase 2: Foundational | 2 | N/A |
| Phase 3: US1 (Menu) | 2 | US1 |
| Phase 4: US2 (Shortcut) | 2 | US2 |
| Phase 5: US3 (Settings) | 2 | US3 |
| Phase 6: Polish | 1 | N/A |
| **Total** | **11** | **3** |

## Dependency Graph

```
Phase 1 (Setup)
     ↓
Phase 2 (Foundational)
     ↓
┌────┴────┐
↓         ↓
Phase 3   Phase 4    (US1 & US2 can be done in parallel)
(US1)     (US2)
     ↓    ↓
     └────┘
        ↓
Phase 5 (US3)  ← US3 depends on US1/US2 completion
        ↓
Phase 6 (Polish)
```

## Phase 1: Setup

**Goal**: Project initialization and configuration

### T001 Add "New" menu item to File menu in lib.rs

File: `src-tauri/src/lib.rs`

Description: Add "New" menu item to the existing File menu, following the pattern of existing menu items like Open and Save.

Acceptance:
- Menu item "New" appears under File menu
- Menu item has accelerator (CmdOrControl+N)

### T002 Register Ctrl+N/Cmd+N global shortcut

File: `src-tauri/src/lib.rs`

Description: Register platform-dependent keyboard shortcut for creating new files using the global shortcut plugin.

Acceptance:
- Ctrl+N shortcut works on Windows/Linux
- Cmd+N shortcut works on macOS
- Shortcut handler emits "shortcut-new-triggered" event

---

## Phase 2: Foundational

**Goal**: Blocking prerequisites before user story implementation

### T003 Add menu event handler for "New" action

File: `src-tauri/src/lib.rs`

Description: Add handler in `app.on_menu_event()` to emit "menu-new-triggered" event when user selects "New" from File menu.

Acceptance:
- Event "menu-new-triggered" is emitted on menu selection
- Handler follows existing event emission pattern

### T004 Add triggerNew() method to openService

File: `src/services/openService.ts`

Description: Add `triggerNew()` method that creates a new window with empty canvas data and user settings applied.

Acceptance:
- Method loads user settings
- Method creates InitialData with empty elements and settings
- Method calls createNewWindow() with InitialData

---

## Phase 3: User Story 1 - Create New File via Menu

**Goal**: Users can create new files from the File menu

**Independent Test**: Click "New" in File menu → New window opens with blank canvas

**Acceptance Scenarios**:
1. Given app has open windows, When user clicks "New", Then new window opens with blank canvas
2. Given app has no open windows, When user clicks "New", Then new window opens with blank canvas

### T005 [P] [US1] Add event listener for menu-new-triggered in openService

File: `src/services/openService.ts`

Description: Add event listener in `init()` method to handle "menu-new-triggered" event and call `triggerNew()`.

Acceptance:
- Listener registered on service init
- Event triggers `triggerNew()` call

### T006 [US1] Test new file creation via menu

File: Manual test in `specs/005-create-new-file/quickstart.md`

Description: Verify menu item creates new window successfully.

Acceptance:
- "New" menu item appears under File
- Clicking creates new Tauri window
- New window has blank Excalidraw canvas

---

## Phase 4: User Story 2 - Create New File via Keyboard Shortcut

**Goal**: Users can create new files with Ctrl+N/Cmd+N

**Independent Test**: Press Ctrl+N or Cmd+N → New window opens

**Acceptance Scenarios**:
1. Given app is running, When user presses Ctrl+N (Win/Linux) or Cmd+N (Mac), Then new window opens
2. Given app is running, When user presses shortcut while text input focused, Then new window still opens

### T007 [P] [US2] Add event listener for shortcut-new-triggered in openService

File: `src/services/openService.ts`

Description: Add event listener in `init()` method to handle "shortcut-new-triggered" event and call `triggerNew()`.

Acceptance:
- Listener registered on service init
- Event triggers `triggerNew()` call

### T008 [US2] Test new file creation via keyboard shortcut

File: Manual test in `specs/005-create-new-file/quickstart.md`

Description: Verify keyboard shortcut creates new window successfully.

Acceptance:
- Ctrl+N creates new window on Windows/Linux
- Cmd+N creates new window on macOS
- New window opens within 500ms of key press

---

## Phase 5: User Story 3 - Apply User Settings to New File

**Goal**: New files respect user editor preferences

**Independent Test**: Change settings → Create new file → Settings are applied

**Acceptance Scenarios**:
1. Given user configured custom background color, When user creates new file, Then canvas shows custom color
2. Given user has no custom settings, When user creates new file, Then canvas shows white background

### T009 [P] [US3] Verify settings passed to InitialData in triggerNew()

File: `src/services/openService.ts`

Description: Ensure `triggerNew()` passes user settings (background color) to InitialData.appState.

Acceptance:
- settingsService.loadSettings() is called
- viewBackgroundColor is set from settings

### T010 [US3] Test settings applied to new file

File: Manual test in `specs/005-create-new-file/quickstart.md`

Description: Verify user settings are applied to new canvas.

Acceptance:
- Custom background color appears on new canvas
- Default white background when no custom settings

---

## Phase 6: Polish

**Goal**: Cross-cutting concerns and final validation

### T011 Comprehensive feature testing and validation

File: `specs/005-create-new-file/quickstart.md`

Description: Run full test checklist and verify all success criteria are met.

Acceptance:
- All manual tests pass (menu, shortcut, settings)
- Multiple concurrent windows work (10+)
- Window labels are unique (excalidraw-1, excalidraw-2, etc.)
- pnpm build succeeds
- cargo check passes

---

## Parallel Execution Examples

### Within Phase 3 (US1) and Phase 4 (US2):
- T005 (add menu listener) can run in parallel with T007 (add shortcut listener)
- Both can be tested independently

### All User Story phases:
- US1 and US2 are independent - can be implemented in parallel
- US3 depends on T004 (triggerNew exists) but not on US1/US2 completion

## Implementation Strategy

**MVP Scope**: User Story 1 only (T001-T006)
- Focus on menu integration first
- Establish base `triggerNew()` functionality
- Verify basic new file creation

**Incremental Delivery**:
1. Add menu and shortcut handlers (T001-T004)
2. Wire event listeners (T005, T007)
3. Verify settings application (T009)
4. Polish and test (T006, T008, T010, T011)

## File Reference

| File | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | Menu item, shortcut registration, event emission |
| `src/services/openService.ts` | triggerNew() method, event listeners |
| `src/hooks/useSettings.ts` | Settings loading (existing) |
| `specs/005-create-new-file/quickstart.md` | Test checklist |
