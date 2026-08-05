export interface SocketUser {
  userId: string;
  displayName: string;
}

export interface ChatMessagePayload {
  connectionId: string;
  content: string;
}

export interface ChatMessageEvent {
  _id: string;
  connectionId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text';
  createdAt: string;
}

export interface MessageDeliveredPayload {
  connectionId: string;
  messageId: string;
}

export interface MessageReadPayload {
  connectionId: string;
}

export interface TypingPayload {
  connectionId: string;
  isTyping: boolean;
}

export interface NotificationEvent {
  _id: string;
  type: string;
  message: string;
  referenceId?: string;
  referenceModel?: string;
  createdAt: string;
}
