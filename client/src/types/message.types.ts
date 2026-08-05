export interface MessageReaction {
  _id: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  connectionId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  imagePublicId?: string;
  readAt?: string;
  deliveredAt?: string;
  isReported?: boolean;
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResult {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessageSearchResult {
  messages: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}
