export interface DirectMessage {
  _id: string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  otherUserId: string;
  otherUser: {
    _id: string;
    displayName: string;
    avatar: string;
    city: string;
    level: number;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationResult {
  conversationId: string;
  messages: DirectMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SendDmInput {
  content: string;
}
