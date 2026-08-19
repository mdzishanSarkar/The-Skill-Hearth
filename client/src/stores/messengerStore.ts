import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import type {
  ConversationSummary,
  ConversationType,
  MessengerMessage,
  ReactionEmoji,
} from '../types/messenger.types';
import {
  getConversations,
  getConversationMessages,
  sendImageMessage,
  updateConversationSettings,
  clearHistoryRest,
  socketOpenConversation,
  socketSendMessage,
  socketTypingStart,
  socketTypingStop,
  socketReact,
  socketMarkRead,
  socketDeleteMessage,
  socketUnsendMessage,
  socketDeleteConversation,
  socketEditMessage,
} from '../services/messenger';
import type { ConversationSettingsPatch } from '../types/messenger.types';

export interface OpenWindow {
  conversationId: string;
  conversationType: ConversationType;
}

export interface ReplyTarget {
  messageId: string;
  senderName: string;
  contentPreview: string;
}

interface MessengerState {
  socket: Socket | null;
  currentUserId: string | null;
  conversations: ConversationSummary[];
  messagesByConversation: Record<string, MessengerMessage[]>;
  nextCursorByConversation: Record<string, string | null>;
  hasMoreByConversation: Record<string, boolean>;
  loadingConversations: boolean;
  loadingMessages: Record<string, boolean>;
  openWindows: OpenWindow[];
  activeConversationId: string | null;
  drafts: Record<string, string>;
  typingUsers: Record<string, Record<string, boolean>>;
  replyTargets: Record<string, ReplyTarget | null>;
  unreadTotal: number;
  expanded: boolean;
  mobileDrawerOpen: boolean;
  messengerOpen: boolean;
  error: string | null;

