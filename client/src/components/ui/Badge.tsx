import clsx from 'clsx';

type BadgeColor = 'indigo' | 'green' | 'amber' | 'gray' | 'red' | 'orange' | 'purple' | 'blue' | 'teal';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  indigo: 'bg-indigo-100 text-indigo-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  blue: 'bg-blue-100 text-blue-800',
  teal: 'bg-teal-100 text-teal-800',
};

export default function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
