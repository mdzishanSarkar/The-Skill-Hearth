export type InboxFilter = 'all' | 'unread' | 'archived' | 'pinned';

export interface InboxOtherUser {
  _id: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface InboxSkill {
  _id: string;
  name: string;
  category: string;
}

export interface InboxLastMessage {
  content: string | null;
  senderId: string;
  createdAt: string;
  type: 'text' | 'image' | 'system';
  isDeleted: boolean;
}

export interface InboxConversation {
  connectionId: string;
  connectionStatus: string;
  otherUser: InboxOtherUser;
  skill: InboxSkill;
  lastMessage: InboxLastMessage | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}

export interface InboxMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InboxConversationListResult {
  conversations: InboxConversation[];
  totalUnread: number;
  meta: InboxMeta;
}
