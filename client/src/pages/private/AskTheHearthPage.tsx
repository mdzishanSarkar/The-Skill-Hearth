import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiSearch, FiZap } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import { searchNatural } from '../../services/naturalSearch.service';
import { getApiError } from '../../types/api.types';
import { getSkillEmoji } from '../../data/skillVisuals';
import { formatDistanceShort } from '../../utils/formatDistance';
import type { NaturalSearchResult } from '../../types/search.types';

const EXAMPLES = [
  'knitting classes in gulshan',
  'gardening near me',
  'pottery in dhanmondi',
  'sourdough baking in uttara',
  'guitar lessons near me',
];

export default function AskTheHearthPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<NaturalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function run(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    try {
      setResult(await searchNatural(trimmed));
    } catch (err) {
      setResult(null);
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void run(query);
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiZap />}
        title="Ask the Hearth"
        subtitle="Describe what you're looking for in plain words, and we'll find skills and places nearby."
      />

      <form onSubmit={handleSubmit} className="mt-6">
        <label className="sr-only" htmlFor="ask-the-hearth-input">
          Ask the Hearth
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="ask-the-hearth-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. knitting classes in gulshan"
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" size="lg" loading={loading} className="shrink-0">
            <FiSearch className="mr-1.5 h-4 w-4" /> Ask
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                void run(example);
              }}
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/50"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="md" />
        </div>
      )}

      {!loading && searched && result && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              “{result.skillQuery}”
            </span>
            {result.nearMe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <FiMapPin className="h-3 w-3" /> near me
              </span>
            )}
            {result.location && !result.nearMe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <FiMapPin className="h-3 w-3" /> {result.location.name}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {result.total} skill{result.total === 1 ? '' : 's'} found
            </span>
          </div>

          {result.skills.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<FiSearch />}
              title="Nothing around here yet"
              description="Try a different neighbourhood, drop the location, or remove “near me” to widen the search."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {result.skills.map((skill) => (
                <li key={skill._id}>
                  <Link
                    to={`/skills/${skill._id}`}
                    className="card card-hover flex items-center gap-4 p-4"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {getSkillEmoji(skill.categoryName, skill.skillName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                        {skill.skillName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {skill.categoryName} · {skill.format} · {skill.sessionLength}
                      </p>
                      {skill.teacher && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Avatar src={skill.teacher.avatar} name={skill.teacher.displayName} size="sm" />
                          {skill.teacher.displayName}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
                      {skill.distanceKm !== undefined ? (
                        <p className="font-medium text-indigo-600 dark:text-indigo-400">
                          {formatDistanceShort(skill.distanceKm)}
                        </p>
                      ) : null}
                      {skill.stats?.averageRating ? `★ ${skill.stats.averageRating.toFixed(1)}` : ''}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && !searched && (
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Tip: mention a skill or craft and a place, like <em>“pottery in dhanmondi”</em>, or say
          “near me” to search around your saved location.
        </p>
      )}
    </div>
  );
}
