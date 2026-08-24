import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle, FiInfo, FiTrash2 } from 'react-icons/fi';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const variantStyles: Record<Variant, { icon: ReactNode; iconBg: string; confirmBg: string; confirmHover: string }> = {
  danger: {
    icon: <FiTrash2 className="h-6 w-6" />,
    iconBg: 'bg-[#ff3b5c]/15 text-[#ff5c78]',
    confirmBg: 'bg-[#ff3b5c]',
    confirmHover: 'hover:bg-[#e02d4c]',
  },
  warning: {
    icon: <FiAlertTriangle className="h-6 w-6" />,
    iconBg: 'bg-amber-500/15 text-amber-400',
    confirmBg: 'bg-amber-500',
    confirmHover: 'hover:bg-amber-600',
  },
  info: {
    icon: <FiInfo className="h-6 w-6" />,
    iconBg: 'bg-blue-500/15 text-blue-400',
    confirmBg: 'bg-blue-500',
    confirmHover: 'hover:bg-blue-600',
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const styles = variantStyles[variant];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[600] flex items-center justify-center p-4"
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
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[24rem] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(24,28,38,0.98)] shadow-[0_32px_72px_rgba(2,6,23,0.7)] backdrop-blur-xl"
          >
            <div className="px-6 pb-5 pt-6 text-center">
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${styles.iconBg}`}>
                {styles.icon}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              <div className="mt-2 text-sm leading-relaxed text-slate-400">
                {message}
              </div>
            </div>
            <div className="space-y-2 border-t border-white/8 px-6 py-4">
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className={`w-full rounded-xl ${styles.confirmBg} px-4 py-3 text-sm font-semibold text-white transition ${styles.confirmHover} active:scale-[0.98] disabled:opacity-60`}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
