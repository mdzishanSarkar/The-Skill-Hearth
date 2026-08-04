import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const stats = [
    { label: 'Sessions completed', value: user.stats.sessionsCompleted },
    { label: 'Average rating', value: user.stats.averageRating.toFixed(1) },
    { label: 'Reviews', value: user.stats.reviewCount },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar || undefined} name={user.displayName} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span
                className={
                  user.isEmailVerified
                    ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800'
                    : 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800'
                }
              >
                {user.isEmailVerified ? 'Email verified' : 'Email not verified'}
              </span>
              {user.isIdVerified && (
                <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800">
                  ID verified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/profile">
            <Button variant="secondary">View profile</Button>
          </Link>
          <Link to="/edit-profile">
            <Button>Edit profile</Button>
          </Link>
        </div>
      </div>

      {user.bio && <p className="mt-6 max-w-2xl text-gray-700">{user.bio}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {user.location.city && (
        <div className="mt-8 rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900">Location</h2>
          <p className="mt-1 text-sm text-gray-600">
            {[user.location.city, user.location.neighborhood].filter(Boolean).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
