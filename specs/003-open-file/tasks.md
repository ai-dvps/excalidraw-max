# Implementation Tasks: Open File

**Feature**: Open File
**Branch**: `003-open-file`
**Generated**: 2025-12-20
**Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## User Stories

| Story | Title | Priority | Independent Test |
|-------|-------|----------|------------------|
| US1 | Open File via Menu or Keyboard | P1 | Trigger open via menu/shortcut, select file, verify new window opens with content |
| US2 | File Format Support | P1 | Open .excalidraw and .json files, verify content loads in both cases |
| US3 | Invalid File Handling | P2 | Open invalid file, verify error message displayed |

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
┌──────────────────────────────────────┐
│  Phase 3 (US1) - Core Open Flow      │ ← Primary MVP
│  - Menu item + shortcut               │
│  - Dialog + file reading              │
│  - Window creation                    │
└──────────────────────────────────────┘
    ↓           ↓           ↓
Phase 4      Phase 5      Phase 6
(US2)        (US3)      (Polish)
```

## Phase 1: Setup

**Goal**: Initialize project structure and types for open functionality

### Independent Test Criteria
- All new files are created with correct structure
- TypeScript compiles without errors

### Tasks

- [x] T001 Create LoadResult type in src/types/open.ts
- [x] T002 Create InitialData interface in src/types/open.ts
- [x] T003 Create Rust commands module src-tauri/src/commands/open_commands.rs
- [x] T004 Export open commands in src-tauri/src/commands/mod.rs
- [x] T005 [P] Implement read_drawing_file command in src-tauri/src/commands/open_commands.rs
- [x] T006 Register read_drawing_file in src-tauri/src/lib.rs invoke_handler
- [x] T007 Create src/services/openService.ts with triggerOpen() function
- [x] T008 Create src/hooks/useFileLoader.ts React hook
- [x] T009 Add event listeners for 'menu-open-triggered' in openService.init()
- [x] T010 [US1] Add Open menu item with accelerator CmdOrControl+O in src-tauri/src/lib.rs
- [x] T011 [US1] Register global shortcut for Cmd+O / Ctrl+O in src-tauri/src/lib.rs
- [x] T012 [US1] Add menu event handler for 'open' in src-tauri/src/lib.rs
- [x] T013 [US1] Implement createNewWindow function in src/services/openService.ts
- [x] T014 [US1] Add open shortcut listener for 'shortcut-open-triggered' in openService
- [x] T015 [US1] Modify ExcalidrawCanvas.tsx to accept initialData prop
- [x] T016 [US1] Pass initialData to Excalidraw component when loading from file
- [x] T017 [US1] Emit load-canvas-data event when new window is ready
- [x] T018 [US2] Configure open dialog filters to show .excalidraw and .json files in src/services/openService.ts
- [x] T019 [US2] Test loading .excalidraw files (manual verification)
- [x] T020 [US2] Test loading .json files (manual verification)
- [x] T021 [US3] Add JSON validation in read_drawing_file Rust command
- [x] T022 [US3] Add Excalidraw structure validation (check for elements array)
- [x] T023 [US3] Return structured error messages from Rust command
- [x] T024 [US3] Display error messages in openService when load fails
- [ ] T025 [US3] Add progress indicator for files larger than 10MB in openService
- [x] T026 Run TypeScript compilation (tsc) to verify no errors
- [x] T027 Run pnpm build to verify production build succeeds
- [ ] T028 Verify open dialog appears in under 1 second (SC-001)
- [ ] T029 Verify files open successfully on first attempt (SC-002)
- [ ] T030 Verify error messages display within 2 seconds (SC-003)
- [ ] T031 Verify large files show progress indicator (SC-004)
- [ ] T032 Verify zero data loss when opening valid files (SC-005)

## Phase 2: Foundational

**Goal**: Implement core file reading and loading functionality (blocking for all user stories)

### Independent Test Criteria
- Rust command can read files and return LoadResult
- Frontend service can invoke Rust command
- File loading hook works correctly

### Tasks

- [ ] T005 [P] Implement read_drawing_file command in src-tauri/src/commands/open_commands.rs
- [ ] T006 Register read_drawing_file in src-tauri/src/lib.rs invoke_handler
- [ ] T007 Create src/services/openService.ts with triggerOpen() function
- [ ] T008 Create src/hooks/useFileLoader.ts React hook
- [ ] T009 Add event listeners for 'menu-open-triggered' in openService.init()

## Phase 3: User Story 1 - Open File via Menu or Keyboard

**Goal**: Users can open files via File → Open... menu or Cmd+O / Ctrl+O shortcut

**Independent Test**: Trigger open via menu or keyboard, select a valid .excalidraw file, verify new window opens with drawing content loaded

### Tasks

- [ ] T010 [US1] Add Open menu item with accelerator CmdOrControl+O in src-tauri/src/lib.rs
- [ ] T011 [US1] Register global shortcut for Cmd+O / Ctrl+O in src-tauri/src/lib.rs
- [ ] T012 [US1] Add menu event handler for 'open' in src-tauri/src/lib.rs
- [ ] T013 [US1] Implement createNewWindow function in src/services/openService.ts
- [ ] T014 [US1] Add open shortcut listener for 'shortcut-open-triggered' in openService
- [ ] T015 [US1] Modify ExcalidrawCanvas.tsx to accept initialData prop
- [ ] T016 [US1] Pass initialData to Excalidraw component when loading from file
- [ ] T017 [US1] Emit load-canvas-data event when new window is ready

## Phase 4: User Story 2 - File Format Support

**Goal**: Support opening .excalidraw and .json file formats

**Independent Test**: Open files with .excalidraw and .json extensions, verify content loads correctly in both cases

### Tasks

- [ ] T018 [US2] Configure open dialog filters to show .excalidraw and .json files in src/services/openService.ts
- [ ] T019 [US2] Test loading .excalidraw files (manual verification)
- [ ] T020 [US2] Test loading .json files (manual verification)

## Phase 5: User Story 3 - Invalid File Handling

**Goal**: Display clear error messages for invalid or corrupted files

**Independent Test**: Attempt to open invalid file, verify appropriate error message is displayed within 2 seconds

### Tasks

- [ ] T021 [US3] Add JSON validation in read_drawing_file Rust command
- [ ] T022 [US3] Add Excalidraw structure validation (check for elements array)
- [ ] T023 [US3] Return structured error messages from Rust command
- [ ] T024 [US3] Display error messages in openService when load fails
- [ ] T025 [US3] Add progress indicator for files larger than 10MB in openService

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Finalize implementation and ensure quality

### Tasks

- [ ] T026 Run TypeScript compilation (tsc) to verify no errors
- [ ] T027 Run pnpm build to verify production build succeeds
- [ ] T028 Verify open dialog appears in under 1 second (SC-001)
- [ ] T029 Verify files open successfully on first attempt (SC-002)
- [ ] T030 Verify error messages display within 2 seconds (SC-003)
- [ ] T031 Verify large files show progress indicator (SC-004)
- [ ] T032 Verify zero data loss when opening valid files (SC-005)

## Implementation Strategy

### MVP Scope (US1 Only - Core Open Flow)

For a Minimum Viable Product, implement only Phase 1, Phase 2, and Phase 3. This delivers:
- File → Open... menu item
- Cmd+O / Ctrl+O shortcut
- Native open dialog
- New window with loaded drawing

### Incremental Delivery

1. **Sprint 1**: Phases 1-3 (Core open functionality)
2. **Sprint 2**: Phase 4 (File format support for .json)
3. **Sprint 3**: Phase 5 (Error handling and progress indicator)
4. **Sprint 4**: Phase 6 (Polish and testing)

## Parallel Execution Opportunities

| Task Group | Can Run In Parallel With | Reason |
|------------|-------------------------|--------|
| T005, T006 | T007, T008 | Rust backend vs Frontend services |
| T010, T011, T012 | T013, T014 | Menu/shortcut setup vs Service implementation |
| T019, T020 | T021, T022 | Testing vs Backend validation |

## File Reference Summary

| Task | File |
|------|------|
| T001-T002 | src/types/open.ts |
| T003-T004 | src-tauri/src/commands/open_commands.rs, mod.rs |
| T005-T006 | src-tauri/src/commands/open_commands.rs, lib.rs |
| T007 | src/services/openService.ts |
| T008 | src/hooks/useFileLoader.ts |
| T009 | src/services/openService.ts |
| T010-T012 | src-tauri/src/lib.rs |
| T013 | src/services/openService.ts |
| T014 | src/services/openService.ts |
| T015-T017 | src/components/ExcalidrawCanvas.tsx |

## Task Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1 | 4 | Setup |
| Phase 2 | 5 | Foundational |
| Phase 3 (US1) | 8 | Core Open Flow |
| Phase 4 (US2) | 3 | File Format Support |
| Phase 5 (US3) | 5 | Invalid File Handling |
| Phase 6 | 7 | Polish |
| **Total** | **32** | |

## Execution Order

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational) - blocks all user stories
3. Complete Phase 3 (US1) - delivers MVP
4. Complete Phase 4 (US2) - if needed
5. Complete Phase 5 (US3) - if needed
6. Complete Phase 6 (Polish)
