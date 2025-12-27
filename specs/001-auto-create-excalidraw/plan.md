# Implementation Plan: Auto-create Excalidraw on App Open

**Branch**: `001-auto-create-excalidraw` | **Date**: 2025-12-20 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/001-auto-create-excalidraw/spec.md`

## Summary

Implement automatic creation of an Excalidraw canvas when the excalimaxdraw Tauri desktop application launches. Users will see a blank drawing canvas immediately upon app startup, with all standard Excalidraw tools available. Error handling will show a dialog with retry button if initialization fails.

## Technical Context

**Language/Version**: TypeScript 5.6, Rust edition 2024 (Tauri v2)
**Primary Dependencies**: React 18, @excalidraw/excalidraw (to be added), @tauri-apps/api v2
**Storage**: N/A - no persistence for this feature (fresh canvas on every launch)
**Testing**: React Testing Library (frontend), cargo test (Rust backend)
**Target Platform**: macOS desktop (Tauri)
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: Canvas interactive within 3 seconds of window appearance
**Constraints**: <200ms for canvas to become visible (CSS render), error dialog on init failure
**Scale/Scope**: Single user, single canvas instance

## Constitution Check (Post-Design Re-check)

*GATE: Verified after Phase 1 design*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security-First Architecture | ✅ PASS | No backend commands; frontend-only feature |
| II. Type Safety Across Layers | ✅ PASS | Using Excalidraw's TypeScript types |
| III. Performance-Conscious Bundling | ✅ PASS | Excalidraw is only new dependency |
| IV. Platform-Appropriate UX | ✅ PASS | Full-window canvas, desktop-first |
| V. Testable Command Architecture | ✅ PASS | React tests + error boundary tests |

**All gates pass. Ready for implementation.**

## Project Structure

### Documentation (this feature)

```text
specs/001-auto-create-excalidraw/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── App.tsx              # Main component - add Excalidraw here
├── main.tsx             # React entry point
├── App.css              # App styling
├── components/          # (NEW) React components
│   └── ExcalidrawCanvas.tsx  # Excalidraw wrapper component
└── hooks/               # (NEW) React hooks
    └── useExcalidraw.ts # Hook for Excalidraw initialization

src-tauri/
├── src/
│   ├── lib.rs           # Tauri commands (no changes needed)
│   └── main.rs          # Rust entry point
└── Cargo.toml           # Dependencies

tests/
├── unit/                # (NEW) React component tests
└── integration/         # (NEW) End-to-end tests
```

**Structure Decision**: Single project with React frontend. ExcalidrawCanvas component encapsulates Excalidraw integration. Simple hook for managing Excalidraw API and state.

## Complexity Tracking

> **No violations - feature is straightforward frontend change.**

## Phase 0: Research

### Research Questions

1. **Excalidraw React Integration Pattern**
   - How to properly initialize Excalidraw component in React 18
   - Best practices for container sizing and responsive canvas

2. **Error Handling**
   - Excalidraw initialization failure scenarios
   - Proper error boundary implementation in React

3. **Performance Optimization**
   - Lazy loading Excalidraw for faster initial render
   - Debouncing onChange callbacks

## Phase 1: Design

### Key Design Decisions

1. **Container Strategy**
   - Excalidraw requires parent container with defined height
   - Use 100% width/height of Tauri window

2. **Error Boundary**
   - React Error Boundary to catch Excalidraw initialization errors
   - Fallback UI with retry button

3. **No Persistence**
   - Render with no initialData (blank canvas)
   - All canvas data discarded on app close

## Phase 2: Implementation

### Tasks Overview

1. Install @excalidraw/excalidraw dependency
2. Create ExcalidrawCanvas component with error boundary
3. Update App.tsx to render ExcalidrawCanvas
4. Add container styles for full-window canvas
5. Add unit tests for error boundary
6. Verify build passes
