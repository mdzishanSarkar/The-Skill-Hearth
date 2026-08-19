import { formatDateDivider } from './format';

export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex h-[44px] items-center gap-3 px-4" role="separator" aria-label={formatDateDivider(date)}>
      <div className="h-px flex-1 bg-white/8" />
      <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase leading-none tracking-wide text-slate-500">
        {formatDateDivider(date)}
      </span>
      <div className="h-px flex-1 bg-white/8" />
    </div>
  );
}
