import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi';

const LINK_COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Skill map', to: '/map' },
      { label: 'Browse skills', to: '/skills' },
      { label: 'Neighborhoods', to: '/community' },
      { label: 'Skill swaps', to: '/swap-suggestions' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Your profile', to: '/profile' },
      { label: 'My skills', to: '/my-skills' },
      { label: 'Saved searches', to: '/saved-searches' },
    ],
  },
  {
    title: 'Learn & play',
    links: [
      { label: 'Courses', to: '/courses' },
      { label: 'Challenges', to: '/challenges' },
      { label: 'Showcase', to: '/showcase' },
      { label: 'Upgrade to Pro', to: '/upgrade' },
    ],
  },
];

const SOCIALS = [
  { label: 'Twitter', icon: <FiTwitter className="h-4 w-4" />, href: '' },
  {
    label: 'Facebook',
    icon: <FiFacebook className="h-4 w-4" />,
    href: 'https://www.facebook.com/zishansarkar01/',
  },
  { label: 'Instagram', icon: <FiInstagram className="h-4 w-4" />, href: '' },
  {
    label: 'LinkedIn',
    icon: <FiLinkedin className="h-4 w-4" />,
    href: 'https://www.linkedin.com/in/zishansarkar/',
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [contactFlash, setContactFlash] = useState(false);

  function handleContactClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setContactFlash(true);
    document.getElementById('site-footer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.setTimeout(() => setContactFlash(false), 1800);
  }

  return (
    <footer
      id="site-footer"
      className={
        contactFlash
          ? 'border-t border-indigo-200 bg-indigo-50 transition-colors duration-300 dark:border-indigo-800 dark:bg-indigo-950/40'
          : 'border-t border-gray-200 bg-gray-50 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-950'
      }
    >
      <div className="page-shell py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
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
            <p className="mt-4 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Trade skills with your neighbors, grow your neighborhood's know-how, and keep learning
              together — one exchange at a time.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((social) =>
                social.href ? (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-800 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
                  >
                    {social.icon}
                  </a>
                ) : (
                  <span
                    key={social.label}
                    aria-label={`${social.label} (coming soon)`}
                    title={`${social.label} — coming soon`}
                    className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-dashed border-gray-200 text-gray-300 dark:border-gray-800 dark:text-gray-600"
                  >
                    {social.icon}
                  </span>
                )
              )}
            </div>
          </div>

          {LINK_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-500 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500 sm:flex-row">
          <p>© {year} The Skill Hearth. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
              Privacy
            </Link>
            <Link to="/" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
              Terms
            </Link>
            <button
              type="button"
              onClick={handleContactClick}
              className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
