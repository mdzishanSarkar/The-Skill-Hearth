import { FiZap } from 'react-icons/fi';

interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const ICON_SIZES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export default function ProBadge({ size = 'md', showLabel = true }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-sm ${SIZES[size]}`}
    >
      <FiZap className={ICON_SIZES[size]} />
      {showLabel && 'Pro'}
    </span>
  );
}
