interface TypingIndicatorProps {
  displayName: string;
}

export default function TypingIndicator({ displayName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-2">
      <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2">
        <p className="text-xs text-gray-500">
          <span className="font-medium">{displayName}</span> is typing
          <span className="ml-1 inline-flex gap-0.5">
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400" />
          </span>
        </p>
      </div>
    </div>
  );
}
