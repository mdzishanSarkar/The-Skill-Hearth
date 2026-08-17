import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  FiGrid,
  FiMap,
  FiAperture,
  FiRefreshCw,
  FiHome,
  FiUsers,
  FiMessageSquare,
  FiBell,
  FiLayout,
  FiAward,
  FiTrendingUp,
  FiBookOpen,
  FiBarChart2,
  FiStar,
  FiSearch,
  FiCalendar,
  FiBook,
  FiFlag,
  FiCompass,
  FiCamera,
  FiPackage,
  FiPlusCircle,
  FiTarget,
  FiShield,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { getUnreadRadarCount } from '../../services/notifications';
import { getUnreadMessageCount } from '../../services/messages';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationBell from './NotificationBell';
import UserMenu from '../ui/UserMenu';
import NavDropdown, { type NavItem } from '../ui/NavDropdown';
import Button from '../ui/Button';

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Discover',
    items: [
      { label: 'Browse skills', to: '/skills', icon: <FiGrid /> },
      { label: 'My Radar', to: '/radar', icon: <FiAperture /> },
      { label: 'Swap-ready matches', to: '/swap-ready-matches', icon: <FiRefreshCw /> },
      { label: 'Skill demand', to: '/demand', icon: <FiBarChart2 /> },
      { label: 'Ask the Hearth', to: '/ask', icon: <FiSearch /> },
      { label: 'Skill map', to: '/map', icon: <FiMap /> },
      { label: 'My swaps', to: '/swaps', icon: <FiRefreshCw /> },
    ],
  },
  {
    label: 'Connect',
    items: [
      { label: 'Feed', to: '/feed', icon: <FiHome /> },
      { label: 'Friends', to: '/friends', icon: <FiUsers /> },
      { label: 'Messages', to: '/messages', icon: <FiMessageSquare /> },
      { label: 'Notifications', to: '/notifications', icon: <FiBell /> },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <FiLayout /> },
      { label: 'My skills', to: '/my-skills', icon: <FiAward /> },
      { label: 'Journey', to: '/gamification', icon: <FiTrendingUp /> },
      { label: 'Journal', to: '/journal', icon: <FiBookOpen /> },
      { label: 'Impact', to: '/impact', icon: <FiBarChart2 /> },
      { label: 'Reviews', to: '/reviews', icon: <FiStar /> },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Community board', to: '/community', icon: <FiUsers /> },
      { label: 'Learner board', to: '/learner-board', icon: <FiTarget /> },
      { label: 'Group sessions', to: '/group-sessions', icon: <FiCalendar /> },
      { label: 'Courses', to: '/courses', icon: <FiBook /> },
      { label: 'Challenges', to: '/challenges', icon: <FiFlag /> },
      { label: 'Mentorships', to: '/mentorships', icon: <FiCompass /> },
      { label: 'Showcase', to: '/showcase', icon: <FiCamera /> },
      { label: 'Skill bundles', to: '/bundles', icon: <FiPackage /> },
      { label: 'Suggest skills', to: '/skill-suggestions', icon: <FiPlusCircle /> },
    ],
  },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 text-white shadow-soft">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M12 3C12 3 5 10 5 15a7 7 0 0014 0c0-5-7-12-7-12zm0 17a4.5 4.5 0 01-4.5-4.5c0-2.7 3.4-6.6 4.5-7.8 1.1 1.2 4.5 5.1 4.5 7.8A4.5 4.5 0 0112 20z" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Skill <span className="gradient-text">Hearth</span>
      </span>
    </Link>
  );
}

function DrawerGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">{label}</p>
      <div className="mt-1.5 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              )
            }
          >
            <span className="text-gray-400 dark:text-gray-500">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [radarUnread, setRadarUnread] = useState(0);
  const [messageUnread, setMessageUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    getUnreadRadarCount().then(setRadarUnread).catch(() => {});
    getUnreadMessageCount().then(setMessageUnread).catch(() => {});
  }, [isAuthenticated, user?._id]);

  const groups =
    user?.role === 'admin'
      ? [
          ...NAV_GROUPS,
          {
            label: 'Admin',
            items: [{ label: 'Admin panel', to: '/admin/users', icon: <FiShield /> }],
          },
        ]
      : NAV_GROUPS;

  const groupsWithBadges = groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.to === '/radar' && radarUnread > 0) return { ...item, badge: radarUnread };
      if (item.to === '/messages' && messageUnread > 0) return { ...item, badge: messageUnread };
      return item;
    }),
  }));

  return (
    <>
    <header className="sticky top-0 z-[120] border-b border-gray-200/70 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-indigo-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:focus:bg-slate-900 dark:focus:text-indigo-300"
      >
        Skip to main content
      </a>
      <nav className="page-shell flex h-16 items-center justify-between gap-2" aria-label="Main">
        <div className="flex min-w-0 items-center gap-2 md:gap-6">
          <Logo />
          <div className="hidden items-center gap-0.5 lg:flex">
            {groupsWithBadges.map((group) => (
              <NavDropdown key={group.label} label={group.label} items={group.items} />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {isAuthenticated && user ? (
            <>
              <div className="hidden md:flex md:items-center md:gap-2">
                <NotificationBell />
                <UserMenu />
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Join the Hearth</Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
    </header>
    {mobileOpen && (
      <div className="fixed inset-0 z-[130] lg:hidden" role="dialog" aria-modal="true">
        <div
          className="animate-fade-in absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <div className="animate-fade-in-up absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto border-r border-gray-200 bg-white px-4 py-5 shadow-lift dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {groupsWithBadges.map((group) => (
              <DrawerGroup key={group.label} label={group.label} items={group.items} />
            ))}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4 sm:hidden dark:border-gray-800">
            <ThemeToggle />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
            {isAuthenticated && user ? (
              <div className="space-y-1">
                <DrawerGroup
                  label="Account"
                  items={[
                    { label: 'My profile', to: '/profile', icon: <FiLayout /> },
                    { label: 'Edit profile', to: '/edit-profile', icon: <FiLayout /> },
                    { label: 'Account settings', to: '/account-settings', icon: <FiShield /> },
                  ]}
                />
                <div className="pt-2">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">
                    Join
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
