import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiFlag } from 'react-icons/fi';

interface ReportDialogProps {
  open: boolean;
  title?: string;
  targetName?: string;
  loading?: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

const REASONS = [
  { value: 'harassment', label: 'Harassment', icon: '🚫' },
  { value: 'inappropriate', label: 'Inappropriate content', icon: '⚠️' },
  { value: 'spam', label: 'Spam', icon: '垃圾' },
  { value: 'fake', label: 'Fake / misleading', icon: '🎭' },
  { value: 'no-show', label: 'No show', icon: '👻' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export default function ReportDialog({
  open,
  title = 'Report',
  targetName,
  loading = false,
  onSubmit,
  onClose,
}: ReportDialogProps) {
  const [selected, setSelected] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected('');
    setDetails('');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  function handleSubmit() {
    if (!selected) return;
    const reason = selected === 'other' && details.trim() ? details.trim() : selected;
    onSubmit(reason);
  }

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
            className="relative w-full max-w-[28rem] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(24,28,38,0.98)] shadow-[0_32px_72px_rgba(2,6,23,0.7)] backdrop-blur-xl"
          >
            <div className="px-6 pb-2 pt-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                <FiFlag className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              {targetName && (
                <p className="mt-1 text-sm text-slate-400">
                  Reporting <span className="font-medium text-slate-300">{targetName}</span>
                </p>
              )}
            </div>

            <div className="px-6 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelected(r.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      selected === r.value
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                        : 'border-white/8 bg-white/3 text-slate-300 hover:border-white/15 hover:bg-white/6'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <span className="font-medium">{r.label}</span>
                  </button>
                ))}
              </div>

              {selected === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please describe the issue..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-2 border-t border-white/8 px-6 py-4">
              <button
                type="button"
                disabled={!selected || loading}
                onClick={handleSubmit}
                className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Report'
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
