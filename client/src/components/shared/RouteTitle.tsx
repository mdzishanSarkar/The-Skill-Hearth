import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'The Skill Hearth';

const TITLE_ROUTES: ReadonlyArray<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/$/, title: 'Home' },
  { pattern: /^\/login\/?$/, title: 'Sign in' },
  { pattern: /^\/register\/?$/, title: 'Create account' },
  { pattern: /^\/verify-email\/.+/, title: 'Verify email' },
  { pattern: /^\/forgot-password\/?$/, title: 'Forgot password' },
  { pattern: /^\/reset-password\/.+/, title: 'Reset password' },
  { pattern: /^\/dashboard\/?$/, title: 'Dashboard' },
  { pattern: /^\/profile\/?$/, title: 'Your profile' },
  { pattern: /^\/profile\/.+/, title: 'Profile' },
  { pattern: /^\/edit-profile\/?$/, title: 'Edit profile' },
  { pattern: /^\/skills\/?$/, title: 'Browse skills' },
  { pattern: /^\/skills\/.+/, title: 'Skill details' },
  { pattern: /^\/my-skills\/?$/, title: 'My skills' },
  { pattern: /^\/admin\/users\/?$/, title: 'User management' },
];

const DEFAULT_TITLE = 'Page not found';

export default function RouteTitle() {
  const { pathname } = useLocation();
  const title = TITLE_ROUTES.find((route) => route.pattern.test(pathname))?.title ?? DEFAULT_TITLE;

  useEffect(() => {
    document.title = `${title} — ${APP_NAME}`;
  }, [title]);

  return null;
}
