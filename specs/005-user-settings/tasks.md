# Implementation Tasks: User Settings

**Feature**: User Settings
**Branch**: `005-user-settings`
**Created**: 2025-12-24
**Plan**: [plan.md](plan.md)

## Summary

Implementation of a user settings feature for excalidraw-max Tauri desktop application. Users can access settings via `Cmd+,` / `Ctrl+,` shortcut or menu, configure preferences in a modal dialog, and persist changes using Tauri store plugin.

## Dependencies

### Story Completion Order

```
Phase 1 (Setup)
     ↓
Phase 2 (Foundational) ──────── All stories depend on these
     ↓
Phase 3 (US1) ──────────────── Can start after Phase 2
     ↓
Phase 4 (US2) ──────────────── Can start after Phase 2 (parallel with US1)
     ↓
Phase 5 (US3) ──────────────── Can start after Phase 2 (parallel with US1, US2)
     ↓
Phase 6 (US4) ──────────────── Can start after Phase 2 (parallel with US1, US2, US3)
     ↓
Phase 7 (US5) ──────────────── Can start after Phase 3-6 complete (depends on UI components)
     ↓
Phase 8 (Polish)
```

### Parallel Execution Examples

- **US1, US2, US3 can run in parallel** after Phase 2 - they share foundational code but implement different UI areas
- **US4 can run in parallel** - it only adds confirmation dialog logic
- **US5 must run last** - it depends on the Editor category component being built in US2

## Implementation Strategy

**MVP Scope**: User Story 1 (Access and Open Settings) + Phase 1 + Phase 2 + Basic UI structure

The feature is delivered incrementally:
1. **Sprint 1**: Setup + Foundational + US1 (basic modal opens)
2. **Sprint 2**: US2 + US3 + US4 (full settings navigation and save)
3. **Sprint 3**: US5 (Editor settings with color picker) + Polish

---

## Phase 1: Setup

**Goal**: Install dependencies and configure project for settings feature

### Independent Test Criteria

- `pnpm build` succeeds with no errors
- TypeScript types compile correctly
- Tauri plugins are registered and permissions configured

### Tasks

- [x] T001 Install Ant Design UI library in package.json
- [x] T002 Install Ant Design icons in package.json
- [x] T003 Add Tauri store plugin via pnpm tauri add command
- [x] T004 Add Tauri notification plugin via pnpm tauri add command
- [x] T005 Update src-tauri/capabilities/default.json with store and notification permissions
- [x] T006 Create src/components/settings/ directory structure
- [x] T007 Create src/services/ directory for settings service
- [x] T008 Create src/types/ directory for settings TypeScript interfaces

---

## Phase 2: Foundational

**Goal**: Create shared types, Rust backend commands, and React hooks needed by all user stories

### Independent Test Criteria

- `pnpm tauri dev` runs without errors
- Rust backend compiles with `cargo check`
- TypeScript types are available for all settings-related code

### Tasks

- [x] T010 Create UserSettings TypeScript interface in src/types/settings.ts
- [x] T011 Create EditorSettings TypeScript interface in src/types/settings.ts
- [x] T012 Create SettingsCategory type in src/types/settings.ts
- [x] T013 Create default settings constant in src/types/settings.ts
- [x] T014 [P] Create isValidHexColor validator function in src/utils/settingsValidator.ts
- [x] T015 [P] Create validateSettings function in src/utils/settingsValidator.ts
- [x] T016 Create load_settings Rust command in src-tauri/src/commands/settings_commands.rs
- [x] T017 Create save_settings Rust command in src-tauri/src/commands/settings_commands.rs
- [x] T018 Create reset_settings Rust command in src-tauri/src/commands/settings_commands.rs
- [x] T019 Register settings commands in src-tauri/src/lib.rs
- [x] T020 Create settingsService TypeScript module in src/services/settingsService.ts
- [x] T021 Implement load() method in settingsService.ts calling load_settings command
- [x] T022 Implement save(settings) method in settingsService.ts calling save_settings command
- [x] T023 Implement reset() method in settingsService.ts calling reset_settings command
- [x] T024 Create useSettings React hook in src/hooks/useSettings.ts
- [x] T025 Implement settings loading on hook mount in useSettings.ts
- [x] T026 Expose settings, save, and reset methods from useSettings hook
- [x] T027 Create index barrel file in src/components/settings/index.ts

