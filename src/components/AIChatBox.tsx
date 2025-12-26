import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Bubble, Sender} from '@ant-design/x';
import {Button, Flex, GetRef, Tooltip} from 'antd';
import {DeleteOutlined, OpenAIOutlined, PaperClipOutlined, RobotOutlined} from '@ant-design/icons';
import type {AIChatBoxProps, ChatMessage} from '../types/chat';

const Switch = Sender.Switch;
const IconStyle = {
  fontSize: 16,
};
const SwitchTextStyle = {
  display: 'inline-flex',
  width: 28,
  justifyContent: 'center',
  alignItems: 'center',
};
/**
 * AIChatBox - Main chat component for AI assistance
 *
 * Features:
 * - Message display with user/AI role styling
 * - Message input with send functionality
 * - Loading states during AI response
 * - Error handling and display
 * - Clear conversation functionality
 * - Session-based chat history (persists across sidebar toggle)
 */
export const AIChatBox: React.FC<AIChatBoxProps> = ({
                                                      onSendMessage,
                                                      onOpen,
                                                      onClose,
                                                    }) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deepThink, setDeepThink] = useState<boolean>(true);

  const senderRef = useRef<GetRef<typeof Sender>>(null);
  // Refs for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  // Notify parent when messages change (for tracking)
  useEffect(() => {
    if (messages.length > 0) {
      onOpen?.();
    }
  }, [messages.length, onOpen]);

  /**
   * Create a new message with unique ID
   */
  const createMessage = useCallback(
    (content: string, role: 'user' | 'ai', status?: 'sent' | 'loading' | 'error'): ChatMessage => ({
      id: crypto.randomUUID(),
      content,
      role,
      timestamp: new Date(),
      status,
    }),
    []
  );

  /**
   * Handle message submission
   */
  const handleSubmit = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading) return;

    // Add user message
    const userMessage = createMessage(trimmedValue, 'user', 'sent');
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Add loading placeholder for AI response
      const loadingMsg = createMessage('', 'ai', 'loading');
      setLoadingMessageId(loadingMsg.id);
      setMessages((prev) => [...prev, loadingMsg]);

      // Get AI response
      const response = await onSendMessage?.(trimmedValue) ?? `I received your message: "${trimmedValue}". How can I help you with your diagram?`;

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsg.id
            ? createMessage(response, 'ai', 'sent')
            : msg
        )
      );
    } catch (error) {
      // Handle error state
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? createMessage(errorMessage, 'ai', 'error')
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setLoadingMessageId(null);
    }
  }, [inputValue, isLoading, onSendMessage, createMessage, loadingMessageId]);

  /**
   * Handle keyboard shortcut (Enter to send)
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /**
   * Clear conversation history
   */
  const handleClearConversation = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setLoadingMessageId(null);
    onClose?.();
  }, [onClose]);

  // Transform messages for Bubble.List
  const bubbleItems = messages.map(({id, content, role, status}) => ({
    key: id,
    content,
    role: role as 'user' | 'ai',
    loading: status === 'loading',
  }));

  return (
    <Flex vertical style={{height: '100%'}} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header with clear button */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          borderBottom: '1px solid #f0f0f0',
          minHeight: 40,
          padding: '0px 8px',
        }}
      >
        <span style={{}}>AI Assistant</span>
        <Tooltip title="Clear conversation">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined/>}
            onClick={handleClearConversation}
            disabled={messages.length === 0}
            size="small"
          />
        </Tooltip>
      </Flex>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <Flex
            vertical
            align="center"
            justify="center"
            style={{height: '100%', color: '#999'}}
          >
            <RobotOutlined style={{fontSize: 48, marginBottom: 16}}/>
            <p>Ask me anything about your diagram</p>
          </Flex>
        ) : (
          <Bubble.List
            items={bubbleItems}
            style={{flex: 1}}
          />
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input area */}
      <div style={{padding: 2, borderTop: '1px solid #f0f0f0'}}>
        <Sender
          loading={loading}
          ref={senderRef}
          placeholder="Press Enter to send message"
          footer={(actionNode) => {
            return (
              <Flex justify="space-between" align="center">
                <Flex gap="small" align="center">
                  <Button style={IconStyle} type="text" icon={<PaperClipOutlined/>}/>
                  <Switch
                    value={deepThink}
                    checkedChildren={
                      <div>
                        <span style={SwitchTextStyle}>on</span>
                      </div>
                    }
                    unCheckedChildren={
                      <div>
                        <span style={SwitchTextStyle}>off</span>
                      </div>
                    }
                    onChange={(checked: boolean) => {
                      setDeepThink(checked);
                    }}
                    icon={<OpenAIOutlined/>}
                  />
                </Flex>
                <Flex align="center">
                  {actionNode}
                </Flex>
              </Flex>
            );
          }}
          suffix={false}
          onSubmit={(v, _, skill) => {
            setLoading(true);
            console.log(`Send message: ${skill?.value} | ${v}`);

            senderRef.current?.clear?.();
          }}
          onCancel={() => {
            setLoading(false);
            console.log('Cancel sending!');
          }}
          autoSize={{minRows: 3, maxRows: 6}}
        />
      </div>
    </Flex>
  );
};
