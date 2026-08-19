export function TypingIndicator({ displayNames }: { displayNames: string[] }) {
  if (displayNames.length === 0) return null;
  const label =
    displayNames.length === 1
      ? `${displayNames[0]} is typing…`
      : displayNames.length === 2
        ? `${displayNames[0]} and ${displayNames[1]} are typing…`
        : 'Several people are typing…';

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-500"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="messenger-typing-dot" />
        <span className="messenger-typing-dot messenger-typing-dot--delay-1" />
        <span className="messenger-typing-dot messenger-typing-dot--delay-2" />
      </span>
      <span className="leading-tight">{label}</span>
    </div>
  );
}
