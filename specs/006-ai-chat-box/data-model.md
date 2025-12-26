# Data Model: AI Chat Box

## Entities

### ChatMessage

Represents a single message in the conversation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (UUID) |
| `content` | string | Yes | Message text content |
| `role` | 'user' \| 'ai' | Yes | Message sender type |
| `timestamp` | Date | Yes | When message was sent |
| `status` | 'sent' \| 'loading' \| 'error' | No | Delivery status |

### ChatSession

Manages the collection of messages for a conversation session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | ChatMessage[] | Yes | Array of messages in order |
| `isOpen` | boolean | Yes | Chat sidebar visibility |
| `isLoading` | boolean | Yes | AI is processing response |

### ChatState

Tracks the overall chat component state.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isDocked` | boolean | Yes | Sidebar docked/expanded state |
| `activeTab` | string | Yes | Current active tab (ai-chat) |

---

## Relationships

```
ChatSession
├── messages: ChatMessage[]
└── state: ChatState
```

- A `ChatSession` contains multiple `ChatMessage` entities
- `ChatState` is managed separately (Excalidraw Sidebar state)

---

## Validation Rules

| Rule | Description |
|------|-------------|
| Message ID | Must be unique within session (UUID) |
| Message order | Messages stored in chronological order |
| Empty message | Cannot send empty content (UI validation) |
| Session reset | Clearing conversation removes all messages |

---

## State Transitions

```
Closed ──Open sidebar──► Open (empty)
                              │
                    Send message ▼
                              │
                        Loading ──Success──► User + AI messages
                              │
                              ▼
                            Error ──Retry──► Loading
                              │
                    Clear conversation ▼
                        Closed (empty)
```

---

## Local Storage Schema

Chat data is session-based only. No persistence across app restarts.

```
// In-memory only
const chatSession: ChatSession = {
  messages: [],
  isOpen: false,
  isLoading: false,
};
```

---

## Component State (React)

```typescript
interface UseAIChatState {
  // Messages
  messages: ChatMessage[];

  // UI State
  isOpen: boolean;
  isDocked: boolean;
  isLoading: boolean;

  // Actions
  sendMessage: (content: string) => void;
  clearConversation: () => void;
  toggleOpen: () => void;
  toggleDock: () => void;
}
```
