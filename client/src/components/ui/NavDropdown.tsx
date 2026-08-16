import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { FiChevronDown } from 'react-icons/fi';

export interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
  end?: boolean;
  badge?: number;
}

interface NavDropdownProps {
  label: string;
  items: NavItem[];
  icon?: ReactNode;
}

export default function NavDropdown({ label, items, icon }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const anyActive = items.some(
    (item) => (item.end ? pathname === item.to : pathname.startsWith(item.to))
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={clsx(
          'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          anyActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        )}
      >
        {icon}
        {label}
        <FiChevronDown className={clsx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="animate-scale-in absolute left-0 z-50 mt-2 w-56 origin-top-left overflow-hidden rounded-xl border border-gray-200/80 bg-white/95 p-1.5 shadow-lift backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                )
              }
            >
              {item.icon && <span className="text-base text-gray-400 dark:text-gray-500">{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
