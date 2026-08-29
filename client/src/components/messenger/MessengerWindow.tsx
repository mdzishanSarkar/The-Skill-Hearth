import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ConversationSummary, ConversationType, MessengerMessage, ReactionEmoji } from '../../types/messenger.types';
import { useMessengerStore } from '../../stores/messengerStore';
import { WindowHeader } from './WindowHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface MessengerWindowProps {
  conversationId: string;
  conversationType: ConversationType;
  embedded?: boolean;
}

const NO_TYPING_USERS: Record<string, boolean> = {};

export function MessengerWindow({ conversationId, conversationType, embedded = false }: MessengerWindowProps) {
  const store = useMessengerStore();
  const [replyPreview, setReplyPreview] = useState<{ messageId: string; senderName: string; contentPreview: string } | null>(null);
  const [lightbox, setLightbox] = useState<MessengerMessage | null>(null);

  const key = `${conversationType}:${conversationId}`;
  const conversation = store.conversations.find(
    (c) => c.conversationId === conversationId && c.conversationType === conversationType,
  ) as ConversationSummary | undefined;
  const messages = store.messagesByConversation[key] ?? [];
  const loadingOlder = Boolean(store.loadingMessages[key]);
  const hasMore = Boolean(store.hasMoreByConversation[key]);
  const draft = store.drafts[conversationId] ?? '';
  const replyTarget = store.replyTargets[conversationId] ?? null;
  const typingUserIds = store.typingUsers[conversationId] ?? NO_TYPING_USERS;
  const typingNames = useMemo(
    () => Object.keys(typingUserIds).map((id) => conversation?.participants.find((p) => p.userId === id)?.displayName ?? 'Someone'),
    [typingUserIds, conversation],
  );

  useEffect(() => {
    if (store.activeConversationId === conversationId) {
      store.markRead(conversationId, conversationType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversationId, conversationType, store.activeConversationId]);

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (isTyping) store.startTyping(conversationId, conversationType);
      else store.stopTyping(conversationId, conversationType);
    },
    [store, conversationId, conversationType],
  );

  const handleReact = useCallback(
    (messageId: string, emoji: ReactionEmoji) => store.toggleReaction(messageId, emoji),
    [store],
  );

  const handleReply = useCallback((message: MessengerMessage) => {
    setReplyPreview({
      messageId: message._id,
      senderName: message.senderName,
      contentPreview: message.content ?? '',
    });
  }, []);

  const handleSendText = useCallback(
    (content: string) => {
      store.sendText({
        conversationId,
        conversationType,
        content,
        replyToMessageId: replyPreview?.messageId,
      });
      setReplyPreview(null);
    },
    [store, conversationId, conversationType, replyPreview],
  );

  const handleSendImage = useCallback(
    (file: File, caption?: string) => {
      void store.sendImage({ conversationId, conversationType, file, caption });
    },
    [store, conversationId, conversationType],
  );

  const handleSendGif = useCallback(
    (url: string) => {
      store.sendGif({ conversationId, conversationType, gifUrl: url });
    },
    [store, conversationId, conversationType],
  );

  if (!conversation) return null;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`messenger-window flex h-full w-full flex-col overflow-hidden border border-white/8 ${
        embedded ? '' : 'sm:w-80 sm:rounded-[28px] sm:shadow-[0_20px_48px_rgba(0,0,0,0.32)]'
      }`}
      aria-label={`Conversation with ${conversation.skillContext?.skillName ?? 'chat'}`}
    >
      <WindowHeader
        conversation={conversation}
        onClose={() => store.closeConversation(conversationId, conversationType)}
        onToggleMute={() => {
          void store.updateSettings?.(conversationId, conversationType, { isMuted: !conversation.isMuted });
        }}
        onTogglePin={() => {
          void store.updateSettings?.(conversationId, conversationType, { isPinned: !conversation.isPinned });
        }}
        onClearHistory={() => {
          void store.clearHistory?.(conversationId, conversationType);
        }}
      />

      <MessageList
        conversationId={conversationId}
        conversationType={conversationType}
        messages={messages}
        currentUserId={store.currentUserId}
        typingNames={typingNames}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={() => void store.loadOlderMessages(conversationId, conversationType)}
        onReact={handleReact}
        onReply={handleReply}
        onEdit={(messageId, content) => store.editMessage(messageId, content)}
        onUnsend={(messageId) => store.unsendMessage(messageId)}
        onOpenImage={(message) => setLightbox(message)}
      />

      <MessageInput
        conversationId={conversationId}
        conversationType={conversationType}
        draft={draft}
        replyPreview={replyTarget ?? replyPreview}
        onDraftChange={(content) => store.setDraft(conversationId, content)}
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onSendGif={handleSendGif}
        onDismissReply={() => {
          setReplyPreview(null);
          store.setReplyTarget(conversationId, null);
        }}
        onTyping={handleTyping}
      />

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/80 p-6"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox.imageUrl}
              alt="Preview"
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close image"
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
