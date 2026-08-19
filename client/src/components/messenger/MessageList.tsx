import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, useListRef } from 'react-window';
import { FiArrowDown } from 'react-icons/fi';
import type { ConversationType, MessengerMessage } from '../../types/messenger.types';
import { shouldShowDateDivider } from './format';
import { DateDivider } from './DateDivider';
import { TypingIndicator } from './TypingIndicator';
import { MessageBubble } from './MessageBubble';

type Row =
  | { type: 'divider'; key: string; date: string }
  | { type: 'typing'; key: string; names: string[] }
  | { type: 'message'; key: string; message: MessengerMessage };

export interface MessageListProps {
  conversationId: string;
  conversationType: ConversationType;
  messages: MessengerMessage[];
  currentUserId: string | null;
  typingNames: string[];
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onReact: (messageId: string, emoji: MessengerMessage['reactions'][number]['emoji']) => void;
  onReply: (message: MessengerMessage) => void;
  onEdit: (messageId: string, content: string) => void;
  onUnsend: (messageId: string) => void;
  onOpenImage?: (message: MessengerMessage) => void;
}

function estimateMessageHeight(message: MessengerMessage): number {
  if (message.type === 'system') return 56;

  const base = 80;
  const content = message.content ?? '';
  const charsPerLine = 30;
  const lines = Math.max(1, Math.ceil(content.length / charsPerLine));
  const textHeight = lines * 20;

  let imageHeight = 0;
  if (message.type === 'image' || message.type === 'gif') {
    const width = message.type === 'image' ? message.imageWidth : message.gifWidth;
    const height = message.type === 'image' ? message.imageHeight : message.gifHeight;
    const ratio = width && height ? width / height : 0;
    imageHeight = ratio > 1.6 ? 224 : ratio !== 0 && ratio < 0.6 ? 384 : 288;
  }

  const skillCardHeight = message.type === 'skill_card' && message.skillCardData ? 96 : 0;
  const replyHeight = message.replyToPreview ? 32 : 0;
  const editedHeight = message.editedAt ? 12 : 0;
  const deletedHeight = message.isDeleted ? 18 : 0;
  const reactionHeight = message.reactions.length > 0 ? 44 : 0;
  return base + textHeight + imageHeight + skillCardHeight + replyHeight + editedHeight + deletedHeight + reactionHeight;
}

export function MessageList(props: MessageListProps) {
  const { messages, typingNames } = props;
  const listRef = useListRef(null as never);
  const [height, setHeight] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const stickToBottomRef = useRef(true);
  const prevRowCountRef = useRef(0);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.element;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [listRef]);

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    let prevIso: string | undefined;
    for (const message of messages) {
      if (shouldShowDateDivider(message.createdAt, prevIso)) {
        result.push({ type: 'divider', key: `div-${message.createdAt}`, date: message.createdAt });
      }
      result.push({ type: 'message', key: message._id, message });
      prevIso = message.createdAt;
    }
    if (typingNames.length > 0) {
      result.push({ type: 'typing', key: 'typing', names: typingNames });
    }

    return result;
  }, [messages, typingNames]);

  const rowCount = rows.length;

  useEffect(() => {
    if (rowCount > prevRowCountRef.current && stickToBottomRef.current && listRef.current) {
      listRef.current.scrollToRow({ index: rowCount - 1, align: 'end', behavior: 'auto' });
    }
    prevRowCountRef.current = rowCount;
  }, [rowCount, listRef]);

  useEffect(() => {
    if (height > 0 && listRef.current) {
      listRef.current.scrollToRow({ index: Math.max(0, rowCount - 1), align: 'end', behavior: 'auto' });
      stickToBottomRef.current = true;
    }
  }, [height, rowCount, listRef]);

  const rowHeight = useCallback((index: number, cellProps: { rows: Row[] }) => {
    const row = cellProps.rows[index];
    if (!row) return 60;
    if (row.type === 'divider') return 44;
    if (row.type === 'typing') return 36;
    return estimateMessageHeight(row.message);
  }, []);

  const rowKey = useCallback((index: number, cellProps: { rows: Row[] }) => {
    return cellProps.rows[index]?.key ?? index;
  }, []);

  const onRowsRendered = useCallback(
    ({ startIndex, stopIndex }: { startIndex: number; stopIndex: number }) => {
      const bottom = stopIndex >= rows.length - 2;
      stickToBottomRef.current = bottom;
      setAtBottom(bottom);
      if (startIndex <= 2 && props.hasMore && !props.loadingOlder) {
        props.onLoadOlder();
      }
    },
    [rows.length, props.hasMore, props.loadingOlder, props.onLoadOlder],
  );

  const scrollToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    setAtBottom(true);
    if (listRef.current) {
      listRef.current.scrollToRow({ index: Math.max(0, rows.length - 1), align: 'end', behavior: 'smooth' });
    }
  }, [rows.length, listRef]);

  const rowProps = useMemo<RowProps>(
    () => ({
      rows,
      currentUserId: props.currentUserId,
      onReact: props.onReact,
      onReply: props.onReply,
      onEdit: props.onEdit,
      onUnsend: props.onUnsend,
      onOpenImage: props.onOpenImage,
    }),
    [rows, props.currentUserId, props.onReact, props.onReply, props.onEdit, props.onUnsend, props.onOpenImage],
  );

  return (
    <div className="relative flex-1 overflow-hidden">
      <List<RowProps>
        className="messenger-message-list"
        listRef={listRef}
        rowCount={rowCount}
        rowHeight={rowHeight}
        rowKey={rowKey}
        rowProps={rowProps}
        rowComponent={RowComponent}
        overscanCount={6}
        onRowsRendered={onRowsRendered}
      />

      {props.loadingOlder && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center" role="status" aria-live="polite">
          <span className="flex items-center gap-2 rounded-full border border-white/8 bg-[rgba(13,17,23,0.9)] px-3 py-1.5 text-[11px] text-slate-300 shadow-lg backdrop-blur-sm">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" aria-hidden="true" />
            Loading earlier messages…
          </span>
        </div>
      )}

      {!atBottom && rows.length > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to latest message"
          title="Scroll to latest"
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[rgba(18,22,31,0.95)] text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.45)] backdrop-blur-md transition hover:bg-[rgba(37,45,60,0.95)] hover:text-white active:scale-95"
        >
          <FiArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface RowProps {
  rows: Row[];
  currentUserId: string | null;
  onReact: MessageListProps['onReact'];
  onReply: MessageListProps['onReply'];
  onEdit: MessageListProps['onEdit'];
  onUnsend: MessageListProps['onUnsend'];
  onOpenImage?: MessageListProps['onOpenImage'];
}

function RowComponent({
  index,
  style,
  rows,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onUnsend,
  onOpenImage,
}: {
  index: number;
  style: React.CSSProperties;
} & RowProps) {
  const row = rows[index];
  if (!row) return null;

  if (row.type === 'divider') {
    return (
      <div style={style}>
        <DateDivider date={row.date} />
      </div>
    );
  }

  if (row.type === 'typing') {
    return (
      <div style={style}>
        <TypingIndicator displayNames={row.names} />
      </div>
    );
  }

  return (
    <div style={style}>
      <MessageBubble
        message={row.message}
        currentUserId={currentUserId}
        showSender={false}
        showAvatar={false}
        onReact={onReact}
        onReply={onReply}
        onEdit={onEdit}
        onUnsend={onUnsend}
        onOpenImage={onOpenImage}
      />
    </div>
  );
}