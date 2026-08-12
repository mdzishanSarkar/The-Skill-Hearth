import type { ReactNode } from 'react';
import clsx from 'clsx';

export type StatTone = 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'violet' | 'slate';

const TONES: Record<StatTone, string> = {
  indigo: 'from-indigo-500 to-violet-600',
  amber: 'from-amber-500 to-orange-600',
  emerald: 'from-emerald-500 to-teal-600',
  rose: 'from-rose-500 to-pink-600',
  sky: 'from-sky-500 to-blue-600',
  violet: 'from-violet-500 to-fuchsia-600',
  slate: 'from-slate-500 to-slate-700',
};

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  className?: string;
}

export default function StatCard({ icon, label, value, hint, tone = 'indigo', className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'card animate-fade-in-up relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className
      )}
    >
      <div
        className={clsx(
          'pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br opacity-15 blur-2xl',
          TONES[tone]
        )}
        aria-hidden="true"
      />
      <div className="relative">
        {icon && (
          <div
            className={clsx(
              'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white',
              TONES[tone]
            )}
          >
            {icon}
          </div>
        )}
        <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {hint && <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}