  setSocket: (socket: Socket | null) => void;
  setCurrentUser: (userId: string | null) => void;
  fetchConversations: () => Promise<void>;
  upsertConversation: (conversation: ConversationSummary) => void;
  openConversation: (conversationId: string, conversationType: ConversationType) => Promise<void>;
  closeConversation: (conversationId: string, conversationType: ConversationType) => void;
  setActiveConversation: (conversationId: string) => void;
  loadOlderMessages: (conversationId: string, conversationType: ConversationType) => Promise<void>;
  sendText: (params: {
    conversationId: string;
    conversationType: ConversationType;
    content: string;
    replyToMessageId?: string;
  }) => void;
  sendGif: (params: {
    conversationId: string;
    conversationType: ConversationType;
    gifUrl: string;
    gifWidth?: number;
    gifHeight?: number;
  }) => void;
  sendImage: (params: {
    conversationId: string;
    conversationType: ConversationType;
    file: File;
    caption?: string;
  }) => Promise<void>;
  addMessage: (message: MessengerMessage) => void;
  updateMessage: (messageId: string, patch: Partial<MessengerMessage>) => void;
  removeMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: ReactionEmoji) => void;
  setReactions: (messageId: string, reactions: MessengerMessage['reactions']) => void;
  markRead: (conversationId: string, conversationType: ConversationType) => void;
  deleteMessage: (messageId: string) => void;
  unsendMessage: (messageId: string) => void;
  removeMessageCompletely: (messageId: string) => void;
  deleteConversation: (conversationId: string, conversationType: ConversationType) => void;
  removeConversation: (conversationId: string, conversationType: ConversationType) => void;
  editMessage: (messageId: string, content: string) => void;
  startTyping: (conversationId: string, conversationType: ConversationType) => void;
  stopTyping: (conversationId: string, conversationType: ConversationType) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  updateSettings: (
    conversationId: string,
    conversationType: ConversationType,
    patch: ConversationSettingsPatch,
  ) => Promise<void>;
  clearHistory: (conversationId: string, conversationType: ConversationType) => Promise<void>;
  setDraft: (conversationId: string, content: string) => void;
  setReplyTarget: (conversationId: string, reply: ReplyTarget | null) => void;
  setUnreadTotal: (total: number) => void;
  setExpanded: (expanded: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setMessengerOpen: (open: boolean) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

const conversationKey = (id: string, type: ConversationType) => `${type}:${id}`;

function normalizeSettingsPatch(
  patch: ConversationSettingsPatch,
  conversation: ConversationSummary,
): Partial<ConversationSummary> {
  const result: Partial<ConversationSummary> = {};
  if (patch.isPinned !== undefined) {
    result.isPinned = patch.isPinned;
    result.pinnedAt = patch.isPinned ? new Date().toISOString() : null;
  }
  if (patch.isMuted !== undefined) {
    result.isMuted = patch.isMuted;
    result.mutedUntil = patch.isMuted ? (patch.mutedUntil ?? conversation.mutedUntil) : null;
  }
  if (patch.isArchived !== undefined) {
    result.isArchived = patch.isArchived;
  }
  return result;
}

export const useMessengerStore = create<MessengerState>((set, get) => ({
  socket: null,
  currentUserId: null,
  conversations: [],
  messagesByConversation: {},
  nextCursorByConversation: {},
  hasMoreByConversation: {},
  loadingConversations: false,
  loadingMessages: {},
  openWindows: [],
  activeConversationId: null,
  drafts: {},
  typingUsers: {},
  replyTargets: {},
  unreadTotal: 0,
  expanded: false,
  mobileDrawerOpen: false,
  messengerOpen: false,
  error: null,

  setSocket: (socket) => set({ socket }),
  setCurrentUser: (currentUserId) => set({ currentUserId }),

  fetchConversations: async () => {
    set({ loadingConversations: true });
    try {
      const conversations = await getConversations();
      set({ conversations, loadingConversations: false });
    } catch {
      set({ loadingConversations: false, error: 'Unable to load conversations' });
    }
  },

  upsertConversation: (conversation) => {
    const { conversations } = get();
    const idx = conversations.findIndex(
      (c) => c.conversationId === conversation.conversationId && c.conversationType === conversation.conversationType,
    );
    const next = idx >= 0
      ? [...conversations.slice(0, idx), conversation, ...conversations.slice(idx + 1)]
      : [conversation, ...conversations];
    const sorted = next
      .filter((c) => !c.isArchived)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
    set({ conversations: sorted });
  },

  openConversation: async (conversationId, conversationType) => {
    const { socket, openWindows, messagesByConversation, currentUserId } = get();
    if (!openWindows.some((w) => w.conversationId === conversationId && w.conversationType === conversationType)) {
      set({ openWindows: [...openWindows, { conversationId, conversationType }] });
    }
    set({ activeConversationId: conversationId, messengerOpen: true });

    const key = conversationKey(conversationId, conversationType);
    if (socket) socketOpenConversation(socket, conversationId, conversationType);

    if (!messagesByConversation[key] || messagesByConversation[key].length === 0) {
      set((state) => ({
        loadingMessages: { ...state.loadingMessages, [key]: true },
        error: null,
      }));
      try {
        const result = await getConversationMessages(conversationId, conversationType, undefined, 30);
        set((state) => ({
          messagesByConversation: { ...state.messagesByConversation, [key]: result.messages },
          nextCursorByConversation: { ...state.nextCursorByConversation, [key]: result.nextCursor },
          hasMoreByConversation: { ...state.hasMoreByConversation, [key]: result.hasMore },
          loadingMessages: { ...state.loadingMessages, [key]: false },
        }));
      } catch {
        set((state) => ({
          loadingMessages: { ...state.loadingMessages, [key]: false },
          error: 'Unable to load messages',
        }));
      }
    }

    if (currentUserId) {
      void get().markRead(conversationId, conversationType);
    }
  },

  closeConversation: (conversationId, conversationType) => {
    const { openWindows, activeConversationId } = get();
    const nextWindows = openWindows.filter(
      (w) => !(w.conversationId === conversationId && w.conversationType === conversationType)
    );
    set({
      openWindows: nextWindows,
      activeConversationId:
        activeConversationId === conversationId
          ? nextWindows[nextWindows.length - 1]?.conversationId ?? null
          : activeConversationId,
    });
  },

  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

  loadOlderMessages: async (conversationId, conversationType) => {
    const key = conversationKey(conversationId, conversationType);
    const { nextCursorByConversation, hasMoreByConversation, loadingMessages, messagesByConversation } = get();
    if (!hasMoreByConversation[key] || !nextCursorByConversation[key] || loadingMessages[key]) return;

    set((state) => ({ loadingMessages: { ...state.loadingMessages, [key]: true } }));
    try {
      const result = await getConversationMessages(conversationId, conversationType, nextCursorByConversation[key], 30);
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [key]: [...result.messages, ...(messagesByConversation[key] ?? [])],
        },
        nextCursorByConversation: { ...state.nextCursorByConversation, [key]: result.nextCursor },
        hasMoreByConversation: { ...state.hasMoreByConversation, [key]: result.hasMore },
        loadingMessages: { ...state.loadingMessages, [key]: false },
      }));
    } catch {
      set((state) => ({ loadingMessages: { ...state.loadingMessages, [key]: false } }));
    }
  },

  sendText: ({ conversationId, conversationType, content, replyToMessageId }) => {
    const { socket } = get();
    if (!socket || !content.trim()) return;
    socketSendMessage(socket, {
      conversationId,
      conversationType,
      content: content.trim(),
      type: 'text',
      replyToMessageId,
    });
    set((state) => ({
      drafts: { ...state.drafts, [conversationId]: '' },
      replyTargets: { ...state.replyTargets, [conversationId]: null },
    }));
  },

  sendGif: ({ conversationId, conversationType, gifUrl, gifWidth, gifHeight }) => {
    const { socket } = get();
    if (!socket || !gifUrl) return;
    socketSendMessage(socket, {
      conversationId,
      conversationType,
      type: 'gif',
      gifUrl,
      gifWidth,
      gifHeight,
    });
  },

  sendImage: async ({ conversationId, conversationType, file, caption }) => {
    try {
      const message = await sendImageMessage(conversationId, conversationType, file, caption);
      get().addMessage(message);
    } catch {
      set({ error: 'Image upload failed' });
    }
  },

  addMessage: (message) => {
    const key = conversationKey(message.conversationId, message.conversationType);
    set((state) => {
      const existing = state.messagesByConversation[key] ?? [];
      if (existing.some((m) => m._id === message._id)) {
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [key]: existing.map((m) => (m._id === message._id ? message : m)),
          },
        };
      }
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [key]: [...existing, message],
        },
      };
    });
  },

  updateMessage: (messageId, patch) => {
    set((state) => {
      const next: Record<string, MessengerMessage[]> = {};
      for (const [key, messages] of Object.entries(state.messagesByConversation)) {
        if (messages.some((m) => m._id === messageId)) {
          next[key] = messages.map((m) => (m._id === messageId ? { ...m, ...patch } : m));
        }
      }
      if (Object.keys(next).length === 0) return {};
      return { messagesByConversation: { ...state.messagesByConversation, ...next } };
    });
  },

  removeMessage: (messageId) => {
    set((state) => {
      const next: Record<string, MessengerMessage[]> = {};
      for (const [key, messages] of Object.entries(state.messagesByConversation)) {
        if (messages.some((m) => m._id === messageId)) {
          next[key] = messages.map((m) => (m._id === messageId ? { ...m, content: null, isDeleted: true } : m));
        }
      }
      if (Object.keys(next).length === 0) return {};
      return { messagesByConversation: { ...state.messagesByConversation, ...next } };
    });
  },

  toggleReaction: (messageId, emoji) => {
    const { socket, currentUserId, messagesByConversation } = get();
    if (!socket || !currentUserId) return;
    const message = Object.values(messagesByConversation)
      .flat()
      .find((m) => m._id === messageId);
    if (!message) return;
    const mine = message.reactions.find((r) => r.userId === currentUserId);
    let reactions: MessengerMessage['reactions'];
    if (mine?.emoji === emoji) {
      reactions = message.reactions.filter((r) => r.userId !== currentUserId);
    } else if (mine) {
      reactions = message.reactions.map((r) =>
        r.userId === currentUserId ? { ...r, emoji } : r,
      );
    } else {
      reactions = [
        ...message.reactions.filter((r) => r.userId !== currentUserId),
        { userId: currentUserId, emoji, createdAt: new Date().toISOString() },
      ];
    }
    get().setReactions(messageId, reactions);
    socketReact(socket, messageId, emoji);
  },

  setReactions: (messageId, reactions) => {
    get().updateMessage(messageId, { reactions });
  },

  markRead: (conversationId, conversationType) => {
    const { socket } = get();
    if (!socket) return;
    const key = conversationKey(conversationId, conversationType);
    const messages = get().messagesByConversation[key] ?? [];
    const lastReadMessageId = messages[messages.length - 1]?._id;
    socketMarkRead(socket, conversationId, conversationType, lastReadMessageId);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId && c.conversationType === conversationType
          ? { ...c, unreadCount: 0, lastReadMessageId: lastReadMessageId ?? c.lastReadMessageId }
          : c,
      ),
      messagesByConversation: {
        ...state.messagesByConversation,
        [key]: messages.map((m) => (m.status === 'sent' ? { ...m, status: 'read' } : m)),
      },
    }));
  },

  deleteMessage: (messageId) => {
    const { socket } = get();
    if (!socket) return;
    socketDeleteMessage(socket, messageId);
  },

  unsendMessage: (messageId) => {
    const { socket } = get();
    if (!socket) return;
    get().removeMessageCompletely(messageId);
    socketUnsendMessage(socket, messageId);
  },

  removeMessageCompletely: (messageId) => {
    set((state) => {
      const next: Record<string, MessengerMessage[]> = {};
      for (const [key, messages] of Object.entries(state.messagesByConversation)) {
        if (messages.some((m) => m._id === messageId)) {
          next[key] = messages.filter((m) => m._id !== messageId);
        }
      }
      if (Object.keys(next).length === 0) return {};
      return { messagesByConversation: { ...state.messagesByConversation, ...next } };
    });
  },

  deleteConversation: (conversationId, conversationType) => {
    const { socket } = get();
    if (!socket) return;
    get().removeConversation(conversationId, conversationType);
    socketDeleteConversation(socket, conversationId, conversationType);
  },

  removeConversation: (conversationId, conversationType) => {
    const { conversations, openWindows, activeConversationId, unreadTotal } = get();
    const key = conversationKey(conversationId, conversationType);
    const removed = conversations.find(
      (c) => c.conversationId === conversationId && c.conversationType === conversationType,
    );
    set({
      conversations: conversations.filter(
        (c) => !(c.conversationId === conversationId && c.conversationType === conversationType),
      ),
      messagesByConversation: (() => {
        const next = { ...get().messagesByConversation };
        delete next[key];
        return next;
      })(),
      nextCursorByConversation: (() => {
        const next = { ...get().nextCursorByConversation };
        delete next[key];
        return next;
      })(),
      hasMoreByConversation: (() => {
        const next = { ...get().hasMoreByConversation };
        delete next[key];
        return next;
      })(),
      loadingMessages: (() => {
        const next = { ...get().loadingMessages };
        delete next[key];
        return next;
      })(),
      openWindows: openWindows.filter(
        (w) => !(w.conversationId === conversationId && w.conversationType === conversationType),
      ),
      activeConversationId: activeConversationId === conversationId ? null : activeConversationId,
      unreadTotal: Math.max(0, unreadTotal - (removed?.unreadCount ?? 0)),
    });
  },

  editMessage: (messageId, content) => {
    const { socket } = get();
    if (!socket || !content.trim()) return;
    socketEditMessage(socket, messageId, content.trim());
  },

  startTyping: (conversationId, conversationType) => {
    const { socket } = get();
    if (!socket) return;
    socketTypingStart(socket, conversationId, conversationType);
  },

  stopTyping: (conversationId, conversationType) => {
    const { socket } = get();
    if (!socket) return;
    socketTypingStop(socket, conversationId, conversationType);
  },

  setTypingUser: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = { ...(state.typingUsers[conversationId] ?? {}) };
      if (isTyping) current[userId] = true;
      else delete current[userId];
      return { typingUsers: { ...state.typingUsers, [conversationId]: current } };
    });
  },

  updateSettings: async (conversationId, conversationType, patch) => {
    try {
      await updateConversationSettings(conversationId, conversationType, patch);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.conversationId === conversationId && c.conversationType === conversationType
            ? { ...c, ...normalizeSettingsPatch(patch, c) }
            : c,
        ),
      }));
    } catch {
      set({ error: 'Unable to update settings' });
    }
  },

  clearHistory: async (conversationId, conversationType) => {
    const key = conversationKey(conversationId, conversationType);
    try {
      await clearHistoryRest(conversationId, conversationType);
      set((state) => ({
        messagesByConversation: { ...state.messagesByConversation, [key]: [] },
        hasMoreByConversation: { ...state.hasMoreByConversation, [key]: false },
        nextCursorByConversation: { ...state.nextCursorByConversation, [key]: null },
      }));
    } catch {
      set({ error: 'Unable to clear history' });
    }
  },

  setDraft: (conversationId, content) => {
    set((state) => ({ drafts: { ...state.drafts, [conversationId]: content } }));
  },

  setReplyTarget: (conversationId, reply) => {
    set((state) => ({ replyTargets: { ...state.replyTargets, [conversationId]: reply } }));
  },

  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),

  setExpanded: (expanded) => set({ expanded }),
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  setMessengerOpen: (messengerOpen) => set({ messengerOpen }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      conversations: [],
      messagesByConversation: {},
      nextCursorByConversation: {},
      hasMoreByConversation: {},
      loadingMessages: {},
      openWindows: [],
      activeConversationId: null,
      drafts: {},
      typingUsers: {},
      replyTargets: {},
      unreadTotal: 0,
      expanded: false,
      mobileDrawerOpen: false,
      messengerOpen: false,
      error: null,
    }),
}));
