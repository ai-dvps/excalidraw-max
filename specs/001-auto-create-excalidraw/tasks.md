# Tasks: Auto-create Excalidraw on App Open

**Feature**: Auto-create Excalidraw on App Open
**Branch**: `001-auto-create-excalidraw`
**Created**: 2025-12-20

## Dependencies & Story Order

```text
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational: ErrorBoundary)
    │
    ▼
Phase 3 [US1] Fresh Excalidraw Canvas on Launch
    │
    ▼
Phase 4 Polish & Cross-Cutting
```

**Story Dependency Graph**:
- US1 (Canvas on Launch) has NO dependencies on other stories
- US2 (Persistence) is OUT OF SCOPE - no tasks generated

## Phase 1: Setup

**Goal**: Initialize project with required dependencies and directory structure

**Independent Test Criteria**: N/A - setup phase only

### Tasks

- [x] T001 Install @excalidraw/excalidraw dependency in package.json
- [x] T002 Create src/components/ directory for React components
- [x] T003 Create src/hooks/ directory for React hooks

## Phase 2: Foundational

**Goal**: Create ErrorBoundary component for graceful error handling (blocking prerequisite for US1)

**Independent Test Criteria**: ErrorBoundary catches rendering errors and shows fallback UI with retry button

### Tasks

- [x] T004 [P] Create ErrorBoundary component in src/components/ErrorBoundary.tsx
- [x] T005 [P] [US1] Add ErrorFallback component in src/components/ErrorBoundary.tsx

## Phase 3: User Story 1 - Fresh Excalidraw Canvas on Launch

**Priority**: P1
**Goal**: Users see a blank Excalidraw canvas immediately upon app launch
**Independent Test**: Launch application and verify canvas is visible and interactive within 3 seconds

**Acceptance Criteria**:
1. Canvas visible immediately when main window appears
2. User can draw shapes/lines/text without additional clicks
3. All standard Excalidraw operations work (undo, redo, erase)

### Tasks

- [x] T006 [US1] Create ExcalidrawCanvas wrapper component in src/components/ExcalidrawCanvas.tsx
- [x] T007 [US1] Import Excalidraw component and CSS in src/components/ExcalidrawCanvas.tsx
- [x] T008 [US1] Render Excalidraw with initialData={null} for blank canvas in src/components/ExcalidrawCanvas.tsx
- [x] T009 [US1] Wrap ExcalidrawCanvas with ErrorBoundary in src/components/ExcalidrawCanvas.tsx
- [x] T010 [US1] Update App.tsx to render ExcalidrawCanvas component
- [x] T011 [US1] Add full-window container styles in src/App.css

## Phase 4: Polish & Cross-Cutting

**Goal**: Verify implementation meets quality standards and success criteria

### Tasks

- [x] T012 [P] Run TypeScript type check with pnpm build
- [x] T013 [P] Run pnpm tauri build to verify production build
- [x] T014 [P] Verify canvas loads within performance budget (3 seconds)

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 14 |
| Parallelizable Tasks | 4 |
| User Story 1 Tasks | 6 |
| Out of Scope Tasks | 0 |

## Parallel Execution Examples

**Setup Phase (all can run in parallel)**:
- T001, T002, T003

**Foundational Phase**:
- T004, T005 can run in parallel (independent files)

**Phase 3 (US1)**:
- T006-T009 depend on T004-T005 (ErrorBoundary)
- T010-T011 can run in parallel after T006-T009 complete

**Phase 4**:
- T012-T014 can run in parallel

## Implementation Strategy

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (Tasks T001-T011)
- Core feature: Auto-create Excalidraw canvas on app launch
- Error handling with retry button
- Full-window canvas styling

**Post-MVP (Future Features)**:
- Canvas persistence between sessions (US2 - deferred)
- File save/load functionality
- Cloud sync/backup
