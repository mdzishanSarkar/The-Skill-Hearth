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
  { pattern: /^\/auth\/callback\/?$/, title: 'Completing sign-in' },
  { pattern: /^\/dashboard\/?$/, title: 'Dashboard' },
  { pattern: /^\/profile\/?$/, title: 'Your profile' },
  { pattern: /^\/profile\/.+/, title: 'Profile' },
  { pattern: /^\/edit-profile\/?$/, title: 'Edit profile' },
  { pattern: /^\/onboarding\/?$/, title: 'Get started' },
  { pattern: /^\/account-settings\/?$/, title: 'Account settings' },
  { pattern: /^\/map\/?$/, title: 'Skill map' },
  { pattern: /^\/skills\/?$/, title: 'Browse skills' },
  { pattern: /^\/skills\/.+/, title: 'Skill details' },
  { pattern: /^\/my-skills\/?$/, title: 'My skills' },
  { pattern: /^\/neighborhood\/.+/, title: 'Neighborhood' },
  { pattern: /^\/community\/?$/, title: 'Community' },
  { pattern: /^\/community\/.+/, title: 'Community' },
  { pattern: /^\/group-sessions\/?$/, title: 'Group sessions' },
  { pattern: /^\/courses\/?$/, title: 'Courses' },
  { pattern: /^\/challenges\/?$/, title: 'Challenges' },
  { pattern: /^\/mentorships\/?$/, title: 'Mentorships' },
  { pattern: /^\/showcase\/new\/?$/, title: 'Share a project' },
  { pattern: /^\/showcase\/.+/, title: 'Showcase' },
  { pattern: /^\/showcase\/?$/, title: 'Showcase' },
  { pattern: /^\/integrations\/?$/, title: 'Integrations' },
  { pattern: /^\/swap-suggestions\/?$/, title: 'Skill swaps' },
  { pattern: /^\/skill-suggestions\/?$/, title: 'Suggest skills' },
  { pattern: /^\/bundles\/?$/, title: 'Skill bundles' },
  { pattern: /^\/bundles\/.+/, title: 'Bundle details' },
  { pattern: /^\/learner-board\/?$/, title: 'Learner board' },
  { pattern: /^\/connection\/.+/, title: 'Connection details' },
  { pattern: /^\/messages\/?$/, title: 'Messages' },
  { pattern: /^\/chat\/.+/, title: 'Chat' },
  { pattern: /^\/notifications\/?$/, title: 'Notifications' },
  { pattern: /^\/admin\/users\/?$/, title: 'User management' },
  { pattern: /^\/admin\/dashboard\/?$/, title: 'Admin dashboard' },
  { pattern: /^\/admin\/reports\/?$/, title: 'Reports' },
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
