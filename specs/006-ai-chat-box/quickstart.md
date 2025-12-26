# Quickstart: AI Chat Box

## Overview

Add an AI chat box to the Excalidraw application using Ant Design X components integrated into the Excalidraw Sidebar.

## Prerequisites

```bash
# Install required dependencies
pnpm add @ant-design/x @ant-design/x-sdk @ant-design/icons
```

## Implementation Steps

### 1. Create the AI Chat Component

Create `src/components/AIChatBox.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import { Bubble, Sender } from '@ant-design/x';
import { Flex } from 'antd';
import type { ChatMessage } from '@/types/chat';

interface AIChatBoxProps {
  onSendMessage?: (content: string) => Promise<string>;
}

export const AIChatBox: React.FC<AIChatBoxProps> = ({ onSendMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Add loading message for AI
      const loadingMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: '',
        role: 'ai',
        timestamp: new Date(),
        status: 'loading',
      };
      setMessages((prev) => [...prev, loadingMessage]);

      // Call AI provider (to be implemented)
      const response = await onSendMessage?.(inputValue) || 'AI response placeholder';

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? { ...msg, content: response, status: 'sent' }
            : msg
        )
      );
    } catch (error) {
      // Handle error - update loading message with error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? { ...msg, status: 'error', content: 'Failed to get response' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, onSendMessage]);

  const items = messages.map(({ id, content, role, status }) => ({
    key: id,
    content,
    role: role as 'user' | 'ai',
    loading: status === 'loading',
  }));

  return (
    <Flex vertical gap="middle" style={{ height: '100%', padding: 16 }}>
      <Bubble.List
        items={items}
        style={{ flex: 1, overflow: 'auto' }}
        roles={{
          ai: { placement: 'start', typing: true },
          user: { placement: 'end' },
        }}
      />
      <Sender
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        loading={isLoading}
        placeholder="Ask AI for help..."
      />
    </Flex>
  );
};
```

### 2. Create Chat Types

Create `src/types/chat.ts`:

```typescript
export type MessageRole = 'user' | 'ai';
export type MessageStatus = 'sent' | 'loading' | 'error';

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  status?: MessageStatus;
}
```

### 3. Integrate with Excalidraw

Update `src/components/ExcalidrawCanvas.tsx`:

```tsx
import React, { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Sidebar } from '@excalidraw/excalidraw';
import { AIChatBox } from './AIChatBox';

export const ExcalidrawCanvas: React.FC = () => {
  const [isChatDocked, setIsChatDocked] = useState(false);

  return (
    <div style={{ height: '100vh' }}>
      <Excalidraw>
        <Sidebar name="ai-chat" docked={isChatDocked} onDock={setIsChatDocked}>
          <Sidebar.Header />
          <Sidebar.Tabs>
            <Sidebar.Tab tab="ai">
              <AIChatBox onSendMessage={async (msg) => {
                // TODO: Implement AI integration
                return `AI response to: ${msg}`;
              }} />
            </Sidebar.Tab>
            <Sidebar.TabTriggers>
              <Sidebar.TabTrigger tab="ai">
                AI Chat
              </Sidebar.TabTrigger>
            </Sidebar.TabTriggers>
          </Sidebar.Tabs>
        </Sidebar>
      </Excalidraw>
    </div>
  );
};
```

### 4. Run Development Server

```bash
pnpm dev
```

## Verification Checklist

- [ ] Sidebar with AI Chat tab appears
- [ ] Clicking AI Chat tab opens the chat panel
- [ ] Messages display with user/AI role styling
- [ ] Typing in Sender and pressing Enter sends message
- [ ] Loading indicator appears during AI response
- [ ] Error state displays on network failure
- [ ] Chat history persists when toggling sidebar
- [ ] Clear conversation button removes all messages

## Next Steps

1. Implement AI backend integration
2. Add conversation persistence (optional)
3. Add accessibility features (deferred)
