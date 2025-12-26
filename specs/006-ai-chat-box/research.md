# Research: AI Chat Box Feature

## Overview

Research findings for implementing an AI chat box using Excalidraw Sidebar and Ant Design X.

---

## Excalidraw Sidebar Integration

### Decision

Use the Excalidraw `<Sidebar>` component as a child of `<Excalidraw>` with custom tab trigger in the sidebar.

### Rationale

- Native integration pattern supported by Excalidraw API
- Provides built-in docking, open/close state management
- Custom tab triggers allow adding AI chat alongside default Library tab
- No need to modify Excalidraw source - fully supported through children components

### API Details

**Core Sidebar Props:**
| Prop | Type | Purpose |
|------|------|---------|
| `name` | string | Unique identifier (required) |
| `docked` | boolean | Controls open/close state |
| `onDock` | function | Callback when user toggles docking |
| `onStateChange` | function | Called on open/close or tab change |

**Component Structure:**
- `Sidebar.Header` - Close/dock buttons
- `Sidebar.Tabs` - Container for tab content
- `Sidebar.Tab` - Individual tab with unique `tab` prop
- `Sidebar.TabTriggers` - Container for trigger buttons
- `Sidebar.TabTrigger` - Button to switch tabs

**Alternative: Sidebar.Trigger**
For triggering sidebar from outside, use `<Sidebar.Trigger name="sidebar-name" tab="tab-name" />`

### Implementation Pattern

```jsx
<Excalidraw>
  <Sidebar name="ai-chat" docked={isDocked} onDock={setIsDocked}>
    <Sidebar.Header />
    <Sidebar.Tabs>
      <Sidebar.Tab tab="ai">
        <AIChatBox />
      </Sidebar.Tab>
      <Sidebar.TabTriggers>
        <Sidebar.TabTrigger tab="ai" onClick={toggleChat}>
          AI Chat
        </Sidebar.TabTrigger>
      </Sidebar.TabTriggers>
    </Sidebar.Tabs>
  </Sidebar>
</Excalidraw>
```

### Key Constraints

- Without `docked={true}`, sidebar closes on outside click
- Must manage `docked` state externally when using `onDock`
- Each sidebar needs unique `name` prop

---

## Ant Design X Components

### Decision

Use Ant Design X for the chat UI with Bubble, Bubble.List, and Sender components.

### Rationale

- Purpose-built for AI chat interfaces
- Handles message bubbles, avatars, typing effects out of the box
- `useXChat` hook provides state management for chat conversations
- Supports role-based styling (user vs AI)
- Integrates well with React 18

### Component Usage

**Bubble Component:**
- Renders individual messages
- Props: `content`, `placement` (start/end), `avatar`, `typing`, `loading`, `variant`, `shape`
- `typing` prop enables typewriter animation effect

**Bubble.List Component:**
- Renders scrollable message list
- Props: `items`, `roles`, `autoScroll`, `style`
- `roles` prop configures styling per message role (user/ai)
- `autoScroll` keeps latest message visible

**Sender Component:**
- Input field with send button
- Props: `value`, `onChange`, `onSubmit`, `loading`, `placeholder`

**useXChat Hook:**
- Manages chat state (messages, loading, errors)
- Provides `onRequest` function to send messages
- Integrates with AI providers (OpenAI, custom)

### Implementation Pattern

```tsx
import { Bubble, Sender } from '@ant-design/x';
import { useXChat } from '@ant-design/x-sdk';

const AIChatBox = () => {
  const [content, setContent] = useState('');
  const { onRequest, messages, isRequesting } = useXChat({});

  const items = messages.map(({ message, id, status }) => ({
    key: id,
    content: message,
    role: status === 'local' ? 'user' : 'ai',
    loading: status === 'loading',
  }));

  return (
    <Flex vertical gap="middle" style={{ height: '100%' }}>
      <Bubble.List
        items={items}
        style={{ flex: 1, overflow: 'auto' }}
        roles={{
          ai: { placement: 'start', typing: true },
          user: { placement: 'end' },
        }}
      />
      <Sender
        value={content}
        onChange={setContent}
        onSubmit={(text) => {
          onRequest({ message: text });
          setContent('');
        }}
        loading={isRequesting}
      />
    </Flex>
  );
};
```

### Key Features

- Typewriter effect for AI responses (`typing: true`)
- Auto-scroll to latest message (`autoScroll`)
- Role-based avatars and placement
- Loading indicators for pending responses
- Session-based message history

---

## Dependencies Required

| Package | Purpose | Source |
|---------|---------|--------|
| `@ant-design/x` | Chat UI components (Bubble, Sender) | npm |
| `@ant-design/x-sdk` | Chat state management (useXChat) | npm |
| `@ant-design/icons` | Icons for chat UI | npm |

---

## Alternatives Considered

### Excalidraw Sidebar Alternatives

1. **Custom overlay** - Would need to implement open/close, docking, positioning manually. Rejected - more code, less maintainable.

2. **Modal dialog** - Rejected - disrupts canvas interaction, doesn't integrate with sidebar UX.

### Chat UI Alternatives

1. **Build from scratch** - Would need to implement message bubbles, scrolling, typing effects. Rejected - reinvents wheel, more maintenance.

2. **Ant Design chat component** - Original Ant Design has chat components but less AI-focused. Ant Design X is purpose-built for AI interfaces.

---

## References

- Excalidraw Sidebar API: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/children-components/sidebar
- Ant Design X: https://x.ant.design/components/introduce/
- Ant Design X GitHub: https://github.com/ant-design/x
