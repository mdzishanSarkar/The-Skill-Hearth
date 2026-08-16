import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

export default function UserMenu() {
  const { user, logout } = useAuth();
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

  if (!user) return null;

  const items = [
    { label: 'My profile', to: '/profile', icon: <FiUser /> },
    { label: 'Edit profile', to: '/edit-profile', icon: <FiUser /> },
    { label: 'Account settings', to: '/account-settings', icon: <FiSettings /> },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full p-0.5 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Avatar src={user.avatar || undefined} name={user.displayName} size="sm" />
        <FiChevronDown className={clsx('h-3.5 w-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-gray-200/80 bg-white/95 shadow-lift backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.displayName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <div className="p-1.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  )
                }
              >
                <span className="text-gray-400 dark:text-gray-500">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <FiLogOut />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
