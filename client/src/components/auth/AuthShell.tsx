import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBookOpen,
  FiMap,
  FiUsers,
  FiZap,
} from 'react-icons/fi';

interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const BRAND_POINTS = [
  { icon: <FiMap />, text: 'Discover skilled neighbours on the map' },
  { icon: <FiUsers />, text: 'Connect through real sessions, not networking' },
  { icon: <FiBookOpen />, text: 'Journal, streak and grow together' },
];

const PREVIEW_STATS = [
  { value: '12', label: 'Sessions' },
  { value: '36h', label: 'Taught' },
  { value: '4.9', label: 'Rating' },
];

const PREVIEW_FRIENDS = [
  { initial: 'S', color: 'bg-rose-300' },
  { initial: 'J', color: 'bg-emerald-300' },
  { initial: 'P', color: 'bg-sky-300' },
  { initial: 'M', color: 'bg-amber-300' },
];

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-stretch justify-center">
      <div className="relative hidden w-full max-w-md flex-col justify-between overflow-hidden bg-gradient-to-br from-[#120e33] via-[#1a1448] to-[#331a5e] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -top-24 -right-14 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.12),inset_0_0_120px_rgba(0,0,0,0.25)]"
          aria-hidden="true"
        />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-amber-200/20 backdrop-blur">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M12 3C12 3 5 10 5 15a7 7 0 0014 0c0-5-7-12-7-12zm0 17a4.5 4.5 0 01-4.5-4.5c0-2.7 3.4-6.6 4.5-7.8 1.1 1.2 4.5 5.1 4.5 7.8A4.5 4.5 0 0112 20z" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">The Skill Hearth</span>
        </Link>

        <div className="relative">
          <div className="h-px w-14 bg-gradient-to-r from-amber-300/80 to-transparent" aria-hidden="true" />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[11px] font-medium tracking-wide text-amber-200 backdrop-blur">
            <FiZap className="h-3.5 w-3.5 text-amber-300" />
            A neighbourhood skill exchange
          </span>
          <h2 className="mt-4 text-2xl leading-snug font-bold tracking-tight [text-shadow:0_0_32px_rgba(251,191,36,0.18)]">
            Connection, as a byproduct of learning together.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Join a growing circle of neighbours who teach, learn and grow with each other.
          </p>

          <div className="mt-6 animate-fade-in-up rounded-2xl border border-amber-200/15 bg-white/[0.07] p-4 shadow-lift ring-1 ring-inset ring-amber-200/5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
                <FiZap className="h-5 w-5 text-amber-950" />
              </span>
              <div>
                <p className="text-sm font-semibold">7-day teaching streak</p>
                <p className="text-xs text-white/60">Keep going, you are on fire.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {PREVIEW_STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/[0.08] px-2 py-2.5 text-center">
                  <p className="text-base font-bold text-amber-200">{stat.value}</p>
                  <p className="text-[10px] tracking-wide text-white/60 uppercase">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {PREVIEW_FRIENDS.map((friend) => (
                    <span
                      key={friend.initial}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-amber-950 ring-2 ring-[#1a1448] ${friend.color}`}
                    >
                      {friend.initial}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-white/70">4 friends learning today</span>
              </div>
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-sm">
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <ul className="space-y-2.5">
            {BRAND_POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-2.5 text-sm text-white/85">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-amber-300 ring-1 ring-white/10">
                  {point.icon}
                </span>
                {point.text}
              </li>
            ))}
          </ul>
          <Link
            to="/skills"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-200/90 hover:text-amber-100"
          >
            Explore the map first
            <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col justify-center px-4 py-10 sm:px-8">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
