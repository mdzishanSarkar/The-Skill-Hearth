import { Link } from 'react-router-dom';
import {
  FiMap,
  FiUsers,
  FiBookOpen,
  FiTrendingUp,
  FiShield,
  FiZap,
  FiArrowRight,
  FiSearch,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

const FEATURES = [
  {
    icon: <FiMap />,
    title: 'Discover your neighbourhood',
    text: 'Explore skills on a live map of the people around you. Find someone to learn from or teach.',
    tone: 'from-sky-500 to-blue-600',
  },
  {
    icon: <FiUsers />,
    title: 'Connection by default',
    text: 'Friends, close friends, swaps and mentorship grow naturally from shared learning — not networking pressure.',
    tone: 'from-indigo-500 to-violet-600',
  },
  {
    icon: <FiBookOpen />,
    title: 'Grow with a journal',
    text: 'Reflect after every session. Build streaks, earn XP, and watch your skill — and your confidence — compound.',
    tone: 'from-amber-500 to-orange-600',
  },
  {
    icon: <FiTrendingUp />,
    title: 'Track your impact',
    text: 'See sessions taught, learners helped and neighbourhoods reached. Your contribution to the Hearth, quantified.',
    tone: 'from-emerald-500 to-teal-600',
  },
];

const STEPS = [
  { number: '01', title: 'Add your skills', text: 'Tell the Hearth what you can teach and what you want to learn.' },
  { number: '02', title: 'Find your people', text: 'Browse the map or use suggestions to request a session nearby.' },
  { number: '03', title: 'Learn together', text: 'Meet up, swap knowledge, and journal your progress after each session.' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="overflow-hidden">
      <section className="relative z-0">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[36rem] bg-gradient-to-b from-indigo-100/60 via-transparent to-transparent dark:from-indigo-950/30"
          aria-hidden="true"
        />
        <div className="page-shell relative z-10 animate-fade-in-up flex flex-col items-center pt-20 pb-16 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300">
            <FiZap className="h-3.5 w-3.5" />
            Skills first. Friends forever.
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-6xl sm:leading-[1.1] dark:text-gray-50">
            Connection, as a byproduct of{' '}
            <span className="gradient-text">learning together</span>.
          </h1>

          <p className="mt-5 max-w-2xl text-base text-gray-600 sm:text-lg dark:text-gray-300">
            The Skill Hearth is where your neighbourhood gathers to teach, learn and grow — one
            session at a time. No networking. Just real people and real skills.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button size="lg">
                    Go to your Hearth <FiArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/skills">
                  <Button variant="secondary" size="lg">
                    Browse skills
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">
                    Join the Hearth <FiArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <FiShield className="h-4 w-4 text-emerald-500" /> Verified members only
            </span>
            <span className="flex items-center gap-1.5">
              <FiMap className="h-4 w-4 text-sky-500" /> Neighbourhood-first
            </span>
            <span className="flex items-center gap-1.5">
              <FiBookOpen className="h-4 w-4 text-amber-500" /> Free to start
            </span>
          </div>
        </div>
      </section>

      <section className="page-shell pb-10">
        <div className="card animate-fade-in-up grid grid-cols-2 divide-x divide-gray-200 rounded-2xl py-6 text-center sm:grid-cols-4 dark:divide-gray-800">
          {[
            { value: '40+', label: 'Skill categories' },
            { value: '1:1', label: 'Personal sessions' },
            { value: '365', label: 'Days to keep learning' },
            { value: '100%', label: 'Community-led' },
          ].map((stat) => (
            <div key={stat.label} className="px-4">
              <p className="gradient-text text-2xl font-extrabold sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Everything you need to grow together
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base dark:text-gray-400">
            A warm, focused toolkit for the whole learning journey.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="card card-hover animate-fade-in-up p-6"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${feature.tone}`}
              >
                {feature.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-gray-50 py-16 dark:from-gray-950 dark:to-gray-950">
        <div className="page-shell grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <FiSearch className="h-3.5 w-3.5" />
              How it works
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
              From first lesson to lifelong friends
            </h2>
            <div className="mt-8 space-y-6">
              {STEPS.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <span className="gradient-text font-mono text-2xl font-bold">{step.number}</span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="card ember-ring p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <FiBookOpen />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today's journal prompt</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Guitar · with Maya</p>
                </div>
              </div>
              <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm italic text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                “What did you learn today? What will you try on your own next?”
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>🔥 7-day logging streak</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  +15 XP
                </span>
              </div>
            </div>
            <div className="card animate-fade-in-up mt-5 p-6 sm:ml-10" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <FiTrendingUp />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your impact</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This quarter</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: '12', label: 'Sessions' },
                  { value: '9', label: 'Learners' },
                  { value: '6', label: 'Areas' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-gray-50 py-2 dark:bg-gray-800">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Ready to light your spark?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 sm:text-base dark:text-gray-400">
          Join a growing circle of neighbours teaching and learning together.
        </p>
        <div className="mt-6">
          <Link to={isAuthenticated ? '/dashboard' : '/register'}>
            <Button size="lg">
              {isAuthenticated ? 'Go to dashboard' : 'Create your free account'}{' '}
              <FiArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
