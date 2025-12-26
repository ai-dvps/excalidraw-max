# Implementation Plan: AI Chat Box

**Branch**: `006-ai-chat-box` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ai-chat-box/spec.md`

## Summary

Add an AI chat box to the Excalidraw desktop application using Ant Design X components integrated into the Excalidraw Sidebar. The feature enables users to access AI assistance while working on diagrams through a side panel that slides out from the right.

**Technical Approach**:
- Use Excalidraw's `<Sidebar>` component with custom AI tab
- Ant Design X for chat UI (Bubble, Bubble.List, Sender)
- Session-based in-memory state for chat history
- Side panel layout with resizable width (via Excalidraw Sidebar docking)

## Technical Context

**Language/Version**: TypeScript 5.6, React 18
**Primary Dependencies**: `@ant-design/x`, `@ant-design/x-sdk`, `@ant-design/icons`
**Storage**: None (session-based, in-memory only per spec)
**Testing**: React Testing Library (existing pattern in project)
**Target Platform**: macOS desktop (Tauri v2)
**Project Type**: Single project (React frontend + Tauri backend)
**Performance Goals**: <2s sidebar open, <3s message display (SC-001, SC-002)
**Constraints**: Local data only, no PII transmission (SC-007)
**Scale/Scope**: Single user session, no multi-user requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript compilation passes | N/A | Will verify during implementation |
| `pnpm build` succeeds | N/A | Will verify during implementation |
| Rust `cargo check` passes | N/A | No Rust changes for this feature |
| Security-first architecture | PASS | Chat data local-only per spec |
| Type safety at FFI | N/A | No FFI changes needed |
| Performance-conscious bundling | PASS | Ant Design X is tree-shakeable |

## Project Structure

### Documentation (this feature)

```text
specs/006-ai-chat-box/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── ai-chat-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── AIChatBox.tsx    # Main chat component
├── types/
│   └── chat.ts          # Chat type definitions
└── hooks/
    └── useAIChat.ts     # Chat state management (optional)

tests/
├── unit/
│   └── AIChatBox.test.tsx
└── integration/
    └── sidebar-chat.test.tsx
```

**Structure Decision**: Feature follows existing project patterns. Chat components placed in `src/components/` alongside existing ExcalidrawCanvas. Types in `src/types/`. Tests follow existing test structure.

## Complexity Tracking

> Not applicable - no Constitution violations

---

## Research Summary

**Research output**: [research.md](./research.md)

### Key Findings

1. **Excalidraw Sidebar** - Native integration via `<Sidebar>` component as child of `<Excalidraw>`. Supports docking, tabs, and external state management.

2. **Ant Design X** - Purpose-built React library for AI interfaces with:
   - `Bubble` - Message bubbles with typing effects
   - `Bubble.List` - Scrollable message container with auto-scroll
   - `Sender` - Input field with send button
   - `useXChat` hook - State management for conversations

3. **Dependencies** - Add `@ant-design/x`, `@ant-design/x-sdk`, `@ant-design/icons`

---

## Data Model Summary

**Data model output**: [data-model.md](./data-model.md)

### Entities

- **ChatMessage** - Individual message with id, content, role, timestamp, status
- **ChatSession** - Collection of messages with UI state
- **ChatState** - Sidebar visibility and docking state

### Key Constraints

- Session-based only (no persistence)
- Messages ordered chronologically
- Empty messages blocked at UI level

---

## API Contracts Summary

**Contracts output**: [contracts/ai-chat-api.yaml](./contracts/ai-chat-api.yaml)

### Contract Categories

1. Sidebar Integration - Props for `<Sidebar>` and `<Sidebar.Trigger>`
2. Chat Components - Bubble, Bubble.List, Sender interfaces
3. State Hook - `useAIChat` contract
4. Events - User actions and AI response events
5. Error Handling - Error types and display contract

---

## Quick Start Summary

**Quickstart output**: [quickstart.md](./quickstart.md)

### Implementation Sequence

1. Install dependencies (`@ant-design/x`, `@ant-design/x-sdk`, `@ant-design/icons`)
2. Create chat types (`src/types/chat.ts`)
3. Create AIChatBox component (`src/components/AIChatBox.tsx`)
4. Integrate with Excalidraw Sidebar (`ExcalidrawCanvas.tsx`)
5. Verify with development server

### Key Code Patterns

- Use `<Sidebar name="ai-chat">` as child of `<Excalidraw>`
- Use `Bubble.List` with `roles` prop for user/AI styling
- Use `Sender` component for input
- Manage state with React `useState` hook

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Install required npm dependencies
3. Implement components following quickstart guide
4. Add unit and integration tests
5. Verify all success criteria from spec
