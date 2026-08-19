import { useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useMessengerStore } from '../../stores/messengerStore';
import { MessengerSidebar } from './MessengerSidebar';
import { MessengerWindow } from './MessengerWindow';

const SIDEBAR_WIDTH_KEY = 'skill-hearth:messenger-sidebar-width';
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;

function loadSidebarWidth(): number {
  const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  if (Number.isFinite(saved)) return Math.min(Math.max(saved, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
  return 300;
}

interface MessengerPanelProps {
  onClose?: () => void;
}

export function MessengerPanel({ onClose }: MessengerPanelProps) {
  const [sidebarWidth, setSidebarWidth] = useState(loadSidebarWidth);
  const widthRef = useRef(sidebarWidth);
  const resizingRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openWindows = useMessengerStore((state) => state.openWindows);
  const activeConversationId = useMessengerStore((state) => state.activeConversationId);

  const activeWindow =
    openWindows.find((w) => w.conversationId === activeConversationId) ?? openWindows[0] ?? null;

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    resizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: PointerEvent) => {
      if (!resizingRef.current) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      widthRef.current = Math.min(Math.max(ev.clientX - rect.left, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(widthRef.current);
    };
    const onUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(widthRef.current));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div ref={panelRef} className="relative h-full">
      <div className="messenger-app-surface flex h-full overflow-hidden rounded-[26px] border border-white/8 bg-[rgba(13,17,23,0.94)] shadow-[0_32px_72px_rgba(2,6,23,0.56)] backdrop-blur-xl">
        <div
          className="hidden h-full shrink-0 overflow-hidden border-r border-white/8 bg-[rgba(18,22,30,0.9)] sm:block"
          style={{ width: sidebarWidth }}
        >
          <MessengerSidebar />
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat list"
          title="Drag to resize"
          onPointerDown={startResize}
          className="hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-[color-mix(in_srgb,var(--bubble-accent-from)_35%,transparent)] active:bg-[color-mix(in_srgb,var(--bubble-accent-from)_55%,transparent)] sm:block"
        />
        <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%)]">
          {activeWindow ? (
            <div className="flex h-full flex-col overflow-hidden">
              <MessengerWindow
                key={`${activeWindow.conversationType}:${activeWindow.conversationId}`}
                conversationId={activeWindow.conversationId}
                conversationType={activeWindow.conversationType}
                embedded
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <p className="text-6xl">🔥</p>
                <p className="mt-6 text-2xl font-bold text-white">Welcome to Messenger</p>
                <p className="mt-3 text-base text-slate-300">
                  Select a conversation from the sidebar to start chatting.
                </p>
                <div className="mt-8 rounded-2xl border border-dashed border-blue-400/20 bg-blue-500/6 p-5 text-slate-400 backdrop-blur-sm">
                  <p className="text-sm">
                    💡 <strong className="text-blue-200">Tip:</strong> Use the search box to quickly find conversations or start a new chat with friends.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close messenger"
          title="Close"
          className="absolute -right-2 -top-2 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-[rgba(18,22,31,0.98)] text-slate-200 shadow-[0_8px_24px_rgba(2,6,23,0.55)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}