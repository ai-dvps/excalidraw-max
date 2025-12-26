/**
 * Chat types for AI Chat Box feature
 */

/**
 * Role of the message sender
 */
export type MessageRole = 'user' | 'ai';

/**
 * Status of message delivery
 */
export type MessageStatus = 'sent' | 'loading' | 'error';

/**
 * Represents a single message in the conversation
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Message text content */
  content: string;
  /** Sender type */
  role: MessageRole;
  /** When the message was sent */
  timestamp: Date;
  /** Delivery status */
  status?: MessageStatus;
}

/**
 * Props for AIChatBox component
 */
export interface AIChatBoxProps {
  /** Callback when a message is sent - returns AI response */
  onSendMessage?: (content: string) => Promise<string>;
  /** Callback when chat is opened */
  onOpen?: () => void;
  /** Callback when chat is closed */
  onClose?: () => void;
}