---

## Phase 3: User Story 1 - Access and Open Settings

**Goal**: Users can open the settings modal via keyboard shortcut or menu

**Priority**: P1 (Critical - without this, no settings access possible)

**Independent Test**: Press `Cmd+,` or navigate to Settings menu, verify modal opens with correct layout

### Tasks

- [x] T030 [US1] Create SettingsModal.tsx component using Ant Design Modal
- [x] T031 [US1] Add open/close state management in SettingsModal.tsx
- [x] T032 [US1] Implement modal with correct width and centered position
- [x] T033 [US1] Add Escape key handler to close modal
- [x] T034 [US1] Add click-outside handler to close modal
- [x] T035 [US1] Add Settings menu item under App menu in src-tauri/src/lib.rs
- [x] T036 [US1] Bind Cmd+, / Ctrl+, shortcut to open settings modal
- [x] T037 [US1] Connect menu item to SettingsModal component visibility
- [ ] T038 [P] [US1] Write unit test for SettingsModal open/close behavior in tests/unit/settingsModal.test.tsx
- [ ] T039 [P] [US1] Write unit test for Escape key handler in tests/unit/settingsModal.test.tsx

---

## Phase 4: User Story 2 - Navigate Settings Categories

**Goal**: Users can navigate between General, Appearance, Shortcuts, and Editor categories

**Priority**: P1 (Core navigation pattern for all settings)

**Independent Test**: Open settings, click each category, verify content updates and category is highlighted

### Tasks

- [ ] T045 [US2] Create SettingsSidebar.tsx component using Ant Design Menu
- [ ] T046 [US2] Define category data structure with General, Appearance, Shortcuts, Editor
- [ ] T047 [US2] Implement category selection state management
- [ ] T048 [US2] Add visual highlighting for selected category
- [ ] T049 [US2] Create SettingsContent.tsx component for dynamic content rendering
- [ ] T050 [US2] Create placeholder GeneralSettings.tsx component
- [ ] T051 [US2] Create placeholder AppearanceSettings.tsx component
- [ ] T052 [US2] Create placeholder ShortcutsSettings.tsx component
- [ ] T053 [US2] Create EditorSettings.tsx component stub (full implementation in US5)
- [ ] T054 [US2] Integrate sidebar and content in SettingsModal.tsx
- [ ] T055 [US2] Ensure General category is selected by default on modal open
- [ ] T056 [P] [US2] Write unit test for category selection in tests/unit/settingsSidebar.test.tsx
- [ ] T057 [P] [US2] Write unit test for SettingsContent rendering in tests/unit/settingsContent.test.tsx

---

## Phase 5: User Story 3 - Save Settings

**Goal**: Users can save settings changes that persist across sessions

**Priority**: P1 (Core value proposition - settings must persist)

**Independent Test**: Change a setting, click Save, close modal, reopen settings, verify change persists

### Tasks

- [ ] T065 [US3] Add Save button to SettingsModal using Ant Design Button
- [ ] T066 [US3] Implement save handler calling useSettings.save()
- [ ] T067 [US3] Add loading state during save operation
- [ ] T068 [US3] Close modal after successful save
- [ ] T069 [US3] Handle save errors and display notification
- [ ] T070 [US3] Integrate Save button with cancel button layout
- [ ] T071 [US3] Add onSave callback for external integration (Excalidraw canvas)
- [ ] T072 [P] [US3] Write integration test for save workflow in tests/integration/settings.test.ts
- [ ] T073 [P] [US3] Write unit test for save button loading state in tests/unit/settingsModal.test.tsx

---

## Phase 6: User Story 4 - Cancel Settings Changes

**Goal**: Users can discard unsaved changes with confirmation dialog

**Priority**: P2 (Important for UX safety)

**Independent Test**: Change settings, click Cancel, confirm discard, verify original values preserved

### Tasks

