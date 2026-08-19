export type ConversationType = 'skill' | 'friend';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'system' | 'image' | 'skill_card' | 'voice_note' | 'gif';
export type ReactionEmoji = '👍' | '❤️' | '😂' | '😮' | '😢' | '🙏' | '🔥';
export type SystemMessageEvent =
  | 'connection_accepted'
  | 'connection_completed'
  | 'safe_meeting_reminder'
  | 'review_prompt'
  | 'friend_accepted'
  | 'skill_swap_matched'
  | 'session_scheduled';

export const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];

export interface MessengerParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: string | null;
  isTyping: boolean;
}

export interface SkillContextSummary {
  skillId: string;
  skillName: string;
  skillCategory: string;
  connectionStatus: string;
  categoryColor: string;
}

export interface LastMessageSummary {
  messageId: string;
  senderId: string;
  content: string | null;
  type: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface ConversationSummary {
  conversationId: string;
  conversationType: ConversationType;
  participants: MessengerParticipant[];
  skillContext?: SkillContextSummary;
  lastMessage: LastMessageSummary | null;
  unreadCount: number;
  lastReadMessageId: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  isArchived: boolean;
  updatedAt: string;
}

export interface ReactionDTO {
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

export interface ReplyToPreview {
  senderId: string;
  senderName: string;
  contentPreview: string;
}

export interface SkillCardData {
  skillId: string;
  skillName: string;
  teacherName: string;
  teacherAvatarUrl: string;
  requestStatus: 'pending' | 'accepted' | 'rejected';
}

export interface MessengerMessage {
  _id: string;
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string | null;
  type: MessageType;
  reactions: ReactionDTO[];
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  editedAt: string | null;
  replyToMessageId: string | null;
  replyToPreview: ReplyToPreview | null;
  isDeleted: boolean;
  isMine: boolean;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;
  skillCardData?: SkillCardData;
  voiceNoteUrl?: string;
  voiceNoteDurationSeconds?: number;
  voiceNoteWaveform?: number[];
  systemEvent?: SystemMessageEvent;
  status: MessageStatus;
}

export interface MessagePageResult {
  messages: MessengerMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationSearchResult {
  conversations: ConversationSummary[];
  messages: MessengerMessage[];
}

export interface MediaGalleryResult {
  images: Array<{
    messageId: string;
    imageUrl: string;
    imageThumbnailUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    createdAt: string;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationSettingsPatch {
  isPinned?: boolean;
  isMuted?: boolean;
  mutedUntil?: string | null;
  isArchived?: boolean;
  customNickname?: string;
  notificationOverride?: 'default' | 'all' | 'mentions_only' | 'none';
  chatTheme?: 'default' | 'sunset' | 'ocean' | 'forest' | 'midnight';
}

export interface MessengerSocketError {
  code: string;
  message?: string;
  event?: string;
  retryAfter?: number;
}