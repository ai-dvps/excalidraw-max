# Implementation Tasks: AI Chat Box

**Feature**: AI Chat Box
**Branch**: `006-ai-chat-box`
**Generated**: 2025-12-25

## Dependencies Graph

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational
    │
    ▼
Phase 3: US1 (Open Chat from Sidebar) ──────► MVP Complete
    │                                               │
    ▼                                               ▼
Phase 4: US2 (Send Messages) ◄─────────────────────┘
    │
    ▼
Phase 5: US3 (View Chat History)
    │
    ▼
Phase 6: US4 (Clear Conversation)
    │
    ▼
Phase 7: Polish & Cross-Cutting
```

## Independent Test Criteria

| User Story | Test Criteria |
|------------|---------------|
| **US1** | Sidebar icon visible, clicking toggles chat panel visibility within 2s |
| **US2** | User can type message, press Enter/send, see message in chat, receive AI response |
| **US3** | Multiple messages visible in scrollable area, history persists across sidebar toggle |
| **US4** | Clear button removes all messages, new conversation starts fresh |

---

## Phase 1: Setup

**Goal**: Initialize project with required dependencies

- [x] T001 Install Ant Design X dependencies in package.json
  - Execute: `pnpm add @ant-design/x @ant-design/x-sdk @ant-design/icons`
  - Verify: Check package.json has new dependencies with correct versions

- [x] T002 [P] Create chat type definitions in src/types/chat.ts
  - Define `MessageRole` type ('user' | 'ai')
  - Define `MessageStatus` type ('sent' | 'loading' | 'error')
  - Define `ChatMessage` interface with id, content, role, timestamp, status
  - Export all types for use in components

---

## Phase 2: Foundational

**Goal**: Create base component structure before user stories

- [x] T003 [P] Create AIChatBox component skeleton in src/components/AIChatBox.tsx
  - Create functional component with placeholder content
  - Add basic structure with Flex layout (height: 100%, padding: 16)
  - Export component for use in ExcalidrawCanvas

- [x] T004 [P] Update ExcalidrawCanvas.tsx to include Sidebar with AIChatBox
  - Import Sidebar from @excalidraw/excalidraw
  - Import AIChatBox component
  - Add useState for isChatDocked (boolean)
  - Wrap Excalidraw with Sidebar component (name="ai-chat")
  - Add Sidebar.Tab with AIChatBox inside
  - Add Sidebar.TabTrigger for AI Chat

---

## Phase 3: User Story 1 - Open AI Chat from Sidebar

**Goal**: Users can open/close the AI chat box from the sidebar

**Independent Test**: Click AI Chat sidebar icon, verify chat panel opens within 2 seconds

- [x] T005 [US1] Implement chat state management in AIChatBox.tsx
  - Add useState for messages array (ChatMessage[])
  - Add useState for isOpen (boolean)
  - Add useState for isDocked (boolean)
  - Connect state to ExcalidrawCanvas via props

- [x] T006 [US1] Add Sidebar trigger with proper icon and label
  - Use Sidebar.TabTrigger with tab="ai"
  - Add icon (RobotOutlined from @ant-design/icons)
  - Add label text "AI Chat"

- [x] T007 [US1] Connect Sidebar docked state to component
  - Pass docked state from ExcalidrawCanvas
  - Handle onDock callback to update parent state
  - Verify chat panel opens/closes on trigger click

- [x] T008 [US1] Test sidebar open/close functionality
  - Click AI Chat trigger
  - Verify chat panel visible within 2 seconds (SC-001)
  - Click trigger again to close
  - Test toggle 50 times without performance issues (SC-005)

---

## Phase 4: User Story 2 - Send Messages in Chat

**Goal**: Users can send messages and receive AI responses

**Independent Test**: Type message, press Enter, verify message appears with AI response

- [x] T009 [US2] Implement Sender component for message input
  - Add Ant Design X Sender component
  - Connect value to input state
  - Handle onChange to update inputValue
  - Handle onSubmit to send message

- [x] T010 [US2] Add message sending logic in AIChatBox.tsx
  - Create handleSendMessage function
  - Validate input (not empty/whitespace)
  - Create user ChatMessage with unique ID (crypto.randomUUID())
  - Append message to messages state

- [x] T011 [US2] Implement loading state during AI response
  - Add isLoading state
  - Show loading indicator in Sender when true
  - Add loading message placeholder (status: 'loading')

- [x] T012 [US2] Implement AI response handling
  - Call onSendMessage prop with user content
  - On success: replace loading message with AI response
  - On error: show error state in message

- [x] T013 [US2] Configure Bubble.List with proper roles
  - Set roles prop with user (placement: 'end') and ai (placement: 'start')
  - Add typing effect for AI messages (typing: true)
  - Add avatars for user and AI roles

- [x] T014 [US2] Test message sending and receiving
  - Type message and press Enter
  - Verify message appears in conversation (SC-002: 95% within 3s)
  - Verify loading indicator shown
  - Verify AI response displayed
  - Send 10+ messages without errors (SC-003)

---

## Phase 5: User Story 3 - View Chat History

**Goal**: Users can scroll through and retain conversation history

**Independent Test**: Send multiple messages, verify all visible, toggle sidebar, verify history persists

- [x] T015 [US3] Implement scrollable message list
  - Configure Bubble.List with flex: 1 and overflow: 'auto'
  - Enable autoScroll to keep latest message visible
  - Set max height to container bounds

- [x] T016 [US3] Preserve chat history across sidebar toggle
  - Ensure messages state persists when isOpen changes
  - Messages array stays in memory during session (FR-007)
  - Verify history visible when reopening chat

- [x] T017 [US3] Test chat history functionality
  - Send 5+ messages until scrollbar appears
  - Scroll through older messages
  - Close and reopen sidebar
  - Verify all previous messages still visible

---

## Phase 6: User Story 4 - Clear Conversation

**Goal**: Users can clear conversation history to start fresh

**Independent Test**: Click clear button, verify all messages removed, new messages start fresh

- [x] T018 [US4] Add clear conversation button
  - Add button in chat header or toolbar
  - Use delete/clear icon from @ant-design/icons
  - Position for easy access (top of chat panel)

- [x] T019 [US4] Implement clear conversation logic
  - Create clearConversation function
  - Reset messages array to empty []
  - Reset isLoading to false
  - Clear any error states

- [x] T020 [US4] Test clear conversation
  - Send several messages
  - Click clear button
  - Verify all messages removed
  - Send new message, verify fresh conversation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Handle edge cases, error states, and final integration

- [x] T021 Handle empty message submission
  - Prevent sending when input is empty or whitespace
  - Show visual feedback if user tries to send empty

- [x] T022 Implement error handling and display
  - Catch errors from onSendMessage
  - Display error state in message bubble
  - Show retry option for failed messages

- [x] T023 Handle network failure scenarios
  - Detect network errors
  - Display user-friendly error message
  - Ensure 100% of errors have actionable feedback (SC-006)

- [x] T024 Make chat box responsive to window resize
  - Ensure chat panel usable at 800x600 minimum (SC-004)
  - Handle flex layout changes on resize
  - Prevent blocking essential Excalidraw tools (FR-013)

- [x] T025 Add clear conversation button to header
  - Add Sidebar.Header before chat content
  - Include clear button with icon
  - Add tooltip "Clear conversation"

- [x] T026 Final integration testing
  - Run pnpm build to verify TypeScript compilation
  - Test all acceptance scenarios from spec
  - Verify success criteria: SC-001 through SC-007

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 26 |
| Setup Tasks | 2 |
| Foundational Tasks | 2 |
| User Story 1 Tasks | 4 |
| User Story 2 Tasks | 6 |
| User Story 3 Tasks | 3 |
| User Story 4 Tasks | 3 |
| Polish Tasks | 6 |
| Parallelizable Tasks | 3 (T002, T003, T004) |

## Suggested MVP Scope

**User Story 1 (US1) + User Story 2 (US2)** represents the MVP:
- Sidebar toggle works
- Messages can be sent and received
- Basic chat functionality complete

Tasks T001-T014 cover MVP (14 tasks).

## Implementation Strategy

1. **Week 1**: Complete Phases 1-2 (Setup & Foundational)
2. **Week 2**: Complete Phase 3-4 (US1 + US2 - MVP)
3. **Week 3**: Complete Phase 5-6 (US3 + US4)
4. **Week 4**: Phase 7 Polish and testing
