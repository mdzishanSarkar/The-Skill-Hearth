import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

interface RejectionDialogProps {
  open: boolean;
  userName: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function RejectionDialog({ open, userName, loading = false, onConfirm, onClose }: RejectionDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, loading, onClose]);

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
            onClick={loading ? undefined : onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Reject identity verification"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[28rem] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(24,28,38,0.98)] shadow-[0_32px_72px_rgba(2,6,23,0.7)] backdrop-blur-xl"
          >
            <div className="px-6 pb-4 pt-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff3b5c]/15 text-[#ff5c78]">
                  <FiAlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reject identity verification</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    You are about to reject the identity document submitted by <span className="font-medium text-slate-200">{userName}</span>. Please provide a reason.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-2">
              <label htmlFor="rejection-reason" className="mb-1.5 block text-sm font-medium text-slate-300">
                Reason for rejection <span className="text-[#ff5c78]">*</span>
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Document is blurry, name does not match, expired document…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#ff3b5c]/50 focus:outline-none focus:ring-1 focus:ring-[#ff3b5c]/30"
              />
              <p className="mt-1 text-right text-[11px] text-slate-500">{reason.length}/500</p>
            </div>

            <div className="space-y-2 border-t border-white/8 px-6 py-4">
              <button
                type="button"
                disabled={loading || !reason.trim()}
                onClick={() => onConfirm(reason.trim())}
                className="w-full rounded-xl bg-[#ff3b5c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e02d4c] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Rejecting…
                  </span>
                ) : (
                  'Reject verification'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
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
