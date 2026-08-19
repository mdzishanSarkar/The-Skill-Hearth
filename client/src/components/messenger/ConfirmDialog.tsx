import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  name?: string;
  avatarUrl?: string;
  avatarColor?: string;
  avatarLetter?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  name,
  avatarUrl,
  avatarColor,
  avatarLetter,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative w-full max-w-[24rem] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(24,28,38,0.98)] shadow-[0_32px_72px_rgba(2,6,23,0.7)] backdrop-blur-xl"
          >
            <div className="px-6 pb-5 pt-6 text-center">
              {name ? (
                avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-white/12"
                  />
                ) : (
                  <span
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg shadow-black/30 ring-2 ring-white/12"
                    style={{ backgroundColor: avatarColor ?? '#64748b' }}
                  >
                    {avatarLetter ?? name.charAt(0).toUpperCase()}
                  </span>
                )
              ) : (
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ff3b5c]/15 text-[#ff5c78]">
                  <FiAlertTriangle className="h-6 w-6" />
                </span>
              )}
              <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              {name && <p className="mt-0.5 text-sm font-medium text-[var(--text-secondary)]">{name}</p>}
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
            </div>
            <div className="space-y-2 border-t border-white/8 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="w-full rounded-xl bg-[#ff3b5c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e02d4c] active:scale-[0.98]"
              >
                {confirmLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}