- [ ] T080 [US4] Add Cancel button to SettingsModal using Ant Design Button
- [ ] T081 [US4] Implement cancel handler with unsaved changes detection
- [ ] T082 [US4] Create confirmation Modal using Ant Design Modal.confirm
- [ ] T083 [US4] Display "Discard unsaved changes?" message with Yes/No options
- [ ] T084 [US4] Handle Yes - close modal without saving
- [ ] T085 [US4] Handle No - keep modal open with changes intact
- [ ] T086 [US4] Skip confirmation if no changes were made
- [ ] T087 [P] [US4] Write unit test for cancel confirmation dialog in tests/unit/settingsModal.test.tsx
- [ ] T088 [P] [US4] Write integration test for discard workflow in tests/integration/settings.test.ts

---

## Phase 7: User Story 5 - Modify Editor Settings

**Goal**: Users can configure default background color for Excalidraw canvases

**Priority**: P2 (Only Editor setting in scope)

**Independent Test**: Open Editor category, change color, save, create new canvas, verify background color

### Tasks

- [ ] T095 [US5] Implement EditorSettings.tsx with Ant Design ColorPicker component
- [ ] T096 [US5] Add color picker for defaultBackgroundColor setting
- [ ] T097 [US5] Display live preview of selected color
- [ ] T098 [US5] Validate hex color format before saving
- [ ] T099 [US5] Connect color picker to useSettings hook
- [ ] T100 [US5] Integrate EditorSettings into SettingsContent rendering
- [ ] T101 [US5] Update ExcalidrawCanvas to use configured default background color
- [ ] T102 [P] [US5] Write unit test for color validation in tests/unit/editorSettings.test.tsx
- [ ] T103 [P] [US5] Write integration test for color picker in tests/unit/colorPicker.test.tsx

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Error handling, notifications, cleanup, and integration

### Tasks

- [ ] T110 Add notification toast when settings file is corrupted or missing at startup
- [ ] T111 Load default settings gracefully when store file is invalid
- [ ] T112 Add error logging for settings operations
- [ ] T113 Add keyboard navigation support for settings modal
- [ ] T114 Add focus management (focus trap) for settings modal
- [ ] T115 Add TypeScript types for Tauri store plugin import
- [ ] T116 Add TypeScript types for Tauri notification plugin import
- [ ] T117 Run pnpm build to verify production build succeeds
- [ ] T118 Run cargo check to verify Rust code compiles
- [ ] T119 Run all tests and verify 100% pass rate
- [ ] T120 Update CLAUDE.md with new technology context (Ant Design, Tauri plugins)

---

## Task Summary

| Phase | User Story | Task Count | Parallelizable |
|-------|------------|------------|----------------|
| Phase 1 | Setup | 8 | 6 |
| Phase 2 | Foundational | 18 | 4 |
| Phase 3 | US1 | 10 | 2 |
| Phase 4 | US2 | 12 | 2 |
| Phase 5 | US3 | 9 | 2 |
| Phase 6 | US4 | 9 | 2 |
| Phase 7 | US5 | 9 | 2 |
| Phase 8 | Polish | 11 | 8 |
| **Total** | | **86** | **28** |

### Task Count by User Story

| User Story | Task Count | Priority |
|------------|------------|----------|
| US1: Access and Open Settings | 10 | P1 |
| US2: Navigate Settings Categories | 12 | P1 |
| US3: Save Settings | 9 | P1 |
| US4: Cancel Settings Changes | 9 | P2 |
| US5: Modify Editor Settings | 9 | P2 |
| Foundational (all stories) | 18 | - |
| Setup | 8 | - |
| Polish | 11 | - |

### Parallel Opportunities

- T006, T007, T008 can run in parallel (directory creation)
- T010, T011, T012 can run in parallel (type definitions)
- T014, T015 can run in parallel (validation utilities)
- T016, T017, T018 can run in parallel (Rust commands)
- T038, T039 can run in parallel (US1 tests)
- T056, T057 can run in parallel (US2 tests)
- T072, T073 can run in parallel (US3 tests)
- T087, T088 can run in parallel (US4 tests)
- T102, T103 can run in parallel (US5 tests)
- T113, T114, T115, T116, T117, T118, T119, T120 can run in parallel (Polish phase)
